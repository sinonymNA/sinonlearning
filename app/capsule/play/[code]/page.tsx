"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import CapIcon from "@/components/capsule/CapIcon";
import FactoryGame from "@/components/capsule/FactoryGame";
import type { ChestResult } from "@/lib/capsuleData";
import { useCapsuleAudio } from "@/components/capsule/useCapsuleAudio";

const GUEST_CAPS = [
  "cap-fox", "cap-cat", "cap-dog", "cap-frog", "cap-fish",
  "cap-duck", "cap-owl", "cap-bunny", "cap-bear", "cap-hamster",
];

interface Player { id: string; displayName: string; capId: string; gold: number; hasAnswered: boolean; }
interface GameState {
  code: string; title: string; status: string; currentQuestion: number; totalQuestions: number;
  questionStartedAt: string | null;
  currentQuestionData: { prompt: string; choices: string[]; timeLimit: number } | null;
  players: Player[]; myPlayerId: string | null;
  myAnswer: { answerIndex: number; isCorrect: boolean; chestResult: ChestResult | null } | null;
}

type JoinPhase = "form" | "joined";

function PlayerScreenInner() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";

  const [joinPhase, setJoinPhase] = useState<JoinPhase>("form");
  const [displayName, setDisplayName] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [capId, setCapId] = useState("cap-fox");
  const [game, setGame] = useState<GameState | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [timer, setTimer] = useState(20);
  const [streak, setStreak] = useState(0);
  const [showStreakBadge, setShowStreakBadge] = useState(false);
  const [floats, setFloats] = useState<Array<{ id: string; delta: number; key: number }>>([]);
  const prevQuestion = useRef(-1);
  // Holds playerId synchronously so fetchState can read it without being a dependency
  const playerIdRef = useRef<string | null>(null);
  const lastAnswerCorrectRef = useRef<boolean | null>(null);
  const goldPrevRef = useRef<Record<string, number>>({});
  const prevStatusRef = useRef<string | null>(null);
  const streakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { play } = useCapsuleAudio();


  const fetchState = useCallback(async () => {
    const pid = playerIdRef.current;
    const url = pid ? `/api/capsule/games/${code}?pid=${encodeURIComponent(pid)}` : `/api/capsule/games/${code}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json() as GameState;
      setGame(data);

      // Status audio triggers
      if (data.status === "active" && prevStatusRef.current !== "active") {
        play("banner");
      }
      prevStatusRef.current = data.status;

      // Streak tracking: when question changes, check previous answer
      if (data.currentQuestion !== prevQuestion.current) {
        const wasCorrect = lastAnswerCorrectRef.current;
        lastAnswerCorrectRef.current = null;
        prevQuestion.current = data.currentQuestion;

        if (wasCorrect === true) {
          setStreak(s => {
            const next = s + 1;
            if (next >= 3) {
              setShowStreakBadge(true);
              if (streakTimerRef.current) clearTimeout(streakTimerRef.current);
              streakTimerRef.current = setTimeout(() => setShowStreakBadge(false), 2200);
            }
            return next;
          });
        } else {
          setStreak(0);
        }

        if (data.questionStartedAt && data.currentQuestionData) {
          const elapsed = (Date.now() - new Date(data.questionStartedAt).getTime()) / 1000;
          const remaining = Math.max(0, (data.currentQuestionData.timeLimit ?? 20) - elapsed);
          setTimer(Math.floor(remaining));
        } else {
          setTimer(data.currentQuestionData?.timeLimit ?? 20);
        }
      }

      // Track current question answer for next streak check
      if (data.myAnswer !== null) {
        lastAnswerCorrectRef.current = data.myAnswer.isCorrect;
      }

      // Gold float tracking for mini-leaderboard
      data.players.forEach(p => {
        const prev = goldPrevRef.current[p.id] ?? p.gold;
        if (p.gold > prev) {
          setFloats(f => [...f, { id: p.id, delta: p.gold - prev, key: Date.now() + Math.random() }]);
        }
        goldPrevRef.current[p.id] = p.gold;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    const saved = localStorage.getItem(`capsule-player-${code}`);
    if (saved) {
      const { pid, name, cap } = JSON.parse(saved) as { pid: string; name: string; cap: string };
      playerIdRef.current = pid; // Set ref immediately so first fetchState call includes it
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

  // Confetti + winner sound on rank 1
  useEffect(() => {
    if (game?.status !== "ended" || !playerId) return;
    const myRank = [...game.players].sort((a, b) => b.gold - a.gold).findIndex(p => p.id === playerId) + 1;
    if (myRank === 1) {
      play("grand-cap");
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 }, colors: ["#fde047","#fbbf24","#f59e0b","#fff","#19CDD2"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true); setJoinError("");
    const res = await fetch(`/api/capsule/games/${code}/join`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, capId }),
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
    await fetchState(); // fetchState uses playerIdRef so myAnswer will come back correctly
  }

  async function resolveChoice(machine: string) {
    if (!playerId) return;
    await fetch(`/api/capsule/games/${code}/resolve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, machineChoice: machine }),
    });
    await fetchState();
  }

  async function earnConsolation() {
    if (!playerId) return;
    await fetch(`/api/capsule/games/${code}/consolation`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    await fetchState();
  }

  // ── Join form ──────────────────────────────────────────────────────────────

  if (joinPhase === "form") {
    return (
      <div style={{
        display: "flex", minHeight: "100dvh", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "20px 20px 32px",
        background: "#07183F",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/capsule/game/cap-raid-logo.png"
          alt="Cap Raid"
          style={{ height: 56, objectFit: "contain", marginBottom: 16, filter: "drop-shadow(0 2px 16px rgba(25,205,210,0.5))" }}
        />

        <div style={{
          marginBottom: 24,
          borderRadius: 14, border: "1px solid rgba(25,205,210,0.25)",
          background: "rgba(25,205,210,0.10)",
          padding: "8px 28px",
          fontFamily: "monospace", fontSize: 24, fontWeight: 900,
          letterSpacing: "0.20em", color: "#19CDD2",
        }}>
          {code}
        </div>

        <form onSubmit={join} style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 320 }}>

          {/* Selected cap preview + picker */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <motion.div
              key={capId}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 14, stiffness: 300 }}
            >
              <CapIcon capId={capId} size={72} animated />
            </motion.div>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
              Pick your cap
            </p>
            {/* Cap selection row */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
              {GUEST_CAPS.map(id => (
                <motion.button
                  key={id}
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={() => setCapId(id)}
                  style={{
                    background: "none", border: "none", padding: 2, cursor: "pointer",
                    borderRadius: "50%",
                    outline: id === capId ? "2px solid #19CDD2" : "2px solid transparent",
                    outlineOffset: 2,
                  }}
                >
                  <CapIcon capId={id} size={36} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Name input */}
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
        position: "relative", overflow: "hidden",
      }}>
        {/* Ambient factory background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/capsule/game/factory-bg.png" alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                   objectFit: "cover", opacity: 0.18, pointerEvents: "none" }} />

        {/* Floating mascot */}
        <motion.img
          src="/assets/capsule/mascot.png"
          alt=""
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 88, objectFit: "contain", marginBottom: 8, position: "relative" }}
        />
        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ marginTop: 8, fontSize: 17, fontWeight: 700, color: "#fff", position: "relative" }}
        >
          {displayName}
        </motion.p>
        <p style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.40)", position: "relative" }}>
          Waiting for the teacher to start…
        </p>
        {game.players.filter(p => p.id !== playerId).length > 0 && (
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, position: "relative" }}>
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
        {myRank === 1 && (
          // eslint-disable-next-line @next/next/no-img-element
          <motion.img
            src="/assets/capsule/game/reward-grand-prize.png"
            alt="Grand Prize"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.1 }}
            style={{ width: 80, objectFit: "contain", marginBottom: 8,
                     filter: "drop-shadow(0 0 20px rgba(253,224,71,0.7))" }}
          />
        )}
        <p style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(25,205,210,0.70)", marginBottom: 4 }}>
          {myRank === 1 ? "You Won!" : `#${myRank} Place`}
        </p>

        <h2 style={{
          fontSize: 60, color: "#fff", letterSpacing: "0.06em",
          fontFamily: "var(--font-bebas)", margin: "0 0 8px",
        }}>GAME OVER</h2>

        <p style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 22, fontWeight: 900, color: "#fde047", marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 24, height: 24, objectFit: "contain" }} />
          {myPlayer?.gold ?? 0} gold
        </p>

        <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 8 }}>
          {leaderboard.slice(0, 5).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.12, type: "spring", damping: 20 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                borderRadius: 14, padding: "10px 14px",
                border: p.id === playerId ? "1px solid rgba(25,205,210,0.30)" : "1px solid rgba(255,255,255,0.08)",
                background: p.id === playerId ? "rgba(25,205,210,0.08)" : "rgba(255,255,255,0.04)",
              }}
            >
              {i === 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/assets/capsule/game/reward-grand-prize.png" alt="🏆" style={{ width: 24, objectFit: "contain" }} />
              ) : (
                <span style={{ width: 24, fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
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
  const timerPct = (timer / (q?.timeLimit ?? 20)) * 100;
  const timerColor = timer > 8 ? "#22c55e" : timer > 4 ? "#eab308" : "#ef4444";

  return (
    <div style={{ display: "flex", minHeight: "100dvh", flexDirection: "column", background: "#07183F" }}>

      {/* Demo banner */}
      {isDemo && (
        <div style={{
          background: "#fde047", color: "#07183F",
          padding: "5px 0", textAlign: "center",
          fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
          flexShrink: 0,
        }}>
          DEMO MODE · AUTO-ADVANCE
        </div>
      )}

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(7,24,63,0.90)",
        backdropFilter: "blur(12px)",
        padding: "8px 16px",
        flexShrink: 0,
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

      {/* Timer bar — uses timer-bar.png asset */}
      <div style={{ height: 10, position: "relative", flexShrink: 0, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/capsule/game/timer-bar.png" alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "fill", opacity: 0.22, pointerEvents: "none" }} />
        <motion.div
          animate={{ scaleX: timerPct / 100 }}
          transition={{ scaleX: { duration: 1, ease: "linear" } }}
          style={{
            position: "absolute", inset: 0, transformOrigin: "left",
            backgroundImage: "url(/assets/capsule/game/timer-bar.png)",
            backgroundSize: "100% 100%",
            filter: timerColor === "#ef4444" ? "hue-rotate(220deg)" : "none",
          }}
        />
      </div>

      {/* Streak badge — fixed top-right overlay */}
      <AnimatePresence>
        {showStreakBadge && streak >= 3 && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            style={{ position: "fixed", top: 64, right: 12, zIndex: 50,
                     display: "flex", alignItems: "center", gap: 6, pointerEvents: "none" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/capsule/game/badge-streak.png" alt="Streak" style={{ height: 44, objectFit: "contain" }} />
            <span style={{ fontSize: 22, fontWeight: 900, color: "#fde047",
                           textShadow: "0 0 12px rgba(253,224,71,0.8)" }}>×{streak}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Factory game — handles question overlay + animation sequence */}
      <FactoryGame
        question={q}
        answered={!!game.myAnswer}
        myAnswer={game.myAnswer}
        timer={timer}
        currentQuestion={game.currentQuestion}
        onSubmit={submitAnswer}
        onResolve={resolveChoice}
        onConsolation={earnConsolation}
      />

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
                <div style={{ position: "relative" }}>
                  <CapIcon capId={p.capId} size={28} />
                  {floats.filter(f => f.id === p.id).map(f => (
                    <motion.div
                      key={f.key}
                      initial={{ y: 0, opacity: 1 }}
                      animate={{ y: -30, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      onAnimationComplete={() => setFloats(fs => fs.filter(x => x.key !== f.key))}
                      style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                               display: "flex", gap: 2, alignItems: "center",
                               fontSize: 11, fontWeight: 900, color: "#fde047",
                               pointerEvents: "none", whiteSpace: "nowrap" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/assets/capsule/coin.png" alt="" style={{ width: 10, height: 10, objectFit: "contain" }} />
                      +{f.delta}
                    </motion.div>
                  ))}
                </div>
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

export default function PlayerScreen() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#07183F" }} />}>
      <PlayerScreenInner />
    </Suspense>
  );
}
