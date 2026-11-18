// @ts-nocheck
import { handleAbyss } from "../../../../arcade-server/api.mjs";
import { respond } from "@/lib/arcadeHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return respond(request, (ctx, body) => handleAbyss(ctx, body));
}
