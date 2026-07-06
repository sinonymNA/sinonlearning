import { NextRequest, NextResponse } from "next/server";
import { getSession, joinSession, recordResponse } from "@/lib/koraGame";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { KoraGameEvalSchema } from "@/lib/koraSchemas";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const KORA_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical understanding engine. " +
  "You do not act as a tutor. You do not replace the teacher. You return " +
  "structured JSON that makes student understanding visible.";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const session = getSession(code);
  if (!session) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  // Keyed by ip + game code so one classroom's shared Wi-Fi IP only shares a
  // bucket within its own game, with a ceiling generous enough for a full
  // class answering at once.
  const ip = getClientIp(request);
  if (isRateLimited(`kora-game-answer:${ip}:${code}`, 60 * 1000, 40)) {
    return NextResponse.json(
      { error: "Too many answers at once — give it a few seconds and try again." },
      { status: 429 }
    );
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
    const { data: evaluation } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 1024,
      system: KORA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      schema: KoraGameEvalSchema,
    });

    // Business rule, not validation: clamp points to the game's 0-100 range.
    const points = Math.max(0, Math.min(100, Math.round(evaluation.points)));

    recordResponse(code, studentId, {
      roundId,
      text,
      points,
      understandingLevel: evaluation.understanding_level,
      misconceptionDetected: evaluation.misconception_detected,
      misconceptionLabel: evaluation.misconception_label,
      feedback: evaluation.feedback,
      submittedAt: Date.now(),
    });

    return NextResponse.json({ evaluation: { ...evaluation, points } });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json(
        { error: "KORA could not evaluate the response. Please try again." },
        { status: 422 }
      );
    }
    console.error("[KORA Game Answer]", err);
    return NextResponse.json(
      { error: "KORA could not evaluate the response. Please try again." },
      { status: 502 }
    );
  }
}
