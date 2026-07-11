"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const CARD = "#ffffff", BORDER = "#e2e8f0", BG = "#f8fafc";
const GAIN = "#16a34a", GAIN_BG = "#f0fdf4", GAIN_BORDER = "#bbf7d0";
const LOSS = "#dc2626", LOSS_BG = "#fef2f2", LOSS_BORDER = "#fecaca";

interface Position {
  ticker: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  changePct: number;
  currentValue: number;
  costBasis: number;
  unrealizedPl: number;
  unrealizedPlPct: number;
}

interface PortfolioData {
  cash: number;
  invested: number;
  currentValue: number;
  totalValue: number;
  totalPl: number;
  totalPlPct: number;
  positions: Position[];
  createdAt: string;
  spyReturn: number | null;
  spyBaseline: number | null;
  spyPrice: number | null;
}

interface Transaction {
  ticker: string;
  action: "buy" | "sell";
  shares: string;
  price_per_share: string;
  total_amount: string;
  executed_at: string;
}

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function PlBadge({ value, pct, size = "sm" }: { value: number; pct: number; size?: "sm" | "lg" }) {
  const up = value >= 0;
  const fs = size === "lg" ? 16 : 12;
  return (
    <span style={{
      fontSize: fs, fontWeight: 700,
      color: up ? GAIN : LOSS,
      background: up ? GAIN_BG : LOSS_BG,
      border: `1px solid ${up ? GAIN_BORDER : LOSS_BORDER}`,
      borderRadius: 6, padding: size === "lg" ? "5px 12px" : "2px 8px",
      whiteSpace: "nowrap",
    }}>
      {up ? "+" : ""}{fmt(value)} ({up ? "+" : ""}{pct.toFixed(2)}%)
    </span>
  );
}

export default function PortfolioPage() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"holdings" | "history">("holdings");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const load = useCallback(async () => {
    const [pRes, hRes] = await Promise.all([
      fetch("/api/stock-sim/portfolio"),
      fetch("/api/stock-sim/history"),
    ]);
    if (pRes.status === 401) {
      router.replace("/margins/login?next=/simulations/stock-market/portfolio");
      return;
    }
    const [pData, hData] = await Promise.all([pRes.json(), hRes.json()]);
    setPortfolio(pData);
    setHistory(hData.history ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: FAINT, fontSize: 14 }}>Loading portfolio…</p>
      </div>
    );
  }

  const p = portfolio;
  const isUp = (p?.totalPl ?? 0) >= 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Total Portfolio Value
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 40, fontWeight: 800, color: INK, letterSpacing: "-0.03em", lineHeight: 1 }}>
                ${fmt(p?.totalValue ?? 100000)}
              </h1>
              {p && <PlBadge value={p.totalPl} pct={p.totalPlPct} size="lg" />}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
              <p style={{ fontSize: 12, color: FAINT }}>
                Started with $100,000.00{p?.createdAt ? ` · Since ${new Date(p.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}
              </p>
              {p?.spyReturn !== null && p?.spyReturn !== undefined && (
                <span style={{
                  fontSize: 12, color: MUTED,
                  background: BG, border: `1px solid ${BORDER}`,
                  borderRadius: 6, padding: "2px 10px",
                }}>
                  S&amp;P 500 since you started:{" "}
                  <strong style={{ color: p.spyReturn >= 0 ? GAIN : LOSS }}>
                    {p.spyReturn >= 0 ? "+" : ""}{p.spyReturn.toFixed(2)}%
                  </strong>
                </span>
              )}
            </div>
          </div>
          <Link href="/simulations/stock-market/trade" style={{
            display: "inline-block", padding: "10px 20px",
            background: INK, color: "#fff", borderRadius: 9,
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            + Trade
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Cash", value: `$${fmt(p?.cash ?? 100000)}`, color: INK },
          { label: "Invested", value: `$${fmt(p?.invested ?? 0)}`, color: INK },
          { label: "Market Value", value: `$${fmt(p?.currentValue ?? 0)}`, color: INK },
          {
            label: "Total Return",
            value: `${isUp ? "+" : ""}${fmt(p?.totalPl ?? 0)}`,
            color: isUp ? GAIN : LOSS,
          },
        ].map(s => (
          <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
        {(["holdings", "history"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: tab === t ? 700 : 500,
              color: tab === t ? INK : MUTED,
              borderBottom: `2px solid ${tab === t ? INK : "transparent"}`,
              marginBottom: -1, textTransform: "capitalize",
            }}
          >
            {t === "holdings" ? `Holdings (${p?.positions.length ?? 0})` : `Trade History (${history.length})`}
          </button>
        ))}
      </div>

      {/* Holdings table */}
      {tab === "holdings" && (
        <>
          {(p?.positions.length ?? 0) === 0 ? (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "48px", textAlign: "center" }}>
              <p style={{ color: FAINT, fontSize: 16, marginBottom: 12 }}>Your portfolio is empty.</p>
              <p style={{ color: MUTED, fontSize: 14, marginBottom: 20 }}>Make your first trade to get started.</p>
              <Link href="/simulations/stock-market/trade" style={{
                display: "inline-block", padding: "10px 20px",
                background: INK, color: "#fff", borderRadius: 8,
                fontSize: 13, fontWeight: 600, textDecoration: "none",
              }}>
                Go to Trade
              </Link>
            </div>
          ) : (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr 100px 100px 110px 120px 120px",
                padding: "10px 20px", background: BG, borderBottom: `1px solid ${BORDER}`,
              }}>
                {["Ticker", "Company", "Shares", "Avg Cost", "Price", "Value", "P&L"].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</p>
                ))}
              </div>

              {p?.positions.map((pos, i) => (
                <div
                  key={pos.ticker}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 100px 100px 110px 120px 120px",
                    padding: "14px 20px",
                    borderBottom: i < (p.positions.length - 1) ? `1px solid ${BORDER}` : "none",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Link
                      href={`/simulations/stock-market/trade?ticker=${pos.ticker}`}
                      style={{ fontSize: 13, fontWeight: 800, color: INK, textDecoration: "none" }}
                    >
                      {pos.ticker}
                    </Link>
                    {pos.changePct !== 0 && (
                      <p style={{ fontSize: 10, color: pos.changePct >= 0 ? GAIN : LOSS, fontWeight: 600, marginTop: 2 }}>
                        {pos.changePct >= 0 ? "▲" : "▼"} {Math.abs(pos.changePct).toFixed(2)}% today
                      </p>
                    )}
                  </div>
                  <div />
                  <p style={{ fontSize: 13, color: INK, fontVariantNumeric: "tabular-nums" }}>{fmt(pos.shares, 4).replace(/\.?0+$/, "")}</p>
                  <p style={{ fontSize: 13, color: MUTED, fontVariantNumeric: "tabular-nums" }}>${fmt(pos.avgCost)}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: INK, fontVariantNumeric: "tabular-nums" }}>${fmt(pos.currentPrice)}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>${fmt(pos.currentValue)}</p>
                  <div>
                    <PlBadge value={pos.unrealizedPl} pct={pos.unrealizedPlPct} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Transaction history */}
      {tab === "history" && (
        <>
          {history.length === 0 ? (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "48px", textAlign: "center" }}>
              <p style={{ color: FAINT, fontSize: 14 }}>No trades yet.</p>
            </div>
          ) : (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "60px 80px 1fr 100px 100px 120px 140px",
                padding: "10px 20px", background: BG, borderBottom: `1px solid ${BORDER}`,
              }}>
                {["", "Ticker", "Action", "Shares", "Price", "Total", "Date"].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</p>
                ))}
              </div>
              {history.map((tx, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid", gridTemplateColumns: "60px 80px 1fr 100px 100px 120px 140px",
                    padding: "12px 20px",
                    borderBottom: i < history.length - 1 ? `1px solid ${BORDER}` : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "3px 6px", borderRadius: 4,
                    background: tx.action === "buy" ? GAIN_BG : LOSS_BG,
                    color: tx.action === "buy" ? GAIN : LOSS,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    display: "inline-block",
                  }}>
                    {tx.action}
                  </span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: INK }}>{tx.ticker}</p>
                  <div />
                  <p style={{ fontSize: 13, color: INK, fontVariantNumeric: "tabular-nums" }}>{parseFloat(tx.shares)}</p>
                  <p style={{ fontSize: 13, color: MUTED, fontVariantNumeric: "tabular-nums" }}>${fmt(parseFloat(tx.price_per_share))}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: INK, fontVariantNumeric: "tabular-nums" }}>${fmt(parseFloat(tx.total_amount))}</p>
                  <p style={{ fontSize: 11, color: FAINT }}>
                    {new Date(tx.executed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {" "}
                    {new Date(tx.executed_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
