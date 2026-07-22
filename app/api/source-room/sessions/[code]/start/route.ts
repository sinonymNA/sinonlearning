import { NextRequest, NextResponse } from "next/server";
import { startSession } from "@/lib/sourceRoomDb";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } },
) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.hostToken !== "string") {
    return NextResponse.json({ error: "hostToken required." }, { status: 400 });
  }

  const ok = await startSession(params.code, body.hostToken);
  if (!ok) {
    return NextResponse.json({ error: "Session not found or invalid host token." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
