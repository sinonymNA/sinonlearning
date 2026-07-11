import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getOrCreatePortfolio, getPositions } from "@/lib/stockMarketDb";
import { getCachedQuote } from "@/lib/finnhubClient";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const hasApiKey = !!process.env.FINNHUB_API_KEY;

  // Fetch SPY price first (used for benchmark + new portfolio creation)
  let spyPrice: number | undefined;
  if (hasApiKey) {
    try {
      const spyQ = await getCachedQuote("SPY");
      spyPrice = spyQ.price;
    } catch { /* ignore */ }
  }

  const portfolio = await getOrCreatePortfolio(user.id, spyPrice);
  const positions = await getPositions(portfolio.id);

  const enriched = await Promise.all(
    positions.map(async (pos) => {
      const shares = parseFloat(pos.shares);
      const avgCost = parseFloat(pos.avg_cost_basis);
      let currentPrice = avgCost;
      let changePct = 0;

      if (hasApiKey) {
        try {
          const q = await getCachedQuote(pos.ticker);
          currentPrice = q.price;
          changePct = q.changePct;
        } catch { /* fall back to cost basis */ }
      }

      const currentValue = shares * currentPrice;
      const costBasis = shares * avgCost;
      const unrealizedPl = currentValue - costBasis;
      const unrealizedPlPct = costBasis > 0 ? (unrealizedPl / costBasis) * 100 : 0;

      return {
        ticker: pos.ticker,
        shares,
        avgCost,
        currentPrice,
        changePct,
        currentValue,
        costBasis,
        unrealizedPl,
        unrealizedPlPct,
      };
    })
  );

  const cash = parseFloat(portfolio.cash_balance);
  const invested = enriched.reduce((s, p) => s + p.costBasis, 0);
  const currentValue = enriched.reduce((s, p) => s + p.currentValue, 0);
  const totalValue = cash + currentValue;
  const totalPl = totalValue - 100000;
  const totalPlPct = (totalPl / 100000) * 100;

  // S&P 500 benchmark comparison
  const spyBaseline = portfolio.spy_baseline ? parseFloat(portfolio.spy_baseline) : null;
  const spyReturn = spyBaseline && spyPrice
    ? ((spyPrice - spyBaseline) / spyBaseline) * 100
    : null;

  return NextResponse.json({
    portfolioId: portfolio.id,
    cash,
    invested,
    currentValue,
    totalValue,
    totalPl,
    totalPlPct,
    positions: enriched,
    createdAt: portfolio.created_at,
    spyBaseline,
    spyPrice: spyPrice ?? null,
    spyReturn,
  });
}
