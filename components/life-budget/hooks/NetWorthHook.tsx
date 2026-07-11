"use client";

import { useState } from "react";
import NetWorthNarrativeLesson from "../lessons/NetWorthNarrativeLesson";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const ACCENT = "#b45309";
const GREEN  = "#16a34a";

const CARDS = [
  {
    front: "Average American at 22",
    reveal: "−$26,000",
    color: "#dc2626",
    detail: "Student loans, car debt, and minimal savings add up fast.",
  },
  {
    front: "Average college graduate at 22",
    reveal: "−$35,000",
    color: "#dc2626",
    detail: "More education usually means more debt in year one — even if it pays off later.",
  },
  {
    front: "Most self-made millionaires at 22",
    reveal: "Near zero",
    color: MUTED,
    detail: "Warren Buffett had $20,000. Jeff Bezos was in student debt. Wealth is built, not inherited, for most.",
  },
  {
    front: "What actually matters at 22",
    reveal: "Direction > Destination",
    color: ACCENT,
    detail: "Net worth at 22 tells you almost nothing. Net worth at 32 tells you everything. What matters is the habit you build right now.",
  },
] as const;

export default function NetWorthHook({ onReady }: { onReady: () => void }) {
  const [step, setStep] = useState<"interactive" | "terms">("interactive");
  const [revealedCount, setRevealedCount] = useState(0);

  if (step === "terms") return <NetWorthNarrativeLesson onReady={onReady} />;

  const reveal = () => {
    if (revealedCount < CARDS.length) setRevealedCount((n) => n + 1);
  };

  const allRevealed = revealedCount === CARDS.length;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 12 }}>
          You&apos;re Not Behind
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
          Before you calculate your net worth, let&apos;s put it in context.
          Tap each card to reveal the number — then we&apos;ll do yours.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {CARDS.map((card, i) => {
            const isRevealed = i < revealedCount;
            const isNext = i === revealedCount;

            return (
              <div
                key={i}
                onClick={isNext ? reveal : undefined}
                style={{
                  borderRadius: 14, overflow: "hidden",
                  border: `1px solid ${isRevealed ? card.color + "44" : BORDER}`,
                  background: isRevealed ? card.color + "08" : CARD,
                  cursor: isNext ? "pointer" : "default",
                  transition: "all 0.3s",
                  opacity: i > revealedCount ? 0.4 : 1,
                }}
              >
                <div style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: isRevealed ? MUTED : INK }}>
                      {card.front}
                    </p>
                    {isNext && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: ACCENT,
                        background: ACCENT + "15", borderRadius: 20, padding: "3px 10px",
                      }}>
                        Tap to reveal
                      </span>
                    )}
                    {isRevealed && (
                      <p style={{ fontSize: 22, fontWeight: 800, color: card.color }}>
                        {card.reveal}
                      </p>
                    )}
                  </div>
                  {isRevealed && (
                    <p style={{ fontSize: 13, color: MUTED, marginTop: 8, lineHeight: 1.6 }}>
                      {card.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {allRevealed && (
          <>
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: 12, padding: "18px 20px", marginBottom: 24,
              fontSize: 13, color: "#166534", lineHeight: 1.6, textAlign: "center",
            }}>
              <strong>Starting negative is not failure — it&apos;s the norm.</strong> The question is whether you know your numbers and have a plan to change them. You&apos;re about to find out.
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, color: MUTED, marginBottom: 16 }}>
                Ready to calculate where you actually stand?
              </p>
              <button
                onClick={() => setStep("terms")}
                style={{
                  fontSize: 15, fontWeight: 700, color: "#fff",
                  background: ACCENT, border: "none",
                  borderRadius: 10, padding: "14px 36px", cursor: "pointer",
                }}
              >
                Next: Learn the Terms →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
