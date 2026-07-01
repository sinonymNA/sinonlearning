"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, Plus } from "lucide-react";
import { generateGameProbes } from "@/lib/koraClient";
import type { GameRound } from "@/lib/koraGame";

interface Props {
  onLaunched?: (code: string) => void;
}

export default function KoraGameSetup({ onLaunched }: Props) {
  const router = useRouter();

  const [concept, setConcept] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [sourceContent, setSourceContent] = useState("");

  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [generatingProbes, setGeneratingProbes] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerateProbes() {
    if (!concept.trim() || !subject.trim() || !gradeLevel.trim() || !sourceContent.trim()) {
      setError("Please fill in concept, subject, grade band, and lesson content.");
      return;
    }
    setGeneratingProbes(true);
    setError("");
    setRounds([]);
    try {
      const { events } = await generateGameProbes({
        concept: concept.trim(),
        subject: subject.trim(),
        gradeLevel: gradeLevel.trim(),
        sourceContent: sourceContent.trim(),
      });
      const newRounds: GameRound[] = events.map((e) => ({
        id: crypto.randomUUID(),
        probe: e.prompt,
        eventType: e.type,
        targetDimension: e.target_dimension,
      }));
      setRounds(newRounds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate questions. Please try again.");
    } finally {
      setGeneratingProbes(false);
    }
  }

  async function handleLaunch() {
    if (!rounds.length) { setError("Add at least one question before launching."); return; }
    setLaunching(true);
    setError("");
    try {
      const res = await fetch("/api/kora-game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: concept.trim(),
          subject: subject.trim(),
          gradeLevel: gradeLevel.trim(),
          sourceContent: sourceContent.trim(),
          rounds,
          mode: "student-paced",
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(e.error);
      }
      const { code: gameCode } = await res.json();
      setCode(gameCode);
      onLaunched?.(gameCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create game session.");
      setLaunching(false);
    }
  }

  function removeRound(id: string) {
    setRounds((r) => r.filter((x) => x.id !== id));
  }

  function addCustomRound() {
    setRounds((r) => [
      ...r,
      {
        id: crypto.randomUUID(),
        probe: "",
        eventType: "explanation",
        targetDimension: "accuracy",
      },
    ]);
  }

  function updateProbe(id: string, probe: string) {
    setRounds((r) => r.map((x) => (x.id === id ? { ...x, probe } : x)));
  }

  async function copyLink(path: string) {
    await navigator.clipboard.writeText(window.location.origin + path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (code) {
    const playerUrl = `/game/${code}`;
    const hostUrl = `/game/${code}/host`;
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 rounded-3xl border border-teal-200 bg-teal-50 p-8">
          <p className="mb-2 text-sm font-medium text-teal-800">Game code</p>
          <p className="font-display text-6xl font-bold tracking-widest text-teal-700">{code}</p>
        </div>
        <p className="mb-6 text-sm text-navy-700/70">
          Students join at <span className="font-medium text-navy-800">/game/{code}</span>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => copyLink(playerUrl)}
            className="rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-medium text-navy-800 transition hover:bg-navy-50"
          >
            {copied ? "Copied!" : "Copy student link"}
          </button>
          <button
            type="button"
            onClick={() => router.push(hostUrl)}
            className="rounded-full bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600"
          >
            Open host view
          </button>
        </div>
        <p className="mt-4 text-xs text-navy-700/50">
          {rounds.length} question{rounds.length !== 1 ? "s" : ""} · student-paced
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-navy-900">KORA Game</h1>
        <p className="mt-2 text-navy-700/70">
          Students type real answers. KORA evaluates understanding live and shows you exactly
          where each student stands — not just who guessed right.
        </p>
      </div>

      <div className="space-y-6">
        {/* Concept fields */}
        <div className="rounded-3xl border border-navy-900/8 bg-white p-6">
          <p className="mb-4 text-sm font-medium text-navy-800">Lesson details</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-700/60">
                Concept <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g. Opportunity Cost"
                className="w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-700/60">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Economics"
                className="w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-700/60">
                Grade band <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. 11–12"
                className="w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-navy-700/60">
              Lesson content <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={sourceContent}
              onChange={(e) => setSourceContent(e.target.value)}
              placeholder="Paste your lesson notes, key ideas, or any content about this concept…"
              rows={5}
              className="w-full resize-none rounded-2xl border border-navy-900/10 bg-navy-50/50 px-4 py-3 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateProbes}
            disabled={generatingProbes || !concept.trim() || !subject.trim() || !gradeLevel.trim() || !sourceContent.trim()}
            className="mt-4 flex items-center gap-2 rounded-full bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:opacity-50"
          >
            {generatingProbes ? (
              <><Loader2 size={15} className="animate-spin" /> Generating questions…</>
            ) : (
              "Generate questions with KORA"
            )}
          </button>
        </div>

        {/* Round list */}
        {rounds.length > 0 && (
          <div className="rounded-3xl border border-navy-900/8 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-navy-800">
                Questions ({rounds.length})
              </p>
              <button
                type="button"
                onClick={addCustomRound}
                className="flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900"
              >
                <Plus size={14} /> Add question
              </button>
            </div>
            <div className="space-y-3">
              {rounds.map((round, idx) => (
                <div key={round.id} className="flex gap-3">
                  <span className="mt-2.5 shrink-0 text-sm font-bold text-navy-400">
                    {idx + 1}
                  </span>
                  <textarea
                    value={round.probe}
                    onChange={(e) => updateProbe(round.id, e.target.value)}
                    rows={2}
                    className="flex-1 resize-none rounded-2xl border border-navy-900/10 bg-navy-50/50 px-4 py-2.5 text-sm text-navy-800 focus:border-teal-400/60 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeRound(round.id)}
                    className="mt-2 text-navy-400 hover:text-rose-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {rounds.length > 0 && (
          <button
            type="button"
            onClick={handleLaunch}
            disabled={launching || !rounds.some((r) => r.probe.trim())}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50"
          >
            {launching ? (
              <><Loader2 size={18} className="animate-spin" /> Launching game…</>
            ) : (
              `Launch KORA Game (${rounds.filter((r) => r.probe.trim()).length} questions)`
            )}
          </button>
        )}
      </div>
    </div>
  );
}
