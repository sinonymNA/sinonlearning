"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { GameSession } from "@/lib/koraGame";

const LEVEL_BG: Record<string, string> = {
  "Not Yet Shown": "bg-rose-400",
  "Emerging": "bg-amber-400",
  "Solid": "bg-blue-400",
  "Strong": "bg-green-400",
};

const LEVEL_TEXT: Record<string, string> = {
  "Not Yet Shown": "text-rose-900",
  "Emerging": "text-amber-900",
  "Solid": "text-blue-900",
  "Strong": "text-green-900",
};

interface StudentCard {
  id: string;
  name: string;
  totalPoints: number;
  latestLevel: string;
  roundsDone: number;
}

interface Props {
  code: string;
}

export default function KoraGameHost({ code }: Props) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch(`/api/kora-game/${code}/state`, { cache: "no-store" });
        if (!res.ok) { setError("Game not found."); return; }
        const { session: s } = await res.json();
        if (active) setSession(s);
      } catch {
        // silently ignore transient failures
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [code]);

  async function copyPlayerLink() {
    await navigator.clipboard.writeText(window.location.origin + `/game/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-navy-700">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-navy-400" />
      </div>
    );
  }

  const students: StudentCard[] = Object.values(session.students).map((s) => {
    const latestResponse = s.responses[s.responses.length - 1];
    return {
      id: s.id,
      name: s.name,
      totalPoints: s.totalPoints,
      latestLevel: latestResponse?.understandingLevel || "—",
      roundsDone: s.responses.length,
    };
  });

  const levelCounts: Record<string, number> = {
    "Strong": 0,
    "Solid": 0,
    "Emerging": 0,
    "Not Yet Shown": 0,
  };
  for (const s of students) {
    if (s.latestLevel in levelCounts) levelCounts[s.latestLevel]++;
  }

  return (
    <div className="min-h-screen bg-navy-950 px-4 py-6 text-white">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/40">KORA Game</p>
          <h1 className="font-display text-2xl">{session.concept}</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-2 text-center">
            <p className="text-xs text-white/50">Game code</p>
            <p className="font-display text-2xl font-bold tracking-widest">{code}</p>
          </div>
          <button
            type="button"
            onClick={copyPlayerLink}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white/80 transition hover:bg-white/20"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap gap-3">
        {Object.entries(levelCounts).map(([level, count]) => (
          <div key={level} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5">
            <span className={`h-3 w-3 rounded-full ${LEVEL_BG[level] ?? "bg-gray-400"}`} />
            <span className="text-sm text-white/70">{level}</span>
            <span className="text-sm font-bold text-white">{count}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5">
          <span className="text-sm text-white/70">Students</span>
          <span className="text-sm font-bold text-white">{students.length}</span>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="mb-2 text-white/60">Waiting for students to join…</p>
          <p className="text-sm text-white/40">
            Share code <span className="font-bold text-white">{code}</span> at{" "}
            <span className="text-white/70">/game/{code}</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {students.map((s) => {
            const bg = LEVEL_BG[s.latestLevel] ?? "bg-white/10";
            const textColor = LEVEL_TEXT[s.latestLevel] ?? "text-white";
            const isAnswered = s.latestLevel !== "—";
            return (
              <div
                key={s.id}
                className={`rounded-2xl p-4 transition ${isAnswered ? bg : "bg-white/8 border border-white/10"}`}
              >
                <p className={`mb-1 truncate text-sm font-semibold ${isAnswered ? textColor : "text-white"}`}>
                  {s.name}
                </p>
                <p className={`text-xs ${isAnswered ? textColor + "/80" : "text-white/40"}`}>
                  {isAnswered ? s.latestLevel : "waiting…"}
                </p>
                <p className={`mt-2 text-lg font-bold ${isAnswered ? textColor : "text-white/30"}`}>
                  {s.totalPoints} pts
                </p>
                <p className={`text-xs ${isAnswered ? textColor + "/60" : "text-white/30"}`}>
                  Round {s.roundsDone}/{session.rounds.length}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
