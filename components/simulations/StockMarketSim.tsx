"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, RotateCcw, Save, TrendingUp } from "lucide-react";
import type { StockQuote } from "@/app/api/stocks/quotes/route";
import StockTicker from "./StockTicker";
import StockTradePanel from "./StockTradePanel";
import StockPriceChart from "./StockPriceChart";
import StockPasscodeModal from "./StockPasscodeModal";

const STARTING_CASH = 10000;
const POLL_INTERVAL_MS = 30 * 1000;
const MAX_HISTORY_POINTS = 200;

export interface Holding {
  symbol: string;
  shares: number;
  avgCost: number;
}

export interface Trade {
  id: string;
  timestamp: number;
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  price: number;
}

export interface PortfolioPoint {
  timestamp: number;
  value: number;
}

export interface GameState {
  cash: number;
  holdings: Holding[];
  trades: Trade[];
  portfolioHistory: PortfolioPoint[];
}

function freshState(): GameState {
  return { cash: STARTING_CASH, holdings: [], trades: [], portfolioHistory: [] };
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.cash === "number" &&
    Array.isArray(v.holdings) &&
    Array.isArray(v.trades) &&
    Array.isArray(v.portfolioHistory)
  );
}

function holdingsValue(holdings: Holding[], quotes: StockQuote[]): number {
  return holdings.reduce((sum, h) => {
    const quote = quotes.find((q) => q.symbol === h.symbol);
    return sum + h.shares * (quote?.price ?? h.avgCost);
  }, 0);
}

type Phase = "start" | "playing";

export default function StockMarketSim() {
  const [phase, setPhase] = useState<Phase>("start");
  const [state, setState] = useState<GameState>(freshState());
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [modal, setModal] = useState<"save" | "load" | null>(null);
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks/quotes");
      const data = await res.json();
      if (!res.ok) {
        setQuotesError(data.error ?? "Couldn't load live prices.");
        return;
      }
      setQuotesError(null);
      setQuotes(data.quotes);
      setState((s) => ({
        ...s,
        portfolioHistory: [
          ...s.portfolioHistory,
          { timestamp: Date.now(), value: s.cash + holdingsValue(s.holdings, data.quotes) },
        ].slice(-MAX_HISTORY_POINTS),
      }));
    } catch {
      setQuotesError("Couldn't load live prices.");
    }
  }, []);

  useEffect(() => {
    if (phase !== "playing") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount-then-poll
    fetchQuotes();
    const interval = setInterval(fetchQuotes, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [phase, fetchQuotes]);

  const startNewGame = () => {
    setState(freshState());
    setSelectedSymbol(null);
    setPhase("playing");
  };

  const trade = (side: "buy" | "sell", shares: number) => {
    if (!selectedSymbol) return;
    const quote = quotes.find((q) => q.symbol === selectedSymbol);
    if (!quote) return;

    setState((s) => {
      const existing = s.holdings.find((h) => h.symbol === selectedSymbol);
      const cost = shares * quote.price;
      let holdings: Holding[];
      let cash: number;

      if (side === "buy") {
        if (cost > s.cash) return s;
        cash = s.cash - cost;
        if (existing) {
          const totalShares = existing.shares + shares;
          const avgCost = (existing.avgCost * existing.shares + cost) / totalShares;
          holdings = s.holdings.map((h) =>
            h.symbol === selectedSymbol ? { ...h, shares: totalShares, avgCost } : h
          );
        } else {
          holdings = [...s.holdings, { symbol: selectedSymbol, shares, avgCost: quote.price }];
        }
      } else {
        if (!existing || existing.shares < shares) return s;
        cash = s.cash + cost;
        const remaining = existing.shares - shares;
        holdings =
          remaining > 0
            ? s.holdings.map((h) => (h.symbol === selectedSymbol ? { ...h, shares: remaining } : h))
            : s.holdings.filter((h) => h.symbol !== selectedSymbol);
      }

      const newTrade: Trade = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        symbol: selectedSymbol,
        side,
        shares,
        price: quote.price,
      };

      return {
        cash,
        holdings,
        trades: [newTrade, ...s.trades].slice(0, 50),
        portfolioHistory: [
          ...s.portfolioHistory,
          { timestamp: Date.now(), value: cash + holdingsValue(holdings, quotes) },
        ].slice(-MAX_HISTORY_POINTS),
      };
    });
  };

  const handleSave = async (passcode: string) => {
    setModalBusy(true);
    setModalError(null);
    try {
      const res = await fetch("/api/stocks/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, state }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error ?? "Couldn't save your game.");
        return;
      }
      setModal(null);
    } catch {
      setModalError("Couldn't save your game.");
    } finally {
      setModalBusy(false);
    }
  };

  const handleLoad = async (passcode: string) => {
    setModalBusy(true);
    setModalError(null);
    try {
      const res = await fetch(`/api/stocks/load?passcode=${encodeURIComponent(passcode)}`);
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error ?? "Couldn't load that game.");
        return;
      }
      if (!isGameState(data.state)) {
        setModalError("That saved game looks corrupted.");
        return;
      }
      setState(data.state);
      setSelectedSymbol(null);
      setModal(null);
      setPhase("playing");
    } catch {
      setModalError("Couldn't load that game.");
    } finally {
      setModalBusy(false);
    }
  };

  if (phase === "start") {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <TrendingUp size={28} className="mx-auto text-teal-300" />
        <h2 className="mt-4 font-display text-2xl font-medium text-white">
          Build a portfolio with real, live stock prices
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/65">
          Start with ${STARTING_CASH.toLocaleString()} in cash and trade a watchlist of well-known
          companies, priced from the real market. No account needed — save your progress with a
          passcode you choose.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={startNewGame}
            className="rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
          >
            Start new game
          </button>
          <button
            onClick={() => {
              setModalError(null);
              setModal("load");
            }}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/30"
          >
            <FolderOpen size={15} />
            Load saved game
          </button>
        </div>

        {modal && (
          <StockPasscodeModal
            mode={modal}
            busy={modalBusy}
            error={modalError}
            onSubmit={modal === "save" ? handleSave : handleLoad}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    );
  }

  const netWorth = state.cash + holdingsValue(state.holdings, quotes);
  const selectedQuote = quotes.find((q) => q.symbol === selectedSymbol) ?? null;
  const selectedHolding = state.holdings.find((h) => h.symbol === selectedSymbol) ?? null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Net worth</p>
            <p className="mt-1 font-display text-2xl font-medium text-teal-300">
              ${netWorth.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Cash</p>
            <p className="mt-1 font-display text-2xl font-medium text-white">${state.cash.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Holdings</p>
            <p className="mt-1 font-display text-2xl font-medium text-white">
              ${holdingsValue(state.holdings, quotes).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setModalError(null);
              setModal("save");
            }}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-white/30"
          >
            <Save size={14} />
            Save
          </button>
          <button
            onClick={() => setPhase("start")}
            className="flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
          >
            <RotateCcw size={14} />
            New game
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <StockPriceChart points={state.portfolioHistory} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/40">Watchlist</p>
          <div className="mt-3">
            <StockTicker
              quotes={quotes}
              error={quotesError}
              selectedSymbol={selectedSymbol}
              onSelect={setSelectedSymbol}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/40">Trade</p>
          <div className="mt-3">
            <StockTradePanel
              symbol={selectedSymbol}
              quote={selectedQuote}
              cash={state.cash}
              holding={selectedHolding}
              onTrade={trade}
            />
          </div>
        </div>
      </div>

      {state.trades.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-white/40">Recent trades</p>
          <div className="mt-3 space-y-1.5">
            {state.trades.slice(0, 8).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-white/70"
              >
                <span>
                  <span className={t.side === "buy" ? "text-teal-300" : "text-rose-300"}>
                    {t.side === "buy" ? "Bought" : "Sold"}
                  </span>{" "}
                  {t.shares} {t.symbol} @ ${t.price.toFixed(2)}
                </span>
                <span className="text-white/40">{new Date(t.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <StockPasscodeModal
          mode={modal}
          busy={modalBusy}
          error={modalError}
          onSubmit={modal === "save" ? handleSave : handleLoad}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
