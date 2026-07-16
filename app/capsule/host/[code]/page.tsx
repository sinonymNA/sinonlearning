"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CapIcon from "@/components/capsule/CapIcon";

const ANSWER_COLORS = ["#ef4444", "#19CDD2", "#eab308", "#a855f7"];
const ANSWER_LABELS = ["A", "B", "C", "D"];

interface Player { id: string; displayName: string; capId: string; gold: number; hasAnswered: boolean; }
interface GameState {
  code: string; title: string; status: string; currentQuestion: number; totalQuestions: number;
  currentQuestionData: { prompt: string; choices: string[]; answer: number; timeLimit: number } | null;
  players: Player[]; answerCount: number; playerCount: number; isHost: boolean;
}

function HostPanelInner() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";

  const [game, setGame] = useState<GameState | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // Demo automation refs
  const demoRef = useRef<{ q: number; done: boolean }>({ q: -1, done: false });
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  useEffect(() => { setRevealed(false); }, [game?.currentQuestion]);

  // Demo: auto-submit bot answers + auto-advance each question
  useEffect(() => {
    if (!isDemo || !game || game.status !== "active" || !game.currentQuestionData) return;
    const q = game.currentQuestion;
    if (demoRef.current.q === q) return; // already set up for this question
    demoRef.current = { q, done: false };

    // clear previous timers
    demoTimers.current.forEach(t => clearTimeout(t));
    demoTimers.current = [];

    const { answer: correctIdx, choices, timeLimit } = game.currentQuestionData;
    const demo = (() => {
      try { return JSON.parse(localStorage.getItem("capsule-demo") ?? "{}") as { code: string; botPlayerIds: string[] }; }
      catch { return { code: "", botPlayerIds: [] }; }
    })();
    const bots = demo.botPlayerIds ?? [];

    // Stagger bot answers over 1–5 seconds, 60% chance correct
    bots.forEach((botId, i) => {
      const delay = 1000 + i * 700 + Math.random() * 400;
      const correct = Math.random() < 0.60;
      const idx = correct
        ? correctIdx
        : (correctIdx + 1 + Math.floor(Math.random() * (choices.length - 1))) % choices.length;
      const t = setTimeout(() => {
        fetch(`/api/capsule/games/${code}/answer`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: botId, answerIndex: idx }),
        }).catch(() => {/* ignore */});
      }, delay);
      demoTimers.current.push(t);
    });

    // Reveal answer 2 seconds before time is up
    const revealAt = Math.max((timeLimit - 2) * 1000, 2000);
    const revealT = setTimeout(() => setRevealed(true), revealAt);
    demoTimers.current.push(revealT);

    // Auto-advance after timeLimit + 1 second
    const advanceT = setTimeout(async () => {
      if (demoRef.current.done) return;
      demoRef.current.done = true;
      setAdvancing(true);
      setRevealed(false);
      await fetch(`/api/capsule/games/${code}/advance`, { method: "POST" });
      await fetchState();
      setAdvancing(false);
    }, (timeLimit + 1) * 1000);
    demoTimers.current.push(advanceT);

    return () => demoTimers.current.forEach(t => clearTimeout(t));
  }, [isDemo, game?.currentQuestion, game?.status, code, fetchState]); // eslint-disable-line react-hooks/exhaustive-deps

  async function advance() {
    setAdvancing(true);
    setRevealed(false);
    await fetch(`/api/capsule/games/${code}/advance`, { method: "POST" });
    await fetchState();
    setAdvancing(false);
  }

  if (!game) {
    return (
      <div style={{ minHeight: "100dvh", background: "#07183F", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(25,205,210,0.5)" }}>Loading…</p>
      </div>
    );
  }

  const leaderboard = [...game.players].sort((a, b) => b.gold - a.gold);

  return (
    <div style={{ minHeight: "100dvh", background: "#07183F" }}>

      {/* Demo banner */}
      {isDemo && (
        <div style={{
          background: "#fde047", color: "#07183F",
          padding: "5px 0", textAlign: "center",
          fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
        }}>
          DEMO MODE · 5 BOT PLAYERS · QUESTIONS AUTO-ADVANCE
        </div>
      )}

      {/* Header */}
      <header style={{
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(25,205,210,0.10)",
        background: "rgba(7,24,63,0.90)",
        backdropFilter: "blur(12px)",
        padding: "0 20px",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/capsule/logo.png" alt="Capsule" style={{ height: 28, objectFit: "contain", filter: "drop-shadow(0 1px 6px rgba(25,205,210,0.4))" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{game.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            fontFamily: "monospace", fontSize: 18, fontWeight: 900, letterSpacing: "0.20em",
            color: "#19CDD2",
            background: "rgba(25,205,210,0.12)",
            borderRadius: 10, padding: "4px 14px",
            border: "1px solid rgba(25,205,210,0.25)",
          }}>
            {code}
          </div>
          {game.status === "active" && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Q{game.currentQuestion + 1}/{game.totalQuestions}
            </span>
          )}
        </div>
      </header>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 280px", gap: 24,
        maxWidth: 1100, margin: "0 auto", padding: "32px 20px",
      }} className="max-lg:grid-cols-1">

        {/* ── Main panel ── */}
        <div>

          {/* WAITING LOBBY */}
          {game.status === "waiting" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>

              {/* Game code card */}
              <div style={{
                marginBottom: 24,
                borderRadius: 24, border: "2px solid rgba(25,205,210,0.30)",
                background: "rgba(25,205,210,0.07)",
                padding: "32px 48px",
              }}>
                <p style={{ marginBottom: 8, fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(25,205,210,0.60)" }}>
                  Game code
                </p>
                <div style={{
                  fontFamily: "var(--font-bebas), monospace", fontSize: 72, fontWeight: 900,
                  letterSpacing: "0.15em", color: "#fff", lineHeight: 1,
                }}>
                  {code}
                </div>
                <p style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.30)" }}>
                  Students go to capsule and enter this code
                </p>
              </div>

              <p style={{ marginBottom: 24, fontSize: 13, color: "rgba(255,255,255,0.40)" }}>
                {game.playerCount} player{game.playerCount !== 1 ? "s" : ""} joined
              </p>

              {/* Player avatars */}
              {game.players.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 32 }}>
                  <AnimatePresence>
                    {game.players.map(p => (
                      <motion.div
                        key={p.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", damping: 14, stiffness: 260 }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                      >
                        <CapIcon capId={p.capId} size={44} animated />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.50)" }}>{p.displayName}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={async () => {
                  await fetch(`/api/capsule/games/${code}/start`, { method: "POST" });
                  await fetchState();
                }}
                disabled={game.playerCount < 1}
                style={{
                  borderRadius: 18, background: "#FF5965", border: "none",
                  padding: "16px 48px",
                  fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "#fff", cursor: game.playerCount < 1 ? "not-allowed" : "pointer",
                  opacity: game.playerCount < 1 ? 0.30 : 1,
                  boxShadow: "0 4px 0 rgba(0,0,0,0.25)",
                }}
              >
                Start Game →
              </button>
            </div>
          )}

          {/* ACTIVE GAME */}
          {game.status === "active" && game.currentQuestionData && (
            <div>
              {/* Progress bar */}
              <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                {Array.from({ length: game.totalQuestions }).map((_, i) => (
                  <div key={i} style={{
                    height: 4, flex: 1, borderRadius: 99,
                    background: i < game.currentQuestion
                      ? "#19CDD2"
                      : i === game.currentQuestion
                        ? "rgba(25,205,210,0.50)"
                        : "rgba(255,255,255,0.08)",
                  }} />
                ))}
              </div>

              {/* Answer count */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(25,205,210,0.60)" }}>
                  Question {game.currentQuestion + 1} of {game.totalQuestions}
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.40)" }}>
                  {game.answerCount} / {game.playerCount} answered
                </span>
              </div>

              {/* Question */}
              <div style={{
                borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                padding: "24px 24px", marginBottom: 20,
              }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
                  {game.currentQuestionData.prompt}
                </p>
              </div>

              {/* Answer grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                {game.currentQuestionData.choices.map((choice, i) => {
                  const isCorrect = revealed && i === game.currentQuestionData!.answer;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      minHeight: 68, borderRadius: 14, padding: "12px 16px",
                      background: isCorrect ? "rgba(21,128,61,0.25)" : `${ANSWER_COLORS[i]}1a`,
                      border: `2px solid ${isCorrect ? "#4ade80" : ANSWER_COLORS[i] + "55"}`,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/assets/capsule/game/answer-btn-${ANSWER_LABELS[i].toLowerCase()}.png`}
                        alt={ANSWER_LABELS[i]}
                        style={{ height: 32, objectFit: "contain", flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", flex: 1 }}>{choice}</span>
                      {isCorrect && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/assets/capsule/game/badge-correct.png" alt="✓" style={{ height: 28, objectFit: "contain" }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: 12 }}>
                {!revealed && (
                  <button
                    onClick={() => setRevealed(true)}
                    style={{
                      borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)",
                      background: "none", padding: "10px 20px",
                      fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.60)", cursor: "pointer",
                    }}
                  >
                    Reveal Answer
                  </button>
                )}
                <button
                  onClick={advance}
                  disabled={advancing}
                  style={{
                    borderRadius: 12, background: "#FF5965", border: "none",
                    padding: "10px 24px",
                    fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "#fff", cursor: advancing ? "not-allowed" : "pointer",
                    opacity: advancing ? 0.40 : 1,
                    boxShadow: "0 3px 0 rgba(0,0,0,0.25)",
                  }}
                >
                  {game.currentQuestion + 1 >= game.totalQuestions ? "End Game →" : "Next Question →"}
                </button>
              </div>
            </div>
          )}

          {/* GAME OVER */}
          {game.status === "ended" && (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <h2 style={{
                fontSize: 56, color: "#fff", letterSpacing: "0.06em",
                fontFamily: "var(--font-bebas)", marginBottom: 8,
              }}>GAME OVER</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.40)", marginBottom: 28 }}>Final standings</p>
              <div style={{ maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {leaderboard.slice(0, 5).map((p, i) => (
                  <div key={p.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)", padding: "12px 16px",
                  }}>
                    {i === 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/assets/capsule/game/crown.png" alt="👑" style={{ width: 28, objectFit: "contain" }} />
                    ) : (
                      <span style={{ width: 28, textAlign: "center", fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.30)" }}>
                        #{i + 1}
                      </span>
                    )}
                    <CapIcon capId={p.capId} size={32} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#fff" }}>{p.displayName}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 900, color: "#fde047" }}>
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

        {/* ── Leaderboard sidebar ── */}
        <aside>
          <div style={{
            position: "sticky", top: 72,
            borderRadius: 18, border: "1px solid rgba(25,205,210,0.12)",
            background: "rgba(25,205,210,0.05)", padding: 16,
          }}>
            <p style={{
              marginBottom: 14, fontSize: 10, fontWeight: 900,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: "rgba(25,205,210,0.60)",
            }}>Leaderboard</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <AnimatePresence>
                {leaderboard.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", damping: 22, stiffness: 300 }}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {i === 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/assets/capsule/game/crown.png" alt="👑" style={{ width: 20, objectFit: "contain", flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: 20, textAlign: "center", fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.20)", flexShrink: 0 }}>
                        #{i + 1}
                      </span>
                    )}
                    <CapIcon capId={p.capId} size={28} animated={i === 0} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.displayName}
                        </span>
                        <motion.span
                          key={p.gold}
                          initial={{ scale: 1.3, color: "#4ade80" }}
                          animate={{ scale: 1, color: "#fde047" }}
                          transition={{ duration: 0.35 }}
                          style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 900, flexShrink: 0 }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 12, height: 12, objectFit: "contain" }} />
                          {p.gold}
                        </motion.span>
                      </div>
                      {p.hasAnswered && game.status === "active" && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          style={{ marginTop: 3, height: 2, width: "100%", borderRadius: 99, background: "rgba(25,205,210,0.50)", transformOrigin: "left" }}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {leaderboard.length === 0 && (
                <p style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.20)" }}>
                  Waiting for players…
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function HostPanel() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#07183F" }} />}>
      <HostPanelInner />
    </Suspense>
  );
}
