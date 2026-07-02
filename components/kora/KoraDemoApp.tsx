"use client";

import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Brain,
  ChevronRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { KORA_DEMO_CONCEPTS, type KoraConcept } from "@/lib/koraDemoConcepts";
import type { ConversationTurn, MentalModel } from "@/app/api/kora-demo/route";

type AppPhase =
  | "concept"
  | "assessment"
  | "analyzing"
  | "profile"
  | "remediation"
  | "complete";

const MAX_ASSESSMENT = 10;
const MAX_REMEDIATION = 7;

const LEVEL_CONFIG: Record<
  string,
  {
    label: string;
    description: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    badgeClass: string;
  }
> = {
  "Not Yet Shown": {
    label: "Not Yet Shown",
    description: "Your responses didn't reveal the core concept yet.",
    textColor: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
  },
  Emerging: {
    label: "Emerging",
    description: "You've grasped parts of it, with important gaps remaining.",
    textColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  Solid: {
    label: "Solid",
    description: "You understand the core concept with some areas to deepen.",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  Strong: {
    label: "Strong",
    description: "You demonstrate clear, transferable understanding.",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    badgeClass: "bg-green-100 text-green-700 border border-green-200",
  },
};

const DIMENSION_PILLS: Record<string, string> = {
  accuracy: "What you know",
  causality: "How it works",
  application: "Using it",
  transfer: "Taking it further",
};

// ──────────────────────────────────────────────
// Atom progress visualization
// ──────────────────────────────────────────────

function AtomRings({
  answered,
  total = MAX_ASSESSMENT,
}: {
  answered: number;
  total?: number;
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const minR = 14;
  const maxR = 96;
  const step = (maxR - minR) / Math.max(total - 1, 1);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="select-none"
    >
      {/* Subtle backdrop */}
      <circle cx={cx} cy={cy} r={maxR + 10} fill="#f8fafc" />

      {Array.from({ length: total }, (_, i) => {
        const r = minR + step * i;
        const filled = i < answered;
        const t = total > 1 ? i / (total - 1) : 0;
        // Filled: dark navy (inner) → steel blue (outer)
        // Empty: faint dashed slate
        const stroke = filled
          ? `hsl(215 55% ${18 + t * 22}%)`
          : "hsl(214 20% 88%)";
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={filled ? 2.5 : 1.2}
            strokeDasharray={filled ? undefined : "3.5 6"}
            style={{
              transition: "stroke 0.55s ease, stroke-width 0.3s ease",
            }}
          />
        );
      })}

      {/* Nucleus */}
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        fill={answered > 0 ? "hsl(215 55% 18%)" : "hsl(214 20% 82%)"}
        style={{ transition: "fill 0.4s ease" }}
      />
    </svg>
  );
}

function AtomProgress({
  answered,
  total = MAX_ASSESSMENT,
  label,
}: {
  answered: number;
  total?: number;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <AtomRings answered={answered} total={total} />
      <div className="text-center -mt-1">
        <p className="text-xs font-mono font-semibold text-navy-600">
          {answered}
          <span className="text-navy-300">/{total}</span>
        </p>
        {label && <p className="text-[11px] text-navy-400 mt-0.5">{label}</p>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Concept card (phase: concept)
// ──────────────────────────────────────────────

function ConceptCard({
  concept,
  onBegin,
}: {
  concept: KoraConcept;
  onBegin: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <span className="inline-block text-[11px] font-semibold tracking-widest uppercase text-navy-400 bg-navy-50 border border-navy-100 rounded-full px-3 py-0.5">
          {concept.subject}
        </span>
        <h2 className="text-3xl font-serif font-bold text-navy-900">
          {concept.name}
        </h2>
        <p className="text-navy-500">{concept.tagline}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
          <BookOpen className="w-4 h-4 shrink-0" />
          Step 1 — Research this concept for ~5 minutes
        </div>
        <p className="text-amber-900/80 text-sm leading-relaxed">
          {concept.research_prompt}
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-navy-700 font-semibold text-sm">
          <Brain className="w-4 h-4 shrink-0" />
          Step 2 — KORA assesses your understanding
        </div>
        <p className="text-navy-500 text-sm leading-relaxed">
          KORA will ask you up to 10 short, focused questions — each needing
          only 1–2 sentences. It will build a map of what you understand and
          what&apos;s missing.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-navy-700 font-semibold text-sm">
          <Lightbulb className="w-4 h-4 shrink-0" />
          Step 3 — Guided discovery to mastery
        </div>
        <p className="text-navy-500 text-sm leading-relaxed">
          KORA guides you to fill your gaps through Socratic questions — it
          will never give you the answer. You discover it yourself.
        </p>
      </div>

      <button
        onClick={onBegin}
        className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        I&apos;ve researched it — assess me
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Assessment panel (phase: assessment)
// ──────────────────────────────────────────────

function AssessmentPanel({
  concept,
  answeredCount,
  currentQuestion,
  dimension,
  onSubmit,
  loading,
}: {
  concept: KoraConcept;
  answeredCount: number;
  currentQuestion: string;
  dimension: string;
  onSubmit: (response: string) => void;
  loading: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && currentQuestion) {
      textareaRef.current?.focus();
    }
  }, [loading, currentQuestion]);

  function handleSubmit() {
    const trimmed = answer.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setAnswer("");
  }

  const pillClass =
    "text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-500";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-navy-400">
          KORA Assessment
        </p>
        <h2 className="text-xl font-serif font-bold text-navy-900">
          {concept.name}
        </h2>
      </div>

      {/* Atom + context */}
      <div className="flex flex-col items-center gap-1">
        <AtomProgress
          answered={answeredCount}
          total={MAX_ASSESSMENT}
          label="understanding probes"
        />
        <p className="text-sm text-navy-500 text-center max-w-xs">
          {answeredCount === 0
            ? "Your mental model starts empty. Each answer fills a ring."
            : answeredCount < 4
            ? "KORA is mapping your understanding. Keep going."
            : answeredCount < 8
            ? "Your model is taking shape."
            : "Almost complete."}
        </p>
      </div>

      {/* Current question */}
      {currentQuestion && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className={pillClass}>
              {DIMENSION_PILLS[dimension] ?? dimension}
            </span>
            <span className="text-[11px] text-navy-300">
              Question {answeredCount + 1} of {MAX_ASSESSMENT}
            </span>
          </div>
          <p className="text-navy-900 font-medium leading-relaxed">
            {currentQuestion}
          </p>
        </div>
      )}

      {loading && !currentQuestion && (
        <div className="flex items-center justify-center gap-2 py-4 text-navy-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">KORA is reading your response…</span>
        </div>
      )}

      {/* Answer area */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder="1–2 sentences is all you need…"
            rows={2}
            disabled={loading || !currentQuestion}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-900 placeholder-navy-300 resize-none focus:outline-none focus:ring-2 focus:ring-navy-300 disabled:opacity-40 bg-white"
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-navy-300 pointer-events-none">
            ⌘↵
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || loading || !currentQuestion}
          className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-30 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking…
            </>
          ) : (
            <>
              Submit
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Analyzing state
// ──────────────────────────────────────────────

function AnalyzingScreen({ concept, answeredCount }: { concept: KoraConcept; answeredCount: number }) {
  return (
    <div className="max-w-lg mx-auto flex flex-col items-center gap-6 py-8">
      <AtomProgress answered={answeredCount} total={MAX_ASSESSMENT} label="probes complete" />
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-navy-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-semibold">Building your understanding profile…</span>
        </div>
        <p className="text-navy-400 text-sm">
          KORA is synthesizing evidence from your {answeredCount} responses about{" "}
          <span className="font-medium text-navy-600">{concept.name}</span>.
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Mental model profile (phase: profile)
// ──────────────────────────────────────────────

function MentalModelProfile({
  concept,
  model,
  answeredCount,
  onBeginRemediation,
}: {
  concept: KoraConcept;
  model: MentalModel;
  answeredCount: number;
  onBeginRemediation: () => void;
}) {
  const cfg = LEVEL_CONFIG[model.overall_level] ?? LEVEL_CONFIG["Emerging"];
  const isStrong = model.overall_level === "Strong";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header + atom */}
      <div className="flex flex-col items-center gap-4">
        <AtomProgress answered={answeredCount} total={MAX_ASSESSMENT} label="probes analyzed" />
        <div className="text-center space-y-1">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-navy-400">
            KORA Understanding Profile
          </p>
          <h2 className="text-2xl font-serif font-bold text-navy-900">
            {concept.name}
          </h2>
        </div>
      </div>

      {/* Overall level card */}
      <div
        className={`rounded-2xl border ${cfg.borderColor} ${cfg.bgColor} p-5 space-y-2`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-navy-500 uppercase tracking-wide">
            Overall Level
          </span>
          <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-sm text-navy-600">{cfg.description}</p>
        <p className="text-sm text-navy-700 leading-relaxed">{model.summary}</p>
      </div>

      {/* Strengths */}
      {model.strengths.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-green-700 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Demonstrated strengths
          </div>
          <ul className="space-y-1.5">
            {model.strengths.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-xl px-3.5 py-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                <span className="text-sm text-navy-700 leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {model.gaps.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            Gaps in your model
          </div>
          <ul className="space-y-1.5">
            {model.gaps.map((g, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span className="text-sm text-navy-700 leading-relaxed">{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Misconceptions */}
      {model.misconceptions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-rose-700 font-semibold text-sm">
            <Brain className="w-4 h-4" />
            Misconceptions detected
          </div>
          <ul className="space-y-1.5">
            {model.misconceptions.map((m, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span className="text-sm text-navy-700 leading-relaxed">{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Path to mastery */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
        <div className="flex items-center gap-1.5 text-navy-700 font-semibold text-sm">
          <Lightbulb className="w-4 h-4" />
          Path to mastery
        </div>
        <p className="text-sm text-navy-700 leading-relaxed">
          {model.path_to_mastery}
        </p>
      </div>

      {isStrong ? (
        <div className="text-center space-y-2 py-2">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
          <p className="font-semibold text-navy-800">
            You already demonstrate Strong understanding.
          </p>
          <p className="text-navy-400 text-sm">No remediation needed.</p>
        </div>
      ) : (
        <button
          onClick={onBeginRemediation}
          className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Begin guided discovery
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Remediation panel (phase: remediation)
// ──────────────────────────────────────────────

function RemediationPanel({
  concept,
  acknowledgment,
  currentQuestion,
  exchangeCount,
  loading,
  onSubmit,
}: {
  concept: KoraConcept;
  acknowledgment: string;
  currentQuestion: string;
  exchangeCount: number;
  loading: boolean;
  onSubmit: (response: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && currentQuestion) {
      textareaRef.current?.focus();
    }
  }, [loading, currentQuestion]);

  function handleSubmit() {
    const trimmed = answer.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setAnswer("");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-navy-400">
            Guided Discovery
          </p>
          <h2 className="text-xl font-serif font-bold text-navy-900">
            {concept.name}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-navy-400">
            Exchange {exchangeCount + 1}
            <span className="text-navy-300">/{MAX_REMEDIATION}</span>
          </p>
          <p className="text-[10px] text-navy-300">Socratic mode</p>
        </div>
      </div>

      {/* Exchange progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-1">
        <div
          className="bg-navy-600 h-1 rounded-full transition-all duration-500"
          style={{ width: `${(exchangeCount / MAX_REMEDIATION) * 100}%` }}
        />
      </div>

      {/* KORA's message */}
      {(acknowledgment || currentQuestion) && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
          <span className="text-[11px] font-semibold text-navy-400 uppercase tracking-wide block">
            KORA
          </span>
          {acknowledgment && (
            <p className="text-navy-600 text-sm leading-relaxed">{acknowledgment}</p>
          )}
          {currentQuestion && (
            <p className="text-navy-900 font-medium leading-relaxed">{currentQuestion}</p>
          )}
        </div>
      )}

      {loading && !currentQuestion && (
        <div className="flex items-center justify-center gap-2 py-4 text-navy-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">KORA is thinking…</span>
        </div>
      )}

      {/* Answer area */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder="Think it through…"
            rows={2}
            disabled={loading || !currentQuestion}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-900 placeholder-navy-300 resize-none focus:outline-none focus:ring-2 focus:ring-navy-300 disabled:opacity-40 bg-white"
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-navy-300 pointer-events-none">
            ⌘↵
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || loading || !currentQuestion}
          className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-30 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking…
            </>
          ) : (
            <>
              Submit
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Complete screen
// ──────────────────────────────────────────────

function CompleteScreen({
  concept,
  model,
  assessedCount,
  onRestart,
}: {
  concept: KoraConcept;
  model: MentalModel;
  assessedCount: number;
  onRestart: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto space-y-6 text-center">
      <AtomProgress answered={assessedCount} total={MAX_ASSESSMENT} label="model complete" />

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-green-700 font-semibold bg-green-50 border border-green-200 rounded-full px-4 py-1.5">
          <CheckCircle2 className="w-4 h-4" />
          Mastery unlocked
        </div>
        <h2 className="text-2xl font-serif font-bold text-navy-900">
          You arrived there yourself
        </h2>
        <p className="text-navy-500 text-sm">
          KORA guided you to understand{" "}
          <span className="font-semibold text-navy-800">{concept.name}</span>{" "}
          without ever giving you the answer.
        </p>
      </div>

      {model.strengths.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-left space-y-3">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-widest">
            What you demonstrated
          </p>
          <ul className="space-y-2">
            {model.strengths.slice(0, 4).map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-navy-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-navy-50 border border-navy-100 rounded-2xl p-5 text-left space-y-1">
        <p className="text-xs font-semibold text-navy-500 uppercase tracking-widest">
          This is KORA
        </p>
        <p className="text-sm text-navy-600 leading-relaxed">
          Not just grading answers — mapping what you understand, finding the
          gaps, and guiding you to fill them yourself. This is what Sinon
          Learning's understanding engine does for every student.
        </p>
      </div>

      <button
        onClick={onRestart}
        className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        Try another concept
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main app
// ──────────────────────────────────────────────

function pickRandomConcept(exclude?: string): KoraConcept {
  const pool = exclude
    ? KORA_DEMO_CONCEPTS.filter((c) => c.id !== exclude)
    : KORA_DEMO_CONCEPTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function KoraDemoApp() {
  const [phase, setPhase] = useState<AppPhase>("concept");
  const [concept, setConcept] = useState<KoraConcept>(() => pickRandomConcept());
  const [assessmentHistory, setAssessmentHistory] = useState<ConversationTurn[]>([]);
  const [remediationHistory, setRemediationHistory] = useState<ConversationTurn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentDimension, setCurrentDimension] = useState("accuracy");
  const [acknowledgment, setAcknowledgment] = useState("");
  const [mentalModel, setMentalModel] = useState<MentalModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const answeredCount = assessmentHistory.filter((t) => t.role === "student").length;
  const remediationExchangeCount = remediationHistory.filter((t) => t.role === "student").length;

  async function callKoraDemo(payload: Record<string, unknown>) {
    const res = await fetch("/api/kora-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(
        (err as { error?: string }).error ?? `Request failed (${res.status})`
      );
    }
    const { data } = await res.json();
    return data;
  }

  async function startAssessment() {
    setPhase("assessment");
    setLoading(true);
    setError("");
    try {
      const data = await callKoraDemo({
        phase: "question",
        concept,
        assessment_history: [],
      });
      setCurrentQuestion(data.question);
      setCurrentDimension(data.dimension);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssessmentResponse(response: string) {
    setLoading(true);
    setError("");

    const updatedHistory: ConversationTurn[] = [
      ...assessmentHistory,
      { role: "kora", content: currentQuestion },
      { role: "student", content: response },
    ];
    setAssessmentHistory(updatedHistory);
    setCurrentQuestion("");

    const newAnsweredCount = updatedHistory.filter((t) => t.role === "student").length;
    const hitCap = newAnsweredCount >= MAX_ASSESSMENT;

    try {
      if (hitCap) {
        // Force analyze at cap
        await triggerAnalysis(updatedHistory);
        return;
      }

      const data = await callKoraDemo({
        phase: "question",
        concept,
        assessment_history: updatedHistory,
      });

      if (data.ready_to_analyze) {
        await triggerAnalysis(updatedHistory);
      } else {
        setCurrentQuestion(data.question);
        setCurrentDimension(data.dimension);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setCurrentQuestion("Let's try another angle. What part of this concept is clearest to you?");
    } finally {
      setLoading(false);
    }
  }

  async function triggerAnalysis(history: ConversationTurn[]) {
    setPhase("analyzing");
    const analysis = await callKoraDemo({
      phase: "analyze",
      concept,
      assessment_history: history,
    });
    setMentalModel(analysis);
    setPhase("profile");
    setLoading(false);
  }

  async function startRemediation() {
    setPhase("remediation");
    setLoading(true);
    setError("");
    try {
      const data = await callKoraDemo({
        phase: "remediate",
        concept,
        assessment_history: assessmentHistory,
        mental_model: mentalModel,
        remediation_history: [],
      });
      setAcknowledgment(data.acknowledgment ?? "");
      setCurrentQuestion(data.question);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemediationResponse(response: string) {
    setLoading(true);
    setError("");

    const koraMessage = [acknowledgment, currentQuestion].filter(Boolean).join(" ");
    const newHistory: ConversationTurn[] = [
      ...remediationHistory,
      ...(koraMessage ? [{ role: "kora" as const, content: koraMessage }] : []),
      { role: "student", content: response },
    ];
    setRemediationHistory(newHistory);
    setAcknowledgment("");
    setCurrentQuestion("");

    const newExchangeCount = newHistory.filter((t) => t.role === "student").length;
    const hitCap = newExchangeCount >= MAX_REMEDIATION;

    try {
      if (hitCap) {
        // Force mastery unlock at cap
        setMentalModel((prev) =>
          prev
            ? {
                ...prev,
                overall_level: "Strong",
                strengths: [
                  ...prev.strengths,
                  "Engaged in extended Socratic discovery",
                ],
              }
            : prev
        );
        setPhase("complete");
        setLoading(false);
        return;
      }

      const data = await callKoraDemo({
        phase: "remediate",
        concept,
        assessment_history: assessmentHistory,
        mental_model: mentalModel,
        remediation_history: newHistory,
      });

      if (data.mastery_unlocked) {
        setMentalModel((prev) =>
          prev
            ? {
                ...prev,
                overall_level: "Strong",
                strengths: [
                  ...prev.strengths,
                  "Reached mastery through guided discovery",
                ],
              }
            : prev
        );
        setPhase("complete");
      } else {
        setAcknowledgment(data.acknowledgment ?? "");
        setCurrentQuestion(data.question);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    const next = pickRandomConcept(concept.id);
    setConcept(next);
    setPhase("concept");
    setAssessmentHistory([]);
    setRemediationHistory([]);
    setCurrentQuestion("");
    setCurrentDimension("accuracy");
    setAcknowledgment("");
    setMentalModel(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-cream-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="text-center mb-10 space-y-1">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-navy-400">
            Sinon Learning · KORA
          </p>
          <h1 className="text-4xl font-serif font-bold text-navy-900">
            Understanding Engine
          </h1>
          <p className="text-navy-500 text-sm max-w-sm mx-auto">
            Research a concept, get assessed, reach mastery — without being
            given the answer.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 px-6 py-8">
          {phase === "concept" && (
            <ConceptCard concept={concept} onBegin={startAssessment} />
          )}
          {phase === "assessment" && (
            <AssessmentPanel
              concept={concept}
              answeredCount={answeredCount}
              currentQuestion={currentQuestion}
              dimension={currentDimension}
              onSubmit={handleAssessmentResponse}
              loading={loading}
            />
          )}
          {phase === "analyzing" && (
            <AnalyzingScreen concept={concept} answeredCount={answeredCount} />
          )}
          {phase === "profile" && mentalModel && (
            <MentalModelProfile
              concept={concept}
              model={mentalModel}
              answeredCount={answeredCount}
              onBeginRemediation={startRemediation}
            />
          )}
          {phase === "remediation" && (
            <RemediationPanel
              concept={concept}
              acknowledgment={acknowledgment}
              currentQuestion={currentQuestion}
              exchangeCount={remediationExchangeCount}
              loading={loading}
              onSubmit={handleRemediationResponse}
            />
          )}
          {phase === "complete" && mentalModel && (
            <CompleteScreen
              concept={concept}
              model={mentalModel}
              assessedCount={answeredCount}
              onRestart={restart}
            />
          )}
        </div>

        <p className="text-center text-[11px] text-navy-300 mt-6">
          Powered by KORA · Sinon Learning&apos;s pedagogical understanding engine
        </p>
      </div>
    </div>
  );
}
