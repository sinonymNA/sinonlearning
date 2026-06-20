import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 25 * 1000;

export const WATCHLIST = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "META", name: "Meta" },
  { symbol: "DIS", name: "Disney" },
  { symbol: "NKE", name: "Nike" },
  { symbol: "KO", name: "Coca-Cola" },
  { symbol: "SBUX", name: "Starbucks" },
  { symbol: "NFLX", name: "Netflix" },
] as const;

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface FinnhubQuote {
  c: number;
  d: number;
  dp: number;
}

let cache: { timestamp: number; quotes: StockQuote[] } | null = null;
let pendingFetch: Promise<StockQuote[]> | null = null;

async function fetchQuotes(apiKey: string): Promise<StockQuote[]> {
  const results = await Promise.all(
    WATCHLIST.map(async ({ symbol, name }) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Finnhub request failed for ${symbol}`);
      const data: FinnhubQuote = await res.json();
      return {
        symbol,
        name,
        price: data.c,
        change: data.d,
        changePercent: data.dp,
      };
    })
  );
  return results;
}

export async function GET() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Live stock prices aren't set up yet. An admin needs to add a Finnhub API key." },
      { status: 503 }
    );
  }

  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ quotes: cache.quotes, asOf: cache.timestamp });
  }

  try {
    if (!pendingFetch) {
      pendingFetch = fetchQuotes(apiKey).finally(() => {
        pendingFetch = null;
      });
    }
    const quotes = await pendingFetch;
    cache = { timestamp: Date.now(), quotes };
    return NextResponse.json({ quotes: cache.quotes, asOf: cache.timestamp });
  } catch {
    if (cache) {
      return NextResponse.json({ quotes: cache.quotes, asOf: cache.timestamp });
    }
    return NextResponse.json({ error: "Couldn't fetch live stock prices right now." }, { status: 502 });
  }
}
