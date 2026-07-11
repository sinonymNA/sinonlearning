"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const CARD = "#ffffff", BORDER = "#e2e8f0", BG = "#f8fafc";
const GAIN = "#16a34a", GAIN_BG = "#f0fdf4", GAIN_BORDER = "#bbf7d0";
const LOSS = "#dc2626", LOSS_BG = "#fef2f2";

interface LeaderboardEntry {
  name: string;
  total_at_cost: string;
  position_count: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stock-sim/leaderboard")
      .then(r => {
        if (r.status === 401) { router.replace("/margins/login?next=/simulations/stock-market/leaderboard"); return null; }
        return r.json();
      })
      .then(d => { if (d) { setBoard(d.board ?? []); setLoading(false); } })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <p style={{ color: FAINT, fontSize: 14 }}>Loading leaderboard…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 36, textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Stock Market Academy
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: INK, letterSpacing: "-0.03em", marginBottom: 10 }}>
          Leaderboard
        </h1>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>
          Ranked by total portfolio value — cash on hand plus the cost basis of all open positions.
          Reflects realized gains and smart capital deployment.
        </p>
      </div>

      {board.length === 0 ? (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "48px", textAlign: "center" }}>
          <p style={{ color: FAINT, fontSize: 16, marginBottom: 10 }}>No traders yet.</p>
          <p style={{ color: MUTED, fontSize: 14, marginBottom: 20 }}>Be the first to make a trade.</p>
          <Link href="/simulations/stock-market/trade" style={{
            display: "inline-block", padding: "10px 22px",
            background: INK, color: "#fff", borderRadius: 9,
            fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}>
            Start Trading →
          </Link>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {board.length >= 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
              {[board[1], board[0], board[2]].map((entry, podiumIdx) => {
                const actualRank = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                const total = parseFloat(entry.total_at_cost);
                const pl = total - 100000;
                const plPct = (pl / 100000) * 100;
                const isUp = pl >= 0;
                const heights = ["80px", "104px", "64px"];
                return (
                  <div key={entry.name} style={{ textAlign: "center" }}>
                    <div style={{
                      background: actualRank === 0 ? "#fefce8" : CARD,
                      border: `2px solid ${actualRank === 0 ? "#fbbf24" : BORDER}`,
                      borderRadius: 12, padding: "16px 12px",
                      display: "flex", flexDirection: "column", alignItems: "center",
                      justifyContent: "flex-end", minHeight: heights[podiumIdx],
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{MEDALS[actualRank]}</div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 3, lineHeight: 1.2 }}>{entry.name}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: isUp ? GAIN : LOSS }}>
                        {isUp ? "+" : ""}{plPct.toFixed(2)}%
                      </p>
                      <p style={{ fontSize: 11, color: MUTED }}>${fmt(total)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "44px 1fr 110px 80px 100px",
              padding: "10px 20px", background: BG, borderBottom: `1px solid ${BORDER}`,
            }}>
              {["Rank", "Trader", "Portfolio", "Return", "Positions"].map(h => (
                <p key={h} style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</p>
              ))}
            </div>

            {board.map((entry, i) => {
              const total = parseFloat(entry.total_at_cost);
              const pl = total - 100000;
              const plPct = (pl / 100000) * 100;
              const isUp = pl >= 0;
              const positions = parseInt(entry.position_count, 10);

              return (
                <div
                  key={entry.name}
                  style={{
                    display: "grid", gridTemplateColumns: "44px 1fr 110px 80px 100px",
                    padding: "14px 20px",
                    borderBottom: i < board.length - 1 ? `1px solid ${BORDER}` : "none",
                    alignItems: "center",
                    background: i === 0 ? "#fefce820" : undefined,
                  }}
                >
                  <div style={{ fontSize: i < 3 ? 18 : 13, fontWeight: 700, color: i < 3 ? INK : FAINT }}>
                    {i < 3 ? MEDALS[i] : `#${i + 1}`}
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: INK }}>{entry.name}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums" }}>
                    ${fmt(total)}
                  </p>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: isUp ? GAIN : LOSS,
                    background: isUp ? GAIN_BG : LOSS_BG,
                    border: `1px solid ${isUp ? GAIN_BORDER : "#fecaca"}`,
                    borderRadius: 6, padding: "2px 8px",
                    display: "inline-block", whiteSpace: "nowrap",
                  }}>
                    {isUp ? "+" : ""}{plPct.toFixed(2)}%
                  </span>
                  <p style={{ fontSize: 13, color: MUTED }}>{positions} {positions === 1 ? "stock" : "stocks"}</p>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <p style={{ fontSize: 11, color: FAINT, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            Rankings based on cash balance + cost basis of open positions. Does not include unrealized price appreciation.
          </p>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/simulations/stock-market/trade" style={{
          display: "inline-block", padding: "11px 24px",
          background: INK, color: "#fff", borderRadius: 9,
          fontSize: 13, fontWeight: 700, textDecoration: "none",
        }}>
          Trade to Climb the Board →
        </Link>
      </div>
    </div>
  );
}
