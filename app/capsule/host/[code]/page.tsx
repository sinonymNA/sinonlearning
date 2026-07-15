"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import CapIcon from "@/components/capsule/CapIcon";

const ANSWER_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#22c55e"];
const ANSWER_LABELS = ["A", "B", "C", "D"];

interface Player { id: string; displayName: string; capId: string; gold: number; hasAnswered: boolean; }
interface GameState {
  code: string; title: string; status: string; currentQuestion: number; totalQuestions: number;
  currentQuestionData: { prompt: string; choices: string[]; answer: number; timeLimit: number } | null;
  players: Player[]; answerCount: number; playerCount: number; isHost: boolean;
}

export default function HostPanel() {
  const { code } = useParams<{ code: string }>();
  const [game, setGame] = useState<GameState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/capsule/games/${code}`);
    if (res.ok) {
      const data = await res.json() as GameState;
      setGame(data);
    }
  }, [code]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState]);

  // Reset revealed when question advances
  useEffect(() => { setRevealed(false); }, [game?.currentQuestion]);

  async function advance() {
    setAdvancing(true);
    setRevealed(false);
    await fetch(`/api/capsule/games/${code}/advance`, { method: "POST" });
    await fetchState();
    setAdvancing(false);
  }

  async function endGame() {
    await fetch(`/api/capsule/games/${code}/end`, { method: "POST" });
    await fetchState();
  }

  if (!game) return <div className="min-h-screen bg-[#0c0600] flex items-center justify-center"><p className="text-orange-400/50 text-sm">Loading…</p></div>;

  const leaderboard = [...game.players].sort((a, b) => b.gold - a.gold);

  return (
    <div className="min-h-screen bg-[#0c0600]">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-orange-400/10 bg-[#0c0600]/90 px-5 backdrop-blur-xl">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-400/50">HOST</span>
          <span className="ml-3 text-sm font-bold text-white">{game.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-orange-500/15 px-3 py-1 font-mono text-lg font-black tracking-[0.2em] text-orange-300">
            {code}
          </span>
          {game.status === "active" && (
            <span className="text-xs text-white/40">
              Q{game.currentQuestion + 1}/{game.totalQuestions}
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_280px]">
        {/* Main panel */}
        <div>
          {game.status === "waiting" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 rounded-3xl border border-orange-400/20 bg-orange-400/8 px-10 py-8">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-orange-400/60">Game code</p>
                <div className="font-mono text-7xl font-black tracking-[0.15em] text-white" style={{ fontFamily: "var(--font-bebas)" }}>
                  {code}
                </div>
                <p className="mt-3 text-xs text-white/30">Students go to capsule and enter this code</p>
              </div>

              <p className="mb-6 text-sm text-white/40">
                {game.playerCount} player{game.playerCount !== 1 ? "s" : ""} joined
              </p>

              {/* Players waiting */}
              {game.players.length > 0 && (
                <div className="mb-8 flex flex-wrap justify-center gap-3">
                  {game.players.map(p => (
                    <div key={p.id} className="flex flex-col items-center gap-1">
                      <CapIcon capId={p.capId} size={40} />
                      <span className="text-[10px] text-white/50">{p.displayName}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={async () => {
                  await fetch(`/api/capsule/games/${code}/start`, { method: "POST" });
                  await fetchState();
                }}
                disabled={game.playerCount < 1}
                className="rounded-2xl bg-orange-500 px-10 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-400 disabled:opacity-30"
              >
                Start Game →
              </button>
            </div>
          )}

          {game.status === "active" && game.currentQuestionData && (
            <div>
              {/* Progress bar */}
              <div className="mb-5 flex gap-1">
                {Array.from({ length: game.totalQuestions }).map((_, i) => (
                  <div key={i} className="h-1 flex-1 rounded-full" style={{
                    background: i < game.currentQuestion ? "#f97316" : i === game.currentQuestion ? "#fb923c" : "rgba(255,255,255,0.08)"
                  }} />
                ))}
              </div>

              {/* Answer count */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400/60">
                  Question {game.currentQuestion + 1} of {game.totalQuestions}
                </span>
                <span className="text-xs text-white/40">
                  {game.answerCount} / {game.playerCount} answered
                </span>
              </div>

              {/* Question */}
              <div className="mb-6 rounded-2xl border border-white/8 bg-white/4 p-6">
                <p className="text-xl font-bold leading-snug text-white sm:text-2xl">
                  {game.currentQuestionData.prompt}
                </p>
              </div>

              {/* Answer grid */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                {game.currentQuestionData.choices.map((choice, i) => (
                  <div
                    key={i}
                    className="flex min-h-[72px] items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: revealed && i === game.currentQuestionData!.answer ? "#15803d" : ANSWER_COLORS[i] + "22",
                      border: `2px solid ${revealed && i === game.currentQuestionData!.answer ? "#4ade80" : ANSWER_COLORS[i] + "55"}`,
                    }}
                  >
                    <span className="text-[10px] font-black text-white/50">{ANSWER_LABELS[i]}</span>
                    <span className="text-sm font-semibold text-white">{choice}</span>
                  </div>
                ))}
              </div>

              {/* Host controls */}
              <div className="flex gap-3">
                {!revealed && (
                  <button onClick={() => setRevealed(true)}
                    className="rounded-xl border border-white/15 px-5 py-3 text-xs font-bold text-white/60 hover:bg-white/5">
                    Reveal Answer
                  </button>
                )}
                <button onClick={advance} disabled={advancing}
                  className="rounded-xl bg-orange-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-orange-400 disabled:opacity-40">
                  {game.currentQuestion + 1 >= game.totalQuestions ? "End Game →" : "Next Question →"}
                </button>
              </div>
            </div>
          )}

          {game.status === "ended" && (
            <div className="py-16 text-center">
              <h2 className="mb-4 text-5xl text-white" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.06em" }}>
                GAME OVER
              </h2>
              <p className="mb-8 text-sm text-white/40">Final standings</p>
              <div className="mx-auto max-w-sm space-y-3">
                {leaderboard.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                    <span className="w-6 text-center text-sm font-black text-white/30">#{i + 1}</span>
                    <CapIcon capId={p.capId} size={32} />
                    <span className="flex-1 text-sm font-bold text-white">{p.displayName}</span>
                    <span className="flex items-center gap-1.5 font-black text-yellow-300">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 18, height: 18, objectFit: "contain" }} />
                      {p.gold}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard sidebar */}
        <aside>
          <div className="sticky top-6 rounded-2xl border border-orange-400/12 bg-orange-400/5 p-4">
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-orange-400/60">Leaderboard</p>
            <div className="space-y-2">
              {leaderboard.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <span className="w-5 text-center text-[10px] font-black text-white/20">#{i + 1}</span>
                  <CapIcon capId={p.capId} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs font-bold text-white">{p.displayName}</span>
                      <span className="ml-2 flex items-center gap-0.5 text-xs font-black text-yellow-300">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 12, height: 12, objectFit: "contain" }} />
                        {p.gold}
                      </span>
                    </div>
                    {p.hasAnswered && game.status === "active" && (
                      <div className="mt-0.5 h-0.5 w-full rounded-full bg-green-500/40" />
                    )}
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="py-4 text-center text-xs text-white/20">Waiting for players…</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
