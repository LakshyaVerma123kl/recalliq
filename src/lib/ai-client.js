import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

// ---------------------------------------------------------------------------
// PDF text extraction
// `unpdf` is Node/Edge safe — no DOMMatrix or browser APIs required.
// `pdf-parse` v2 fails on Vercel with "DOMMatrix is not defined".
// ---------------------------------------------------------------------------

async function parsePdf(buffer) {
  try {
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text ?? "";
  } catch (err) {
    throw new Error(`PDF text extraction failed: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const FLASHCARD_SYSTEM_PROMPT = `You are an expert educator and flashcard creator. Your job is to analyze educational content and generate high-quality flashcards that maximize learning and retention.

Rules for creating flashcards:
1. Cover ALL key concepts, definitions, formulas, relationships, and important details
2. Create cards that test understanding, not just memorization
3. Include cards for:
   - Core definitions and concepts
   - Relationships and comparisons between ideas
   - Common misconceptions and edge cases
   - Application and problem-solving (especially for math/science)
   - Cause and effect relationships
   - Important examples and their significance
4. Write questions that are clear and unambiguous
5. Write answers that are concise but complete
6. Assign difficulty: "easy", "medium", or "hard"
7. Assign 1-3 relevant tags per card
8. Write like a great teacher — warm, clear, insightful

You MUST respond with ONLY valid JSON matching this exact structure:
{
  "title": "Descriptive title for this deck",
  "subject": "Subject area (e.g., Mathematics, History, Biology)",
  "description": "Brief 1-2 sentence description of what this deck covers",
  "cards": [
    {
      "question": "Clear, specific question",
      "answer": "Concise but complete answer",
      "difficulty": "easy|medium|hard",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Generate 15-30 comprehensive, high-quality flashcards. Quality over quantity.`;

const REGENERATE_SYSTEM_PROMPT = `You are an expert educator. Given a flashcard question, generate a better, more detailed answer. Keep it concise but thorough. Respond with ONLY the improved answer text, nothing else.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanJsonResponse(text) {
  if (!text) throw new Error("Empty response from AI provider");
  // Strip markdown code fences if present (Gemini sometimes wraps output)
  const stripped = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    JSON.parse(stripped);
    return stripped;
  } catch {
    // Try to extract the first JSON object from the string
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) return match[0];
    throw new Error("Could not extract valid JSON from AI response");
  }
}

function validateDeck(parsed) {
  return (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray(parsed.cards) &&
    parsed.cards.length > 0
  );
}

// ---------------------------------------------------------------------------
// Provider: Groq (Llama 3.3 70B) — always tried first, fastest
// ---------------------------------------------------------------------------

async function callGroq(textContent) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze the following educational content and generate comprehensive flashcards:\n\n${textContent}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });
  return response.choices[0].message.content;
}

// ---------------------------------------------------------------------------
// Provider: Gemini
//
// Correct model names for the v1beta API (as of 2025):
//   gemini-2.5-flash  — latest, may be rate-limited under high demand
//   gemini-1.5-flash  — reliable, fast fallback
//   gemini-1.5-pro    — highest quality fallback
//
// "gemini-pro" (without version) was removed and returns 404.
// ---------------------------------------------------------------------------

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-pro"];

async function callGeminiWithPDF(fileBuffer, fileName, model) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const uploadedFile = await ai.files.upload({
    file: new Blob([fileBuffer], { type: "application/pdf" }),
    config: { displayName: fileName },
  });

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: uploadedFile.uri,
              mimeType: "application/pdf",
            },
          },
          {
            text: `${FLASHCARD_SYSTEM_PROMPT}\n\nAnalyze this PDF document thoroughly and generate comprehensive flashcards covering all key material. Return ONLY valid JSON.`,
          },
        ],
      },
    ],
    config: { temperature: 0.7, maxOutputTokens: 8192 },
  });

  return response.text;
}

async function callGeminiWithText(textContent, model) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${FLASHCARD_SYSTEM_PROMPT}\n\nAnalyze the following educational content and generate comprehensive flashcards:\n\n${textContent}`,
          },
        ],
      },
    ],
    config: { temperature: 0.7, maxOutputTokens: 8192 },
  });

  return response.text;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate flashcards from a PDF buffer.
 *
 * Cascade:
 *   1. Groq (Llama 3.3 70B) — extract text with unpdf, send to Groq
 *   2. Gemini 2.5 Flash     — native PDF vision (no text extraction needed)
 *   3. Gemini 1.5 Flash     — reliable fallback
 *   4. Gemini 1.5 Pro       — highest quality fallback
 */
export async function generateFromPDF(fileBuffer, fileName) {
  const errors = [];

  // ── 1. Groq via unpdf text extraction ─────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const text = await parsePdf(fileBuffer);
      if (text && text.trim().length >= 50) {
        const raw = await callGroq(text.trim());
        const parsed = JSON.parse(cleanJsonResponse(raw));
        if (validateDeck(parsed)) return { ...parsed, provider: "groq" };
        errors.push("Groq: Response parsed but contained no cards");
      } else {
        errors.push(
          "Groq: Extracted PDF text too short — falling back to Gemini native vision",
        );
      }
    } catch (err) {
      errors.push(`Groq: ${err.message}`);
    }
  }

  // ── 2-4. Gemini models with native PDF vision ──────────────────────────
  if (process.env.GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const raw = await callGeminiWithPDF(fileBuffer, fileName, model);
        const parsed = JSON.parse(cleanJsonResponse(raw));
        if (validateDeck(parsed)) return { ...parsed, provider: model };
        errors.push(`${model}: Response parsed but contained no cards`);
      } catch (err) {
        errors.push(`${model}: ${err.message}`);
      }
    }
  }

  throw new Error(
    `All AI providers failed for PDF generation.\n\nDetails:\n${errors
      .map((e, i) => `  ${i + 1}. ${e}`)
      .join("\n")}`,
  );
}

/**
 * Generate flashcards from plain text.
 *
 * Cascade:
 *   1. Groq (Llama 3.3 70B) — fastest
 *   2. Gemini 2.5 Flash
 *   3. Gemini 1.5 Flash
 *   4. Gemini 1.5 Pro
 */
export async function generateFromText(textContent) {
  const errors = [];

  // ── 1. Groq ────────────────────────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const raw = await callGroq(textContent);
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (validateDeck(parsed)) return { ...parsed, provider: "groq" };
      errors.push("Groq: Response parsed but contained no cards");
    } catch (err) {
      errors.push(`Groq: ${err.message}`);
    }
  }

  // ── 2-4. Gemini models ─────────────────────────────────────────────────
  if (process.env.GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const raw = await callGeminiWithText(textContent, model);
        const parsed = JSON.parse(cleanJsonResponse(raw));
        if (validateDeck(parsed)) return { ...parsed, provider: model };
        errors.push(`${model}: Response parsed but contained no cards`);
      } catch (err) {
        errors.push(`${model}: ${err.message}`);
      }
    }
  }

  throw new Error(
    `All AI providers failed for text generation.\n\nDetails:\n${errors
      .map((e, i) => `  ${i + 1}. ${e}`)
      .join("\n")}`,
  );
}

/**
 * Regenerate a single card's answer.
 * Cascade: Groq → Gemini 2.5 Flash → 1.5 Flash → 1.5 Pro
 */
export async function regenerateAnswer(question, currentAnswer) {
  const prompt = `Current question: "${question}"\nCurrent answer: "${currentAnswer}"\n\nGenerate a better, more detailed answer. Respond with ONLY the improved answer text.`;

  // ── 1. Groq ────────────────────────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: REGENERATE_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      const text = response.choices[0].message.content?.trim();
      if (text) return text;
    } catch {
      // fall through to Gemini
    }
  }

  // ── 2-4. Gemini models ─────────────────────────────────────────────────
  if (process.env.GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text: `${REGENERATE_SYSTEM_PROMPT}\n\n${prompt}` }],
            },
          ],
        });
        const text = response.text?.trim();
        if (text) return text;
      } catch {
        // fall through
      }
    }
  }

  throw new Error("No AI provider available for answer regeneration");
}
