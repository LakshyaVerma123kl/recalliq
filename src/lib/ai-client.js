import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

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

/**
 * Multi-provider AI client with fallback chain:
 * 1. Groq (Llama 3.3 70B) — Primary, fastest
 * 2. Gemini 2.5 Flash — Secondary
 * 3. Gemini 2.5 Pro — For complex content
 * 4. OpenAI — Final fallback (if key provided)
 */

async function callGroq(textContent, customPrompt) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
      {
        role: "user",
        content: customPrompt
          ? customPrompt
          : `Analyze the following educational content and generate comprehensive flashcards:\n\n${textContent}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });

  return response.choices[0].message.content;
}

async function callOpenAI(textContent, customPrompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
      {
        role: "user",
        content: customPrompt
          ? customPrompt
          : `Analyze the following educational content and generate comprehensive flashcards:\n\n${textContent}`,
      },
    ],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  return response.choices[0].message.content;
}

async function callGeminiWithPDF(fileBuffer, fileName, model = "gemini-2.5-flash-preview-04-17") {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Upload file to Gemini
  const uploadedFile = await ai.files.upload({
    file: new Blob([fileBuffer], { type: "application/pdf" }),
    config: { displayName: fileName },
  });

  const response = await ai.models.generateContent({
    model: model,
    contents: [
      {
        role: "user",
        parts: [
          { fileData: { fileUri: uploadedFile.uri, mimeType: "application/pdf" } },
          {
            text: `${FLASHCARD_SYSTEM_PROMPT}\n\nAnalyze this PDF document thoroughly and generate comprehensive flashcards covering all key material. Return ONLY valid JSON.`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  return response.text;
}

async function callGeminiWithText(textContent, model = "gemini-2.5-flash-preview-04-17") {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: model,
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
    config: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  });

  return response.text;
}

function cleanJsonResponse(text) {
  try {
    JSON.parse(text);
    return text.trim();
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return match[0];
    return text.trim();
  }
}

/**
 * Generate flashcards from PDF buffer
 * Strategy: Use Gemini for PDF (native vision), then Groq for text fallback
 */
export async function generateFromPDF(fileBuffer, fileName) {
  const errors = [];

  // Strategy 1: Gemini 2.5 Flash with native PDF
  if (process.env.GEMINI_API_KEY) {
    try {
      const raw = await callGeminiWithPDF(fileBuffer, fileName, "gemini-2.5-flash-preview-04-17");
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) {
        return { ...parsed, provider: "gemini-flash" };
      }
    } catch (err) {
      errors.push(`Gemini Flash: ${err.message}`);
    }

    // Strategy 2: Gemini 2.5 Pro for complex content
    try {
      const raw = await callGeminiWithPDF(fileBuffer, fileName, "gemini-2.5-pro-preview-03-25");
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) {
        return { ...parsed, provider: "gemini-pro" };
      }
    } catch (err) {
      errors.push(`Gemini Pro: ${err.message}`);
    }
  }

  throw new Error(`All AI providers failed for PDF. Errors: ${errors.join("; ")}`);
}

/**
 * Generate flashcards from text content
 * Strategy: Groq (primary) → Gemini Flash → Gemini Pro
 */
export async function generateFromText(textContent) {
  const errors = [];

  // Strategy 1: Groq (Llama 3.3 70B) — Primary, fastest
  if (process.env.GROQ_API_KEY) {
    try {
      const raw = await callGroq(textContent);
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) {
        return { ...parsed, provider: "groq" };
      }
    } catch (err) {
      errors.push(`Groq: ${err.message}`);
    }
  }

  // Strategy 2: Gemini 2.5 Flash
  if (process.env.GEMINI_API_KEY) {
    try {
      const raw = await callGeminiWithText(textContent, "gemini-2.5-flash-preview-04-17");
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) {
        return { ...parsed, provider: "gemini-flash" };
      }
    } catch (err) {
      errors.push(`Gemini Flash: ${err.message}`);
    }
  }

  // Strategy 3: OpenAI (GPT-4o)
  if (process.env.OPENAI_API_KEY) {
    try {
      const raw = await callOpenAI(textContent);
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) {
        return { ...parsed, provider: "openai" };
      }
    } catch (err) {
      errors.push(`OpenAI: ${err.message}`);
    }
  }

  throw new Error(`All AI providers failed. Errors: ${errors.join("; ")}`);
}

/**
 * Regenerate answer for a single card
 */
export async function regenerateAnswer(question, currentAnswer) {
  const prompt = `Current question: "${question}"\nCurrent answer: "${currentAnswer}"\n\nGenerate a better, more detailed answer. Respond with ONLY the improved answer text.`;

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
      return response.choices[0].message.content;
    } catch (err) {
      // Fail silently and let the next block handle it
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: [{ role: "user", parts: [{ text: `${REGENERATE_SYSTEM_PROMPT}\n\n${prompt}` }] }],
      });
      return response.text;
    } catch (err) {
      // Fail silently and let the next block handle it
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: REGENERATE_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });
      return response.choices[0].message.content;
    } catch (err) {
      // Fail silently
    }
  }

  throw new Error("No AI provider available for regeneration");
}
