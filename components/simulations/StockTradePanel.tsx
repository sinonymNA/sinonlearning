"use client";

import { useState } from "react";
import type { StockQuote } from "@/app/api/stocks/quotes/route";
import type { Holding } from "./StockMarketSim";

export default function StockTradePanel({
  symbol,
  quote,
  cash,
  holding,
  onTrade,
}: {
  symbol: string | null;
  quote: StockQuote | null;
  cash: number;
  holding: Holding | null;
  onTrade: (side: "buy" | "sell", shares: number) => void;
}) {
  const [shares, setShares] = useState(1);

  if (!symbol || !quote) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
        Select a stock from the watchlist to buy or sell.
      </div>
    );
  }

  const cost = shares * quote.price;
  const canBuy = cost <= cash && shares > 0;
  const canSell = (holding?.shares ?? 0) >= shares && shares > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm font-semibold text-white">{symbol}</p>
      <p className="mt-1 text-xs text-white/40">
        Current price ${quote.price.toFixed(2)} &middot; You own {holding?.shares ?? 0} shares
      </p>

      <label className="mt-4 block text-sm font-medium text-white/80">
        Shares
        <input
          type="number"
          min={1}
          value={shares}
          onChange={(e) => setShares(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-teal-300/50 focus:outline-none"
        />
      </label>

      <p className="mt-2 text-xs text-white/40">Estimated total: ${cost.toFixed(2)}</p>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => onTrade("buy", shares)}
          disabled={!canBuy}
          className="flex-1 rounded-full bg-teal-300 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200 disabled:opacity-30"
        >
          Buy
        </button>
        <button
          onClick={() => onTrade("sell", shares)}
          disabled={!canSell}
          className="flex-1 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/30 disabled:opacity-30"
        >
          Sell
        </button>
      </div>
    </div>
  );
}
