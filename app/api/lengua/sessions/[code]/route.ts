import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getStudents,
  getStudentByToken,
  getRecentLines,
  getLookupHeatmap,
  getGlossary,
  getStudentHarvest,
} from "@/lib/lenguaDb";
import { getDeckById } from "@/lib/sliderDb";
import { tierDef, l1DelayMs, languageByCode } from "@/lib/lenguaLanguages";
import type { Slide } from "@/lib/sliderTypes";

export const dynamic = "force-dynamic";

// Single polled endpoint for the presenter screen and every student screen.
//
// A student passes their token and gets back only their own slice: their
// language's glossary for the current slide, their tier's rules, their harvest.
// The presenter gets the room-level view including the lookup heat map.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const studentToken = request.nextUrl.searchParams.get("studentToken");
  const host = request.nextUrl.searchParams.get("host") === "1";

  const session = await getSession(code);
  if (!session) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const [students, lines] = await Promise.all([getStudents(code), getRecentLines(code, 25)]);

  // Slides are public to the room — that's the point of the room.
  let slides: Slide[] = [];
  let deckTitle = session.title;
  if (session.deck_id) {
    const deck = await getDeckById(session.deck_id);
    if (deck) {
      slides = deck.slides as Slide[];
      deckTitle = deck.title;
    }
  }

  const base = {
    code: session.code,
    title: deckTitle,
    status: session.status,
    currentSlide: session.current_slide,
    slideCount: slides.length,
    slide: slides[session.current_slide] ?? null,
    languages: session.languages,
    studentCount: students.length,
    lines: lines.map((l) => ({ seq: l.seq, text: l.text_en, confidence: l.confidence })),
  };

  // ── Student view ──────────────────────────────────────────────────────────
  if (studentToken) {
    const student = await getStudentByToken(code, studentToken);
    if (!student) {
      return NextResponse.json({ ...base, me: null });
    }

    const tier = tierDef(student.tier);
    const glossary = session.deck_id ? await getGlossary(session.deck_id, student.language) : null;
    const lang = languageByCode(student.language);

    // Only the terms that actually occur on the slide being shown — the panel
    // beside the slide should be this slide's vocabulary, not the whole deck's.
    const slideText = [
      base.slide?.title,
      base.slide?.subtitle,
      base.slide?.body,
      ...(base.slide?.bullets ?? []),
      ...(base.slide?.columns ?? []),
      base.slide?.quoteText,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const slideTerms = (glossary?.terms ?? []).filter((t) =>
      slideText.includes(t.term.toLowerCase())
    );

    return NextResponse.json({
      ...base,
      me: {
        id: student.id,
        name: student.display_name,
        language: student.language,
        languageName: lang?.name ?? student.language,
        rtl: lang?.rtl ?? false,
        fontFamily: lang?.fontFamily ?? null,
        tier: student.tier,
        tierLabel: tier.label,
        showL1OnFirstTap: tier.showL1OnFirstTap,
        l1Available: tier.offerL1,
        l1DelayMs: l1DelayMs(student.tier),
        // At tier 4 the L1 column is withheld even in the pre-built glossary;
        // the tier means English-only everywhere, not just on tap.
        slideTerms: slideTerms.map((t) => ({
          term: t.term,
          gloss_en: t.gloss_en,
          gloss_l1: tier.offerL1 ? t.gloss_l1 : null,
        })),
        harvest: session.status === "ended" ? await getStudentHarvest(code, student.id) : [],
      },
    });
  }

  // ── Presenter view ────────────────────────────────────────────────────────
  if (host) {
    const heatmap = await getLookupHeatmap(code);
    return NextResponse.json({
      ...base,
      slides,
      roster: students.map((s) => ({
        id: s.id,
        name: s.display_name,
        language: s.language,
        tier: s.tier,
      })),
      heatmap,
    });
  }

  return NextResponse.json(base);
}
