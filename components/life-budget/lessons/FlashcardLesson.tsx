"use client";

import { useState } from "react";

const INK    = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const CARD   = "#ffffff";
const LIGHT  = "#f8fafc";

export interface TermCard {
  term: string;
  question: string;
  definition: string;
  example: string;
}

interface FlashcardLessonProps {
  cards: TermCard[];
  accent: string;
  title: string;
  subtitle: string;
  onReady: () => void;
  ctaLabel: string;
}

export default function FlashcardLesson({ cards, accent, title, subtitle, onReady, ctaLabel }: FlashcardLessonProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());

  const card = cards[index];
  const allSeen = seen.size === cards.length;

  const flip = () => {
    if (!flipped) {
      setSeen((prev) => new Set([...prev, index]));
    }
    setFlipped((f) => !f);
  };

  const go = (dir: 1 | -1) => {
    const next = index + dir;
    if (next < 0 || next >= cards.length) return;
    setIndex(next);
    setFlipped(false);
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Learn the terms
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 10 }}>{title}</h1>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>{subtitle}</p>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 28 }}>
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIndex(i); setFlipped(false); }}
            aria-label={`Term ${i + 1}`}
            style={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: seen.has(i) ? accent : i === index ? accent : BORDER,
              opacity: i === index ? 1 : seen.has(i) ? 0.65 : 1,
              transition: "all 0.25s",
              padding: 0,
            }}
          />
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: MUTED, marginBottom: 20, fontWeight: 600 }}>
        Term {index + 1} of {cards.length} — {allSeen ? "All terms flipped ✓" : `${seen.size} of ${cards.length} seen`}
      </p>

      {/* Flip card */}
      <div
        style={{
          perspective: "800px",
          maxWidth: 560,
          margin: "0 auto 28px",
          height: 260,
          cursor: "pointer",
        }}
        onClick={flip}
        role="button"
        aria-label={flipped ? "Click to see question" : "Click to flip and see definition"}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.45s cubic-bezier(0.4,0.2,0.2,1)",
          }}
        >
          {/* Front */}
          <div
            style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              background: CARD,
              border: `2px solid ${accent}`,
              borderRadius: 18,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 32px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
              {card.term}
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: INK, lineHeight: 1.5, marginBottom: 20 }}>
              {card.question}
            </p>
            <p style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>Click to flip →</p>
          </div>

          {/* Back */}
          <div
            style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: LIGHT,
              border: `2px solid ${accent}`,
              borderRadius: 18,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "24px 28px",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
              {card.term}
            </p>
            <p style={{ fontSize: 15, color: INK, lineHeight: 1.6, marginBottom: 16, fontWeight: 500 }}>
              {card.definition}
            </p>
            <div style={{
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: "12px 16px",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                Real example
              </p>
              <p style={{ fontSize: 13, color: INK, lineHeight: 1.55 }}>{card.example}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 36 }}>
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          style={{
            width: 42, height: 42, borderRadius: 10,
            border: `1px solid ${BORDER}`,
            background: CARD, cursor: index === 0 ? "not-allowed" : "pointer",
            fontSize: 18, color: index === 0 ? BORDER : INK,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ←
        </button>
        <button
          onClick={flip}
          style={{
            padding: "10px 24px", borderRadius: 10,
            border: `1px solid ${accent}`,
            background: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 700, color: accent,
          }}
        >
          {flipped ? "Flip back" : "Flip card"}
        </button>
        <button
          onClick={() => go(1)}
          disabled={index === cards.length - 1}
          style={{
            width: 42, height: 42, borderRadius: 10,
            border: `1px solid ${BORDER}`,
            background: CARD, cursor: index === cards.length - 1 ? "not-allowed" : "pointer",
            fontSize: 18, color: index === cards.length - 1 ? BORDER : INK,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          →
        </button>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center" }}>
        {!allSeen && (
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 14 }}>
            Flip all {cards.length} cards to continue — {cards.length - seen.size} left
          </p>
        )}
        <button
          onClick={onReady}
          disabled={!allSeen}
          style={{
            fontSize: 15, fontWeight: 700,
            color: allSeen ? "#fff" : MUTED,
            background: allSeen ? accent : "#f1f5f9",
            border: "none",
            borderRadius: 10, padding: "14px 36px",
            cursor: allSeen ? "pointer" : "not-allowed",
            transition: "all 0.25s",
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
