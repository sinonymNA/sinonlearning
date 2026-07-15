import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/capsuleAuth";
import { createGame } from "@/lib/capsuleDb";
import { DEMO_QUESTIONS, type CapsuleQuestion } from "@/lib/capsuleData";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (user.role !== "teacher") return NextResponse.json({ error: "Only teachers can host games." }, { status: 403 });

  let body: { title?: string; questions?: CapsuleQuestion[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  const title = (body.title ?? "Cap Raid").trim();
  const questions = body.questions?.length ? body.questions : DEMO_QUESTIONS;

  const code = await createGame(user.id, title, questions);
  return NextResponse.json({ code });
}
