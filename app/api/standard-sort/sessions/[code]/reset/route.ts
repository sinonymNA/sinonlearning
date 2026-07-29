import { NextRequest, NextResponse } from "next/server";
import { resetSession } from "@/lib/standardSortDb";

export const dynamic = "force-dynamic";

// Destructive — wipes every participant and response for the session so the
// same code/link can be reused for a real run after a trial. Gated on the
// host token issued once at creation, held only by whoever made the session.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.hostToken) return NextResponse.json({ error: "Host token required." }, { status: 401 });

  const ok = await resetSession(code, body.hostToken);
  if (!ok) return NextResponse.json({ error: "Could not reset this session." }, { status: 403 });
  return NextResponse.json({ ok: true });
}
