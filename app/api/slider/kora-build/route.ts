import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { createDeck } from "@/lib/sliderDb";
import { type Slide } from "@/lib/sliderTypes";
import { SLIDER_THEMES, DEFAULT_THEME_ID } from "@/lib/sliderThemes";
import { generateSliderDeck } from "@/lib/sliderKoraGenerate";
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
  if (isRateLimited(`slider-kora-build:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { topic?: string; audience?: string; keyPoints?: string; length?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim();
  const keyPoints = (body.keyPoints ?? "").trim();
  if (!topic || !keyPoints) {
    return NextResponse.json({ error: "A topic and key points are required." }, { status: 400 });
  }

  let output;
  try {
    const result = await generateSliderDeck({
      topic,
      audience: (body.audience ?? "").trim(),
      keyPoints,
      length: (body.length ?? "Medium (~8 slides)").trim(),
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
    console.error("[slider/kora-build] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }

  const themeId = SLIDER_THEMES.some((t) => t.id === output.theme_id) ? output.theme_id : DEFAULT_THEME_ID;
  const slides: Slide[] = output.slides.map((s) => ({
    id: randomUUID(),
    layout: s.layout,
    title: s.title,
    subtitle: s.subtitle,
    body: s.body,
    bullets: s.bullets,
    columns: s.columns ? ([s.columns[0], s.columns[1]] as [string, string]) : undefined,
    image: null,
    quoteText: s.quoteText,
    quoteAttribution: s.quoteAttribution,
    notes: s.notes,
  }));

  const deck = await createDeck({ teacherId: user.id, title: output.deck_title, themeId, slides });
  return NextResponse.json({ deckId: deck.id });
}
