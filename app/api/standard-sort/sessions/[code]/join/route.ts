import { NextRequest, NextResponse } from "next/server";
import { joinSession } from "@/lib/standardSortDb";

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

  const participant = await joinSession(code, name, participantToken);
  if (!participant) {
    return NextResponse.json({ error: "That code doesn't match a session." }, { status: 404 });
  }
  return NextResponse.json({ name: participant.name });
}
