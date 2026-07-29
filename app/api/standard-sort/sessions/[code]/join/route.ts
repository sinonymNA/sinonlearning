import { NextRequest, NextResponse } from "next/server";
import { joinSession, getOrCreateSeededSession } from "@/lib/standardSortDb";
import { STANDARD_SORT_SEEDS } from "@/lib/standardSort";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { name?: string; participantToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const participantToken = (body.participantToken ?? "").trim();
  if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!participantToken) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  // A seeded session springs into existence on first contact regardless of
  // whether the caller hit the state route first — join shouldn't be fragile
  // to call order, since the inline name prompt on the sort page fires it
  // directly.
  const seed = STANDARD_SORT_SEEDS[code];
  if (seed) await getOrCreateSeededSession(code, seed);

  const participant = await joinSession(code, name, participantToken);
  if (!participant) {
    return NextResponse.json({ error: "That code doesn't match a session." }, { status: 404 });
  }
  return NextResponse.json({ name: participant.name });
}
