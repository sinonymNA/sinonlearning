import { NextRequest, NextResponse } from "next/server";
import { getSession, getStudentByToken, recordLookup } from "@/lib/lenguaDb";
import { glossTermCached } from "@/lib/lenguaKoraGenerate";
import { tierDef } from "@/lib/lenguaLanguages";
import { KoraConfigError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";

// A student tapped a word.
//
// The language is taken from their enrolment rather than the request body — a
// client cannot ask for a language it did not join with. The tier decides how
// much comes back: at tier 4 the L1 translation is withheld entirely, which is
// the whole point of the tier existing.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { studentToken?: string; term?: string; context?: string; slideIndex?: number; wantL1?: boolean };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const term = (body.term ?? "").trim();
  if (!term || term.length > 80) {
    return NextResponse.json({ error: "No term supplied." }, { status: 400 });
  }

  const session = await getSession(code);
  if (!session) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const student = await getStudentByToken(code, (body.studentToken ?? "").trim());
  if (!student) return NextResponse.json({ error: "You're not in this room." }, { status: 403 });

  const tier = tierDef(student.tier);
  const wantL1 = Boolean(body.wantL1) && tier.offerL1;

  try {
    const { entry, cached } = await glossTermCached(term, student.language, body.context ?? "");

    await recordLookup({
      code,
      studentId: student.id,
      term,
      language: student.language,
      slideIndex: Number(body.slideIndex) || 0,
      reachedL1: wantL1,
    });

    return NextResponse.json({
      term: entry.term,
      gloss_en: entry.gloss_en,
      // Withheld unless the tier allows it and the student actually asked —
      // the second tap is the deliberate act the design depends on.
      gloss_l1: wantL1 || tier.showL1OnFirstTap ? entry.gloss_l1 : null,
      part_of_speech: entry.part_of_speech ?? null,
      l1Available: tier.offerL1,
      cached,
    });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "Glossing is not configured." }, { status: 503 });
    }
    console.error("[lengua/lookup] failed:", err);
    return NextResponse.json({ error: "Could not look that up." }, { status: 502 });
  }
}
