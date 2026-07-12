import { NextResponse } from "next/server";
import { getCachedQuote } from "@/lib/finnhubClient";

export const dynamic = "force-dynamic";

const WATCHLIST = [
  // Big Tech
  { symbol: "AAPL", name: "Apple", group: "Big Tech" },
  { symbol: "MSFT", name: "Microsoft", group: "Big Tech" },
  { symbol: "GOOGL", name: "Alphabet", group: "Big Tech" },
  // AI & Chips
  { symbol: "NVDA", name: "NVIDIA", group: "AI & Chips" },
  { symbol: "AMD", name: "AMD", group: "AI & Chips" },
  { symbol: "AVGO", name: "Broadcom", group: "AI & Chips" },
  // EV & Transport
  { symbol: "TSLA", name: "Tesla", group: "EV & Transport" },
  { symbol: "UBER", name: "Uber", group: "EV & Transport" },
  { symbol: "F", name: "Ford", group: "EV & Transport" },
  // Finance
  { symbol: "JPM", name: "JPMorgan", group: "Finance" },
  { symbol: "V", name: "Visa", group: "Finance" },
  { symbol: "GS", name: "Goldman Sachs", group: "Finance" },
  // Consumer
  { symbol: "SBUX", name: "Starbucks", group: "Consumer" },
  { symbol: "NKE", name: "Nike", group: "Consumer" },
  { symbol: "MCD", name: "McDonald's", group: "Consumer" },
  // Entertainment
  { symbol: "DIS", name: "Disney", group: "Entertainment" },
  { symbol: "NFLX", name: "Netflix", group: "Entertainment" },
  { symbol: "SPOT", name: "Spotify", group: "Entertainment" },
  // Healthcare
  { symbol: "UNH", name: "UnitedHealth", group: "Healthcare" },
  { symbol: "LLY", name: "Eli Lilly", group: "Healthcare" },
  { symbol: "JNJ", name: "J&J", group: "Healthcare" },
  // Energy
  { symbol: "XOM", name: "Exxon", group: "Energy" },
  { symbol: "CVX", name: "Chevron", group: "Energy" },
  { symbol: "NEE", name: "NextEra", group: "Energy" },
];

interface Mover {
  symbol: string;
  name: string;
  group: string;
  price: number;
  changePct: number;
}

let cache: { at: number; movers: Mover[] } | null = null;
const TTL = 60_000;

export async function GET() {
  if (!process.env.FINNHUB_API_KEY) return NextResponse.json({ movers: [] });
  if (cache && Date.now() - cache.at < TTL) return NextResponse.json({ movers: cache.movers });

  const settled = await Promise.allSettled(
    WATCHLIST.map(async ({ symbol, name, group }) => {
      const q = await getCachedQuote(symbol);
      return { symbol, name, group, price: q.price, changePct: q.changePct } as Mover;
    })
  );

  const movers: Mover[] = settled
    .filter((r): r is PromiseFulfilledResult<Mover> => r.status === "fulfilled")
    .map(r => r.value)
    .filter(m => m.price > 0);

  movers.sort((a, b) => b.changePct - a.changePct);
  cache = { at: Date.now(), movers };
  return NextResponse.json({ movers });
}
