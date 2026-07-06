"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import ReelLogo from "@/components/ReelLogo";

const LENGTHS = ["Short (~5 beats)", "Medium (~8 beats)", "Long (~12 beats)"];

export default function ReelBuildWizard() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [length, setLength] = useState(LENGTHS[1]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/reel/kora-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, keyPoints, length, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not draft the script.");
        return;
      }
      router.push(`/reel/${data.projectId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between bg-white px-6">
        <Link href="/reel">
          <ReelLogo width={110} />
        </Link>
        <Link href="/reel" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700">
          <ArrowLeft size={13} /> All videos
        </Link>
      </header>

      <main className="mx-auto max-w-lg px-6 py-10">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white">
            <Sparkles size={18} />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Script with KORA</h1>
            <p className="text-[13px] text-slate-400">Answer a few questions — KORA drafts the beats and narration.</p>
          </div>
        </div>

        <form onSubmit={generate} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Topic *</span>
            <input
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Opportunity cost"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Audience</span>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. 9th-grade economics"
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Key points to cover</span>
            <textarea
              rows={3}
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              placeholder="What should the video get across?"
              className={`${inputCls} resize-none`}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Length</span>
            <select value={length} onChange={(e) => setLength(e.target.value)} className={inputCls}>
              {LENGTHS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Anything else? (optional)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tone, a hook to open with, examples to use…"
              className={inputCls}
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy || !topic.trim()}
            className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-200 transition-all hover:shadow-md disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Drafting your script…
              </>
            ) : (
              <>
                <Sparkles size={15} /> Draft the script
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
