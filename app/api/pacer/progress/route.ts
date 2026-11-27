import { NextRequest, NextResponse } from "next/server";
import { requireUser, noStore } from "@/lib/pacerHttp";
import { setProgress } from "@/lib/pacerDb";

export const dynamic = "force-dynamic";

/** Where you are in a book. Newest write wins, so an old tab cannot drag you backwards. */
export async function PUT(req: NextRequest) {
  const a = await requireUser(req, true); if ("res" in a) return a.res;
  let b: Record<string, unknown>; try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore }); }
  const pos = Math.round(Number(b?.pos)), wpm = Math.round(Number(b?.wpm)), at = Math.round(Number(b?.at)), id = String(b?.id || "");
  if (!/^[a-z0-9]{1,24}$/.test(id) || !Number.isFinite(pos) || pos < 0 || pos > 5e6 || !Number.isFinite(wpm) || wpm < 60 || wpm > 1200 || !Number.isFinite(at) || at <= 0) return NextResponse.json({ error: "Invalid progress." }, { status: 400, headers: noStore });
  return NextResponse.json({ ok: true, applied: await setProgress(a.user.id, id, pos, wpm, Math.min(at, Date.now() + 60000)) }, { headers: noStore });
}
