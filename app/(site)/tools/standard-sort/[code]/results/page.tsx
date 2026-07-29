"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ListChecks, Flag, Check, Copy, RotateCcw, Users } from "lucide-react";

interface UnitCount { unit: string; count: number; pct: number }
interface StandardTally {
  id: string; code: string | null; text: string;
  respondentCount: number; unitCounts: UnitCount[];
  fullAgreement: boolean; needsDiscussion: boolean;
}
interface Results {
  totalParticipants: number; finishedParticipants: number; standardCount: number;
  standards: StandardTally[];
}
interface State {
  code: string; title: string; units: string[];
  standards: { id: string }[]; results: Results | null;
}

export default function StandardSortResultsPage() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<State | null>(null);
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const hostToken = useRef<string | null>(null);

  if (hostToken.current === null && typeof window !== "undefined") {
    hostToken.current = localStorage.getItem(`standard-sort-host-${code}`);
  }

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/standard-sort/sessions/${code}?results=1`);
      if (!res.ok) return;
      setState(await res.json());
    } catch { /* next poll retries */ }
  }, [code]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 3000);
    return () => clearInterval(id);
  }, [fetchState]);

  function copyLink() {
    const url = `${window.location.origin}/tools/standard-sort/join?code=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  async function reset() {
    if (!hostToken.current) return;
    if (!window.confirm("This clears every response and participant for this session so it can be run again. This can't be undone. Continue?")) return;
    setResetting(true);
    try {
      await fetch(`/api/standard-sort/sessions/${code}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostToken: hostToken.current }),
      });
      await fetchState();
    } finally {
      setResetting(false);
    }
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-400" />
      </div>
    );
  }

  const r = state.results;
  // Disagreements surfaced first — that's the whole point of doing this as a
  // team rather than one person deciding, and it's what the meeting should
  // spend its time on.
  const flagged = r?.standards.filter((s) => s.needsDiscussion) ?? [];
  const rest = r?.standards.filter((s) => !s.needsDiscussion) ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-5 py-10">
        {/* Header + share */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ListChecks className="text-indigo-600" size={20} />
              <h1 className="text-[20px] font-bold text-slate-900">{state.title}</h1>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-400">
              <Users size={13} />
              {r ? `${r.finishedParticipants} of ${r.totalParticipants} finished` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-600 transition hover:border-indigo-300"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copied ? "Copied" : `Copy join link · ${code}`}
            </button>
            {hostToken.current && (
              <button
                onClick={reset}
                disabled={resetting}
                className="flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-40"
              >
                <RotateCcw size={13} /> {resetting ? "Resetting…" : "Reset"}
              </button>
            )}
          </div>
        </div>

        <Link
          href={`/tools/standard-sort/${code}`}
          className="mt-4 inline-block text-[13px] font-medium text-indigo-600 hover:underline"
        >
          Do your own sort →
        </Link>

        {r && r.totalParticipants === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-[14px] text-slate-400">
              Nobody has joined yet. Share the code above with your team.
            </p>
          </div>
        )}

        {/* Needs discussion */}
        {flagged.length > 0 && (
          <div className="mt-8">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-600">
              <Flag size={12} /> Needs discussion ({flagged.length})
            </p>
            <div className="mt-2.5 flex flex-col gap-3">
              {flagged.map((s) => (
                <StandardCard key={s.id} standard={s} />
              ))}
            </div>
          </div>
        )}

        {/* Everything else */}
        {rest.length > 0 && (
          <div className="mt-8">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {flagged.length > 0 ? "Agreed" : "Standards"} ({rest.length})
            </p>
            <div className="mt-2.5 flex flex-col gap-3">
              {rest.map((s) => (
                <StandardCard key={s.id} standard={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StandardCard({ standard }: { standard: StandardTally }) {
  const top = standard.unitCounts[0];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {standard.code && (
            <p className="font-mono text-[11.5px] font-semibold text-indigo-500">{standard.code}</p>
          )}
          <p className="text-[14.5px] font-medium leading-snug text-slate-800">{standard.text}</p>
        </div>
        <div className="shrink-0 text-right">
          {standard.fullAgreement && standard.respondentCount > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
              <Check size={11} /> Full agreement
            </span>
          ) : standard.needsDiscussion ? (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
              <Flag size={11} /> Split
            </span>
          ) : null}
          <p className="mt-1 text-[11px] text-slate-400">
            {standard.respondentCount} response{standard.respondentCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {standard.respondentCount > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {standard.unitCounts.map((u) => (
            <div key={u.unit} className="flex items-start gap-2.5">
              {/* Wraps rather than truncates — a hidden unit name in a
                  results-review meeting is worse than an uneven row height,
                  and several of the 8 given names run past 30 characters. */}
              <span
                className={[
                  "w-36 shrink-0 pt-0.5 text-[12.5px] leading-snug sm:w-44",
                  u.unit === top?.unit && u.count > 0 ? "font-semibold text-slate-800" : "text-slate-500",
                ].join(" ")}
              >
                {u.unit}
              </span>
              <span className="mt-1.5 h-2 flex-1 shrink-0 overflow-hidden rounded-full bg-slate-100">
                <span
                  className={u.unit === top?.unit ? "block h-full rounded-full bg-indigo-500" : "block h-full rounded-full bg-slate-300"}
                  style={{ width: `${Math.max(u.count > 0 ? 4 : 0, u.pct)}%` }}
                />
              </span>
              <span className="mt-1.5 w-8 shrink-0 text-right text-[11px] tabular-nums text-slate-400">{u.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
