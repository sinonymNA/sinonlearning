"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { GameSession, StudentResponse } from "@/lib/koraGame";

type EvalResult = {
  points: number;
  understanding_level: string;
  misconception_detected: boolean;
  misconception_label: string | null;
  feedback: string;
  advance: boolean;
};

const LEVEL_COLORS: Record<string, string> = {
  "Not Yet Shown": "bg-rose-100 text-rose-800",
  "Emerging": "bg-amber-100 text-amber-800",
  "Solid": "bg-blue-100 text-blue-800",
  "Strong": "bg-green-100 text-green-800",
};

interface Props {
  code: string;
  studentId: string;
  studentName: string;
  session: GameSession;
  priorResponses: StudentResponse[];
}

export default function KoraGamePlay({ code, studentId, studentName, session, priorResponses }: Props) {
  const [currentRoundIdx, setCurrentRoundIdx] = useState(priorResponses.length);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState("");

  const allRounds = session.rounds;
  const done = currentRoundIdx >= allRounds.length;
  const currentRound = done ? null : allRounds[currentRoundIdx];

  const totalPoints =
    priorResponses.reduce((sum, r) => sum + r.points, 0) +
    (evalResult ? evalResult.points : 0);

  async function handleSubmit() {
    if (!currentRound || !answer.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/kora-game/${code}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          studentName,
          roundId: currentRound.id,
          probe: currentRound.probe,
          text: answer.trim(),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(e.error);
      }
      const { evaluation } = await res.json();
      setEvalResult(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    setCurrentRoundIdx((i) => i + 1);
    setAnswer("");
    setEvalResult(null);
    setError("");
  }

  if (done && !evalResult) {
    const finalPoints = priorResponses.reduce((sum, r) => sum + r.points, 0);
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 text-6xl">🎉</div>
        <h2 className="mb-2 font-display text-3xl text-navy-900">You finished!</h2>
        <p className="mb-6 text-navy-700/70">
          Total score: <span className="font-bold text-navy-900">{finalPoints}</span> points
        </p>
        <p className="max-w-sm text-sm text-navy-700/60">
          Your teacher can see how well you understood {session.concept}.
          Great thinking, {studentName}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 overflow-hidden rounded-full bg-navy-900/8 h-1.5">
          <div
            className="h-full rounded-full bg-teal-500 transition-all"
            style={{ width: `${((currentRoundIdx) / allRounds.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-navy-700/50">
          {currentRoundIdx + 1} / {allRounds.length}
        </span>
      </div>

      {/* Concept chip */}
      <div className="mb-4 inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
        {session.concept}
      </div>

      {/* Probe */}
      {currentRound && (
        <div className="mb-6 rounded-3xl border border-navy-900/8 bg-white p-6 shadow-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-navy-700/40">
            Question {currentRoundIdx + 1}
          </p>
          <p className="text-lg font-medium text-navy-900">{currentRound.probe}</p>
        </div>
      )}

      {/* Feedback card (after submit) */}
      {evalResult ? (
        <div className="mb-6 space-y-4">
          <div className="rounded-3xl border border-navy-900/8 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${LEVEL_COLORS[evalResult.understanding_level] ?? "bg-navy-100 text-navy-800"}`}
              >
                {evalResult.understanding_level}
              </span>
              <span className="text-sm font-bold text-navy-900">+{evalResult.points} pts</span>
            </div>
            <p className="text-sm text-navy-800">{evalResult.feedback}</p>
            {evalResult.misconception_detected && evalResult.misconception_label && (
              <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3">
                <p className="text-xs font-semibold text-amber-800">Watch out for:</p>
                <p className="text-sm text-amber-900">{evalResult.misconception_label}</p>
              </div>
            )}
          </div>

          {currentRoundIdx + 1 < allRounds.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-full bg-teal-500 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              Next question →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-full bg-navy-800 py-3 text-sm font-semibold text-white transition hover:bg-navy-700"
            >
              See my final score →
            </button>
          )}
        </div>
      ) : (
        /* Answer input */
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitting}
            placeholder="Type your answer here…"
            rows={4}
            className="w-full resize-none rounded-2xl border border-navy-900/10 bg-white px-4 py-3 text-sm text-navy-800 shadow-sm placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none disabled:opacity-60"
          />
          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !answer.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-500 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50"
          >
            {submitting ? (
              <><Loader2 size={18} className="animate-spin" /> KORA is evaluating…</>
            ) : (
              "Submit answer"
            )}
          </button>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-navy-700/40">
        Total so far: {totalPoints} pts
      </p>
    </div>
  );
}
