"use client";

import { useState } from "react";
import { Check, X, RotateCcw, Gauge } from "lucide-react";
import {
  CALIBRATION_CLAIMS,
  summarizeCalibration,
  type ClaimResponse,
  type Confidence,
} from "@/lib/hallucinationClaims";

const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: "low", label: "Not sure" },
  { value: "medium", label: "Fairly sure" },
  { value: "high", label: "Certain" },
];

export default function CalibrationSandbox() {
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<ClaimResponse[]>([]);
  const [pendingGuess, setPendingGuess] = useState<boolean | null>(null);
  const [pendingConfidence, setPendingConfidence] = useState<Confidence | null>(null);
  const [revealed, setRevealed] = useState(false);

  const claim = CALIBRATION_CLAIMS[index];
  const done = index >= CALIBRATION_CLAIMS.length;
  const summary = done ? summarizeCalibration(CALIBRATION_CLAIMS, responses) : null;

  const submit = () => {
    if (pendingGuess === null || pendingConfidence === null) return;
    setResponses((prev) => [...prev, { guessedTrue: pendingGuess, confidence: pendingConfidence }]);
    setRevealed(true);
  };

  const next = () => {
    setIndex((i) => i + 1);
    setPendingGuess(null);
    setPendingConfidence(null);
    setRevealed(false);
  };

  const reset = () => {
    setIndex(0);
    setResponses([]);
    setPendingGuess(null);
    setPendingConfidence(null);
    setRevealed(false);
  };

  if (done && summary) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-teal-300/30 bg-teal-300/10 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-white/45">Accuracy</p>
            <p className="mt-1 font-display text-3xl font-medium text-white">
              {summary.correctCount}/{summary.total}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-white/45">Confidently wrong</p>
            <p className="mt-1 font-display text-3xl font-medium text-white">{summary.overconfidentWrong}</p>
          </div>
        </div>

        <p className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/65">
          {summary.overconfidentWrong === 0
            ? "You never said \"certain\" on a wrong answer — your confidence tracked your actual accuracy well. That's calibration, and it's exactly what AI models are bad at: they sound certain on every answer, right or wrong."
            : `You said "certain" ${summary.overconfidentWrong} time${summary.overconfidentWrong === 1 ? "" : "s"} and were wrong. That gap between how sure you sounded and how right you were is the same gap that produces an AI hallucination — confident tone is not evidence of accuracy, in you or in a model.`}
        </p>

        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw size={14} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/45">
        <span>
          Claim {index + 1} of {CALIBRATION_CLAIMS.length}
        </span>
        <span className="flex items-center gap-1.5">
          <Gauge size={12} />
          {responses.filter((r, i) => CALIBRATION_CLAIMS[i] && r.guessedTrue === CALIBRATION_CLAIMS[i].isTrue).length} correct so far
        </span>
      </div>

      <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-base leading-relaxed text-white/90">
        {claim.text}
      </p>

      {!revealed ? (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/50">True or false?</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setPendingGuess(true)}
                className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  pendingGuess === true
                    ? "border-teal-300/40 bg-teal-300/15 text-teal-100"
                    : "border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/10"
                }`}
              >
                True
              </button>
              <button
                onClick={() => setPendingGuess(false)}
                className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  pendingGuess === false
                    ? "border-rose-300/40 bg-rose-300/15 text-rose-100"
                    : "border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/10"
                }`}
              >
                False
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/50">How confident are you?</p>
            <div className="mt-2 flex gap-2">
              {CONFIDENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPendingConfidence(opt.value)}
                  className={`flex-1 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                    pendingConfidence === opt.value
                      ? "border-purple-300/40 bg-purple-300/15 text-purple-100"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submit}
            disabled={pendingGuess === null || pendingConfidence === null}
            className="rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Lock In Answer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 ${
              pendingGuess === claim.isTrue ? "border-teal-300/30 bg-teal-300/10" : "border-rose-300/30 bg-rose-300/10"
            }`}
          >
            {pendingGuess === claim.isTrue ? (
              <Check size={16} className="mt-0.5 flex-shrink-0 text-teal-300" />
            ) : (
              <X size={16} className="mt-0.5 flex-shrink-0 text-rose-300" />
            )}
            <div>
              <p className="text-sm font-medium text-white">
                Actually {claim.isTrue ? "true" : "false"}.
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/65">{claim.explanation}</p>
            </div>
          </div>

          <button
            onClick={next}
            className="rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
          >
            {index + 1 < CALIBRATION_CLAIMS.length ? "Next Claim" : "See Results"}
          </button>
        </div>
      )}
    </div>
  );
}
