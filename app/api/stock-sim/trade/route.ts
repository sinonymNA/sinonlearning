import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getOrCreatePortfolio, executeTrade } from "@/lib/stockMarketDb";
import { getCachedQuote } from "@/lib/finnhubClient";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!process.env.FINNHUB_API_KEY) {
    return NextResponse.json({ error: "Stock data API not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const { ticker, action, shares: sharesRaw } = body;

  if (typeof ticker !== "string" || !ticker.trim()) {
    return NextResponse.json({ error: "ticker is required." }, { status: 400 });
  }
  if (action !== "buy" && action !== "sell") {
    return NextResponse.json({ error: "action must be buy or sell." }, { status: 400 });
  }
  const shares = parseFloat(String(sharesRaw));
  if (isNaN(shares) || shares <= 0) {
    return NextResponse.json({ error: "shares must be a positive number." }, { status: 400 });
  }

  // Fetch live price server-side — never trust the client's quoted price
  let price: number;
  try {
    const q = await getCachedQuote(ticker.toUpperCase());
    price = q.price;
    if (!price || price <= 0) {
      return NextResponse.json({ error: `No price available for ${ticker}.` }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Could not fetch current price." }, { status: 502 });
  }

  const portfolio = await getOrCreatePortfolio(user.id);
  const result = await executeTrade(portfolio.id, ticker.toUpperCase(), action, shares, price);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ticker: ticker.toUpperCase(), action, shares, pricePerShare: price, total: shares * price });
}
