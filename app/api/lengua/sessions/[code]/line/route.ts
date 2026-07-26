import { NextRequest, NextResponse } from "next/server";
import { appendLine, getSession } from "@/lib/lenguaDb";

export const dynamic = "force-dynamic";

// The teacher's browser does speech recognition locally and posts finalised
// lines here. No audio ever leaves their machine and no model is involved, so
// the transcript itself costs nothing to run.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { hostToken?: string; seq?: number; text?: string; confidence?: number };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const session = await getSession(code);
  if (!session) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (!body.hostToken || session.host_token !== body.hostToken) {
    return NextResponse.json({ error: "Only the presenter can post transcript." }, { status: 403 });
  }

  const text = (body.text ?? "").trim();
  if (!text) return NextResponse.json({ ok: true, skipped: true });

  await appendLine({
    code,
    seq: Number(body.seq) || 0,
    text,
    confidence: typeof body.confidence === "number" ? body.confidence : 1,
  });
  return NextResponse.json({ ok: true });
}
