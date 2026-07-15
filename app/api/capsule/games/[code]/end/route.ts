import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/capsuleAuth";
import { getGame, endGame } from "@/lib/capsuleDb";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const game = await getGame(code);
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  if (game.host_id !== user.id) return NextResponse.json({ error: "Only the host can end the game." }, { status: 403 });

  await endGame(code);
  return NextResponse.json({ ok: true });
}
