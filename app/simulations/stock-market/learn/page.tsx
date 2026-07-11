"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { STOCK_UNITS, UNIT_ACCENTS } from "@/data/stockCourse";

const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const BORDER = "#e2e8f0", BG = "#f8fafc";
const GAIN = "#16a34a", GAIN_BG = "#f0fdf4", GAIN_BORDER = "#bbf7d0";

interface UnitProgress {
  unit_slug: string;
  completed_at: string | null;
}

export default function LearnPage() {
  const [progress, setProgress] = useState<UnitProgress[]>([]);

  useEffect(() => {
    fetch("/api/stock-course/progress")
      .then((r) => r.ok ? r.json() : { progress: [] })
      .then((d) => setProgress(d.progress ?? []));
  }, []);

  const doneSet = new Set(
    progress.filter((p) => p.completed_at).map((p) => p.unit_slug)
  );
  const doneCount = doneSet.size;

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
          Every unit opens with a story that upends what you think you know, walks through the concept
          with real-world stakes, then sends you to the simulator to apply it immediately.
        </p>

        {/* Progress bar */}
        {doneCount > 0 && (
          <div style={{ maxWidth: 360, margin: "20px auto 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: GAIN }}>
                {doneCount} of 9 units complete
              </span>
              <span style={{ fontSize: 11, color: FAINT }}>{Math.round((doneCount / 9) * 100)}%</span>
            </div>
            <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: GAIN, borderRadius: 3,
                width: `${(doneCount / 9) * 100}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Unit list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {STOCK_UNITS.map((unit, i) => {
          const isDone = doneSet.has(unit.slug);
          const accent = UNIT_ACCENTS[unit.num];
          const isNext = !isDone && STOCK_UNITS.slice(0, i).every((u) => doneSet.has(u.slug));

          return (
            <div
              key={unit.num}
              style={{
                display: "grid", gridTemplateColumns: "44px 1fr auto",
                gap: "0 20px", padding: "24px 0",
                borderBottom: i < STOCK_UNITS.length - 1 ? `1px solid ${BORDER}` : "none",
                alignItems: "start",
              }}
            >
              {/* Unit number */}
              <div style={{
                fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700,
                color: isDone ? GAIN : isNext ? accent : FAINT,
                lineHeight: 1, paddingTop: 3,
                transition: "color 0.3s",
              }}>
                {isDone ? "✓" : unit.num}
              </div>

              {/* Content */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: isDone ? MUTED : INK }}>
                    {unit.title}
                  </h3>
                  {isDone && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px",
                      background: GAIN_BG, border: `1px solid ${GAIN_BORDER}`,
                      color: GAIN, borderRadius: 999, letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}>
                      Done
                    </span>
                  )}
                  {isNext && !isDone && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px",
                      background: accent + "12", border: `1px solid ${accent}33`,
                      color: accent, borderRadius: 999, letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}>
                      Up next
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: 13, color: MUTED, fontStyle: "italic", lineHeight: 1.55,
                  borderLeft: `2px solid ${isDone ? GAIN_BORDER : accent + "44"}`,
                  paddingLeft: 12, marginBottom: 12,
                }}>
                  &ldquo;{unit.previewHook}&rdquo;
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

              {/* Start link */}
              <div style={{ paddingTop: 2 }}>
                <Link
                  href={`/simulations/stock-market/learn/${unit.slug}`}
                  style={{
                    display: "inline-block", padding: "7px 14px",
                    background: isDone ? BG : isNext ? accent : BG,
                    color: isDone ? MUTED : isNext ? "#fff" : MUTED,
                    border: `1px solid ${isDone ? BORDER : isNext ? accent : BORDER}`,
                    borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isDone ? "Review" : isNext ? "Start →" : "Preview"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion CTA or bottom CTA */}
      {doneCount === 9 ? (
        <div style={{
          marginTop: 48, background: INK, borderRadius: 16, padding: "32px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
            🎓 Course Complete
          </p>
          <p style={{ fontSize: 15, color: "#64748b", marginBottom: 20, lineHeight: 1.65 }}>
            You&apos;ve covered everything from equity basics to advanced mechanics. Now put it to work.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/simulations/stock-market/trade" style={{
              display: "inline-block", padding: "11px 22px",
              background: GAIN, color: "#fff",
              borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: "none",
            }}>
              Keep Trading
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
      ) : (
        <div style={{
          marginTop: 48, background: INK, borderRadius: 16, padding: "32px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
            {doneCount === 0 ? "The simulator is live now." : `${9 - doneCount} unit${9 - doneCount !== 1 ? "s" : ""} to go.`}
          </p>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
            {doneCount === 0
              ? "Start with Unit 1 or jump straight into trading with your $100,000."
              : "Keep going — every unit ends with a real trade."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href={
                doneCount === 0
                  ? "/simulations/stock-market/learn/unit-1"
                  : `/simulations/stock-market/learn/unit-${Math.min(doneCount + 1, 9)}`
              }
              style={{
                display: "inline-block", padding: "11px 22px",
                background: GAIN, color: "#fff",
                borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: "none",
              }}
            >
              {doneCount === 0 ? "Start Unit 1 →" : `Continue Unit ${Math.min(doneCount + 1, 9)} →`}
            </Link>
            <Link href="/simulations/stock-market/trade" style={{
              display: "inline-block", padding: "11px 22px",
              background: "#1e293b", color: "#94a3b8",
              borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: "none",
            }}>
              Trade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
