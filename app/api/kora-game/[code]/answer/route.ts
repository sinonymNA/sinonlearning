import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getSession, joinSession, recordResponse } from "@/lib/koraGame";

export const dynamic = "force-dynamic";

const KORA_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical understanding engine. " +
  "You do not act as a tutor. You do not replace the teacher. You return " +
  "structured JSON that makes student understanding visible.";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
  }

  const session = getSession(code);
  if (!session) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  let body: {
    studentId: string;
    studentName: string;
    roundId: string;
    probe: string;
    text: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { studentId, studentName, roundId, probe, text } = body;
  if (!studentId || !probe || !text) {
    return NextResponse.json({ error: "studentId, probe, and text are required." }, { status: 400 });
  }

  joinSession(code, studentId, studentName || "Anonymous");

  const userMessage = [
    `Concept: ${session.concept}`,
    `Subject: ${session.subject} | Grade Band: ${session.gradeLevel}`,
    `Source Content:\n${session.sourceContent}`,
    ``,
    `Probe: "${probe}"`,
    ``,
    `Student response:\n"${text}"`,
    ``,
    `Task: Evaluate this student response for the game. Return a KORA game evaluation.`,
  ].join("\n");

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: KORA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const evaluation = JSON.parse(extractJson(raw));
    const points = typeof evaluation.points === "number"
      ? Math.max(0, Math.min(100, Math.round(evaluation.points)))
      : 10;

    recordResponse(code, studentId, {
      roundId,
      text,
      points,
      understandingLevel: evaluation.understanding_level || "Not Yet Shown",
      misconceptionDetected: !!evaluation.misconception_detected,
      misconceptionLabel: evaluation.misconception_label || null,
      feedback: evaluation.feedback || "",
      submittedAt: Date.now(),
    });

    return NextResponse.json({ evaluation: { ...evaluation, points } });
  } catch (err) {
    console.error("[KORA Game Answer]", err);
    return NextResponse.json(
      { error: "KORA could not evaluate the response. Please try again." },
      { status: 502 }
    );
  }
}
