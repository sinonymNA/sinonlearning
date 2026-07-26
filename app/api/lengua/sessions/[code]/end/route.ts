import { NextRequest, NextResponse } from "next/server";
import { endSession } from "@/lib/lenguaDb";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.hostToken) return NextResponse.json({ error: "Host token required." }, { status: 401 });
  const ok = await endSession(code, body.hostToken);
  if (!ok) return NextResponse.json({ error: "Could not end this room." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
