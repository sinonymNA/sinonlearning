"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEMO_QUESTIONS, type CapsuleQuestion } from "@/lib/capsuleData";

interface Me { username: string; role: string; }

const ANSWER_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e"];
const ANSWER_LABELS = ["A", "B", "C", "D"];

export default function CapsuleHostPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Cap Raid");
  const [useDemo, setUseDemo] = useState(true);
  const [customRaw, setCustomRaw] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/capsule/auth/me").then(r => r.json()).then(d => {
      setMe(d.user);
      setLoading(false);
      if (d.user && d.user.role !== "teacher") router.push("/capsule");
      if (!d.user) router.push("/capsule/login");
    });
  }, [router]);

  function parseQuestions(raw: string): CapsuleQuestion[] {
    return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
      const parts = line.split("\t");
      if (parts.length < 5) return null;
      const [prompt, a, b, c, d] = parts;
      return { prompt, choices: [a, b, c, d] as [string, string, string, string], answer: 0, timeLimit: 20 };
    }).filter(Boolean) as CapsuleQuestion[];
  }

  async function createGame() {
    setCreating(true); setError("");
    const questions = useDemo ? DEMO_QUESTIONS : parseQuestions(customRaw);
    if (!useDemo && questions.length < 2) {
      setError("Add at least 2 questions. Format: Question [tab] Correct [tab] Wrong [tab] Wrong [tab] Wrong");
      setCreating(false); return;
    }
    const res = await fetch("/api/capsule/games", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, questions }),
    });
    const data = await res.json() as { code?: string; error?: string };
    if (!res.ok || !data.code) { setError(data.error ?? "Failed to create game."); setCreating(false); return; }
    router.push(`/capsule/host/${data.code}`);
  }

  if (loading) return <div className="min-h-screen bg-[#0c0600]" />;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Link href="/capsule" className="mb-8 inline-block text-xs font-bold uppercase tracking-widest text-orange-400/60 hover:text-orange-400">
        ← Capsule
      </Link>

      <h1 className="mb-8 text-4xl font-black text-white" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.06em" }}>
        HOST A GAME
      </h1>

      <div className="flex flex-col gap-5">
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-orange-400/70">Game title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-orange-400/50" />
        </div>

        {/* Question set */}
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-orange-400/70">Questions</label>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
            <button onClick={() => setUseDemo(true)} className={`rounded-lg py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${useDemo ? "bg-orange-500 text-white" : "text-white/40 hover:text-white/60"}`}>
              Demo Set ({DEMO_QUESTIONS.length}Q)
            </button>
            <button onClick={() => setUseDemo(false)} className={`rounded-lg py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${!useDemo ? "bg-orange-500 text-white" : "text-white/40 hover:text-white/60"}`}>
              Custom
            </button>
          </div>
        </div>

        {!useDemo && (
          <div>
            <p className="mb-2 text-[10px] text-white/35">
              Paste rows: Question [tab] Correct answer [tab] Wrong [tab] Wrong [tab] Wrong
            </p>
            <textarea
              value={customRaw} onChange={e => setCustomRaw(e.target.value)} rows={8}
              placeholder={"What is 2+2?\t4\t3\t5\t6\nWho painted the Mona Lisa?\tLeonardo da Vinci\tMichelangelo\tRaphael\tBotticelli"}
              className="w-full rounded-xl border border-white/10 bg-[#100800] p-4 font-mono text-xs leading-6 text-orange-100/80 outline-none focus:border-orange-400/40"
            />
          </div>
        )}

        {useDemo && (
          <div className="rounded-xl border border-white/8 bg-white/3 p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-orange-400/60">Preview</p>
            <div className="space-y-2">
              {DEMO_QUESTIONS.slice(0, 3).map((q, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 text-[10px] font-black text-white/25">Q{i + 1}</span>
                  <div>
                    <p className="text-xs text-white/70">{q.prompt}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {q.choices.map((c, ci) => (
                        <span key={ci} className={`rounded px-1.5 py-0.5 text-[10px] font-bold`}
                          style={{ background: ci === q.answer ? "#16a34a33" : "rgba(255,255,255,0.05)", color: ci === q.answer ? "#86efac" : "rgba(255,255,255,0.3)" }}>
                          {ANSWER_LABELS[ci]} {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {DEMO_QUESTIONS.length > 3 && <p className="text-[10px] text-white/20">…and {DEMO_QUESTIONS.length - 3} more</p>}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button onClick={createGame} disabled={creating}
          className="rounded-2xl bg-orange-500 py-4 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-orange-400 disabled:opacity-40">
          {creating ? "Creating…" : "Create Game →"}
        </button>
      </div>
    </div>
  );
}
