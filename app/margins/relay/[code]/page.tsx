"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { RELAY_SPRITES, type RelayMove, type RelayCrest } from "@/lib/relayGame";

interface PriorEntry {
  round: number;
  move: RelayMove;
  text: string;
  authorName: string;
}
interface Assignment {
  essayOwnerId: string;
  essayOwnerName: string;
  isOwnEssay: boolean;
  move: RelayMove;
  prior: PriorEntry[];
  text: string;
}
interface Me {
  id: string;
  name: string;
  seat: number | null;
  team: { id: string; index: number; crest: RelayCrest } | null;
  teammates: { id: string; name: string; seat: number }[];
  assignment: Assignment | null;
}
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
  me: Me | null;
  results: {
    essays: {
      essayOwnerId: string;
      ownerName: string;
      teamId: string;
      chain: PriorEntry[];
      score: { categories: { category: string; earned: number; possible: number; reason: string }[]; total: number; possible: number; standout: string; perfect: boolean } | null;
    }[];
    leaderboard: { teamId: string; crest: RelayCrest; members: { id: string; name: string }[]; total: number; possible: number; perfectCount: number }[];
  } | null;
}

export default function RelayPlayPage() {
  const { code } = useParams<{ code: string }>();
  const [state, setState] = useState<State | null>(null);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const tokenRef = useRef<string | null>(null);
  const roundRef = useRef(0);
  const dirtyRef = useRef(false);

  if (tokenRef.current === null && typeof window !== "undefined") {
    tokenRef.current = localStorage.getItem(`relay-student-${code}`);
  }

  const fetchState = useCallback(async () => {
    const token = tokenRef.current;
    const url = `/api/relay/sessions/${code}${token ? `?studentToken=${token}` : ""}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data: State = await res.json();
      setState(data);

      // On a round change, adopt the server's text for the new assignment and
      // drop any unsaved local edits from the round that just ended — they
      // belonged to a different essay.
      if (data.round !== roundRef.current) {
        roundRef.current = data.round;
        setText(data.me?.assignment?.text ?? "");
        dirtyRef.current = false;
        setSaved(false);
      }
    } catch { /* transient — the next poll will catch up */ }
  }, [code]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState]);

  // Autosave. Debounced so typing doesn't hammer the route, and it always
  // flushes on round end because the server rejects a save aimed at a stale
  // round anyway.
  useEffect(() => {
    if (!dirtyRef.current || state?.status !== "writing") return;
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/relay/sessions/${code}/entry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentToken: tokenRef.current, text, round: roundRef.current }),
        });
        if (res.ok) { dirtyRef.current = false; setSaved(true); setTimeout(() => setSaved(false), 1600); }
      } catch { /* retried on next keystroke */ }
    }, 700);
    return () => clearTimeout(id);
  }, [text, code, state?.status]);

  // Countdown derived from the server's round start, so a refresh or a late
  // join shows the true remaining time instead of a full clock.
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

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-violet-400" />
      </div>
    );
  }

  const crest = state.me?.team?.crest;
  const mmss = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const urgent = secondsLeft <= 20 && secondsLeft > 0;

  // ── Lobby ─────────────────────────────────────────────────────────────────
  if (state.status === "lobby") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <img src={RELAY_SPRITES.logo} alt="Relay" className="h-14 w-auto" />
        <img src={RELAY_SPRITES.timer} alt="" className="mt-8 h-24 w-auto animate-pulse" />
        <p className="mt-6 text-[17px] font-semibold text-slate-800">You&apos;re in.</p>
        <p className="mt-1 text-[14px] text-slate-400">
          Waiting for your teacher to start — teams are drawn at random when they do.
        </p>
        <p className="mt-6 text-[13px] text-slate-400">
          {state.playerCount} {state.playerCount === 1 ? "player" : "players"} in the room
        </p>
      </div>
    );
  }

  // ── Grading ───────────────────────────────────────────────────────────────
  if (state.status === "grading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <img src={RELAY_SPRITES.pencil} alt="" className="h-24 w-auto" />
        <Loader2 className="mt-6 animate-spin text-violet-400" />
        <p className="mt-4 text-[17px] font-semibold text-slate-800">KORA is reading every essay.</p>
        <p className="mt-1 text-[14px] text-slate-400">Scores are coming up on the board.</p>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (state.status === "results") {
    const mine = state.results?.essays.find((e) => e.essayOwnerId === state.me?.id);
    const myTeam = state.results?.leaderboard.find((t) => t.teamId === state.me?.team?.id);
    const rank = state.results?.leaderboard.findIndex((t) => t.teamId === state.me?.team?.id) ?? -1;
    return (
      <div className="min-h-screen bg-white px-5 py-10">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            {crest && <img src={crest.sprite} alt="" className="mx-auto h-20 w-auto" />}
            <p className="mt-3 text-[13px] font-bold uppercase tracking-widest text-slate-400">
              Team {crest?.name}
            </p>
            {myTeam && (
              <p className="mt-1 text-[34px] font-bold leading-none text-slate-900">
                {myTeam.total}
                <span className="text-[18px] font-semibold text-slate-400"> / {myTeam.possible}</span>
              </p>
            )}
            {/* Top mark has to be earned, not just placed first — a lone team
                on 0 points is not a winner. */}
            {rank === 0 && (myTeam?.total ?? 0) > 0 && (
              <img src={RELAY_SPRITES.topMark} alt="Top mark" className="mx-auto mt-3 h-20 w-auto" />
            )}
            {rank > 0 && <p className="mt-1 text-[13px] text-slate-400">Rank #{rank + 1}</p>}
          </div>

          {mine?.score && (
            <div className="mt-8">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Your essay
              </p>
              {mine.score.perfect && (
                <img src={RELAY_SPRITES.perfect} alt="Perfect" className="mt-2 h-16 w-auto" />
              )}
              <div className="mt-3 flex flex-col gap-2">
                {mine.score.categories.map((c) => (
                  <div key={c.category} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                    <img
                      src={c.earned > 0 ? RELAY_SPRITES.earned : RELAY_SPRITES.missed}
                      alt={c.earned > 0 ? "Earned" : "Missed"}
                      className="h-9 w-9 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800">
                        {c.category}{" "}
                        <span className="text-slate-400">{c.earned}/{c.possible}</span>
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{c.reason}</p>
                    </div>
                  </div>
                ))}
              </div>

              {mine.chain.length > 0 && (
                <div className="mt-6">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Who wrote what
                  </p>
                  <div className="mt-2 flex flex-col gap-3">
                    {mine.chain.map((s) => (
                      <div key={s.round} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: s.move.accent }}>
                          {s.move.label} · {s.authorName}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
                          {s.text || <span className="italic text-slate-300">left blank</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Writing ───────────────────────────────────────────────────────────────
  const a = state.me?.assignment;
  if (!a) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <img src={RELAY_SPRITES.timer} alt="" className="h-20 w-auto" />
        <p className="mt-5 text-[15px] text-slate-500">
          Waiting for your next hand-off…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Round header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-2.5">
          <img src={a.move.sprite} alt="" className="h-9 w-auto shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Round {state.round} of {state.totalRounds}
            </p>
            <p className="truncate text-[14px] font-bold leading-tight" style={{ color: a.move.accent }}>
              {a.move.label}
            </p>
          </div>
          <div
            className={[
              "shrink-0 rounded-lg px-2.5 py-1 font-mono text-[17px] font-bold tabular-nums",
              urgent ? "animate-pulse bg-red-50 text-red-600" : "bg-slate-100 text-slate-600",
            ].join(" ")}
          >
            {mmss}
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full transition-[width] duration-500 ease-linear"
            style={{
              width: `${Math.max(0, Math.min(100, (secondsLeft / state.roundSeconds) * 100))}%`,
              background: urgent ? "#dc2626" : a.move.accent,
            }}
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-4">
        {/* Prompt */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Prompt</p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-slate-700">{state.prompt}</p>
        </div>

        {/* The hand-off */}
        <div className="mt-5 flex items-center gap-2.5">
          <img src={RELAY_SPRITES.baton} alt="" className="h-11 w-auto" />
          <p className="text-[13px] leading-snug text-slate-500">
            {a.isOwnEssay ? (
              <>You&apos;re starting <span className="font-semibold text-slate-700">your own</span> essay.</>
            ) : (
              <>You picked up <span className="font-semibold text-slate-700">{a.essayOwnerName}</span> essay. Build on it — don&apos;t restart it.</>
            )}
          </p>
        </div>

        {/* What you inherited */}
        {a.prior.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {a.prior.map((p) => (
              <div key={p.round} className="rounded-xl border-l-2 bg-slate-50 py-2.5 pl-3 pr-3" style={{ borderColor: p.move.accent }}>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: p.move.accent }}>
                  {p.move.label} · {p.authorName}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-600">
                  {p.text || <span className="italic text-slate-300">left blank — you&apos;re working without it</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Your brief */}
        <div className="mt-5 rounded-xl p-3.5" style={{ background: `${a.move.accent}12` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: a.move.accent }}>
            Your job — {a.move.subtitle}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{a.move.brief}</p>
        </div>

        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); dirtyRef.current = true; }}
          disabled={secondsLeft === 0}
          rows={9}
          placeholder={`Write the ${a.move.label.toLowerCase()}…`}
          className="mt-3 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-400"
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">
            {secondsLeft === 0 ? "Time — your work is saved." : `${text.trim().split(/\s+/).filter(Boolean).length} words`}
          </span>
          {saved && (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <Check size={11} /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
