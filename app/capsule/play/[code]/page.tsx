"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import CapIcon from "@/components/capsule/CapIcon";
import FactoryGame from "@/components/capsule/FactoryGame";
import type { ChestResult } from "@/lib/capsuleData";

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
  const prevQuestion = useRef(-1);

  // Demo automation refs
  const demoRef = useRef<{ q: number; done: boolean }>({ q: -1, done: false });
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/capsule/games/${code}`);
    if (res.ok) {
      const data = await res.json() as GameState;
      setGame(data);
      if (data.currentQuestion !== prevQuestion.current) {
        prevQuestion.current = data.currentQuestion;
        setTimer(data.currentQuestionData?.timeLimit ?? 20);
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

  // Demo: auto-submit bot answers + auto-advance for student view
  useEffect(() => {
    if (!isDemo || !game || game.status !== "active" || !game.currentQuestionData) return;
    const q = game.currentQuestion;
    if (demoRef.current.q === q) return;
    demoRef.current = { q, done: false };

    demoTimers.current.forEach(t => clearTimeout(t));
    demoTimers.current = [];

    const { choices, timeLimit } = game.currentQuestionData;
    const demo = (() => {
      try { return JSON.parse(localStorage.getItem("capsule-demo") ?? "{}") as { code: string; botPlayerIds: string[] }; }
      catch { return { code: "", botPlayerIds: [] }; }
    })();
    const bots = demo.botPlayerIds ?? [];

    // Submit random answers for bots (play page doesn't know correct answer)
    bots.forEach((botId, i) => {
      const delay = 1000 + i * 700 + Math.random() * 400;
      const idx = Math.floor(Math.random() * choices.length);
      const t = setTimeout(() => {
        fetch(`/api/capsule/games/${code}/answer`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: botId, answerIndex: idx }),
        }).catch(() => {/* ignore */});
      }, delay);
      demoTimers.current.push(t);
    });

    // Auto-advance using DemoTeacher session cookie (set during demo setup)
    const advanceT = setTimeout(async () => {
      if (demoRef.current.done) return;
      demoRef.current.done = true;
      await fetch(`/api/capsule/games/${code}/advance`, { method: "POST" });
      await fetchState();
    }, (timeLimit + 1) * 1000);
    demoTimers.current.push(advanceT);

    return () => demoTimers.current.forEach(t => clearTimeout(t));
  }, [isDemo, game?.currentQuestion, game?.status, code, fetchState]); // eslint-disable-line react-hooks/exhaustive-deps

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
          src="/assets/capsule/logo.png"
          alt="Capsule"
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

      {/* Timer bar */}
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", position: "relative", flexShrink: 0 }}>
        <motion.div
          animate={{ width: `${timerPct}%`, backgroundColor: timerColor }}
          transition={{ width: { duration: 1, ease: "linear" }, backgroundColor: { duration: 0.3 } }}
          style={{ position: "absolute", top: 0, left: 0, height: "100%" }}
        />
      </div>

      {/* Factory game — handles question overlay + animation sequence */}
      <FactoryGame
        question={q}
        answered={!!game.myAnswer}
        myAnswer={game.myAnswer}
        timer={timer}
        currentQuestion={game.currentQuestion}
        onSubmit={submitAnswer}
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

export default function PlayerScreen() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#07183F" }} />}>
      <PlayerScreenInner />
    </Suspense>
  );
}
