import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { generateWorksheetFromDescription } from "@/lib/notesheetKoraGenerate";
import { KoraConfigError, KoraValidationError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

const MIN_DESCRIPTION_CHARS = 20;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`notesheet-describe:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { description?: string; subject?: string; gradeBand?: string; targetPages?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { description = "", subject = "", gradeBand = "", targetPages = 2 } = body;
  const trimmed = description.trim();
  if (trimmed.length < MIN_DESCRIPTION_CHARS) {
    return NextResponse.json(
      { error: "Describe your worksheet in a sentence or two so KORA has something to design from." },
      { status: 400 }
    );
  }

  try {
    const { output } = await generateWorksheetFromDescription({
      description: trimmed,
      subject,
      gradeBand,
      targetPages,
    });
    // output carries the plan fields plus a designBrief the client renders
    // above the preview so the design decisions stay visible.
    const { designBrief, ...plan } = output as Record<string, unknown>;
    return NextResponse.json({ plan, designBrief });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "AI returned an invalid worksheet structure." }, { status: 422 });
    }
    console.error("[notesheet/describe] Claude call failed:", err);
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 502 });
  }
}
