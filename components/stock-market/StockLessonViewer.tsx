"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NarrativeLesson from "@/components/life-budget/lessons/NarrativeLesson";
import StockUnitQuiz from "@/components/stock-market/StockUnitQuiz";
import { getStockUnit } from "@/data/stockCourse";
import type { StockUnit } from "@/data/stockCourse";

const INK = "#0f172a";
const MUTED = "#64748b";
const FAINT = "#94a3b8";
const BORDER = "#e2e8f0";
const CARD = "#ffffff";
const BG = "#f8fafc";
const GAIN = "#16a34a";
const GAIN_BG = "#f0fdf4";
const GAIN_BORDER = "#bbf7d0";

type Phase = "hook" | "lesson" | "quiz" | "mission" | "done";

// ── Hook phase ─────────────────────────────────────────────────────────────────

function HookPhase({ unit, onNext }: { unit: StockUnit; onNext: () => void }) {
  const [revealed, setReveal] = useState(false);
  const { hook, accent } = unit;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 40 }}>
      <style>{`
        .sm-btn { transition: opacity 0.15s ease, transform 0.15s ease; }
        .sm-btn:hover { opacity: 0.87; transform: translateY(-1px); }
        .sm-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: accent,
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10,
        }}>
          Unit {unit.num} · Before you start
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: INK, marginBottom: 20, lineHeight: 1.2 }}>
          {hook.title}
        </h1>
      </div>

      {/* Story setup */}
      <div style={{
        fontSize: 16, lineHeight: 1.75, color: INK,
        marginBottom: 28,
      }}>
        {hook.setup}
      </div>

      {/* Question prompt */}
      {!revealed && (
        <div style={{
          background: BG, border: `1px solid ${BORDER}`,
          borderRadius: 14, padding: "20px 24px", marginBottom: 24,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: MUTED, fontStyle: "italic", marginBottom: 20, lineHeight: 1.6 }}>
            {hook.question}
          </p>
          <button
            className="sm-btn"
            onClick={() => setReveal(true)}
            style={{
              fontSize: 14, fontWeight: 700, color: "#fff",
              background: accent, border: "none",
              borderRadius: 10, padding: "12px 28px", cursor: "pointer",
            }}
          >
            Show me →
          </button>
        </div>
      )}

      {/* Reveal */}
      {revealed && (
        <div style={{
          background: accent + "0c",
          border: `1px solid ${accent}33`,
          borderRadius: 14, padding: "28px 28px 24px",
          marginBottom: 28,
          animation: "smReveal 0.4s ease",
        }}>
          <style>{`
            @keyframes smReveal {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <p style={{
            fontSize: 38, fontWeight: 900, color: accent,
            letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 4,
          }}>
            {hook.reveal.stat}
          </p>
          <p style={{ fontSize: 13, color: MUTED, fontWeight: 600, marginBottom: 16 }}>
            {hook.reveal.statSub}
          </p>
          <div style={{ height: 1, background: accent + "22", marginBottom: 16 }} />
          <p style={{ fontSize: 14, color: INK, lineHeight: 1.7 }}>
            {hook.reveal.explanation}
          </p>
        </div>
      )}

      {/* Optional interactive sandbox */}
      {revealed && hook.sandbox && (
        <div style={{ marginBottom: 28 }}>
          {hook.sandbox}
        </div>
      )}

      {revealed && (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>
            Now you know the story. The lesson explains why — and how it applies to your money.
          </p>
          <button
            className="sm-btn"
            onClick={onNext}
            style={{
              fontSize: 15, fontWeight: 700, color: "#fff",
              background: accent, border: "none",
              borderRadius: 10, padding: "14px 36px", cursor: "pointer",
            }}
          >
            Start the Lesson →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Mission phase ──────────────────────────────────────────────────────────────

function MissionPhase({
  unit,
  onComplete,
  alreadyDone,
}: {
  unit: StockUnit;
  onComplete: () => void;
  alreadyDone: boolean;
}) {
  const { mission, accent, num } = unit;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 40 }}>
      <style>{`
        .sm-btn { transition: opacity 0.15s ease, transform 0.15s ease; }
        .sm-btn:hover { opacity: 0.87; transform: translateY(-1px); }
        .sm-btn:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: accent,
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10,
        }}>
          Unit {num} · Apply It
        </p>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: INK, marginBottom: 12, lineHeight: 1.25 }}>
          {mission.title}
        </h2>
        <p style={{ fontSize: 15, color: MUTED, maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
          {mission.description}
        </p>
      </div>

      {/* Steps */}
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 14, padding: "24px", marginBottom: 24,
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: MUTED,
          letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16,
        }}>
          Your Mission
        </p>
        {mission.steps.map((step, i) => (
          <div key={i} style={{
            display: "flex", gap: 14, alignItems: "flex-start",
            marginBottom: i < mission.steps.length - 1 ? 14 : 0,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: accent + "14", border: `1px solid ${accent}33`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontSize: 11, fontWeight: 800, color: accent,
            }}>
              {i + 1}
            </div>
            <p style={{ fontSize: 14, color: INK, lineHeight: 1.6, paddingTop: 2 }}>{step}</p>
          </div>
        ))}
      </div>

      {/* Trade CTA */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
        <Link
          href={
            mission.tickerSuggestion
              ? `/simulations/stock-market/trade?ticker=${mission.tickerSuggestion}`
              : "/simulations/stock-market/trade"
          }
          style={{
            display: "inline-block", padding: "12px 22px",
            background: accent, color: "#fff",
            borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}
        >
          Go Trade →
        </Link>
        <Link
          href="/simulations/stock-market/portfolio"
          style={{
            display: "inline-block", padding: "12px 22px",
            background: CARD, color: MUTED,
            border: `1px solid ${BORDER}`,
            borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none",
          }}
        >
          View Portfolio
        </Link>
      </div>

      {/* Complete unit button */}
      {!alreadyDone ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 14, lineHeight: 1.5 }}>
            When you&apos;ve completed the mission, mark this unit done.
          </p>
          <button
            className="sm-btn"
            onClick={onComplete}
            style={{
              fontSize: 14, fontWeight: 700, color: GAIN,
              background: GAIN_BG, border: `1px solid ${GAIN_BORDER}`,
              borderRadius: 10, padding: "12px 28px", cursor: "pointer",
            }}
          >
            ✓ Mark Unit {num} Complete
          </button>
        </div>
      ) : (
        <div style={{
          background: GAIN_BG, border: `1px solid ${GAIN_BORDER}`,
          borderRadius: 12, padding: "16px 20px", textAlign: "center",
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: GAIN }}>✓ Unit {num} Complete</p>
          {num < 11 && (
            <Link
              href={`/simulations/stock-market/learn/unit-${num + 1}`}
              style={{
                display: "inline-block", marginTop: 10,
                fontSize: 13, fontWeight: 600, color: GAIN, textDecoration: "underline",
              }}
            >
              Next: Unit {num + 1} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main viewer ────────────────────────────────────────────────────────────────

interface StockLessonViewerProps {
  slug: string;
  initiallyDone: boolean;
}

export default function StockLessonViewer({ slug, initiallyDone }: StockLessonViewerProps) {
  const router = useRouter();
  const unit = getStockUnit(slug) as StockUnit;
  const [phase, setPhase] = useState<Phase>("hook");
  const [done, setDone] = useState(initiallyDone);

  const handleComplete = useCallback(async () => {
    await fetch("/api/stock-course/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitSlug: unit.slug }),
    });
    setDone(true);
  }, [unit.slug]);

  const handleQuizComplete = useCallback(async (score: number) => {
    await fetch("/api/stock-course/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitSlug: unit.slug, quizScore: score }),
    });
    setPhase("mission");
  }, [unit.slug]);

  const accent = unit.accent;

  // 4-segment progress bar: Hook / Lesson / Quiz / Mission
  const phases: { key: Phase; label: string }[] = [
    { key: "hook", label: "Hook" },
    { key: "lesson", label: "Lesson" },
    { key: "quiz", label: "Quiz" },
    { key: "mission", label: "Mission" },
  ];
  const phaseOrder: Phase[] = ["hook", "lesson", "quiz", "mission"];
  const resolvedPhase: Phase = phase === "done" ? "mission" : phase;
  const currentIdx = phaseOrder.indexOf(resolvedPhase);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* Back link */}
      <Link
        href="/simulations/stock-market/learn"
        style={{ fontSize: 12, color: FAINT, fontWeight: 600, textDecoration: "none", display: "inline-block", marginBottom: 24 }}
      >
        ← All Units
      </Link>

      {/* Phase progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 36 }}>
        {phases.map((p) => {
          const isActive = p.key === resolvedPhase;
          const isPast = phaseOrder.indexOf(p.key) < currentIdx;
          return (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                flex: 1, height: 4, borderRadius: 2,
                background: isPast || isActive ? accent : BORDER,
                transition: "background 0.3s ease",
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: isActive ? accent : isPast ? MUTED : FAINT,
                letterSpacing: "0.06em", textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>
                {p.label}
              </span>
            </div>
          );
        })}
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: done ? accent : BORDER }} />
      </div>

      {/* Phase content */}
      {phase === "hook" && (
        <HookPhase unit={unit} onNext={() => setPhase("lesson")} />
      )}

      {phase === "lesson" && (
        <NarrativeLesson
          title={unit.lesson.title}
          character={unit.lesson.character}
          beats={unit.lesson.beats}
          accent={accent}
          ctaLabel={unit.lesson.ctaLabel}
          ctaSubtitle={unit.lesson.ctaSubtitle}
          onReady={() => setPhase("quiz")}
        />
      )}

      {phase === "quiz" && (
        <StockUnitQuiz
          unitNum={unit.num}
          accent={accent}
          quiz={unit.unitQuiz}
          onComplete={handleQuizComplete}
        />
      )}

      {(phase === "mission" || phase === "done") && (
        <MissionPhase
          unit={unit}
          alreadyDone={done}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
