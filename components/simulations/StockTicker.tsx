"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import type { StockQuote } from "@/app/api/stocks/quotes/route";

export default function StockTicker({
  quotes,
  error,
  selectedSymbol,
  onSelect,
}: {
  quotes: StockQuote[];
  error: string | null;
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
        {error}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/50">
        Loading live prices&hellip;
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {quotes.map((q) => {
        const up = q.change >= 0;
        const selected = selectedSymbol === q.symbol;
        return (
          <button
            key={q.symbol}
            onClick={() => onSelect(q.symbol)}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
              selected
                ? "border-teal-300/50 bg-teal-300/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-white">{q.symbol}</p>
              <p className="text-xs text-white/40">{q.name}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-base font-medium text-white">${q.price.toFixed(2)}</p>
              <p
                className={`flex items-center justify-end gap-1 text-xs ${
                  up ? "text-teal-300" : "text-rose-300"
                }`}
              >
                {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                {Math.abs(q.changePercent).toFixed(2)}%
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
