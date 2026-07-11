"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const CARD = "#ffffff", BORDER = "#e2e8f0", DARK = "#0f172a";
const GAIN = "#16a34a", GAIN_BG = "#f0fdf4", GAIN_BORDER = "#bbf7d0";
const LOSS = "#dc2626", LOSS_BG = "#fef2f2", LOSS_BORDER = "#fecaca";

interface PortfolioData {
  cash: number;
  totalValue: number;
  totalPl: number;
  totalPlPct: number;
  invested: number;
  positions: { ticker: string; shares: number; unrealizedPl: number; unrealizedPlPct: number; currentValue: number }[];
}

interface HistoryItem {
  id: string;
  ticker: string;
  action: "buy" | "sell";
  shares: string;
  price_per_share: string;
  total_amount: string;
  executed_at: string;
}

const UNIT_TITLES = [
  "What Is a Stock?",
  "How Markets Work",
  "Reading a Company",
  "Valuing a Business",
  "Building a Portfolio",
  "Market Cycles & Macro",
  "Investment Strategies",
  "Behavioral Finance",
  "Advanced Mechanics",
];

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function StockMarketDashboard() {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stock-sim/portfolio"),
      fetch("/api/stock-sim/history"),
    ]).then(async ([pRes, hRes]) => {
      if (pRes.status === 401) {
        router.replace("/margins/login?next=/simulations/stock-market");
        return;
      }
      const pData = await pRes.json();
      const hData = await hRes.json();
      setPortfolio(pData);
      setHistory((hData.history ?? []).slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: FAINT, fontSize: 14 }}>Loading your portfolio…</p>
      </div>
    );
  }

  const pl = portfolio?.totalPl ?? 0;
  const plPct = portfolio?.totalPlPct ?? 0;
  const isUp = pl >= 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          Portfolio Overview
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: INK, letterSpacing: "-0.03em", lineHeight: 1 }}>
            ${fmt(portfolio?.totalValue ?? 100000)}
          </h1>
          <span style={{
            fontSize: 16, fontWeight: 600,
            color: isUp ? GAIN : LOSS,
            background: isUp ? GAIN_BG : LOSS_BG,
            border: `1px solid ${isUp ? GAIN_BORDER : LOSS_BORDER}`,
            borderRadius: 8, padding: "4px 12px",
          }}>
            {isUp ? "+" : ""}{fmt(pl)} ({isUp ? "+" : ""}{plPct.toFixed(2)}%)
          </span>
        </div>
        <p style={{ fontSize: 13, color: FAINT, marginTop: 6 }}>
          vs. $100,000 starting capital
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Cash Available", value: `$${fmt(portfolio?.cash ?? 100000)}` },
          { label: "Invested", value: `$${fmt(portfolio?.invested ?? 0)}` },
          { label: "Positions", value: String(portfolio?.positions.length ?? 0) },
        ].map(s => (
          <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: INK, letterSpacing: "-0.02em" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Left: positions + history */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Top positions */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: INK }}>Holdings</p>
              <Link href="/simulations/stock-market/portfolio" style={{ fontSize: 12, color: GAIN, textDecoration: "none", fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {portfolio?.positions.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ color: FAINT, fontSize: 14, marginBottom: 12 }}>No positions yet.</p>
                <Link href="/simulations/stock-market/trade" style={{
                  display: "inline-block", padding: "8px 18px",
                  background: DARK, color: "#fff", borderRadius: 8,
                  fontSize: 13, fontWeight: 600, textDecoration: "none",
                }}>
                  Make your first trade
                </Link>
              </div>
            ) : (
              <div>
                {portfolio?.positions.slice(0, 6).map((pos, i) => (
                  <div key={pos.ticker} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 20px",
                    borderBottom: i < Math.min((portfolio?.positions.length ?? 0) - 1, 5) ? `1px solid ${BORDER}` : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, color: MUTED, letterSpacing: "0.02em",
                        flexShrink: 0,
                      }}>
                        {pos.ticker.slice(0, 4)}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: INK }}>{pos.ticker}</p>
                        <p style={{ fontSize: 11, color: FAINT }}>{pos.shares} shares</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: INK }}>${fmt(pos.currentValue)}</p>
                      <p style={{ fontSize: 11, fontWeight: 600, color: pos.unrealizedPl >= 0 ? GAIN : LOSS }}>
                        {pos.unrealizedPl >= 0 ? "+" : ""}{fmt(pos.unrealizedPlPct, 1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent trades */}
          {history.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: INK }}>Recent Trades</p>
              </div>
              {history.map((tx) => (
                <div key={tx.id ?? tx.executed_at} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 20px", borderBottom: `1px solid ${BORDER}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 4,
                      background: tx.action === "buy" ? GAIN_BG : LOSS_BG,
                      color: tx.action === "buy" ? GAIN : LOSS,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      {tx.action}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{tx.ticker}</span>
                    <span style={{ fontSize: 12, color: MUTED }}>{parseFloat(tx.shares)} shares @ ${parseFloat(tx.price_per_share).toFixed(2)}</span>
                  </div>
                  <span style={{ fontSize: 11, color: FAINT }}>
                    {new Date(tx.executed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: quick actions + course preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Quick actions */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>Quick Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/simulations/stock-market/trade" style={{
                display: "block", padding: "11px 16px", background: DARK,
                color: "#fff", borderRadius: 9, fontSize: 13, fontWeight: 600,
                textDecoration: "none", textAlign: "center",
              }}>
                Trade Stocks
              </Link>
              <Link href="/simulations/stock-market/portfolio" style={{
                display: "block", padding: "11px 16px", background: "#f1f5f9",
                color: INK, borderRadius: 9, fontSize: 13, fontWeight: 600,
                textDecoration: "none", textAlign: "center",
              }}>
                View Portfolio
              </Link>
            </div>
          </div>

          {/* Course preview */}
          <div style={{ background: DARK, borderRadius: 14, padding: "20px" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              Stock Market Academy
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>9 units. Harvard-level investing.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {UNIT_TITLES.slice(0, 5).map((title, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, background: "#1e293b",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "#475569", flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{title}</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: "#475569", paddingLeft: 30 }}>+ 4 more units…</p>
            </div>
            <Link href="/simulations/stock-market/learn" style={{
              display: "block", padding: "10px 16px", background: GAIN,
              color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600,
              textDecoration: "none", textAlign: "center",
            }}>
              Start Learning
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
