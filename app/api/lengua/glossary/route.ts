import { NextRequest, NextResponse } from "next/server";
import { getDeckById } from "@/lib/sliderDb";
import { getGlossary, saveGlossary, seedLexiconFromGlossary, getGlossaryLanguages } from "@/lib/lenguaDb";
import { generateDeckGlossary } from "@/lib/lenguaKoraGenerate";
import { isSupportedLanguage } from "@/lib/lenguaLanguages";
import { KoraConfigError } from "@/lib/koraServer";
import type { Slide } from "@/lib/sliderTypes";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Flatten a deck to the text a glossary should be built from. */
function deckText(slides: Slide[]): string {
  return slides
    .map((s) =>
      [s.title, s.subtitle, s.body, ...(s.bullets ?? []), ...(s.columns ?? []), s.quoteText, s.notes]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");
}

/** GET — which languages this deck already has glossaries for. */
export async function GET(request: NextRequest) {
  const deckId = request.nextUrl.searchParams.get("deckId");
  if (!deckId) return NextResponse.json({ error: "deckId required." }, { status: 400 });
  return NextResponse.json({ languages: await getGlossaryLanguages(deckId) });
}

/**
 * POST — build (or return) a deck's glossary in one language.
 *
 * This is the "download a language" action. It costs one model call per deck
 * per language, once, and is then reused by every future lesson from that deck.
 * Already-built languages short-circuit before reaching the model.
 */
export async function POST(request: NextRequest) {
  let body: { deckId?: string; language?: string; subject?: string; gradeBand?: string; force?: boolean };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const deckId = (body.deckId ?? "").trim();
  const language = (body.language ?? "").trim();
  if (!deckId) return NextResponse.json({ error: "deckId required." }, { status: 400 });
  if (!isSupportedLanguage(language)) {
    return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
  }

  if (!body.force) {
    const existing = await getGlossary(deckId, language);
    if (existing) {
      return NextResponse.json({ terms: existing.terms, cached: true });
    }
  }

  const deck = await getDeckById(deckId);
  if (!deck) return NextResponse.json({ error: "Deck not found." }, { status: 404 });

  const text = deckText(deck.slides as Slide[]);
  if (text.trim().length < 40) {
    return NextResponse.json({ error: "This deck has too little text to gloss." }, { status: 400 });
  }

  try {
    const { output } = await generateDeckGlossary({
      deckText: text,
      language,
      subject: body.subject ?? "",
      gradeBand: body.gradeBand ?? "",
    });
    await saveGlossary(deckId, language, output.terms);
    // Fold the deck's terms into the global cache too, so the words are already
    // warm when a student taps one mid-lesson.
    await seedLexiconFromGlossary(language, output.terms);
    return NextResponse.json({ terms: output.terms, cached: false });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    console.error("[lengua/glossary] failed:", err);
    return NextResponse.json({ error: "Could not build the glossary." }, { status: 502 });
  }
}
