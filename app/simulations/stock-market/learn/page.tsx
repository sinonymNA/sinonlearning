"use client";

import Link from "next/link";

const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const CARD = "#ffffff", BORDER = "#e2e8f0", BG = "#f8fafc";
const GAIN = "#16a34a", GAIN_BG = "#f0fdf4", GAIN_BORDER = "#bbf7d0";

const UNITS = [
  {
    num: 1, title: "What Is a Stock?",
    hook: "Amazon's stock dropped 80% after its IPO. Investors who sold lost everything. Those who held turned $10K into $12M.",
    concepts: ["Equity & ownership", "Dividends", "IPOs", "Stock splits"],
  },
  {
    num: 2, title: "How Markets Work",
    hook: "In 1987 the market fell 22% in a single day. No war started. No recession hit. Here's why.",
    concepts: ["Market makers", "Bid-ask spread", "Order types", "S&P 500, Dow, NASDAQ"],
  },
  {
    num: 3, title: "Reading a Company",
    hook: "WeWork was valued at $47 billion. Someone read their filing. The valuation collapsed.",
    concepts: ["Income statement", "Balance sheet", "Cash flow", "P/E, EPS, Gross margin"],
  },
  {
    num: 4, title: "Valuing a Business",
    hook: "Warren Buffett called buying Berkshire his biggest mistake — a $200B error. He still made billions.",
    concepts: ["Intrinsic value", "DCF basics", "Margin of safety", "Growth vs value"],
  },
  {
    num: 5, title: "Building a Portfolio",
    hook: "A Nobel Prize was awarded for proving that combining risky assets can make you safer.",
    concepts: ["Modern Portfolio Theory", "Correlation", "Diversification", "Beta"],
  },
  {
    num: 6, title: "Market Cycles & Macro",
    hook: "Goldman's model said the 2008 losses should happen once in 100,000 years. They saw it 10 days in a row.",
    concepts: ["Bull & bear markets", "Interest rates", "Fed policy", "Inflation & real returns"],
  },
  {
    num: 7, title: "Investment Strategies",
    hook: "Jack Bogle invented the index fund. Wall Street called it 'Bogle's Folly.' His fund beat 90% of professionals.",
    concepts: ["Value investing", "Growth investing", "Dividend investing", "Index funds"],
  },
  {
    num: 8, title: "Behavioral Finance",
    hook: "Dartmouth researchers threw darts at the WSJ. Their dart portfolio beat 90% of professional fund managers.",
    concepts: ["Loss aversion", "Recency bias", "Herding", "The disposition effect"],
  },
  {
    num: 9, title: "Advanced Mechanics",
    hook: "Long-Term Capital Management had two Nobel winners on staff. They still nearly collapsed global markets.",
    concepts: ["Short selling", "Options basics", "ETFs", "Leverage & risk"],
  },
];

export default function LearnPage() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 48, textAlign: "center" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
          Stock Market Academy
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: INK, letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 14 }}>
          Nine units. Harvard-caliber investing.
        </h1>
        <p style={{ fontSize: 16, color: MUTED, maxWidth: 520, margin: "0 auto", lineHeight: 1.65 }}>
          Every unit opens with a story that upends what you think you know, walks through the concept with real-world stakes, then sends you to the simulator to apply it immediately.
        </p>
        <div style={{
          display: "inline-block", marginTop: 20,
          background: "#fffbeb", border: "1px solid #fcd34d",
          borderRadius: 10, padding: "12px 20px",
        }}>
          <p style={{ fontSize: 13, color: "#92400e", fontWeight: 600 }}>
            Course content is coming in Phase 2. The trading simulator is live now.
          </p>
          <Link href="/simulations/stock-market/trade" style={{
            display: "inline-block", marginTop: 8,
            padding: "7px 16px", background: INK, color: "#fff",
            borderRadius: 7, fontSize: 12, fontWeight: 600, textDecoration: "none",
          }}>
            Go trade while you wait →
          </Link>
        </div>
      </div>

      {/* Unit list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {UNITS.map((unit, i) => (
          <div
            key={unit.num}
            style={{
              display: "grid", gridTemplateColumns: "44px 1fr",
              gap: "0 20px", padding: "24px 0",
              borderBottom: i < UNITS.length - 1 ? `1px solid ${BORDER}` : "none",
            }}
          >
            <div style={{
              fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700,
              color: GAIN, lineHeight: 1, paddingTop: 3,
            }}>
              {unit.num}
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 8 }}>{unit.title}</h3>
              <p style={{
                fontSize: 13, color: MUTED, fontStyle: "italic", lineHeight: 1.55,
                borderLeft: `2px solid ${GAIN_BORDER}`, paddingLeft: 12, marginBottom: 12,
              }}>
                "{unit.hook}"
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {unit.concepts.map(c => (
                  <span key={c} style={{
                    fontSize: 11, padding: "3px 9px", borderRadius: 999,
                    background: BG, border: `1px solid ${BORDER}`, color: MUTED, fontWeight: 500,
                  }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{
        marginTop: 48, background: INK, borderRadius: 16, padding: "32px",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          While you wait
        </p>
        <p style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
          The simulator is live.
        </p>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
          Start trading with your $100,000 in virtual capital. The learning will catch up.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/simulations/stock-market/trade" style={{
            display: "inline-block", padding: "11px 22px",
            background: GAIN, color: "#fff",
            borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
            Start Trading
          </Link>
          <Link href="/simulations/stock-market/portfolio" style={{
            display: "inline-block", padding: "11px 22px",
            background: "#1e293b", color: "#94a3b8",
            borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>
            View Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}
