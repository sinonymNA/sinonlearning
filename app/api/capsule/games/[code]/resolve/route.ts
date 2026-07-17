import { NextRequest, NextResponse } from "next/server";
import { resolveAnswer } from "@/lib/capsuleDb";
import type { MachineChoice } from "@/lib/capsuleData";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const body = await req.json() as { playerId?: string; machineChoice?: string };
  const { playerId, machineChoice } = body;

  if (!playerId || !machineChoice) {
    return NextResponse.json({ error: "playerId and machineChoice are required." }, { status: 400 });
  }

  const validMachines: MachineChoice[] = ["volt", "aurum", "ruby"];
  if (!validMachines.includes(machineChoice as MachineChoice)) {
    return NextResponse.json({ error: "Invalid machineChoice." }, { status: 400 });
  }

  // We need the current question index — fetch from the game's current state
  const { getGame } = await import("@/lib/capsuleDb");
  const game = await getGame(code);
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });
  if (game.status !== "active") return NextResponse.json({ error: "Game is not active." }, { status: 400 });

  try {
    const { chestResult, goldDelta } = await resolveAnswer(
      code,
      playerId,
      game.current_question,
      machineChoice as MachineChoice,
    );
    return NextResponse.json({ chestResult, goldDelta });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resolve failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
