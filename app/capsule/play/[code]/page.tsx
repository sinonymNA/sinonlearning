"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import CapIcon from "@/components/capsule/CapIcon";
import type { ChestResult } from "@/lib/capsuleData";

const ANSWER_LABELS = ["A", "B", "C", "D"];

const ANSWER_BG = [
  "linear-gradient(180deg, #ff6b7a 0%, #d42035 100%)",
  "linear-gradient(180deg, #3dd9e8 0%, #0babbb 100%)",
  "linear-gradient(180deg, #ffd740 0%, #e6a800 100%)",
  "linear-gradient(180deg, #c274ff 0%, #8b2fd6 100%)",
];
const ANSWER_SHADOW = ["#9a1525", "#067a88", "#a07500", "#5a0090"];

interface Player { id: string; displayName: string; capId: string; gold: number; hasAnswered: boolean; }
interface GameState {
  code: string; title: string; status: string; currentQuestion: number; totalQuestions: number;
  questionStartedAt: string | null;
  currentQuestionData: { prompt: string; choices: string[]; timeLimit: number } | null;
  players: Player[]; myPlayerId: string | null;
  myAnswer: { answerIndex: number; isCorrect: boolean; chestResult: ChestResult | null } | null;
}

type JoinPhase = "form" | "joined";

// Framer-motion variants for the answer grid stagger
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const btnVariants = {
  hidden: { y: 28, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring" as const, damping: 18, stiffness: 280 } },
};

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
  // Flash overlay state: null | "correct" | "wrong"
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const prevQuestion = useRef(-1);
  const prevAnswered = useRef(false);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/capsule/games/${code}`);
    if (res.ok) {
      const data = await res.json() as GameState;
      setGame(data);
      if (data.currentQuestion !== prevQuestion.current) {
        prevQuestion.current = data.currentQuestion;
        prevAnswered.current = false;
        setChestOpen(false);
        setTimer(data.currentQuestionData?.timeLimit ?? 20);
      }
      // Detect when answer first arrives
      if (data.myAnswer && !prevAnswered.current) {
        prevAnswered.current = true;
        const kind = data.myAnswer.isCorrect ? "correct" : "wrong";
        setFlash(kind);
        setTimeout(() => setFlash(null), 450);
      }
    }
  }, [code]);

  useEffect(() => {
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

  function handleChestOpen() {
    setChestOpen(true);
    confetti({
      particleCount: 65,
      spread: 58,
      origin: { y: 0.55 },
      colors: ["#fde047", "#fbbf24", "#f59e0b", "#fff", "#fef3c7"],
      shapes: ["circle"],
      scalar: 1.1,
      gravity: 1.0,
    });
  }

  // ── Join form ──────────────────────────────────────────────────────────────

  if (joinPhase === "form") {
    return (
      <div style={{
        display: "flex", minHeight: "100dvh", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 20px",
        background: "#07183F",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/capsule/logo.png"
          alt="Capsule"
          style={{ height: 64, objectFit: "contain", marginBottom: 24, filter: "drop-shadow(0 2px 16px rgba(25,205,210,0.5))" }}
        />
        <div style={{
          marginBottom: 20,
          borderRadius: 18, border: "1px solid rgba(25,205,210,0.25)",
          background: "rgba(25,205,210,0.10)",
          padding: "10px 32px",
          fontFamily: "monospace", fontSize: 28, fontWeight: 900,
          letterSpacing: "0.20em", color: "#19CDD2",
        }}>
          {code}
        </div>
        <form onSubmit={join} style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 300 }}>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            required
            autoFocus
            style={{
              borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              padding: "13px 18px",
              textAlign: "center", fontSize: 14, fontWeight: 700, color: "#fff",
              outline: "none",
            }}
            onFocus={e => (e.target.style.borderColor = "rgba(25,205,210,0.50)")}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
          />
          {joinError && <p style={{ textAlign: "center", fontSize: 12, color: "#f87171" }}>{joinError}</p>}
          <motion.button
            type="submit"
            disabled={joining || !displayName.trim()}
            whileTap={{ scale: 0.95 }}
            style={{
              borderRadius: 14, background: "#19CDD2", border: "none",
              padding: "14px 0", fontSize: 14, fontWeight: 900,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#06163E", cursor: (joining || !displayName.trim()) ? "not-allowed" : "pointer",
              opacity: (joining || !displayName.trim()) ? 0.40 : 1,
              boxShadow: "0 4px 0 #067a88",
            }}
          >
            {joining ? "Joining…" : "Join Game"}
          </motion.button>
        </form>
      </div>
    );
  }

  if (!game) return <div style={{ minHeight: "100dvh", background: "#07183F" }} />;

  const myPlayer = game.players.find(p => p.id === playerId);
  const leaderboard = [...game.players].sort((a, b) => b.gold - a.gold);

  // ── Waiting ────────────────────────────────────────────────────────────────

  if (game.status === "waiting") {
    return (
      <div style={{
        display: "flex", minHeight: "100dvh", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "0 20px", background: "#07183F",
      }}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 200 }}
        >
          <CapIcon capId={capId} size={80} animated />
        </motion.div>
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ marginTop: 16, fontSize: 17, fontWeight: 700, color: "#fff" }}
        >
          {displayName}
        </motion.p>
        <p style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.40)" }}>
          Waiting for the teacher to start…
        </p>
        {game.players.filter(p => p.id !== playerId).length > 0 && (
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            <AnimatePresence>
              {game.players.filter(p => p.id !== playerId).map(p => (
                <motion.div
                  key={p.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 16 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
                >
                  <CapIcon capId={p.capId} size={32} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.30)" }}>{p.displayName}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // ── Game ended ─────────────────────────────────────────────────────────────

  if (game.status === "ended") {
    const myRank = leaderboard.findIndex(p => p.id === playerId) + 1;
    return (
      <div style={{
        display: "flex", minHeight: "100dvh", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 20px",
        textAlign: "center", background: "#07183F",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          {myRank === 1 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/assets/capsule/game/crown.png" alt="👑" style={{ height: 40, objectFit: "contain" }} />
          )}
          <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(25,205,210,0.70)" }}>
            {myRank === 1 ? "You Won!" : `#${myRank} Place`}
          </p>
          {myRank === 1 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/assets/capsule/game/crown.png" alt="" style={{ height: 40, objectFit: "contain", transform: "scaleX(-1)" }} />
          )}
        </div>

        <h2 style={{
          fontSize: 60, color: "#fff", letterSpacing: "0.06em",
          fontFamily: "var(--font-bebas)", margin: "0 0 8px",
        }}>GAME OVER</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          {myRank === 1 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/assets/capsule/game/coin-burst.png" alt="" style={{ height: 36, objectFit: "contain" }} />
          )}
          <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, fontWeight: 900, color: "#fde047" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 24, height: 24, objectFit: "contain" }} />
            {myPlayer?.gold ?? 0} gold
          </p>
          {myRank === 1 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/assets/capsule/game/coin-burst.png" alt="" style={{ height: 36, objectFit: "contain", transform: "scaleX(-1)" }} />
          )}
        </div>

        <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 8 }}>
          {leaderboard.slice(0, 5).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.08, type: "spring", damping: 20 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                borderRadius: 14, padding: "10px 14px",
                border: p.id === playerId ? "1px solid rgba(25,205,210,0.30)" : "1px solid rgba(255,255,255,0.08)",
                background: p.id === playerId ? "rgba(25,205,210,0.08)" : "rgba(255,255,255,0.04)",
              }}
            >
              {i === 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/assets/capsule/game/crown.png" alt="👑" style={{ width: 20, objectFit: "contain" }} />
              ) : (
                <span style={{ width: 20, fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
                  #{i + 1}
                </span>
              )}
              <CapIcon capId={p.capId} size={28} animated={p.id === playerId && myRank === 1} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "left" }}>{p.displayName}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 900, color: "#fde047" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 14, height: 14, objectFit: "contain" }} />
                {p.gold}
              </span>
            </motion.div>
          ))}
        </div>

        <Link href="/capsule" style={{
          marginTop: 24,
          borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)",
          padding: "11px 24px", fontSize: 12, fontWeight: 700,
          color: "rgba(255,255,255,0.60)", textDecoration: "none",
          display: "inline-block",
        }}>
          Back to Capsule
        </Link>
      </div>
    );
  }

  // ── Active game ────────────────────────────────────────────────────────────

  const q = game.currentQuestionData;
  const answered = !!game.myAnswer;
  const timerPct = (timer / (q?.timeLimit ?? 20)) * 100;
  const timerColor = timer > 8 ? "#22c55e" : timer > 4 ? "#eab308" : "#ef4444";

  return (
    <div style={{ display: "flex", minHeight: "100dvh", flexDirection: "column", background: "#07183F" }}>

      {/* Screen flash overlay on answer */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash}
            initial={{ opacity: 0.75 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100, pointerEvents: "none",
              background: flash === "correct" ? "rgba(21,128,61,0.40)" : "rgba(239,68,68,0.40)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(7,24,63,0.90)",
        backdropFilter: "blur(12px)",
        padding: "8px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CapIcon capId={capId} size={28} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.70)" }}>{displayName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 900, color: "#fde047" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 18, height: 18, objectFit: "contain" }} />
          {myPlayer?.gold ?? 0}
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
          Q{game.currentQuestion + 1}/{game.totalQuestions}
        </span>
      </div>

      {/* Timer bar — smooth width via framer-motion */}
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", position: "relative" }}>
        <motion.div
          animate={{ width: `${timerPct}%`, backgroundColor: timerColor }}
          transition={{ width: { duration: 1, ease: "linear" }, backgroundColor: { duration: 0.3 } }}
          style={{ position: "absolute", top: 0, left: 0, height: "100%" }}
        />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 16px 16px" }}>
        {q && (
          <>
            {/* Question header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(25,205,210,0.60)" }}>
                {answered ? "Waiting for others…" : "Answer now"}
              </span>
              {!answered && (
                <motion.span
                  key={timer}
                  initial={{ scale: timer <= 5 ? 1.3 : 1 }}
                  animate={{ scale: 1 }}
                  style={{ fontSize: 18, fontWeight: 900, color: timerColor } as React.CSSProperties}
                >
                  {timer}s
                </motion.span>
              )}
            </div>

            {/* Question text */}
            <div style={{ flex: 1, marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.4, color: "#fff", margin: 0 }}>
                {q.prompt}
              </h2>
            </div>

            {/* Answer buttons — stagger in, spring press */}
            <AnimatePresence mode="wait">
              {!answered ? (
                <motion.div
                  key={`q-${game.currentQuestion}`}
                  variants={gridVariants}
                  initial="hidden"
                  animate="visible"
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
                >
                  {q.choices.map((choice, i) => (
                    <motion.button
                      key={i}
                      variants={btnVariants}
                      whileTap={{ scale: 0.89, boxShadow: "none" }}
                      onClick={() => submitAnswer(i)}
                      style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "space-between",
                        minHeight: 120, borderRadius: 18, border: "none",
                        padding: "6px 8px 14px",
                        background: ANSWER_BG[i],
                        boxShadow: `0 5px 0 ${ANSWER_SHADOW[i]}`,
                        cursor: "pointer",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/assets/capsule/game/answer-btn-${ANSWER_LABELS[i].toLowerCase()}.png`}
                        alt={ANSWER_LABELS[i]}
                        style={{ width: "90%", maxWidth: 150, objectFit: "contain", pointerEvents: "none" }}
                      />
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: "#fff",
                        textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                        textAlign: "center", lineHeight: 1.3,
                        padding: "0 4px",
                      }}>
                        {choice}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                /* Post-answer state */
                <motion.div
                  key="post-answer"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 20 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 8, textAlign: "center" }}
                >
                  {game.myAnswer?.isCorrect ? (
                    <>
                      {!chestOpen ? (
                        <motion.button
                          onClick={handleChestOpen}
                          whileTap={{ scale: 0.93 }}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                            borderRadius: 24, border: "1px solid rgba(253,224,71,0.35)",
                            background: "rgba(253,224,71,0.08)",
                            padding: "28px 48px", cursor: "pointer",
                          }}
                        >
                          <motion.img
                            src="/assets/capsule/game/badge-correct.png"
                            alt="Correct!"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 10, stiffness: 260 }}
                            style={{ height: 48, objectFit: "contain" }}
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/assets/capsule/chest-closed.png" alt="chest" style={{ width: 88, height: 88, objectFit: "contain" }} />
                          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fde047" }}>
                            Tap to open!
                          </span>
                        </motion.button>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", damping: 11, stiffness: 240 }}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                            borderRadius: 24, border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.05)",
                            padding: "28px 48px",
                          }}
                        >
                          {game.myAnswer.chestResult?.type === "gold" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src="/assets/capsule/game/coin-burst.png" alt="coins!" style={{ width: 100, objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: 52 }}>
                              {game.myAnswer.chestResult?.type === "steal" ? "🗡️"
                                : game.myAnswer.chestResult?.type === "lose" ? "💀"
                                : game.myAnswer.chestResult?.type === "double" ? "🔥" : "✨"}
                            </span>
                          )}
                          <p style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
                            {game.myAnswer.chestResult?.label ?? "Reward!"}
                          </p>
                        </motion.div>
                      )}
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>Waiting for the teacher to advance…</p>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 8 }}>
                      <motion.img
                        src="/assets/capsule/game/badge-wrong.png"
                        alt="Wrong"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ type: "spring", damping: 14 }}
                        style={{ height: 56, objectFit: "contain" }}
                      />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>Wrong answer</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.30)" }}>Waiting for next question…</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Mini leaderboard */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(7,24,63,0.80)",
        padding: "10px 16px 14px",
      }}>
        <p style={{ marginBottom: 8, fontSize: 9, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(25,205,210,0.50)" }}>
          Leaderboard
        </p>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 2 }}>
          <AnimatePresence>
            {leaderboard.slice(0, 8).map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: p.id === playerId ? 1 : 0.45 }}
                transition={{ type: "spring", damping: 18 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}
              >
                <CapIcon capId={p.capId} size={28} />
                <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 9, color: "rgba(255,255,255,0.50)", whiteSpace: "nowrap" }}>
                  {i === 0 && "👑 "}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/capsule/coin.png" alt="" style={{ width: 10, height: 10, objectFit: "contain" }} />
                  {p.gold}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
