import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { generateRubric } from "@/lib/marginsKoraGenerate";
import { type EssayType } from "@/lib/marginsRubrics";
import { KoraConfigError, KoraValidationError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

const ESSAY_TYPES: EssayType[] = ["DBQ", "LEQ", "SAQ"];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`margins-generate-rubric:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { essayType?: string; topic?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const essayType = body.essayType as EssayType;
  if (!ESSAY_TYPES.includes(essayType)) {
    return NextResponse.json({ error: "essayType must be DBQ, LEQ, or SAQ." }, { status: 400 });
  }
  const topic = (body.topic ?? "").trim();
  if (!topic) return NextResponse.json({ error: "A topic is required." }, { status: 400 });

  try {
    const { output } = await generateRubric({ essayType, topic });
    return NextResponse.json({ rubric: output });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid rubric structure." }, { status: 422 });
    }
    console.error("[margins/generate-rubric] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }
}
