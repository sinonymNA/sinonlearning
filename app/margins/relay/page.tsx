"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Users, Timer, Shuffle } from "lucide-react";
import { RELAY_MOVES, RELAY_SPRITES, ROUND_SECONDS_OPTIONS, DEFAULT_ROUND_SECONDS } from "@/lib/relayGame";

const ESSAY_TYPES = [
  { id: "LEQ", label: "LEQ", hint: "Long essay · 6 pts" },
  { id: "DBQ", label: "DBQ", hint: "Document-based · 7 pts" },
  { id: "SAQ", label: "SAQ", hint: "Short answer" },
];

const EXAMPLE_PROMPTS = [
  "Evaluate the extent to which the Industrial Revolution changed the role of women in European society from 1750 to 1900.",
  "Evaluate the extent to which maritime trade networks transformed political power in the Indian Ocean region from 1200 to 1450.",
  "Evaluate the extent to which the Cold War shaped decolonization movements in Africa and Asia after 1945.",
];

export default function RelaySetupPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [essayType, setEssayType] = useState("LEQ");
  const [roundSeconds, setRoundSeconds] = useState(DEFAULT_ROUND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/relay/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), essayType, roundSeconds }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not create the room."); return; }
      localStorage.setItem(`relay-host-${data.code}`, data.hostToken);
      router.push(`/margins/relay/host/${data.code}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalMinutes = Math.round((roundSeconds * RELAY_MOVES.length) / 60);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-5 py-12">
        <img src={RELAY_SPRITES.logo} alt="Relay" className="h-20 w-auto" />
        <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
          Students are shuffled into random teams and write one essay together — but nobody
          writes the whole thing. Each round the essays rotate, so you inherit a teammate&apos;s
          argument and have to build on it. KORA scores every essay on the real AP rubric.
        </p>

        {/* The four moves */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RELAY_MOVES.map((m, i) => (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
              <img src={m.sprite} alt="" className="mx-auto h-14 w-auto" />
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Round {i + 1}
              </p>
              <p className="text-[12px] font-semibold leading-tight text-slate-700">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Prompt */}
        <div className="mt-9">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Essay prompt
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Evaluate the extent to which…"
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => setPrompt(p)}
                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
              >
                Example {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Essay type */}
        <div className="mt-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Rubric</span>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {ESSAY_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setEssayType(t.id)}
                className={[
                  "rounded-xl border px-3 py-2.5 text-center transition",
                  essayType === t.id
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-slate-200 text-slate-500 hover:border-violet-300",
                ].join(" ")}
              >
                <span className="block text-[14px] font-bold">{t.label}</span>
                <span className="block text-[10px] text-slate-400">{t.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Round length */}
        <div className="mt-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Time per round
          </span>
          <div className="mt-1.5 grid grid-cols-5 gap-2">
            {ROUND_SECONDS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setRoundSeconds(s)}
                className={[
                  "rounded-xl border py-2.5 text-[13px] font-semibold transition",
                  roundSeconds === s
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-slate-200 text-slate-500 hover:border-violet-300",
                ].join(" ")}
              >
                {s < 120 ? `${s}s` : `${s / 60}m`}
              </button>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-slate-400">
            <Timer size={12} /> Four rounds ≈ {totalMinutes} minutes of writing, plus grading.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2 rounded-xl bg-slate-50 p-4 text-[12px] text-slate-500">
          <span className="flex items-center gap-2"><Shuffle size={13} className="text-violet-500" /> Teams are randomised when you start — not by join order.</span>
          <span className="flex items-center gap-2"><Users size={13} className="text-violet-500" /> Up to 4 per team. Everyone writes every round.</span>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={create}
          disabled={loading || prompt.trim().length < 15}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-[15px] font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? "Creating room…" : "Create room"}
          {!loading && <ArrowRight size={16} />}
        </button>

        <p className="mt-4 text-center text-[12px] text-slate-400">
          Students join at{" "}
          <Link href="/margins/relay/join" className="font-medium text-violet-600 hover:underline">
            /margins/relay/join
          </Link>
        </p>
      </div>
    </div>
  );
}
