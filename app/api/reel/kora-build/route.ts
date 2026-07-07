import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { createReelProject } from "@/lib/reelDb";
import { generateReelScript, toBeat } from "@/lib/reelKoraGenerate";
import { KoraConfigError, KoraValidationError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 15;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`reel-kora-build:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { topic?: string; audience?: string; keyPoints?: string; length?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return NextResponse.json({ error: "A topic is required." }, { status: 400 });
  }

  let output;
  try {
    const result = await generateReelScript({
      topic,
      audience: (body.audience ?? "").trim(),
      keyPoints: (body.keyPoints ?? "").trim(),
      length: (body.length ?? "Medium (~8 beats)").trim(),
      notes: (body.notes ?? "").trim(),
    });
    output = result.output;
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid script structure." }, { status: 422 });
    }
    console.error("[reel/kora-build] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }

  const beats = output.beats.map(toBeat);
  const project = await createReelProject({ teacherId: user.id, title: output.title, beats });
  return NextResponse.json({ projectId: project.id });
}
