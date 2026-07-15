import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/capsuleAuth";
import { getGame, joinGame } from "@/lib/capsuleDb";
import { STARTER_CAP_ID } from "@/lib/capsuleData";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const user = await getCurrentUser();

  const game = await getGame(code);
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  if (game.status === "ended") return NextResponse.json({ error: "This game has ended." }, { status: 410 });

  let body: { displayName?: string };
  try { body = await req.json(); } catch { body = {}; }

  const displayName = (body.displayName ?? user?.username ?? "").trim().slice(0, 24);
  if (!displayName) return NextResponse.json({ error: "Enter a display name." }, { status: 400 });

  const capId = user?.equipped_cap_id ?? STARTER_CAP_ID;
  const player = await joinGame(code, user?.id ?? null, displayName, capId);

  return NextResponse.json({ playerId: player.id, displayName: player.display_name, capId: player.cap_id });
}
