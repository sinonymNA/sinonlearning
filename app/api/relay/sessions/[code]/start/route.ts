import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/relayDb";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { hostToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.hostToken) return NextResponse.json({ error: "Host token required." }, { status: 401 });

  const ok = await startSession(code, body.hostToken);
  if (!ok) {
    return NextResponse.json(
      { error: "Could not start — you need at least 2 players and a room still in the lobby." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
