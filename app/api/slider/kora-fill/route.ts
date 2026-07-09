import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { createDeck } from "@/lib/sliderDb";
import { generateSliderDeckFromContent, buildSlidesWithIds, resolveThemeId } from "@/lib/sliderKoraGenerate";
import { KoraConfigError, KoraValidationError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";
// A single-phase call, but the schema-repair retry plus normal Claude latency
// can still take up to a minute or so — see the comment in the sibling
// kora-build route for the caveat that this Vercel/Next.js construct may be a
// no-op depending on how this app is actually deployed.
export const maxDuration = 120;

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 15;
const MIN_CONTENT_LENGTH = 20;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`slider-kora-fill:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { rawContent?: string; audience?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawContent = (body.rawContent ?? "").trim();
  if (rawContent.length < MIN_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: "Paste in a bit more content — at least a couple sentences." },
      { status: 400 }
    );
  }

  let output;
  try {
    const result = await generateSliderDeckFromContent({
      rawContent,
      audience: (body.audience ?? "").trim(),
      notes: (body.notes ?? "").trim(),
    });
    output = result.output;
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid slideshow structure." }, { status: 422 });
    }
    console.error("[slider/kora-fill] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }

  const themeId = resolveThemeId(output.theme_id);
  const slides = buildSlidesWithIds(output.slides);

  const deck = await createDeck({
    teacherId: user.id,
    title: output.deck_title,
    themeId,
    slides,
  });
  return NextResponse.json({ deckId: deck.id });
}
