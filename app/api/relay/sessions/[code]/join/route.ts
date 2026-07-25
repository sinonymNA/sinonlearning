import { NextRequest, NextResponse } from "next/server";
import { joinSession } from "@/lib/relayDb";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { name?: string; studentToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const studentToken = (body.studentToken ?? "").trim();
  if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!studentToken) return NextResponse.json({ error: "Missing student token." }, { status: 400 });

  const player = await joinSession(code, name, studentToken);
  if (!player) {
    // Either the code is wrong or the relay already started — teams and seats
    // are fixed at start, so a late joiner can't be slotted into the rotation.
    return NextResponse.json(
      { error: "That room isn't accepting players right now. Check the code, or ask your teacher to restart." },
      { status: 409 }
    );
  }
  return NextResponse.json({ playerId: player.id, name: player.display_name });
}
