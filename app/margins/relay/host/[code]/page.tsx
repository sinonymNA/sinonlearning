"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Play, ArrowRight, Sparkles } from "lucide-react";
import { RELAY_SPRITES, RELAY_MOVES, type RelayMove, type RelayCrest } from "@/lib/relayGame";

interface State {
  code: string;
  prompt: string;
  status: "lobby" | "writing" | "grading" | "results";
  round: number;
  totalRounds: number;
  move: RelayMove | null;
  roundSeconds: number;
  roundStartedAt: string | null;
  playerCount: number;
  lobbyPlayers: { id: string; name: string }[];
  teams: { id: string; index: number; crest: RelayCrest; members: { id: string; name: string; seat: number }[] }[];
  writtenThisRound: number;
  essayCount: number;
  results: {
    essays: {
      essayOwnerId: string; ownerName: string; teamId: string;
      chain: { round: number; move: RelayMove; text: string; authorName: string }[];
      score: { categories: { category: string; earned: number; possible: number; reason: string }[]; total: number; possible: number; standout: string; perfect: boolean } | null;
    }[];
    leaderboard: { teamId: string; crest: RelayCrest; members: { id: string; name: string }[]; total: number; possible: number; perfectCount: number }[];
  } | null;
}

export default function RelayHostPage() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<State | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(0);
  const hostToken = useRef<string | null>(null);

  if (hostToken.current === null && typeof window !== "undefined") {
    hostToken.current = localStorage.getItem(`relay-host-${code}`);
  }

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/relay/sessions/${code}`);
      if (!res.ok) return;
      setState(await res.json());
    } catch { /* next poll retries */ }
  }, [code]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState]);

  useEffect(() => {
    if (state?.status !== "writing" || !state.roundStartedAt) { setSecondsLeft(0); return; }
    const tick = () => {
      const elapsed = (Date.now() - new Date(state.roundStartedAt!).getTime()) / 1000;
      setSecondsLeft(Math.max(0, Math.round(state.roundSeconds - elapsed)));
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [state?.status, state?.roundStartedAt, state?.roundSeconds]);

  // Reveal the leaderboard one team at a time, slowest-first, so the room gets
  // a countdown to the winner instead of the whole board at once.
  useEffect(() => {
    if (state?.status !== "results" || !state.results) return;
    const n = state.results.leaderboard.length;
    if (revealed >= n) return;
    const id = setTimeout(() => setRevealed((r) => r + 1), revealed === 0 ? 600 : 1400);
    return () => clearTimeout(id);
  }, [state?.status, state?.results, revealed]);

  async function post(path: string, body: Record<string, unknown> = {}) {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/relay/sessions/${code}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostToken: hostToken.current, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? "Something went wrong.");
      await fetchState();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="animate-spin text-violet-300" />
      </div>
    );
  }

  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const lastRound = state.round >= state.totalRounds;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* ── Lobby ───────────────────────────────────────────────────────── */}
        {state.status === "lobby" && (
          <div className="text-center">
            <img src={RELAY_SPRITES.logo} alt="Relay" className="mx-auto h-16 w-auto brightness-0 invert" />
            <p className="mt-8 text-[13px] font-bold uppercase tracking-[0.3em] text-slate-400">
              Join at margins · relay · join
            </p>
            <p className="mt-3 font-mono text-[86px] font-bold leading-none tracking-[0.12em] text-white">
              {state.code}
            </p>

            <p className="mt-8 text-[15px] text-slate-300">
              {state.playerCount} {state.playerCount === 1 ? "player" : "players"} in the room
            </p>
            <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
              {state.lobbyPlayers.map((p) => (
                <span key={p.id} className="rounded-full bg-slate-800 px-3.5 py-1.5 text-[13px] text-slate-200">
                  {p.name}
                </span>
              ))}
            </div>

            <button
              onClick={() => post("start")}
              disabled={busy || state.playerCount < 2}
              className="mx-auto mt-10 flex items-center gap-2 rounded-2xl bg-violet-600 px-8 py-4 text-[16px] font-semibold shadow-lg shadow-violet-900/40 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
            >
              <Play size={17} /> Draw teams & start
            </button>
            {state.playerCount < 2 && (
              <p className="mt-3 text-[12px] text-slate-500">At least 2 players needed to relay.</p>
            )}
          </div>
        )}

        {/* ── Writing ─────────────────────────────────────────────────────── */}
        {state.status === "writing" && state.move && (
          <>
            <div className="flex items-center gap-5">
              <img src={state.move.sprite} alt="" className="h-20 w-auto" />
              <div className="flex-1">
                <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-slate-400">
                  Round {state.round} of {state.totalRounds}
                </p>
                <h1 className="text-[38px] font-bold leading-tight">{state.move.label}</h1>
                <p className="text-[15px] text-slate-400">{state.move.subtitle}</p>
              </div>
              <div className="text-right">
                <p
                  className={[
                    "font-mono text-[64px] font-bold leading-none tabular-nums",
                    secondsLeft <= 20 ? "animate-pulse text-red-400" : "text-white",
                  ].join(" ")}
                >
                  {mmss}
                </p>
                <p className="mt-1 text-[13px] text-slate-400">
                  {state.writtenThisRound} / {state.essayCount} writing
                </p>
              </div>
            </div>

            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full transition-[width] duration-500 ease-linear"
                style={{
                  width: `${Math.max(0, Math.min(100, (secondsLeft / state.roundSeconds) * 100))}%`,
                  background: secondsLeft <= 20 ? "#f87171" : state.move.accent,
                }}
              />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-800/60 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Prompt</p>
              <p className="mt-1.5 text-[17px] leading-relaxed text-slate-100">{state.prompt}</p>
            </div>

            {/* Round map — where the baton sits */}
            <div className="mt-6 grid grid-cols-4 gap-3">
              {RELAY_MOVES.map((m, i) => {
                const done = i + 1 < state.round;
                const now = i + 1 === state.round;
                return (
                  <div
                    key={m.id}
                    className={[
                      "rounded-xl border p-3 text-center transition",
                      now ? "border-white/40 bg-white/10" : done ? "border-slate-700 bg-slate-800/40 opacity-60" : "border-slate-800 opacity-30",
                    ].join(" ")}
                  >
                    <img src={m.sprite} alt="" className="mx-auto h-10 w-auto" />
                    <p className="mt-1.5 text-[11px] font-semibold text-slate-300">{m.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => post("advance")}
                disabled={busy}
                className="flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-[15px] font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-40"
              >
                {lastRound ? "Finish & grade" : "Next round"} <ArrowRight size={16} />
              </button>
              {lastRound && (
                <button
                  onClick={() => post("grade")}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-2xl bg-violet-600 px-7 py-3.5 text-[15px] font-semibold transition hover:bg-violet-500 disabled:opacity-40"
                >
                  <Sparkles size={16} /> Grade now
                </button>
              )}
            </div>

            {/* Teams */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {state.teams.map((t) => (
                <div key={t.id} className="rounded-xl bg-slate-800/50 p-3 text-center">
                  <img src={t.crest.sprite} alt="" className="mx-auto h-12 w-auto" />
                  <p className="mt-1.5 text-[12px] font-bold text-slate-200">{t.crest.name}</p>
                  <p className="text-[11px] leading-snug text-slate-500">
                    {t.members.map((m) => m.name).join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Grading ─────────────────────────────────────────────────────── */}
        {state.status === "grading" && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <img src={RELAY_SPRITES.pencil} alt="" className="h-28 w-auto" />
            <Loader2 className="mt-7 animate-spin text-violet-300" size={30} />
            <p className="mt-5 text-[24px] font-bold">KORA is grading every essay</p>
            <p className="mt-1.5 text-[15px] text-slate-400">
              {state.essayCount} essays against the real {state.prompt ? "AP" : ""} rubric — this takes a moment.
            </p>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {state.status === "results" && state.results && (
          <div>
            <h1 className="text-center text-[15px] font-bold uppercase tracking-[0.3em] text-slate-400">
              Final standings
            </h1>
            <div className="mx-auto mt-7 flex max-w-3xl flex-col gap-3">
              {[...state.results.leaderboard]
                .slice(0, Math.max(0, revealed))
                .reverse()
                .map((t) => {
                  const place = state.results!.leaderboard.findIndex((x) => x.teamId === t.teamId);
                  return (
                    <div
                      key={t.teamId}
                      className={[
                        "flex items-center gap-4 rounded-2xl p-4 transition",
                        place === 0 ? "bg-white text-slate-900" : "bg-slate-800",
                      ].join(" ")}
                    >
                      <span className={["w-8 text-center font-mono text-[22px] font-bold", place === 0 ? "text-slate-400" : "text-slate-500"].join(" ")}>
                        {place + 1}
                      </span>
                      <img src={t.crest.sprite} alt="" className="h-14 w-auto" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[17px] font-bold">{t.crest.name}</p>
                        <p className={["truncate text-[12px]", place === 0 ? "text-slate-500" : "text-slate-400"].join(" ")}>
                          {t.members.map((m) => m.name).join(" · ")}
                        </p>
                      </div>
                      {t.perfectCount > 0 && (
                        <img src={RELAY_SPRITES.perfect} alt="Perfect essay" className="h-11 w-auto" />
                      )}
                      {place === 0 && t.total > 0 && revealed >= state.results!.leaderboard.length && (
                        <img src={RELAY_SPRITES.topMark} alt="Top mark" className="h-14 w-auto" />
                      )}
                      <p className="font-mono text-[26px] font-bold tabular-nums">
                        {t.total}
                        <span className={["text-[15px]", place === 0 ? "text-slate-400" : "text-slate-500"].join(" ")}>/{t.possible}</span>
                      </p>
                    </div>
                  );
                })}
            </div>

            {/* Standout lines — the part worth reading aloud */}
            {revealed >= state.results.leaderboard.length && (
              <div className="mx-auto mt-10 max-w-3xl">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Lines worth reading out
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {state.results.essays
                    .filter((e) => e.score?.standout)
                    .slice(0, 5)
                    .map((e) => (
                      <div key={e.essayOwnerId} className="rounded-xl bg-slate-800/60 p-3.5">
                        <p className="text-[14px] italic leading-relaxed text-slate-200">
                          &ldquo;{e.score!.standout}&rdquo;
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">{e.ownerName}&apos;s essay</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-6 max-w-lg rounded-xl bg-red-500/15 px-4 py-3 text-center text-[13px] text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
