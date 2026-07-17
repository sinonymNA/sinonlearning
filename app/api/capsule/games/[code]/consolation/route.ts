import { NextRequest, NextResponse } from "next/server";
import { awardConsolation, getGame } from "@/lib/capsuleDb";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = await req.json() as { playerId?: string };
  const { playerId } = body;

  if (!playerId) {
    return NextResponse.json({ error: "playerId is required." }, { status: 400 });
  }

  const game = await getGame(code);
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  if (game.status !== "active") return NextResponse.json({ error: "Game is not active." }, { status: 400 });

  try {
    const { goldDelta } = await awardConsolation(code, playerId, game.current_question);
    return NextResponse.json({ goldDelta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Consolation award failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
