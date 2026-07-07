import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { generateNotesheetPlan } from "@/lib/notesheetKoraGenerate";
import { KoraConfigError, KoraValidationError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`notesheet-generate:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { rawText: string; concept?: string; subject?: string; gradeBand?: string; targetPages?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { rawText, concept = "", subject = "", gradeBand = "", targetPages = 2 } = body;
  if (!rawText) {
    return NextResponse.json({ error: "rawText is required." }, { status: 400 });
  }

  try {
    const { output } = await generateNotesheetPlan({ rawText, concept, subject, gradeBand, targetPages });
    return NextResponse.json({ plan: output });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "AI returned an invalid plan structure." }, { status: 422 });
    }
    console.error("[notesheet/generate] Claude call failed:", err);
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 502 });
  }
}
