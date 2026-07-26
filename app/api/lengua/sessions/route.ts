import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/lenguaDb";
import { getCurrentUser } from "@/lib/marginsAuth";
import { isSupportedLanguage } from "@/lib/lenguaLanguages";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { deckId?: string | null; title?: string; languages?: string[] };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = (body.title ?? "").trim() || "Lesson";
  const languages = (body.languages ?? []).filter(isSupportedLanguage);
  if (languages.length === 0) {
    return NextResponse.json({ error: "Pick at least one language for the room." }, { status: 400 });
  }

  let teacherId: string | null = null;
  try { teacherId = (await getCurrentUser())?.id ?? null; } catch { teacherId = null; }

  try {
    const { code, hostToken } = await createSession({
      deckId: body.deckId ?? null, title, languages, teacherId,
    });
    return NextResponse.json({ code, hostToken });
  } catch (err) {
    console.error("[lengua/sessions] create failed:", err);
    return NextResponse.json({ error: "Could not create the room." }, { status: 500 });
  }
}
