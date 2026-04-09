import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

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

async function callGroq(textContent, customPrompt) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
      {
        role: "user",
        content: customPrompt ? customPrompt : `Analyze the following educational content and generate comprehensive flashcards:\n\n${textContent}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  });
  return response.choices[0].message.content;
}

async function callHuggingFace(textContent, customPrompt) {
  const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [
        { role: "system", content: FLASHCARD_SYSTEM_PROMPT },
        {
          role: "user",
          content: customPrompt ? customPrompt : `Analyze the following educational content and generate comprehensive flashcards:\n\n${textContent}`,
        }
      ],
      max_tokens: 8000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });
  const data = await response.json();
  if(!response.ok) throw new Error(data.error?.message || "HuggingFace API failed");
  return data.choices[0].message.content;
}

async function callGeminiWithPDF(fileBuffer, fileName, model) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
          { text: `${FLASHCARD_SYSTEM_PROMPT}\n\nAnalyze this PDF document thoroughly and generate comprehensive flashcards covering all key material. Return ONLY valid JSON.` },
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
    model: model,
    contents: [
      {
        role: "user",
        parts: [
          { text: `${FLASHCARD_SYSTEM_PROMPT}\n\nAnalyze the following educational content and generate comprehensive flashcards:\n\n${textContent}` },
        ],
      },
    ],
    config: { temperature: 0.7, maxOutputTokens: 8192 },
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

export async function generateFromPDF(fileBuffer, fileName) {
  const errors = [];
  if (process.env.GEMINI_API_KEY) {
    try {
      const raw = await callGeminiWithPDF(fileBuffer, fileName, "gemini-2.5-flash");
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) return { ...parsed, provider: "gemini" };
    } catch (err) {
      errors.push(`Gemini 2.5 Flash: ${err.message}`);
    }
    
    try {
      const raw = await callGeminiWithPDF(fileBuffer, fileName, "gemini-pro");
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) return { ...parsed, provider: "gemini" };
    } catch (err) {
      errors.push(`Gemini Pro: ${err.message}`);
    }
  }
  throw new Error(`All AI providers failed for PDF. Errors: ${errors.join("; ")}`);
}

export async function generateFromText(textContent) {
  const errors = [];

  // 1. Groq (Llama 3.3 70B)
  if (process.env.GROQ_API_KEY) {
    try {
      const raw = await callGroq(textContent);
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) return { ...parsed, provider: "groq" };
    } catch (err) {
      errors.push(`Groq Llama 3.3 70B: ${err.message}`);
    }
  }

  // 2. Gemini 2.5 Flash
  if (process.env.GEMINI_API_KEY) {
    try {
      const raw = await callGeminiWithText(textContent, "gemini-2.5-flash");
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) return { ...parsed, provider: "gemini" };
    } catch (err) {
      errors.push(`Gemini 2.5 Flash: ${err.message}`);
    }
  }

  // 3. Gemini Pro
  if (process.env.GEMINI_API_KEY) {
    try {
      const raw = await callGeminiWithText(textContent, "gemini-pro");
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) return { ...parsed, provider: "gemini" };
    } catch (err) {
      errors.push(`Gemini Pro: ${err.message}`);
    }
  }

  // 4. HuggingFace Llama 3.3
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const raw = await callHuggingFace(textContent);
      const parsed = JSON.parse(cleanJsonResponse(raw));
      if (parsed.cards && parsed.cards.length > 0) return { ...parsed, provider: "huggingface" };
    } catch (err) {
      errors.push(`HuggingFace Llama 3.3: ${err.message}`);
    }
  }

  throw new Error(`All AI providers failed. Errors: ${errors.join("; ")}`);
}

export async function regenerateAnswer(question, currentAnswer) {
  const prompt = `Current question: "${question}"\nCurrent answer: "${currentAnswer}"\n\nGenerate a better, more detailed answer. Respond with ONLY the improved answer text.`;

  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: REGENERATE_SYSTEM_PROMPT }, { role: "user", content: prompt }],
        temperature: 0.7, max_tokens: 1000,
      });
      return response.choices[0].message.content;
    } catch (err) {}
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: `${REGENERATE_SYSTEM_PROMPT}\n\n${prompt}` }] }],
      });
      return response.text;
    } catch (err) {}
  }

  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-3.3-70B-Instruct/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.3-70B-Instruct",
          messages: [{ role: "system", content: REGENERATE_SYSTEM_PROMPT }, { role: "user", content: prompt }],
          temperature: 0.7
        })
      });
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {}
  }

  throw new Error("No AI provider available for regeneration");
}
