"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, BookOpen, Brain, ChevronRight, CheckCircle2, AlertCircle, Lightbulb, Timer } from "lucide-react";
import { KORA_DEMO_CONCEPTS, type KoraConcept } from "@/lib/koraDemoConcepts";
import type { ConversationTurn, MentalModel } from "@/app/api/kora-demo/route";

type AppPhase =
  | "concept"
  | "research"
  | "assessment"
  | "analyzing"
  | "profile"
  | "remediation"
  | "complete";

const LEVEL_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; description: string }
> = {
  "Not Yet Shown": {
    label: "Not Yet Shown",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    description: "Your responses didn't reveal the core concept yet.",
  },
  Emerging: {
    label: "Emerging",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description: "You've grasped parts of it, with important gaps remaining.",
  },
  Solid: {
    label: "Solid",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    description: "You understand the core concept with some gaps to address.",
  },
  Strong: {
    label: "Strong",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    description: "You demonstrate clear, transferable understanding.",
  },
};

function ConceptCard({ concept, onBegin }: { concept: KoraConcept; onBegin: () => void }) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-navy-400">
          {concept.subject}
        </span>
        <h2 className="text-3xl font-serif font-bold text-navy-900">{concept.name}</h2>
        <p className="text-navy-500 text-lg">{concept.tagline}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
          <BookOpen className="w-4 h-4" />
          Research this concept for 5 minutes
        </div>
        <p className="text-amber-900 text-sm leading-relaxed">{concept.research_prompt}</p>
      </div>

      <p className="text-center text-navy-500 text-sm">
        When you&apos;re ready, KORA will assess your understanding through a short conversation.
      </p>

      <button
        onClick={onBegin}
        className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        I&apos;ve researched it — start the assessment
      </button>
    </div>
  );
}

function ResearchTimer({ onDone }: { onDone: () => void }) {
  const [seconds, setSeconds] = useState(300);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <div className="max-w-xl mx-auto space-y-6 text-center">
      <div className="space-y-2">
        <Timer className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-2xl font-serif font-bold text-navy-900">Research time</h2>
        <p className="text-navy-500">
          Use the research prompt on the previous screen. Come back when you&apos;re ready.
        </p>
      </div>

      <div className="text-6xl font-mono font-bold text-navy-900">
        {m}:{String(s).padStart(2, "0")}
      </div>

      {seconds <= 0 && (
        <p className="text-green-700 font-semibold">Time&apos;s up — head back and start the assessment!</p>
      )}

      <button
        onClick={onDone}
        className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        I&apos;m ready — assess me
      </button>
    </div>
  );
}

function AssessmentPanel({
  concept,
  history,
  currentQuestion,
  dimension,
  onSubmit,
  loading,
}: {
  concept: KoraConcept;
  history: ConversationTurn[];
  currentQuestion: string;
  dimension: string;
  onSubmit: (response: string) => void;
  loading: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, currentQuestion]);

  function handleSubmit() {
    const trimmed = answer.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setAnswer("");
  }

  const DIMENSION_LABELS: Record<string, string> = {
    accuracy: "What you know",
    causality: "Why it works",
    application: "Using it",
    transfer: "Applying it elsewhere",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-bold text-navy-900">{concept.name}</h2>
          <p className="text-xs text-navy-400 uppercase tracking-widest">{concept.subject}</p>
        </div>
        <span className="text-xs text-navy-500 bg-navy-100 px-2.5 py-1 rounded-full">
          Assessment in progress
        </span>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {history.map((turn, i) => (
          <div
            key={i}
            className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
              turn.role === "kora"
                ? "bg-slate-50 border border-slate-200 text-navy-800"
                : "bg-navy-900 text-white ml-8"
            }`}
          >
            {turn.role === "kora" && (
              <span className="text-xs font-semibold text-navy-400 block mb-1">KORA</span>
            )}
            {turn.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {currentQuestion && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-1">
          <span className="text-xs font-semibold text-navy-400 block">
            KORA · {DIMENSION_LABELS[dimension] ?? dimension}
          </span>
          <p className="text-navy-800 text-sm leading-relaxed">{currentQuestion}</p>
        </div>
      )}

      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          placeholder="Type your response… (⌘Enter to submit)"
          rows={3}
          disabled={loading || !currentQuestion}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-900 placeholder-navy-300 resize-none focus:outline-none focus:ring-2 focus:ring-navy-400 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || loading || !currentQuestion}
          className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              KORA is reading your response…
            </>
          ) : (
            <>
              Submit response
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function MentalModelProfile({
  concept,
  model,
  onBeginRemediation,
}: {
  concept: KoraConcept;
  model: MentalModel;
  onBeginRemediation: () => void;
}) {
  const cfg = LEVEL_CONFIG[model.overall_level] ?? LEVEL_CONFIG["Emerging"];
  const isStrong = model.overall_level === "Strong";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-navy-400">
          KORA Understanding Profile
        </p>
        <h2 className="text-2xl font-serif font-bold text-navy-900">{concept.name}</h2>
      </div>

      <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} px-5 py-4 space-y-1`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-navy-500">Overall Level</span>
          <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
        </div>
        <p className="text-sm text-navy-600">{cfg.description}</p>
        <p className="text-sm text-navy-700 leading-relaxed mt-2">{model.summary}</p>
      </div>

      {model.strengths.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Strengths
          </div>
          <ul className="space-y-1.5">
            {model.strengths.map((s, i) => (
              <li key={i} className="text-sm text-navy-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {model.gaps.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            Gaps
          </div>
          <ul className="space-y-1.5">
            {model.gaps.map((g, i) => (
              <li key={i} className="text-sm text-navy-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {model.misconceptions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
            <Brain className="w-4 h-4" />
            Misconceptions detected
          </div>
          <ul className="space-y-1.5">
            {model.misconceptions.map((m, i) => (
              <li key={i} className="text-sm text-navy-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 leading-relaxed">
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-1">
        <div className="flex items-center gap-2 text-navy-600 font-semibold text-sm">
          <Lightbulb className="w-4 h-4" />
          Path to mastery
        </div>
        <p className="text-sm text-navy-700 leading-relaxed">{model.path_to_mastery}</p>
      </div>

      {isStrong ? (
        <div className="text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
          <p className="text-navy-700 font-semibold">You already demonstrate Strong understanding.</p>
          <p className="text-navy-500 text-sm">No remediation needed — try a different concept.</p>
        </div>
      ) : (
        <button
          onClick={onBeginRemediation}
          className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          Begin guided discovery →
        </button>
      )}
    </div>
  );
}

function RemediationPanel({
  concept,
  history,
  currentQuestion,
  acknowledgment,
  loading,
  onSubmit,
}: {
  concept: KoraConcept;
  history: ConversationTurn[];
  currentQuestion: string;
  acknowledgment: string;
  loading: boolean;
  onSubmit: (response: string) => void;
}) {
  const [answer, setAnswer] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, currentQuestion, acknowledgment]);

  function handleSubmit() {
    const trimmed = answer.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setAnswer("");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-bold text-navy-900">{concept.name}</h2>
          <p className="text-xs text-navy-400 uppercase tracking-widest">{concept.subject}</p>
        </div>
        <span className="text-xs text-navy-500 bg-navy-100 px-2.5 py-1 rounded-full">
          Guided discovery
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {history.map((turn, i) => (
          <div
            key={i}
            className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
              turn.role === "kora"
                ? "bg-slate-50 border border-slate-200 text-navy-800"
                : "bg-navy-900 text-white ml-8"
            }`}
          >
            {turn.role === "kora" && (
              <span className="text-xs font-semibold text-navy-400 block mb-1">KORA</span>
            )}
            {turn.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {(acknowledgment || currentQuestion) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-2">
          <span className="text-xs font-semibold text-navy-400 block">KORA</span>
          {acknowledgment && (
            <p className="text-navy-600 text-sm leading-relaxed">{acknowledgment}</p>
          )}
          {currentQuestion && (
            <p className="text-navy-800 text-sm leading-relaxed font-medium">{currentQuestion}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
          placeholder="Think it through… (⌘Enter to submit)"
          rows={3}
          disabled={loading || !currentQuestion}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-navy-900 placeholder-navy-300 resize-none focus:outline-none focus:ring-2 focus:ring-navy-400 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || loading || !currentQuestion}
          className="w-full flex items-center justify-center gap-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              KORA is thinking…
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

function CompleteScreen({
  concept,
  model,
  onRestart,
}: {
  concept: KoraConcept;
  model: MentalModel;
  onRestart: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6">
      <div className="space-y-3">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-serif font-bold text-navy-900">Mastery unlocked</h2>
        <p className="text-navy-500">
          You arrived at Strong understanding of{" "}
          <span className="font-semibold text-navy-800">{concept.name}</span> through your own
          reasoning.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-left space-y-2">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest">
          What you demonstrated
        </p>
        <ul className="space-y-1.5">
          {model.strengths.map((s, i) => (
            <li key={i} className="text-sm text-navy-700 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-navy-500 text-sm">
        This is what KORA does for every student — not just grading answers, but building a map of
        what they understand and guiding them to fill the gaps themselves.
      </p>

      <button
        onClick={onRestart}
        className="w-full bg-navy-900 hover:bg-navy-800 text-white font-semibold py-3.5 rounded-xl transition-colors"
      >
        Try another concept
      </button>
    </div>
  );
}

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
  const [currentDimension, setCurrentDimension] = useState("");
  const [acknowledgment, setAcknowledgment] = useState("");
  const [mentalModel, setMentalModel] = useState<MentalModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function callKoraDemo(payload: Record<string, unknown>) {
    const res = await fetch("/api/kora-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error((err as { error?: string }).error ?? `Request failed (${res.status})`);
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

    try {
      const data = await callKoraDemo({
        phase: "question",
        concept,
        assessment_history: updatedHistory,
      });

      if (data.ready_to_analyze) {
        setPhase("analyzing");
        const analysis = await callKoraDemo({
          phase: "analyze",
          concept,
          assessment_history: updatedHistory,
        });
        setMentalModel(analysis);
        setPhase("profile");
      } else {
        setCurrentQuestion(data.question);
        setCurrentDimension(data.dimension);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setCurrentQuestion("KORA encountered an issue. Please try again.");
    } finally {
      setLoading(false);
    }
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

    const newHistory: ConversationTurn[] = [
      ...remediationHistory,
      ...(acknowledgment || currentQuestion
        ? [{ role: "kora" as const, content: [acknowledgment, currentQuestion].filter(Boolean).join(" ") }]
        : []),
      { role: "student", content: response },
    ];
    setRemediationHistory(newHistory);
    setAcknowledgment("");
    setCurrentQuestion("");

    try {
      const data = await callKoraDemo({
        phase: "remediate",
        concept,
        assessment_history: assessmentHistory,
        mental_model: mentalModel,
        remediation_history: newHistory,
      });

      if (data.mastery_unlocked) {
        // Update mental model strengths for the complete screen
        setMentalModel((prev) =>
          prev
            ? {
                ...prev,
                overall_level: "Strong",
                strengths: [
                  ...prev.strengths,
                  "Demonstrated mastery through Socratic discovery",
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
    setCurrentDimension("");
    setAcknowledgment("");
    setMentalModel(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-cream-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10 space-y-1">
          <p className="text-xs font-semibold tracking-widest uppercase text-navy-400">
            KORA · Understanding Engine
          </p>
          <h1 className="text-4xl font-serif font-bold text-navy-900">
            Live demo
          </h1>
          <p className="text-navy-500 max-w-md mx-auto text-sm">
            Research a concept, then let KORA assess your understanding and guide you to mastery — without ever giving you the answer.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-8">
          {phase === "concept" && (
            <ConceptCard concept={concept} onBegin={() => setPhase("research")} />
          )}
          {phase === "research" && (
            <ResearchTimer onDone={startAssessment} />
          )}
          {phase === "assessment" && (
            <AssessmentPanel
              concept={concept}
              history={assessmentHistory}
              currentQuestion={currentQuestion}
              dimension={currentDimension}
              onSubmit={handleAssessmentResponse}
              loading={loading}
            />
          )}
          {phase === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-navy-400 animate-spin" />
              <p className="text-navy-600 font-medium">KORA is building your understanding profile…</p>
              <p className="text-navy-400 text-sm">Synthesizing evidence from your responses</p>
            </div>
          )}
          {phase === "profile" && mentalModel && (
            <MentalModelProfile
              concept={concept}
              model={mentalModel}
              onBeginRemediation={startRemediation}
            />
          )}
          {phase === "remediation" && (
            <RemediationPanel
              concept={concept}
              history={remediationHistory}
              currentQuestion={currentQuestion}
              acknowledgment={acknowledgment}
              loading={loading}
              onSubmit={handleRemediationResponse}
            />
          )}
          {phase === "complete" && mentalModel && (
            <CompleteScreen
              concept={concept}
              model={mentalModel}
              onRestart={restart}
            />
          )}
        </div>

        <p className="text-center text-xs text-navy-300 mt-6">
          Powered by KORA · Sinon Learning&apos;s pedagogical understanding engine
        </p>
      </div>
    </div>
  );
}
