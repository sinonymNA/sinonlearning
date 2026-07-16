"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_QUESTIONS, type CapsuleQuestion } from "@/lib/capsuleData";

interface Me { username: string; role: string; }

const ANSWER_LABELS = ["A", "B", "C", "D"];
const ANSWER_COLORS = ["#ef4444", "#19CDD2", "#eab308", "#a855f7"];
const TIME_OPTIONS = [10, 15, 20, 30, 45, 60];

function emptyQuestion(): CapsuleQuestion {
  return { prompt: "", choices: ["", "", "", ""], answer: 0, timeLimit: 20 };
}

/* ── Question Card ─────────────────────────────────────────────────────────── */

function QuestionCard({
  q, index, total,
  onChange, onRemove,
}: {
  q: CapsuleQuestion; index: number; total: number;
  onChange: (q: CapsuleQuestion) => void; onRemove: () => void;
}) {
  const isValid = q.prompt.trim().length > 0 && q.choices.every(c => c.trim().length > 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      style={{
        borderRadius: 18, border: `1px solid ${isValid ? "rgba(25,205,210,0.20)" : "rgba(255,255,255,0.07)"}`,
        background: "rgba(255,255,255,0.03)",
        padding: "18px 18px 14px",
        position: "relative",
      }}
    >
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase",
          color: isValid ? "rgba(25,205,210,0.70)" : "rgba(255,255,255,0.25)",
        }}>
          Q{index + 1}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Time limit */}
          <select
            value={q.timeLimit}
            onChange={e => onChange({ ...q, timeLimit: Number(e.target.value) })}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)",
              cursor: "pointer", outline: "none",
            }}
          >
            {TIME_OPTIONS.map(t => (
              <option key={t} value={t}>{t}s</option>
            ))}
          </select>
          {/* Remove */}
          {total > 1 && (
            <button
              onClick={onRemove}
              style={{
                background: "none", border: "none", padding: 0, cursor: "pointer",
                fontSize: 14, color: "rgba(255,255,255,0.22)",
                lineHeight: 1,
              }}
              title="Remove question"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Prompt */}
      <textarea
        value={q.prompt}
        onChange={e => onChange({ ...q, prompt: e.target.value })}
        placeholder={`Question ${index + 1}…`}
        rows={2}
        style={{
          width: "100%", boxSizing: "border-box",
          borderRadius: 10, border: "1px solid rgba(255,255,255,0.10)",
          background: "rgba(7,24,63,0.60)",
          padding: "10px 12px", fontSize: 13, fontWeight: 600, color: "#fff",
          outline: "none", resize: "vertical", lineHeight: 1.45,
          marginBottom: 12,
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(25,205,210,0.40)")}
        onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
      />

      {/* Choices */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {q.choices.map((choice, ci) => {
          const isCorrect = q.answer === ci;
          return (
            <div key={ci} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {/* Correct-answer selector */}
              <button
                onClick={() => onChange({ ...q, answer: ci as 0 | 1 | 2 | 3 })}
                title={isCorrect ? "Correct answer" : "Set as correct"}
                style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${isCorrect ? ANSWER_COLORS[ci] : "rgba(255,255,255,0.15)"}`,
                  background: isCorrect ? `${ANSWER_COLORS[ci]}30` : "none",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: isCorrect ? ANSWER_COLORS[ci] : "rgba(255,255,255,0.20)",
                  transition: "all 0.15s",
                }}
              >
                {ANSWER_LABELS[ci]}
              </button>
              <input
                value={choice}
                onChange={e => {
                  const next = [...q.choices] as [string, string, string, string];
                  next[ci] = e.target.value;
                  onChange({ ...q, choices: next });
                }}
                placeholder={`Choice ${ANSWER_LABELS[ci]}`}
                style={{
                  flex: 1, borderRadius: 8,
                  border: `1px solid ${isCorrect ? `${ANSWER_COLORS[ci]}50` : "rgba(255,255,255,0.08)"}`,
                  background: isCorrect ? `${ANSWER_COLORS[ci]}0d` : "rgba(7,24,63,0.60)",
                  padding: "8px 10px", fontSize: 12, fontWeight: 600,
                  color: isCorrect ? "#fff" : "rgba(255,255,255,0.70)",
                  outline: "none",
                  transition: "border-color 0.15s, background 0.15s",
                }}
                onFocus={e => { if (!isCorrect) e.target.style.borderColor = "rgba(255,255,255,0.25)"; }}
                onBlur={e => { if (!isCorrect) e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
            </div>
          );
        })}
      </div>

      {/* Correct answer hint */}
      <p style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.22)" }}>
        Click a letter to mark the correct answer · currently: <span style={{ color: ANSWER_COLORS[q.answer], fontWeight: 700 }}>{ANSWER_LABELS[q.answer]}</span>
      </p>
    </motion.div>
  );
}

/* ── Game Mode Card ────────────────────────────────────────────────────────── */

const GAME_MODES = [
  {
    id: "cap-raid",
    logo: "/assets/capsule/game/cap-raid-logo.png",
    name: "Cap Raid",
    tagline: "Raid the Factory",
    desc: "Answer questions to activate the capsule factory. Pick a machine, pull the lever, and crack open your reward — gold, steals, and chaos.",
    accent: "#fde047",
    available: true,
  },
  {
    id: "coming-soon-1",
    logo: null,
    name: "???",
    tagline: "Coming Soon",
    desc: "A new game mode is in the works. Stay tuned.",
    accent: "rgba(255,255,255,0.15)",
    available: false,
  },
  {
    id: "coming-soon-2",
    logo: null,
    name: "???",
    tagline: "Coming Soon",
    desc: "Another way to play is on the way.",
    accent: "rgba(255,255,255,0.15)",
    available: false,
  },
] as const;

type GameModeId = (typeof GAME_MODES)[number]["id"];

/* ── Host Setup Page ───────────────────────────────────────────────────────── */

export default function CapsuleHostPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameMode, setGameMode] = useState<GameModeId>("cap-raid");
  const [title, setTitle] = useState("Cap Raid");
  const [questions, setQuestions] = useState<CapsuleQuestion[]>([emptyQuestion()]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    fetch("/api/capsule/auth/me").then(r => r.json()).then(d => {
      setMe(d.user);
      setLoading(false);
      if (d.user && d.user.role !== "teacher") router.push("/capsule");
      if (!d.user) router.push("/capsule/login");
    });
  }, [router]);

  function loadDemo() {
    setQuestions(DEMO_QUESTIONS.map(q => ({ ...q })));
    setTitle("Cap Raid Demo");
    setShowDemo(false);
  }

  function addQuestion() {
    setQuestions(qs => [...qs, emptyQuestion()]);
  }

  function updateQuestion(index: number, q: CapsuleQuestion) {
    setQuestions(qs => qs.map((old, i) => (i === index ? q : old)));
  }

  function removeQuestion(index: number) {
    setQuestions(qs => qs.filter((_, i) => i !== index));
  }

  function validateQuestions(): string | null {
    if (questions.length < 2) return "Add at least 2 questions.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) return `Question ${i + 1} is missing a prompt.`;
      for (let ci = 0; ci < 4; ci++) {
        if (!q.choices[ci].trim()) return `Question ${i + 1}, choice ${ANSWER_LABELS[ci]} is empty.`;
      }
    }
    return null;
  }

  async function createGame() {
    setError("");
    const err = validateQuestions();
    if (err) { setError(err); return; }
    setCreating(true);
    const res = await fetch("/api/capsule/games", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() || "Cap Raid", questions }),
    });
    const data = await res.json() as { code?: string; error?: string };
    if (!res.ok || !data.code) { setError(data.error ?? "Failed to create game."); setCreating(false); return; }
    router.push(`/capsule/host/${data.code}`);
  }

  const validCount = questions.filter(q =>
    q.prompt.trim() && q.choices.every(c => c.trim()),
  ).length;

  if (loading) return <div style={{ minHeight: "100dvh", background: "#07183F" }} />;

  return (
    <div style={{ minHeight: "100dvh", background: "#07183F", paddingBottom: 64 }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "36px 20px 0" }}>

        <Link href="/capsule" style={{
          display: "inline-block", marginBottom: 28,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "rgba(25,205,210,0.6)", textDecoration: "none",
        }}>
          ← Capsule
        </Link>

        {/* Heading */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/capsule/logo.png" alt="Capsule"
              style={{ height: 36, objectFit: "contain", marginBottom: 8, filter: "drop-shadow(0 2px 12px rgba(25,205,210,0.4))" }} />
            <h1 style={{ fontSize: 38, fontWeight: 900, color: "#fff", letterSpacing: "0.06em", fontFamily: "var(--font-bebas)", margin: 0 }}>
              HOST A GAME
            </h1>
          </div>
          {/* Load demo shortcut */}
          <motion.button
            onClick={() => setShowDemo(v => !v)}
            whileTap={{ scale: 0.94 }}
            style={{
              borderRadius: 10, border: "1px solid rgba(25,205,210,0.25)",
              background: "rgba(25,205,210,0.08)",
              padding: "8px 14px", fontSize: 11, fontWeight: 800,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "rgba(25,205,210,0.80)", cursor: "pointer",
            }}
          >
            Load Demo
          </motion.button>
        </div>

        {/* Demo set banner */}
        <AnimatePresence>
          {showDemo && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{
                marginBottom: 20,
                borderRadius: 14, border: "1px solid rgba(25,205,210,0.25)",
                background: "rgba(25,205,210,0.07)",
                padding: "14px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}
            >
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                  Demo Set — {DEMO_QUESTIONS.length} questions
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>
                  Replaces your current questions with the built-in demo set.
                </p>
              </div>
              <motion.button
                onClick={loadDemo}
                whileTap={{ scale: 0.93 }}
                style={{
                  flexShrink: 0, borderRadius: 10, background: "#19CDD2", border: "none",
                  padding: "9px 16px", fontSize: 11, fontWeight: 900,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "#06163E", cursor: "pointer",
                }}
              >
                Use Demo
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Game Mode ── */}
          <div>
            <label style={{
              display: "block", marginBottom: 12,
              fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
              color: "rgba(25,205,210,0.70)",
            }}>
              Game Mode
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {GAME_MODES.map(mode => {
                const selected = gameMode === mode.id;
                return (
                  <motion.button
                    key={mode.id}
                    onClick={() => { if (mode.available) setGameMode(mode.id); }}
                    whileTap={mode.available ? { scale: 0.96 } : {}}
                    style={{
                      position: "relative", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 8, padding: "14px 10px 12px",
                      borderRadius: 16, border: `2px solid ${selected ? mode.accent : "rgba(255,255,255,0.08)"}`,
                      background: selected ? `${mode.accent}10` : "rgba(255,255,255,0.02)",
                      cursor: mode.available ? "pointer" : "default",
                      opacity: mode.available ? 1 : 0.35,
                      transition: "border-color 0.15s, background 0.15s",
                    }}
                  >
                    {/* Logo or placeholder */}
                    {mode.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mode.logo}
                        alt={mode.name}
                        style={{ width: "100%", maxWidth: 110, objectFit: "contain", pointerEvents: "none" }}
                      />
                    ) : (
                      <div style={{
                        width: 80, height: 64,
                        borderRadius: 10, border: "2px dashed rgba(255,255,255,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22, color: "rgba(255,255,255,0.15)",
                      }}>
                        ?
                      </div>
                    )}

                    {/* Mode name + tagline */}
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", color: selected ? "#fff" : "rgba(255,255,255,0.30)", textTransform: "uppercase" }}>
                        {mode.name}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: selected ? mode.accent : "rgba(255,255,255,0.20)", textTransform: "uppercase" }}>
                        {mode.tagline}
                      </p>
                    </div>

                    {/* Selected checkmark */}
                    {selected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: "absolute", top: 8, right: 8,
                          width: 18, height: 18, borderRadius: "50%",
                          background: mode.accent,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, color: "#06163E", fontWeight: 900,
                        }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Selected mode description */}
            {(() => {
              const mode = GAME_MODES.find(m => m.id === gameMode);
              return mode ? (
                <motion.p
                  key={gameMode}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.40)", lineHeight: 1.5 }}
                >
                  {mode.desc}
                </motion.p>
              ) : null;
            })()}
          </div>

          {/* Game title */}
          <div>
            <label style={{
              display: "block", marginBottom: 8,
              fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
              color: "rgba(25,205,210,0.70)",
            }}>
              Game title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                padding: "12px 16px", fontSize: 14, color: "#fff", outline: "none",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(25,205,210,0.50)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
            />
          </div>

          {/* Questions section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{
              fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
              color: "rgba(25,205,210,0.70)",
            }}>
              Questions
              <span style={{ marginLeft: 8, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>
                {validCount}/{questions.length} ready
              </span>
            </label>
            <motion.button
              onClick={addQuestion}
              whileTap={{ scale: 0.93 }}
              style={{
                borderRadius: 8, border: "1px dashed rgba(255,255,255,0.20)",
                background: "none", padding: "6px 12px",
                fontSize: 11, fontWeight: 800, letterSpacing: "0.06em",
                color: "rgba(255,255,255,0.45)", cursor: "pointer",
              }}
            >
              + Add Question
            </motion.button>
          </div>

          {/* Question cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <AnimatePresence initial={false}>
              {questions.map((q, i) => (
                <QuestionCard
                  key={i}
                  q={q}
                  index={i}
                  total={questions.length}
                  onChange={updated => updateQuestion(i, updated)}
                  onRemove={() => removeQuestion(i)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom add button (convenience) */}
          <motion.button
            onClick={addQuestion}
            whileTap={{ scale: 0.95 }}
            style={{
              width: "100%", borderRadius: 14,
              border: "2px dashed rgba(255,255,255,0.12)",
              background: "none", padding: "14px 0",
              fontSize: 12, fontWeight: 800, letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.28)", cursor: "pointer",
            }}
          >
            + Add Another Question
          </motion.button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontSize: 12, color: "#f87171" }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            onClick={createGame}
            disabled={creating}
            whileTap={creating ? {} : { scale: 0.97 }}
            style={{
              borderRadius: 18, background: creating ? "rgba(255,89,101,0.40)" : "#FF5965",
              border: "none", padding: "16px 24px",
              fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#fff", cursor: creating ? "not-allowed" : "pointer",
              boxShadow: creating ? "none" : "0 4px 0 rgba(0,0,0,0.25)",
              transition: "background 0.15s",
            }}
          >
            {creating ? "Creating…" : `Create Game · ${questions.length} Q →`}
          </motion.button>

        </div>
      </div>
    </div>
  );
}
