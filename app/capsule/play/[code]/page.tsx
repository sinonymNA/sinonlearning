"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CapIcon from "@/components/capsule/CapIcon";
import type { ChestResult } from "@/lib/capsuleData";

const ANSWER_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e"];
const ANSWER_LABELS = ["A", "B", "C", "D"];

interface Player { id: string; displayName: string; capId: string; gold: number; hasAnswered: boolean; }
interface GameState {
  code: string; title: string; status: string; currentQuestion: number; totalQuestions: number;
  questionStartedAt: string | null;
  currentQuestionData: { prompt: string; choices: string[]; timeLimit: number } | null;
  players: Player[]; myPlayerId: string | null;
  myAnswer: { answerIndex: number; isCorrect: boolean; chestResult: ChestResult | null } | null;
}

type JoinPhase = "form" | "joined";

export default function PlayerScreen() {
  const { code } = useParams<{ code: string }>();
  const [joinPhase, setJoinPhase] = useState<JoinPhase>("form");
  const [displayName, setDisplayName] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [capId, setCapId] = useState("cap-fox");
  const [game, setGame] = useState<GameState | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [timer, setTimer] = useState(20);
  const [chestOpen, setChestOpen] = useState(false);
  const prevQuestion = useRef(-1);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/capsule/games/${code}`);
    if (res.ok) {
      const data = await res.json() as GameState;
      setGame(data);

      // Reset chest animation on new question
      if (data.currentQuestion !== prevQuestion.current) {
        prevQuestion.current = data.currentQuestion;
        setChestOpen(false);
        setTimer(data.currentQuestionData?.timeLimit ?? 20);
      }
    }
  }, [code]);

  useEffect(() => {
    // Try to restore session from localStorage
    const saved = localStorage.getItem(`capsule-player-${code}`);
    if (saved) {
      const { pid, name, cap } = JSON.parse(saved) as { pid: string; name: string; cap: string };
      setPlayerId(pid); setDisplayName(name); setCapId(cap);
      setJoinPhase("joined");
    }

    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState, code]);

  // Client-side countdown (decorative — host controls actual pacing)
  useEffect(() => {
    if (!game?.currentQuestionData || game.myAnswer) return;
    const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [game?.currentQuestion, game?.myAnswer]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true); setJoinError("");
    const res = await fetch(`/api/capsule/games/${code}/join`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
    const data = await res.json() as { playerId?: string; capId?: string; error?: string };
    setJoining(false);
    if (!res.ok || !data.playerId) { setJoinError(data.error ?? "Failed to join."); return; }
    setPlayerId(data.playerId);
    setCapId(data.capId ?? "cap-fox");
    localStorage.setItem(`capsule-player-${code}`, JSON.stringify({ pid: data.playerId, name: displayName, cap: data.capId ?? "cap-fox" }));
    setJoinPhase("joined");
    await fetchState();
  }

  async function submitAnswer(answerIndex: number) {
    if (!playerId || game?.myAnswer) return;
    await fetch(`/api/capsule/games/${code}/answer`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, answerIndex }),
    });
    await fetchState();
  }

  // ── Join form ──────────────────────────────────────────────────────────────

  if (joinPhase === "form") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <Link href="/capsule" className="mb-8 text-2xl font-black text-orange-400" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.08em" }}>
          CAPSULE
        </Link>
        <div className="mb-4 rounded-2xl border border-orange-400/20 bg-orange-400/8 px-8 py-3 font-mono text-3xl font-black tracking-[0.2em] text-orange-300">
          {code}
        </div>
        <form onSubmit={join} className="flex w-full max-w-xs flex-col gap-3">
          <input
            value={displayName} onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name" maxLength={24} required autoFocus
            className="rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-orange-400/50"
          />
          {joinError && <p className="text-center text-xs text-red-400">{joinError}</p>}
          <button type="submit" disabled={joining || !displayName.trim()}
            className="rounded-xl bg-orange-500 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-400 disabled:opacity-40">
            {joining ? "Joining…" : "Join Game"}
          </button>
        </form>
      </div>
    );
  }

  if (!game) return <div className="min-h-screen bg-[#06163E]" />;

  const myPlayer = game.players.find(p => p.id === playerId);
  const leaderboard = [...game.players].sort((a, b) => b.gold - a.gold);

  // ── Waiting for game to start ─────────────────────────────────────────────

  if (game.status === "waiting") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
        <CapIcon capId={capId} size={80} />
        <p className="mt-4 text-lg font-bold text-white">{displayName}</p>
        <p className="mt-6 text-sm text-white/40">Waiting for the teacher to start…</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {game.players.filter(p => p.id !== playerId).map(p => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <CapIcon capId={p.capId} size={32} />
              <span className="text-[10px] text-white/30">{p.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Game ended ────────────────────────────────────────────────────────────

  if (game.status === "ended") {
    const myRank = leaderboard.findIndex(p => p.id === playerId) + 1;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-orange-400/60">
          {myRank === 1 ? "🏆 YOU WON!" : `#${myRank} Place`}
        </p>
        <h2 className="mb-1 text-6xl text-white" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.06em" }}>
          GAME OVER
        </h2>
        <p className="mb-8 flex items-center gap-2 text-xl font-black text-yellow-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 24, height: 24, objectFit: "contain" }} />
          {myPlayer?.gold ?? 0} gold
        </p>
        <div className="w-full max-w-xs space-y-2">
          {leaderboard.slice(0, 5).map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${p.id === playerId ? "border border-orange-400/30 bg-orange-400/10" : "border border-white/8 bg-white/4"}`}>
              <span className="w-5 text-xs font-black text-white/25">#{i + 1}</span>
              <CapIcon capId={p.capId} size={28} />
              <span className="flex-1 text-sm font-bold text-white">{p.displayName}</span>
              <span className="flex items-center gap-1 text-sm font-black text-yellow-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 14, height: 14, objectFit: "contain" }} />
                {p.gold}
              </span>
            </div>
          ))}
        </div>
        <Link href="/capsule" className="mt-8 rounded-xl border border-white/12 px-6 py-3 text-xs font-bold text-white/60 hover:bg-white/5">
          Back to Capsule
        </Link>
      </div>
    );
  }

  // ── Active game ───────────────────────────────────────────────────────────

  const q = game.currentQuestionData;
  const answered = !!game.myAnswer;
  const timerPct = (timer / (q?.timeLimit ?? 20)) * 100;
  const timerColor = timer > 8 ? "#22c55e" : timer > 4 ? "#eab308" : "#ef4444";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-2">
        <div className="flex items-center gap-2">
          <CapIcon capId={capId} size={28} />
          <span className="text-xs font-bold text-white/70">{displayName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-black text-yellow-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 18, height: 18, objectFit: "contain" }} />
          {myPlayer?.gold ?? 0}
        </div>
        <span className="text-[10px] text-white/25">Q{game.currentQuestion + 1}/{game.totalQuestions}</span>
      </div>

      {/* Timer bar */}
      <div className="h-1 bg-white/8">
        <div className="h-full transition-all" style={{ width: `${timerPct}%`, background: timerColor, transition: "width 1s linear" }} />
      </div>

      <div className="flex flex-1 flex-col px-4 py-6">
        {q && (
          <>
            {/* Question */}
            <div className="mb-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400/50">
                  {answered ? "Waiting for others…" : "Answer now"}
                </span>
                {!answered && (
                  <span className="text-lg font-black tabular-nums" style={{ color: timerColor }}>{timer}s</span>
                )}
              </div>
              <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
                {q.prompt}
              </h2>
            </div>

            {/* Answer buttons */}
            {!answered ? (
              <div className="grid grid-cols-2 gap-3">
                {q.choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => submitAnswer(i)}
                    className="flex min-h-[90px] flex-col items-start gap-2 rounded-2xl border-2 border-transparent p-4 text-left text-white active:scale-95"
                    style={{ background: ANSWER_COLORS[i] }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{ANSWER_LABELS[i]}</span>
                    <span className="text-sm font-semibold leading-snug">{choice}</span>
                  </button>
                ))}
              </div>
            ) : (
              /* Post-answer: chest or X */
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                {game.myAnswer?.isCorrect ? (
                  <>
                    {!chestOpen ? (
                      <button
                        onClick={() => setChestOpen(true)}
                        className="flex flex-col items-center gap-3 rounded-3xl border border-yellow-400/30 bg-yellow-400/10 px-10 py-8 transition-transform hover:scale-105 active:scale-95"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/capsule/chest-closed.png" alt="chest" style={{ width: 96, height: 96, objectFit: "contain" }} />
                        <span className="text-xs font-black uppercase tracking-widest text-yellow-300">Tap to open!</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-3 rounded-3xl border border-orange-400/30 bg-orange-400/10 px-10 py-8">
                        {game.myAnswer.chestResult?.type === "gold" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src="/assets/capsule/chest-open.png" alt="chest open" style={{ width: 96, height: 96, objectFit: "contain" }} />
                        ) : (
                          <span className="text-5xl">
                            {game.myAnswer.chestResult?.type === "steal" ? "🗡️" :
                             game.myAnswer.chestResult?.type === "lose" ? "💀" :
                             game.myAnswer.chestResult?.type === "double" ? "🔥" : "✨"}
                          </span>
                        )}
                        <p className="text-lg font-black text-white">
                          {game.myAnswer.chestResult?.label ?? "Reward!"}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-white/30">Waiting for the teacher to advance…</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <span className="text-5xl">❌</span>
                    <p className="text-sm font-bold text-red-400">Wrong answer</p>
                    <p className="text-xs text-white/30">Waiting for next question…</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mini leaderboard */}
      <div className="border-t border-white/8 px-4 py-3">
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/20">Leaderboard</p>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {leaderboard.slice(0, 8).map((p, i) => (
            <div key={p.id} className={`flex flex-col items-center gap-1 ${p.id === playerId ? "opacity-100" : "opacity-50"}`}>
              <CapIcon capId={p.capId} size={28} />
              <span className="flex items-center gap-0.5 text-[9px] text-white/50 whitespace-nowrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 10, height: 10, objectFit: "contain" }} />
                {p.gold}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
