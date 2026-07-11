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

export interface StoryBeat {
  narrative: React.ReactNode;
  term?: StoryTermCallout;
  visual?: React.ReactNode;
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
  const endRef = useRef<HTMLDivElement>(null);

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
        .nb-beat { animation: nb-fadeup 0.45s ease; }
        .nb-narrative p + p { margin-top: 20px; }
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
                overflow: "hidden",
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
