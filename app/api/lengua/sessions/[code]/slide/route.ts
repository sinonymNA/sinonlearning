import { NextRequest, NextResponse } from "next/server";
import { setCurrentSlide } from "@/lib/lenguaDb";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.hostToken) return NextResponse.json({ error: "Host token required." }, { status: 401 });
  const ok = await setCurrentSlide(code, body.hostToken, Number(body.index) || 0);
  if (!ok) return NextResponse.json({ error: "Could not change slide." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
