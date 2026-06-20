import { NextRequest, NextResponse } from "next/server";
import { loadStockSimGame } from "@/lib/stockSimSaves";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const passcode = request.nextUrl.searchParams.get("passcode")?.trim() ?? "";
  if (!passcode) {
    return NextResponse.json({ error: "Enter your passcode." }, { status: 400 });
  }

  const state = await loadStockSimGame(passcode);
  if (!state) {
    return NextResponse.json({ error: "No saved game found for that passcode." }, { status: 404 });
  }

  return NextResponse.json({ state });
}
