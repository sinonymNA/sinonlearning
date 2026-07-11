"use client";

import { useState } from "react";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const ACCENT = "#2563eb";
const GREEN  = "#16a34a";

interface Card { statement: string; answer: "myth" | "fact"; explanation: string }

const CARDS: Card[] = [
  {
    statement: "Most entry-level salaries match what job listings advertise.",
    answer: "myth",
    explanation: "BLS data shows most workers earn 18–25% less than job listings claim in year 1. Postings show the full range — you almost always start at the bottom.",
  },
  {
    statement: "People who negotiate their first salary earn more on average.",
    answer: "fact",
    explanation: "Workers who negotiate earn $5K–$10K more per year on average. Since raises are percentage-based, that gap compounds across your entire career.",
  },
  {
    statement: "A more expensive school always means a higher starting salary.",
    answer: "myth",
    explanation: "College Scorecard data shows ROI varies wildly. In many fields, a $200K degree produces the same starting salary as a $40K one. Your major matters more than the brand.",
  },
];

export default function CareerHook({ onReady }: { onReady: () => void }) {
  const [answers, setAnswers] = useState<Record<number, "myth" | "fact" | null>>({ 0: null, 1: null, 2: null });
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const answer = (index: number, choice: "myth" | "fact") => {
    if (revealed.has(index)) return;
    setAnswers((prev) => ({ ...prev, [index]: choice }));
    setRevealed((prev) => new Set([...prev, index]));
  };

  const allRevealed = revealed.size === 3;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 12 }}>
          Salary Myth or Fact?
        </h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Three things most students believe about their first paycheck. Tap each card — then we&apos;ll find your actual numbers.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 620, margin: "0 auto" }}>
        {CARDS.map((card, i) => {
          const isRevealed = revealed.has(i);
          const chosen = answers[i];
          const isCorrect = chosen === card.answer;

          return (
            <div
              key={i}
              style={{
                background: isRevealed ? (isCorrect ? "#f0fdf4" : "#fef2f2") : CARD,
                border: `1px solid ${isRevealed ? (isCorrect ? "#bbf7d0" : "#fecaca") : BORDER}`,
                borderRadius: 14,
                padding: "20px 24px",
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.55, marginBottom: 16 }}>
                &ldquo;{card.statement}&rdquo;
              </p>

              {!isRevealed ? (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => answer(i, "myth")}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, fontWeight: 700, fontSize: 13,
                      border: "2px solid #fca5a5", background: "#fff7f7", color: "#dc2626",
                      cursor: "pointer", letterSpacing: "0.05em",
                    }}
                  >
                    MYTH
                  </button>
                  <button
                    onClick={() => answer(i, "fact")}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, fontWeight: 700, fontSize: 13,
                      border: "2px solid #86efac", background: "#f7fff9", color: GREEN,
                      cursor: "pointer", letterSpacing: "0.05em",
                    }}
                  >
                    FACT
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.06em",
                      color: isCorrect ? GREEN : "#dc2626",
                      background: isCorrect ? "#dcfce7" : "#fee2e2",
                      borderRadius: 6, padding: "3px 10px",
                    }}>
                      {isCorrect ? "✓ CORRECT" : "✗ NOT QUITE"}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isCorrect ? GREEN : "#dc2626" }}>
                      This is a {card.answer.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{card.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allRevealed && (
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
            Now you know what to look for. Let&apos;s research your actual career.
          </p>
          <button
            onClick={onReady}
            style={{
              fontSize: 15, fontWeight: 700, color: "#fff",
              background: ACCENT, border: "none",
              borderRadius: 10, padding: "14px 36px", cursor: "pointer",
            }}
          >
            Research My Career →
          </button>
        </div>
      )}
    </div>
  );
}
