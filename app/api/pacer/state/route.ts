import { NextRequest, NextResponse } from "next/server";
import { requireUser, noStore } from "@/lib/pacerHttp";
import { getState, setState } from "@/lib/pacerDb";
import { sanitizeSettings, sanitizeSessions, mergeSessions } from "@/lib/pacer/validate.mjs";

export const dynamic = "force-dynamic";

/** Reader settings (newest write wins) and session history (merged, never lost). */
export async function PUT(req: NextRequest) {
  const a = await requireUser(req, true); if ("res" in a) return a.res;
  let b: Record<string, unknown>; try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: noStore }); }
  const at = Math.min(Math.round(Number(b?.at)) || Date.now(), Date.now() + 60000), cur = await getState(a.user.id);
  const sessions = mergeSessions(cur.sessions as never, sanitizeSessions(b?.sessions)); await setState(a.user.id, sanitizeSettings(b?.settings as never), sessions as never, at);
  const now = await getState(a.user.id); return NextResponse.json({ ok: true, settings: now.settings, sessions: now.sessions, at: now.at }, { headers: noStore });
}
