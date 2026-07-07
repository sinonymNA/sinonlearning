"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { KORA_LAB_TASK_UI } from "./taskUi";
import KoraCandidatePane from "./KoraCandidatePane";
import KoraRatingBar from "./KoraRatingBar";
import KoraStatsPanel from "./KoraStatsPanel";
import KoraHistoryList from "./KoraHistoryList";
import KoraExportButton from "./KoraExportButton";
import type { KoraLabWinner } from "@/lib/koraLabDb";

interface GeneratedCandidate {
  system: string;
  output: unknown;
  configUsed: { model: string; thinking: boolean; maxTokens: number; label?: string; systemPromptOverride?: string };
}

const TASK_IDS = Object.keys(KORA_LAB_TASK_UI);

export default function KoraLabApp() {
  const [taskType, setTaskType] = useState(TASK_IDS[0]);
  const [input, setInput] = useState<any>(() => KORA_LAB_TASK_UI[TASK_IDS[0]].defaultInput());
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pair, setPair] = useState<{
    inputContext: Record<string, unknown>;
    candidateA: GeneratedCandidate;
    candidateB: GeneratedCandidate;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const taskUi = KORA_LAB_TASK_UI[taskType];

  function selectTask(next: string) {
    setTaskType(next);
    setInput(KORA_LAB_TASK_UI[next].defaultInput());
    setPair(null);
    setError(null);
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    setPair(null);
    try {
      const res = await fetch("/api/kora-lab/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType, input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      setPair({ inputContext: data.inputContext, candidateA: data.candidateA, candidateB: data.candidateB });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function rate(winner: KoraLabWinner, reason: string) {
    if (!pair) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/kora-lab/pairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType,
          inputContext: pair.inputContext,
          systemPromptSnapshot: pair.candidateA.system,
          candidateA: pair.candidateA.output,
          candidateAConfig: pair.candidateA.configUsed,
          candidateB: pair.candidateB.output,
          candidateBConfig: pair.candidateB.configUsed,
          winner,
          reason,
        }),
      });
      if (res.ok) {
        setPair(null);
        setRefreshKey((k) => k + 1);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save rating.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600">Internal tool</p>
        <h1 className="font-display text-2xl font-semibold text-navy-900">KORA Lab</h1>
        <p className="mt-1 text-sm text-navy-700/60">
          Generate two candidate outputs for the same input, pick the better one, build an owned preference dataset.
        </p>
      </div>

      <div className="rounded-2xl border border-navy-900/8 bg-white p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Task</span>
          <select
            value={taskType}
            onChange={(e) => selectTask(e.target.value)}
            className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
          >
            {TASK_IDS.map((id) => (
              <option key={id} value={id}>
                {KORA_LAB_TASK_UI[id].label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-1.5 text-[13px] text-navy-700/50">{taskUi.description}</p>

        <div className="mt-4">
          <taskUi.InputForm value={input} onChange={setInput} />
        </div>

        <button
          onClick={generate}
          disabled={generating}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-60"
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {generating ? "Generating both candidates…" : "Generate pair"}
        </button>
        {generating && (
          <p className="mt-2 text-[13px] text-navy-700/50">
            This can take up to a minute for Opus/thinking tasks — hang tight.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>

      {pair && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <KoraCandidatePane
              taskType={taskType}
              label="Candidate A"
              config={pair.candidateA.configUsed}
              output={pair.candidateA.output}
              inputContext={pair.inputContext}
            />
            <KoraCandidatePane
              taskType={taskType}
              label="Candidate B"
              config={pair.candidateB.configUsed}
              output={pair.candidateB.output}
              inputContext={pair.inputContext}
            />
          </div>
          <KoraRatingBar onRate={rate} submitting={submitting} />
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl border border-navy-900/8 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-navy-900">Dataset so far</p>
          <div className="flex flex-wrap gap-2">
            <KoraExportButton taskType={taskType} />
            <KoraExportButton />
          </div>
        </div>
        <KoraStatsPanel refreshKey={refreshKey} />
        <KoraHistoryList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
