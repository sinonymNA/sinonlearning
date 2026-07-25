import { NextRequest, NextResponse } from "next/server";
import { getSession, getPlayers, saveEntry } from "@/lib/relayDb";
import { essaySeatForRound } from "@/lib/relayGame";

export const dynamic = "force-dynamic";

// Autosave target for the writing screen.
//
// The client sends only its own student token and the text. Which essay that
// student is allowed to write on is derived server-side from the seat rotation
// — the request never names an essay. That closes the hole where a client could
// post into a rival team's essay by guessing an id, and it means a stale client
// mid-round-change writes nothing rather than writing to the wrong place.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { studentToken?: string; text?: string; round?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const studentToken = (body.studentToken ?? "").trim();
  if (!studentToken) return NextResponse.json({ error: "Missing student token." }, { status: 401 });

  const session = await getSession(code);
  if (!session) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (session.status !== "writing") {
    return NextResponse.json({ error: "This room isn't in a writing round." }, { status: 409 });
  }

  // Reject a save aimed at a round that has already moved on, so a laggy
  // autosave can't overwrite the next round's work.
  if (typeof body.round === "number" && body.round !== session.current_round) {
    return NextResponse.json({ error: "That round has ended." }, { status: 409 });
  }

  const players = await getPlayers(code);
  const player = players.find((p) => p.student_token === studentToken);
  if (!player || !player.team_id || player.seat_index === null) {
    return NextResponse.json({ error: "You're not seated in this room." }, { status: 403 });
  }

  const teammates = players
    .filter((p) => p.team_id === player.team_id)
    .sort((a, b) => (a.seat_index ?? 0) - (b.seat_index ?? 0));
  if (teammates.length === 0) {
    return NextResponse.json({ error: "Your team has no members." }, { status: 403 });
  }

  const holdingSeat = essaySeatForRound(player.seat_index, session.current_round, teammates.length);
  const owner = teammates[holdingSeat];
  if (!owner) return NextResponse.json({ error: "No essay assigned this round." }, { status: 409 });

  await saveEntry({
    code,
    essayOwnerId: owner.id,
    round: session.current_round,
    authorId: player.id,
    text: body.text ?? "",
  });

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
