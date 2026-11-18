// @ts-nocheck
import { handleDev } from "../../../../arcade-server/api.mjs";
import { respond } from "@/lib/arcadeHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Developer test lab commands. Every call is re-authorised server-side (signed-in teacher required). */
export async function POST(request: Request) {
  return respond(request, (ctx, body, { service }) => handleDev(service, ctx, body));
}
