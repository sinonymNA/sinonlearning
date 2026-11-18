// @ts-nocheck
import { cookies } from "next/headers";
import { handleAccount } from "../../../../arcade-server/api.mjs";
import { hashToken } from "../../../../arcade-server/accounts.mjs";
import { respond } from "@/lib/arcadeHttp";
import { ARCADE_COOKIE } from "@/lib/arcadeAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Username + password arcade accounts. The session cookie holds a random token; only its hash is stored. */
export async function POST(request: Request) {
  return respond(request, async (ctx, body, { service }) => {
    const jar = await cookies();
    if (body.type === "logout") {
      const t = jar.get(ARCADE_COOKIE)?.value;
      if (t) await ctx.store.deleteSession(hashToken(t));
    }
    const out = await handleAccount(service, ctx, body);
    if (out.startSession) {
      jar.set(ARCADE_COOKIE, out.startSession.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: out.startSession.expiresAt });
    }
    if (out.endSession) jar.delete(ARCADE_COOKIE);
    return { ok: true, user: out.user ?? null };
  });
}
