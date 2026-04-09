import { NextResponse } from "next/server";
import { regenerateAnswer } from "@/lib/ai-client";

export async function POST(request) {
  try {
    const { question, currentAnswer } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const newAnswer = await regenerateAnswer(question, currentAnswer);

    return NextResponse.json({ success: true, answer: newAnswer });
  } catch (error) {
    console.error("[API] Regenerate failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to regenerate answer" },
      { status: 500 }
    );
  }
}