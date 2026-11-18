// @ts-nocheck
import { NextResponse } from "next/server";
import { getArcadeUser } from "@/lib/arcadeAuth";
import { getArcade } from "@/lib/arcadeRuntime";
import { getClientIp } from "@/lib/rateLimit";

const STATUS = { forbidden: 403, auth: 401, not_found: 404, rate: 429 };

/** Shared wrapper for the arcade API routes: parse JSON, resolve identity, map GameErrors to HTTP errors. */
export async function respond(request: Request, run: (ctx: any, body: any, arcade: any) => Promise<any>) {
  try {
    const raw = await request.text();
    if (raw.length > 20000) return NextResponse.json({ error: "Message too large." }, { status: 413 });
    const body = JSON.parse(raw || "{}");
    const arcade = getArcade();
    const user = await getArcadeUser();
    const ctx = {
      user, ip: getClientIp(request), store: arcade.store,
      // reuse of the existing Game Show question banks (lib/gameShows.ts)
      gameShows: { getById: async (id: string) => (await import("@/lib/gameShows")).getGameShowById(id) },
    };
    const data = await run(ctx, body, arcade);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const e = error as any;
    const known = e?.name === "GameError";
    if (!known && !(e instanceof SyntaxError)) console.error("arcade error", e);
    return NextResponse.json(
      { error: known ? e.message : e instanceof SyntaxError ? "Malformed request." : "Something went wrong.", code: known ? e.code : "error" },
      { status: known ? STATUS[e.code] ?? 400 : 400 }
    );
  }
}
