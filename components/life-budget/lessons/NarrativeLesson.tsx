"use client";

import { useState, useRef } from "react";

const INK   = "#0f172a";
const MUTED = "#64748b";
const LIGHT = "#f8fafc";

export interface StoryTermCallout {
  name: string;
  definition: string;
  impact: string;
}

export interface QuickCheck {
  q: string;
  choices: string[];   // exactly 4
  correct: number;     // 0-indexed
  explain: string;
}

export interface StoryBeat {
  narrative: React.ReactNode;
  term?: StoryTermCallout;
  visual?: React.ReactNode;
  check?: QuickCheck;
}

interface NarrativeLessonProps {
  title: string;
  character: string;
  beats: StoryBeat[];
  accent: string;
  onReady: () => void;
  ctaLabel: string;
  ctaSubtitle?: string;
}

export default function NarrativeLesson({
  title,
  character,
  beats,
  accent,
  onReady,
  ctaLabel,
  ctaSubtitle = "Now apply these concepts to your own numbers.",
}: NarrativeLessonProps) {
  const [revealed, setRevealed] = useState(1);
  const [selections, setSelections] = useState<Record<number, number>>({});
  const endRef = useRef<HTMLDivElement>(null);

  const selectAnswer = (beatIdx: number, choiceIdx: number) => {
    setSelections(s => beatIdx in s ? s : { ...s, [beatIdx]: choiceIdx });
  };

  const LETTER = ["A", "B", "C", "D"];

  const advance = () => {
    setRevealed((r) => Math.min(r + 1, beats.length));
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  };

  const allRevealed = revealed >= beats.length;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <style>{`
        @keyframes nb-fadeup {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nb-explain {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nb-beat { animation: nb-fadeup 0.45s ease; }
        .nb-narrative p + p { margin-top: 20px; }
        .nb-btn { transition: opacity 0.15s ease, transform 0.15s ease; }
        .nb-btn:hover { opacity: 0.87; transform: translateY(-1px); }
        .nb-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
        .nb-choice:not(:disabled):hover { filter: brightness(0.96); }
        .nb-explain { animation: nb-explain 0.3s ease; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: accent,
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10,
        }}>
          Before you start
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 8, lineHeight: 1.25 }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: MUTED, fontStyle: "italic" }}>{character}</p>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 36 }}>
        {beats.map((_, i) => (
          <div
            key={i}
            style={{
              height: 5, borderRadius: 3,
              width: i < revealed ? 28 : 8,
              background: i < revealed ? accent : "#e2e8f0",
              transition: "all 0.35s ease",
            }}
          />
        ))}
        <span style={{ fontSize: 11, color: MUTED, marginLeft: 10, fontWeight: 600 }}>
          {revealed} / {beats.length}
        </span>
      </div>

      {/* Story beats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
        {beats.slice(0, revealed).map((beat, i) => (
          <div
            key={i}
            className={i === revealed - 1 ? "nb-beat" : ""}
          >
            {/* Visual panel (e.g. pay stub) */}
            {beat.visual && (
              <div style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                overflowX: "auto",
                overflowY: "hidden",
                marginBottom: 20,
              }}>
                {beat.visual}
              </div>
            )}

            {/* Narrative */}
            <div
              className="nb-narrative"
              style={{
                fontSize: 16,
                lineHeight: 1.7,
                color: INK,
                marginBottom: beat.term ? 28 : 0,
              }}
            >
              {beat.narrative}
            </div>

            {/* Term callout */}
            {beat.term && (
              <div style={{
                borderLeft: `3px solid ${accent}`,
                borderRadius: "0 10px 10px 0",
                background: LIGHT,
                padding: "20px 24px",
                marginLeft: 4,
              }}>
                <p style={{
                  fontSize: 10, fontWeight: 800, color: accent,
                  letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8,
                }}>
                  {beat.term.name}
                </p>
                <p style={{ fontSize: 14, color: INK, lineHeight: 1.65, marginBottom: 10 }}>
                  {beat.term.definition}
                </p>
                <div style={{
                  display: "flex", gap: 8, alignItems: "flex-start",
                  background: "#fff", borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  padding: "12px 16px",
                }}>
                  <span style={{ fontSize: 13, color: accent, flexShrink: 0, fontWeight: 700 }}>↳</span>
                  <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>
                    {beat.term.impact}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Check */}
            {beat.check && (() => {
              const sel = selections[i];
              const answered = sel !== undefined;
              const isCorrect = sel === beat.check.correct;
              return (
                <div style={{
                  marginTop: 20,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "18px 20px",
                  background: "#fafafa",
                }}>
                  <p style={{
                    fontSize: 10, fontWeight: 800, color: accent,
                    letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10,
                  }}>
                    Quick Check
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.6, marginBottom: 14 }}>
                    {beat.check.q}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {beat.check.choices.map((choice, j) => {
                      const isRight = j === beat.check!.correct;
                      const isWrong = answered && j === sel && !isCorrect;
                      let border = "1px solid #e2e8f0";
                      let bg = "#fff";
                      let color = INK;
                      if (answered && isRight) { border = "2px solid #16a34a"; bg = "#f0fdf4"; color = "#166534"; }
                      else if (isWrong)          { border = "2px solid #dc2626"; bg = "#fef2f2"; color = "#991b1b"; }
                      return (
                        <button
                          key={j}
                          className="nb-choice"
                          disabled={answered}
                          onClick={() => selectAnswer(i, j)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px",
                            border, borderRadius: 8,
                            background: bg, color,
                            cursor: answered ? "default" : "pointer",
                            textAlign: "left", fontSize: 13, lineHeight: 1.5,
                            fontFamily: "inherit", width: "100%",
                          }}
                        >
                          <span style={{
                            flexShrink: 0, width: 22, height: 22, borderRadius: "50%",
                            border: `1px solid ${answered && isRight ? "#16a34a" : isWrong ? "#dc2626" : "#cbd5e1"}`,
                            background: answered && isRight ? "#dcfce7" : isWrong ? "#fee2e2" : "#f8fafc",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 800,
                            color: answered && isRight ? "#166534" : isWrong ? "#991b1b" : MUTED,
                          }}>
                            {LETTER[j]}
                          </span>
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                  {answered && (
                    <div className="nb-explain" style={{
                      marginTop: 12, padding: "12px 14px",
                      background: "#fff", border: "1px solid #e2e8f0",
                      borderRadius: 8, fontSize: 13, color: MUTED, lineHeight: 1.65,
                    }}>
                      <strong style={{ color: isCorrect ? "#16a34a" : "#dc2626" }}>
                        {isCorrect ? "Correct! " : "Not quite — "}
                      </strong>
                      {beat.check.explain}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Divider */}
      {beats.length > 1 && (
        <div style={{ height: 1, background: "#e2e8f0", margin: "36px 0" }} />
      )}

      {/* Advance / CTA */}
      <div ref={endRef} style={{ textAlign: "center", paddingBottom: 8 }}>
        {!allRevealed ? (
          <button
            className="nb-btn"
            onClick={advance}
            style={{
              fontSize: 14, fontWeight: 700, color: accent,
              background: "transparent",
              border: `2px solid ${accent}`,
              borderRadius: 10, padding: "12px 32px", cursor: "pointer",
            }}
          >
            Continue the story →
          </button>
        ) : (
          <>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
              {ctaSubtitle}
            </p>
            <button
              className="nb-btn"
              onClick={onReady}
              style={{
                fontSize: 15, fontWeight: 700, color: "#fff",
                background: accent, border: "none",
                borderRadius: 10, padding: "14px 36px", cursor: "pointer",
              }}
            >
              {ctaLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
