"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, BookOpen } from "lucide-react";
import FadeIn from "@/components/FadeIn";

const DEFAULT_QUESTIONS = [
  { id: "historical-context", prompt: "Historical Context — What was happening that influenced this source's creation?" },
  { id: "audience", prompt: "Audience — Who was the intended audience? How did that shape the content?" },
  { id: "purpose", prompt: "Purpose — What was the author trying to achieve?" },
  { id: "point-of-view", prompt: "Point of View — How does the author's background shape their perspective?" },
  { id: "beyond-source", prompt: "Beyond the Source — What other evidence would help evaluate this source?" },
];

const TIMER_OPTIONS = [
  { seconds: 60, label: "1 min" },
  { seconds: 120, label: "2 min" },
  { seconds: 180, label: "3 min" },
  { seconds: 240, label: "4 min" },
  { seconds: 300, label: "5 min" },
];

export default function SourceRoomPage() {
  const router = useRouter();
  const [sourceText, setSourceText] = useState("");
  const [sourceImageUrl, setSourceImageUrl] = useState("");
  const [sourceLabel, setSourceLabel] = useState("Historical Source");
  const [sourceCitation, setSourceCitation] = useState("");
  const [enabledQuestions, setEnabledQuestions] = useState<Set<string>>(
    new Set(DEFAULT_QUESTIONS.map((q) => q.id)),
  );
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function toggleQuestion(id: string) {
    setEnabledQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleCreate() {
    if (!sourceText.trim() && !sourceImageUrl.trim()) {
      setError("Add a source text or image URL before creating a session.");
      return;
    }
    setError("");
    setCreating(true);
    try {
      const questions = DEFAULT_QUESTIONS.filter((q) => enabledQuestions.has(q.id));
      const res = await fetch("/api/source-room/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: sourceText.trim() || undefined,
          sourceImageUrl: sourceImageUrl.trim() || undefined,
          sourceLabel: sourceLabel.trim() || "Historical Source",
          sourceCitation: sourceCitation.trim() || undefined,
          questions,
          timerSeconds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create session.");
      }
      const { code, hostToken } = await res.json();
      localStorage.setItem(`source-room-host-${code}`, hostToken);
      router.push(`/tools/source-room/host/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <FadeIn>
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-navy-900">Source Room</h1>
              <p className="mt-1 text-sm text-navy-800/60">
                Display a primary source for students to analyze together in real time.
              </p>
            </div>
          </div>
        </FadeIn>

        <div className="flex flex-col gap-6">
          {/* Source text */}
          <FadeIn delay={0.05}>
            <div className="rounded-2xl border border-navy-900/8 bg-white p-6">
              <label className="mb-1 block text-sm font-semibold text-navy-900">
                Primary Source Text
              </label>
              <p className="mb-3 text-xs text-navy-800/50">
                Paste the source exactly as you want students to see it.
              </p>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste the primary source text here…"
                rows={7}
                className="w-full rounded-xl border border-navy-900/12 bg-cream-50 px-4 py-3 text-sm text-navy-900 placeholder:text-navy-900/30 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />

              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-900/50">
                  Source Image URL (optional)
                </label>
                <input
                  type="url"
                  value={sourceImageUrl}
                  onChange={(e) => setSourceImageUrl(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-xl border border-navy-900/12 bg-cream-50 px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-900/30 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                {sourceImageUrl.trim() && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-navy-900/8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sourceImageUrl}
                      alt="Source preview"
                      className="max-h-48 w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </FadeIn>

          {/* Citation */}
          <FadeIn delay={0.08}>
            <div className="rounded-2xl border border-navy-900/8 bg-white p-6">
              <label className="mb-1 block text-sm font-semibold text-navy-900">
                Document Label &amp; Citation
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-navy-800/50">Label</label>
                  <input
                    type="text"
                    value={sourceLabel}
                    onChange={(e) => setSourceLabel(e.target.value)}
                    placeholder="Historical Source"
                    className="w-full rounded-xl border border-navy-900/12 bg-cream-50 px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-900/30 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="mb-1 block text-xs font-medium text-navy-800/50">Citation</label>
                  <input
                    type="text"
                    value={sourceCitation}
                    onChange={(e) => setSourceCitation(e.target.value)}
                    placeholder="Document 1 — Conquistador account, Tenochtitlan, 1521"
                    className="w-full rounded-xl border border-navy-900/12 bg-cream-50 px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-900/30 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Questions */}
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-navy-900/8 bg-white p-6">
              <p className="mb-1 text-sm font-semibold text-navy-900">Analysis Questions</p>
              <p className="mb-4 text-xs text-navy-800/50">
                Toggle which HAPP skills students will respond to.
              </p>
              <div className="flex flex-col gap-2">
                {DEFAULT_QUESTIONS.map((q) => {
                  const active = enabledQuestions.has(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => toggleQuestion(q.id)}
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-teal-400/60 bg-teal-50 text-teal-900"
                          : "border-navy-900/8 bg-cream-50 text-navy-800/40"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors ${
                          active
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-navy-900/20 text-navy-900/30"
                        }`}
                      >
                        {active ? "✓" : ""}
                      </span>
                      <span className="text-sm">{q.prompt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </FadeIn>

          {/* Timer */}
          <FadeIn delay={0.12}>
            <div className="rounded-2xl border border-navy-900/8 bg-white p-6">
              <p className="mb-4 text-sm font-semibold text-navy-900">Timer</p>
              <div className="flex flex-wrap gap-2">
                {TIMER_OPTIONS.map((opt) => (
                  <button
                    key={opt.seconds}
                    onClick={() => setTimerSeconds(opt.seconds)}
                    className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${
                      timerSeconds === opt.seconds
                        ? "border-navy-900 bg-navy-900 text-cream-50"
                        : "border-navy-900/15 bg-cream-50 text-navy-700 hover:border-navy-900/30"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </FadeIn>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}

          <FadeIn delay={0.14}>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full rounded-2xl bg-teal-600 py-4 text-base font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
            >
              {creating ? "Creating session…" : "Create Session →"}
            </button>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
