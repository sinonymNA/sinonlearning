import { NextRequest, NextResponse } from "next/server";
import { saveStockSimGame } from "@/lib/stockSimSaves";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const passcode = typeof body.passcode === "string" ? body.passcode.trim() : "";
  const state = body.state;

  if (passcode.length < 4) {
    return NextResponse.json(
      { error: "Choose a passcode that's at least 4 characters." },
      { status: 400 }
    );
  }
  if (!state || typeof state !== "object") {
    return NextResponse.json({ error: "Missing game state." }, { status: 400 });
  }

  await saveStockSimGame(passcode, state);
  return NextResponse.json({ ok: true });
}
