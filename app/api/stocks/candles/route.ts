import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PERIODS: Record<string, { interval: string; range: string }> = {
  "1W": { interval: "1d", range: "5d" },
  "1M": { interval: "1d", range: "1mo" },
  "3M": { interval: "1d", range: "3mo" },
  "6M": { interval: "1d", range: "6mo" },
  "1Y": { interval: "1wk", range: "1y" },
};

// 5-minute in-memory cache
interface Cached { timestamps: number[]; closes: number[]; at: number }
const cache = new Map<string, Cached>();
const TTL = 5 * 60_000;

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.toUpperCase();
  const period = request.nextUrl.searchParams.get("period") ?? "1M";

  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  const key = `${ticker}:${period}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) {
    return NextResponse.json({ timestamps: hit.timestamps, closes: hit.closes });
  }

  const cfg = PERIODS[period] ?? PERIODS["1M"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${cfg.interval}&range=${cfg.range}&includePrePost=false`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; sinonlearning/1.0)",
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ timestamps: [], closes: [], error: `Yahoo ${res.status}` });
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return NextResponse.json({ timestamps: [], closes: [] });

    const rawTs: number[] = result.timestamp ?? [];
    const rawC: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const timestamps: number[] = [];
    const closes: number[] = [];
    rawTs.forEach((t, i) => {
      const c = rawC[i];
      if (c != null && c > 0) { timestamps.push(t); closes.push(c); }
    });

    cache.set(key, { timestamps, closes, at: Date.now() });
    return NextResponse.json({ timestamps, closes });
  } catch (err) {
    return NextResponse.json({ timestamps: [], closes: [], error: String(err) });
  }
}
