import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "./marginsAuth";
import type { MarginsUser } from "./marginsDb";

/** Cookie-authenticated writes must come from this site itself (a different site cannot make your browser change your library). */
export function sameOrigin(req: NextRequest): boolean {
  const site = req.headers.get("sec-fetch-site"); if (site) return site === "same-origin" || site === "none";
  const origin = req.headers.get("origin"); if (!origin) return true; try { return new URL(origin).host === (req.headers.get("x-forwarded-host") || req.headers.get("host")); } catch { return false; }
}
export const noStore = { "Cache-Control": "private, no-store" };
/** The signed-in user, or the response to send instead. */
export async function requireUser(req: NextRequest, write = false): Promise<{ user: MarginsUser } | { res: NextResponse }> {
  if (!process.env.DATABASE_URL) return { res: NextResponse.json({ error: "Sync is not set up on this server." }, { status: 503, headers: noStore }) };
  if (write && !sameOrigin(req)) return { res: NextResponse.json({ error: "Cross-site request refused." }, { status: 403, headers: noStore }) };
  const user = await getCurrentUser().catch(() => undefined); if (!user) return { res: NextResponse.json({ error: "Sign in to use sync." }, { status: 401, headers: noStore }) };
  return { user };
}
