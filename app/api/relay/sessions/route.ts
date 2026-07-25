import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/relayDb";
import { getCurrentUser } from "@/lib/marginsAuth";
import { DEFAULT_ROUND_SECONDS, ROUND_SECONDS_OPTIONS } from "@/lib/relayGame";

export const dynamic = "force-dynamic";

const MIN_PROMPT_CHARS = 15;

export async function POST(request: NextRequest) {
  let body: { prompt?: string; essayType?: string; roundSeconds?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (prompt.length < MIN_PROMPT_CHARS) {
    return NextResponse.json({ error: "Write a full essay prompt for students to answer." }, { status: 400 });
  }

  const essayType = ["DBQ", "LEQ", "SAQ"].includes(body.essayType ?? "") ? body.essayType! : "LEQ";
  const roundSeconds = ROUND_SECONDS_OPTIONS.includes(body.roundSeconds ?? 0)
    ? body.roundSeconds!
    : DEFAULT_ROUND_SECONDS;

  // Signing in is optional — a teacher can run a room without an account, same
  // as Source Room. When they are signed in we record it so the room can later
  // be tied back to a class.
  let teacherId: string | null = null;
  try {
    const user = await getCurrentUser();
    teacherId = user?.id ?? null;
  } catch {
    teacherId = null;
  }

  try {
    const { code, hostToken } = await createSession({ prompt, essayType, roundSeconds, teacherId });
    return NextResponse.json({ code, hostToken });
  } catch (err) {
    console.error("[relay/sessions] create failed:", err);
    return NextResponse.json({ error: "Could not create the room. Please try again." }, { status: 500 });
  }
}
