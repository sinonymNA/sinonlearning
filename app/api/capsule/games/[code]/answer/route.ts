import { NextRequest, NextResponse } from "next/server";
import { getGame, getAnswer, submitAnswer, getPlayerById } from "@/lib/capsuleDb";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  let body: { playerId?: string; answerIndex?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  const { playerId, answerIndex } = body;
  if (!playerId || answerIndex === undefined) {
    return NextResponse.json({ error: "playerId and answerIndex are required." }, { status: 400 });
  }

  const game = await getGame(code);
  if (!game || game.status !== "active") return NextResponse.json({ error: "Game is not active." }, { status: 400 });

  const player = await getPlayerById(playerId);
  if (!player || player.game_code !== code) return NextResponse.json({ error: "Player not in this game." }, { status: 403 });

  // Idempotent — ignore duplicate submissions
  const existing = await getAnswer(code, playerId, game.current_question);
  if (existing) return NextResponse.json({ answer: existing, goldDelta: 0 });

  const questions = game.questions as Array<{ answer: number }>;
  const isCorrect = answerIndex === questions[game.current_question]?.answer;

  const result = await submitAnswer(code, playerId, game.current_question, answerIndex, isCorrect);
  return NextResponse.json(result);
}
