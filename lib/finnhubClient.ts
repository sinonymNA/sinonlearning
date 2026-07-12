const BASE = "https://finnhub.io/api/v1";

function apiKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY not set");
  return key;
}

async function fhFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("token", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Finnhub ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FinnhubQuote {
  c: number;   // current price
  d: number;   // change
  dp: number;  // change percent
  h: number;   // day high
  l: number;   // day low
  o: number;   // open
  pc: number;  // previous close
}

export interface CompanyProfile {
  name: string;
  ticker: string;
  exchange: string;
  finnhubIndustry: string;
  logo: string;
  weburl: string;
  marketCapitalization: number;
  shareOutstanding: number;
}

export interface SearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export interface BasicFinancials {
  peRatio: number | null;
  epsAnnual: number | null;
  grossMarginTTM: number | null;
  debtToEquity: number | null;
  returnOnEquity: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  revenuePerShareAnnual: number | null;
}

// ── Per-ticker in-memory cache (20 second TTL) ────────────────────────────────

interface CachedQuote {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  prevClose: number;
  timestamp: number;
}

const quoteCache = new Map<string, CachedQuote>();
const QUOTE_TTL = 20_000;

export async function getCachedQuote(symbol: string): Promise<CachedQuote> {
  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < QUOTE_TTL) {
    return cached;
  }
  const q = await fhFetch<FinnhubQuote>("/quote", { symbol });
  const result: CachedQuote = {
    price: q.c,
    change: q.d,
    changePct: q.dp,
    high: q.h,
    low: q.l,
    prevClose: q.pc,
    timestamp: Date.now(),
  };
  quoteCache.set(symbol, result);
  return result;
}

// ── Candle cache (5-minute TTL per symbol+resolution) ────────────────────────

interface CandleResult {
  timestamps: number[];
  closes: number[];
  cached: number;
}

const candleCache = new Map<string, CandleResult>();
const CANDLE_TTL = 5 * 60_000;

export async function getCandles(
  symbol: string,
  resolution: string,
  from: number,
  to: number,
): Promise<{ timestamps: number[]; closes: number[] }> {
  const key = `${symbol}:${resolution}:${from}`;
  const hit = candleCache.get(key);
  if (hit && Date.now() - hit.cached < CANDLE_TTL) {
    return { timestamps: hit.timestamps, closes: hit.closes };
  }
  const data = await fhFetch<{ t: number[]; c: number[]; s: string }>("/stock/candle", {
    symbol, resolution,
    from: String(from),
    to: String(to),
  });
  if (data.s !== "ok" || !data.t?.length) return { timestamps: [], closes: [] };
  const result: CandleResult = { timestamps: data.t, closes: data.c, cached: Date.now() };
  candleCache.set(key, result);
  return { timestamps: result.timestamps, closes: result.closes };
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function searchSymbols(q: string): Promise<SearchResult[]> {
  const data = await fhFetch<{ result: SearchResult[] }>("/search", { q });
  return (data.result ?? [])
    .filter((r) => r.type === "Common Stock" && !r.symbol.includes("."))
    .slice(0, 8);
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const data = await fhFetch<CompanyProfile>("/stock/profile2", { symbol });
  if (!data?.name) return null;
  return data;
}

export async function getBasicFinancials(symbol: string): Promise<BasicFinancials> {
  const data = await fhFetch<{ metric: Record<string, unknown> }>(
    "/stock/metric",
    { symbol, metric: "all" }
  );
  const m = data.metric ?? {};
  const num = (k: string) => (typeof m[k] === "number" ? (m[k] as number) : null);
  return {
    peRatio: num("peInclExtraTTM"),
    epsAnnual: num("epsInclExtraAnnual"),
    grossMarginTTM: num("grossMarginTTM"),
    debtToEquity: num("totalDebt/totalEquityAnnual"),
    returnOnEquity: num("roeRfy"),
    fiftyTwoWeekHigh: num("52WeekHigh"),
    fiftyTwoWeekLow: num("52WeekLow"),
    revenuePerShareAnnual: num("revenuePerShareAnnual"),
  };
}
