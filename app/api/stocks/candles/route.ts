import { NextRequest, NextResponse } from "next/server";
import { getCandles } from "@/lib/finnhubClient";

export const dynamic = "force-dynamic";

const PERIODS: Record<string, { resolution: string; days: number }> = {
  "1W": { resolution: "D", days: 7 },
  "1M": { resolution: "D", days: 30 },
  "3M": { resolution: "D", days: 90 },
  "6M": { resolution: "D", days: 180 },
  "1Y": { resolution: "W", days: 365 },
};

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.toUpperCase();
  const period = request.nextUrl.searchParams.get("period") ?? "1M";

  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });
  if (!process.env.FINNHUB_API_KEY) return NextResponse.json({ error: "API not configured" }, { status: 503 });

  const cfg = PERIODS[period] ?? PERIODS["1M"];
  const to = Math.floor(Date.now() / 1000);
  const from = to - cfg.days * 86400;

  try {
    const data = await getCandles(ticker, cfg.resolution, from, to);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not fetch chart data." }, { status: 502 });
  }
}
