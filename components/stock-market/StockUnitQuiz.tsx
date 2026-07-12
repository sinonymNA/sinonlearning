"use client";

import { useState } from "react";
import type { QuickCheck } from "@/components/life-budget/lessons/NarrativeLesson";

const INK = "#0f172a";
const MUTED = "#64748b";
const LETTER = ["A", "B", "C", "D"];

interface Props {
  unitNum: number;
  accent: string;
  quiz: QuickCheck[];
  onComplete: (score: number) => void;
}

export default function StockUnitQuiz({ unitNum, accent, quiz, onComplete }: Props) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  const question = quiz[currentQ];

  const handleSelect = (j: number) => {
    if (selected !== null) return;
    setSelected(j);
  };

  const handleNext = () => {
    const correct = selected === question.correct;
    const newAnswers = [...answers, correct];
    if (currentQ + 1 >= quiz.length) {
      setAnswers(newAnswers);
      setFinished(true);
    } else {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
      setSelected(null);
    }
  };

  if (finished) {
    const score = answers.filter(Boolean).length;
    const pct = score / quiz.length;
    const color = pct >= 0.8 ? "#16a34a" : pct >= 0.6 ? "#d97706" : "#dc2626";
    const label = pct >= 0.8 ? "Excellent!" : pct >= 0.6 ? "Good effort!" : "Keep reviewing!";
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", paddingBottom: 40 }}>
        <div style={{
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 16, padding: "40px 32px", marginBottom: 24,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: accent,
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16,
          }}>
            Unit {unitNum} Quiz Complete
          </p>
          <p style={{ fontSize: 52, fontWeight: 900, color, lineHeight: 1, marginBottom: 6 }}>
            {score} / {quiz.length}
          </p>
          <p style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 28 }}>{label}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }}>
            {answers.map((ok, i) => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: "50%",
                background: ok ? "#16a34a" : "#dc2626",
              }} />
            ))}
          </div>
        </div>
        <button
          onClick={() => onComplete(score)}
          style={{
            fontSize: 15, fontWeight: 700, color: "#fff",
            background: accent, border: "none",
            borderRadius: 10, padding: "14px 36px", cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseOver={e => (e.currentTarget.style.opacity = "0.87")}
          onMouseOut={e => (e.currentTarget.style.opacity = "1")}
        >
          Continue to Mission →
        </button>
      </div>
    );
  }

  const isAnswered = selected !== null;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", paddingBottom: 40 }}>
      <style>{`
        .sq-choice:not(:disabled):hover { filter: brightness(0.96); }
      `}</style>

      {/* Progress */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Unit {unitNum} Quiz
          </p>
          <p style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>
            {currentQ + 1} / {quiz.length}
          </p>
        </div>
        <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2 }}>
          <div style={{
            height: "100%", borderRadius: 2, background: accent,
            width: `${(currentQ / quiz.length) * 100}%`,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {/* Question card */}
      <div style={{
        background: "#fff", border: "1px solid #e2e8f0",
        borderRadius: 14, padding: "28px 24px", marginBottom: 16,
      }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: INK, lineHeight: 1.55, marginBottom: 20 }}>
          {question.q}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {question.choices.map((choice, j) => {
            const isRight = j === question.correct;
            const isWrong = isAnswered && j === selected && selected !== question.correct;
            let border = "1px solid #e2e8f0";
            let bg = "#f8fafc";
            let color = INK;
            if (isAnswered && isRight) { border = "2px solid #16a34a"; bg = "#f0fdf4"; color = "#166534"; }
            else if (isWrong)          { border = "2px solid #dc2626"; bg = "#fef2f2"; color = "#991b1b"; }
            return (
              <button
                key={j}
                className="sq-choice"
                disabled={isAnswered}
                onClick={() => handleSelect(j)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px",
                  border, borderRadius: 10,
                  background: bg, color,
                  cursor: isAnswered ? "default" : "pointer",
                  textAlign: "left", fontSize: 14, lineHeight: 1.5,
                  fontFamily: "inherit", width: "100%",
                }}
              >
                <span style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
                  border: `1px solid ${isAnswered && isRight ? "#16a34a" : isWrong ? "#dc2626" : "#cbd5e1"}`,
                  background: isAnswered && isRight ? "#dcfce7" : isWrong ? "#fee2e2" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                  color: isAnswered && isRight ? "#166534" : isWrong ? "#991b1b" : MUTED,
                }}>
                  {LETTER[j]}
                </span>
                {choice}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation + Next */}
      {isAnswered && (
        <div style={{ animation: "nb-fadeup 0.3s ease" }}>
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 10, padding: "14px 18px", marginBottom: 16,
            fontSize: 13, color: MUTED, lineHeight: 1.65,
          }}>
            <strong style={{ color: selected === question.correct ? "#16a34a" : "#dc2626" }}>
              {selected === question.correct ? "Correct! " : "Not quite — "}
            </strong>
            {question.explain}
          </div>
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleNext}
              style={{
                fontSize: 14, fontWeight: 700, color: "#fff",
                background: accent, border: "none",
                borderRadius: 10, padding: "12px 32px", cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.opacity = "0.87")}
              onMouseOut={e => (e.currentTarget.style.opacity = "1")}
            >
              {currentQ + 1 < quiz.length ? "Next Question →" : "See Results →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
