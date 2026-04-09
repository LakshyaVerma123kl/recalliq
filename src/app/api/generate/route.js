import { NextResponse } from "next/server";
import { generateFromPDF, generateFromText } from "@/lib/ai-client";

export const maxDuration = 60;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const textContent = formData.get("textContent");
    const title = formData.get("title");

    if (!file && !textContent) {
      return NextResponse.json(
        { error: "Please provide a PDF file or text content" },
        { status: 400 }
      );
    }

    let result;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (buffer.length > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 400 }
        );
      }

      result = await generateFromPDF(buffer, file.name);
    } else {
      if (textContent.length < 50) {
        return NextResponse.json(
          { error: "Please provide more content (at least 50 characters)" },
          { status: 400 }
        );
      }
      result = await generateFromText(textContent);
    }

    if (title && title.trim()) {
      result.title = title.trim();
    }

    return NextResponse.json({ success: true, deck: result });
  } catch (error) {
    console.error("[API] Generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}