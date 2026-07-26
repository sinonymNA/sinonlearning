import { NextRequest, NextResponse } from "next/server";
import { joinSession } from "@/lib/lenguaDb";
import { isSupportedLanguage, DEFAULT_TIER } from "@/lib/lenguaLanguages";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { name?: string; studentToken?: string; language?: string; tier?: number };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const studentToken = (body.studentToken ?? "").trim();
  const language = (body.language ?? "").trim();
  if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!studentToken) return NextResponse.json({ error: "Missing student token." }, { status: 400 });
  if (!isSupportedLanguage(language)) {
    return NextResponse.json({ error: "Choose a language." }, { status: 400 });
  }

  const tier = Math.max(1, Math.min(4, Number(body.tier) || DEFAULT_TIER));
  const student = await joinSession({ code, name, studentToken, language, tier });
  if (!student) {
    return NextResponse.json({ error: "That room isn't open. Check the code with your teacher." }, { status: 409 });
  }
  return NextResponse.json({ studentId: student.id, language: student.language, tier: student.tier });
}
