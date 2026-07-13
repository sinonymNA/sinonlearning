"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Check, ChevronDown, Flame, Gem, Heart,
  RotateCcw, ShieldAlert, Sparkles, X, Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  VAULT_ARTIFACTS, VAULT_CUSTOM_SET_KEY, VAULT_QUESTIONS,
  type VaultArtifact, type VaultCustomSet, type VaultQuestion,
} from "@/lib/vaultGame";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "home" | "room" | "repair" | "shrine" | "relic" | "camp" | "lost" | "extracted";
type Modifier = "echo" | "fortune" | "lantern" | null;
type Save = {
  shards: number;
  bestDepth: number;
  artifacts: string[];
  mastered: string[];
  conceptWins?: Record<string, number>;
};

const EMPTY_SAVE: Save = { shards: 0, bestDepth: 0, artifacts: [], mastered: [] };
const MAX_TIMER = 12;

// A/B/C/D colors — bold, distinct, readable
const ANSWER_COLORS = ["#2563eb", "#16a34a", "#d97706", "#9333ea"] as const;
const ANSWER_LABELS = ["A", "B", "C", "D"] as const;

// ─── Sound ────────────────────────────────────────────────────────────────────

function playTone(type: "correct" | "wrong" | "tick" | "fanfare") {
  try {
    const ctx = new AudioContext();
    const schedule = (
      freq: number, startAt: number, dur: number,
      wave: OscillatorType = "sine", vol = 0.2,
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
      gain.gain.setValueAtTime(vol, ctx.currentTime + startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + dur);
      osc.start(ctx.currentTime + startAt);
      osc.stop(ctx.currentTime + startAt + dur);
    };

    if (type === "correct") {
      schedule(440, 0, 0.12, "sine", 0.22);
      schedule(660, 0.1, 0.25, "sine", 0.2);
    } else if (type === "wrong") {
      schedule(200, 0, 0.15, "sawtooth", 0.18);
      schedule(130, 0.15, 0.35, "sawtooth", 0.15);
    } else if (type === "tick") {
      schedule(900, 0, 0.05, "square", 0.07);
    } else if (type === "fanfare") {
      [330, 415, 523, 660].forEach((f, i) =>
        schedule(f, i * 0.1, 0.2, "sine", 0.15),
      );
    }
  } catch { /* Audio unavailable in some contexts */ }
}

// ─── Root component ────────────────────────────────────────────────────────────

export default function VaultGame() {
  const noMotion = useReducedMotion();

  // Persistence
  const [ready, setReady] = useState(false);
  const [save, setSave] = useState<Save>(EMPTY_SAVE);

  // Navigation / deck
  const [phase, setPhase] = useState<Phase>("home");
  const [deck, setDeck] = useState("Mixed Descent");
  const [customSet, setCustomSet] = useState<VaultCustomSet | null>(null);

  // Run state
  const [depth, setDepth] = useState(1);
  const [light, setLight] = useState(3);
  const [shards, setShards] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timer, setTimer] = useState(MAX_TIMER);
  const [timedOut, setTimedOut] = useState(false);

  // Question state
  const [picked, setPicked] = useState<number | null>(null);
  const [eliminated, setEliminated] = useState<number | null>(null);
  const [relic, setRelic] = useState<VaultArtifact | null>(null);
  const [carried, setCarried] = useState<string[]>([]);
  const [modifier, setModifier] = useState<Modifier>(null);
  const [runWins, setRunWins] = useState<Record<string, number>>({});
  const [repairPicked, setRepairPicked] = useState<number | null>(null);

  // Keep modifier accessible in the timer closure without re-triggering the effect
  const modRef = useRef<Modifier>(null);
  useEffect(() => { modRef.current = modifier; }, [modifier]);

  // ── Load save + URL params ──────────────────────────────────────────────────

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sinon-vault-save-v1");
      if (stored) setSave(JSON.parse(stored) as Save);

      const local = localStorage.getItem(VAULT_CUSTOM_SET_KEY);
      if (local) {
        const parsed = JSON.parse(local) as VaultCustomSet;
        if (parsed.questions?.length >= 3) setCustomSet(parsed);
      }

      const id = new URLSearchParams(window.location.search).get("set");
      if (id === "custom" && local) setDeck((JSON.parse(local) as VaultCustomSet).title);
      if (id && id !== "custom") {
        fetch(`/api/vault/sets/${encodeURIComponent(id)}`)
          .then(r => r.ok ? r.json() : Promise.reject())
          .then((data: { vaultSet: VaultCustomSet }) => {
            if (data.vaultSet.questions.length >= 3) {
              setCustomSet(data.vaultSet);
              setDeck(data.vaultSet.title);
            }
          })
          .catch(() => undefined);
      }
    } catch { /* Save is optional */ }
    setReady(true);
  }, []);

  // ── Question pool + shuffled order ─────────────────────────────────────────

  const pool = useMemo(() =>
    customSet && deck === customSet.title
      ? customSet.questions
      : deck === "Mixed Descent"
        ? VAULT_QUESTIONS
        : VAULT_QUESTIONS.filter(q => q.subject === deck),
    [customSet, deck],
  );

  const question: VaultQuestion = pool[(depth - 1) % pool.length];

  // Deterministically shuffle choices per floor so replay feels different
  const order = useMemo(
    () => [0, 1, 2, 3].map(i => (i + depth * 3 + question.id.length) % 4),
    [depth, question.id],
  );

  // ── Countdown timer ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "room" || picked !== null || timedOut) return;
    setTimer(MAX_TIMER);

    const id = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(id);
          setTimedOut(true);
          setCombo(0);
          setLight(v => Math.max(0, v - (modRef.current === "fortune" ? 2 : 1)));
          playTone("wrong");
          setTimeout(() => setPhase("repair"), 500);
          return 0;
        }
        if (t <= 4) playTone("tick");
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, depth]); // re-runs on new room, not on every state change

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const persist = (next: Save) => {
    setSave(next);
    try { localStorage.setItem("sinon-vault-save-v1", JSON.stringify(next)); } catch { /* Optional */ }
  };

  const resetRoom = () => {
    setPicked(null);
    setEliminated(null);
    setTimedOut(false);
    setTimer(MAX_TIMER);
  };

  /** Move to the next floor. Shows shrine at depths 3 and 6. */
  const advance = (fromDepth: number) => {
    setDepth(fromDepth + 1);
    resetRoom();
    setPhase(fromDepth === 3 || fromDepth === 6 ? "shrine" : "room");
  };

  const extract = () => {
    const wins = Object.entries(runWins).reduce(
      (all, [concept, val]) => ({ ...all, [concept]: (all[concept] ?? 0) + val }),
      { ...(save.conceptWins ?? {}) },
    );
    persist({
      shards: save.shards + shards,
      bestDepth: Math.max(save.bestDepth, depth),
      artifacts: [...new Set([...save.artifacts, ...carried])],
      mastered: [...new Set([...save.mastered, ...Object.keys(runWins)])],
      conceptWins: wins,
    });
    setPhase("extracted");
  };

  const start = () => {
    setDepth(1); setLight(3); setShards(0); setCombo(0);
    setRelic(null); setCarried([]); setModifier(null);
    setRunWins({}); setRepairPicked(null);
    resetRoom();
    setPhase("room");
  };

  // ── Answer handler ──────────────────────────────────────────────────────────

  const answer = (choiceIndex: number) => {
    if (picked !== null || timedOut || choiceIndex === eliminated) return;
    setPicked(choiceIndex);

    const isCorrect = choiceIndex === question.answer;

    if (!isCorrect) {
      playTone("wrong");
      setCombo(0);
      setLight(v => Math.max(0, v - (modifier === "fortune" ? 2 : 1)));
      setTimeout(() => setPhase("repair"), 600);
      return;
    }

    playTone("correct");
    const nextCombo = combo + 1;
    setCombo(nextCombo);
    const earned = Math.round(
      (20 + depth * 5 + combo * 3) * (modifier === "fortune" ? 1.5 : 1),
    );
    setShards(v => v + earned);
    setRunWins(v => ({ ...v, [question.concept]: (v[question.concept] ?? 0) + 1 }));

    // Confetti every 3 correct in a row
    if (nextCombo > 0 && nextCombo % 3 === 0) {
      import("canvas-confetti").then(mod => {
        mod.default({
          particleCount: 50, spread: 70, origin: { y: 0.55 },
          colors: ["#fbbf24", "#34d399", "#60a5fa", "#f472b6"],
        });
      });
    }

    // Show relic on even floors, then decide next step
    if (depth % 2 === 0) {
      playTone("fanfare");
      const options = VAULT_ARTIFACTS.filter(a => !carried.includes(a.id));
      const found = options[(depth + nextCombo) % options.length] ?? VAULT_ARTIFACTS[0];
      setRelic(found);
      setCarried(v => [...v, found.id]);
      setTimeout(() => setPhase("relic"), 650);
    } else if (depth >= 8) {
      setTimeout(() => extract(), 700);
    } else {
      setTimeout(() => advance(depth), 700);
    }
  };

  /** Called when the user dismisses a relic card. */
  const afterRelic = () => {
    if (depth >= 8) { extract(); return; }
    advance(depth);
  };

  /** Repair question after a wrong answer. */
  const repair = (index: number) => {
    if (repairPicked !== null) return;
    setRepairPicked(index);
    if (index === question.repairAnswer) setShards(v => v + 10);
    setTimeout(() => {
      setRepairPicked(null);
      if (light <= 0) { setPhase("lost"); return; }
      if (depth >= 8) { extract(); return; }
      advance(depth);
    }, 700);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!ready) return <div className="min-h-screen bg-[#0a0a0f]" />;

  const timerPct = (timer / MAX_TIMER) * 100;
  const timerColor = timer > 6 ? "#06b6d4" : timer > 3 ? "#f59e0b" : "#ef4444";

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/8 bg-[#0a0a0f]/90 px-4 backdrop-blur-xl sm:px-6">
        <Link
          href="/game-shows"
          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} /> Exit
        </Link>
        <span
          className="text-2xl tracking-[0.12em] text-white"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          THE VAULT
        </span>
        <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-300">
          <Gem size={13} /> {save.shards}
        </span>
      </header>

      <AnimatePresence mode="wait">
        {phase === "home" && (
          <HomeScreen
            key="home"
            deck={deck}
            customSet={customSet}
            save={save}
            onDeck={setDeck}
            onStart={start}
          />
        )}

        {phase !== "home" && (
          <motion.div
            key={phase === "room" ? `room-${depth}` : phase}
            initial={{ opacity: 0, y: noMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="mx-auto max-w-2xl px-4 py-8 sm:px-6"
          >
            {(phase === "room" || phase === "repair") && (
              <Hud depth={depth} light={light} shards={shards} combo={combo} />
            )}

            {phase === "room" && (
              <RoomScreen
                question={question}
                order={order}
                picked={picked}
                timedOut={timedOut}
                eliminated={eliminated}
                modifier={modifier}
                timerPct={timerPct}
                timerColor={timerColor}
                timer={timer}
                onEcho={() => {
                  const bad = order.find(i => i !== question.answer);
                  if (bad !== undefined) setEliminated(bad);
                }}
                onAnswer={answer}
              />
            )}

            {phase === "repair" && (
              <RepairScreen
                question={question}
                picked={repairPicked}
                onPick={repair}
              />
            )}

            {phase === "shrine" && (
              <ShrineScreen
                depth={depth}
                shards={shards}
                active={modifier}
                onChoose={(next, extractNow) => {
                  setModifier(next);
                  if (next === "lantern") setLight(v => Math.min(4, v + 1));
                  if (extractNow) { extract(); return; }
                  resetRoom();
                  setPhase("room");
                }}
              />
            )}

            {phase === "relic" && relic && (
              <RelicScreen artifact={relic} onContinue={afterRelic} />
            )}

            {phase === "lost" && (
              <EndScreen
                lost
                shards={Math.floor(shards / 2)}
                depth={depth}
                onAgain={start}
                onHome={() => setPhase("home")}
              />
            )}

            {phase === "extracted" && (
              <EndScreen
                shards={shards}
                depth={depth}
                onAgain={start}
                onHome={() => setPhase("home")}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── HUD ──────────────────────────────────────────────────────────────────────

function Hud({ depth, light, shards, combo }: {
  depth: number; light: number; shards: number; combo: number;
}) {
  return (
    <div className="mb-6 flex items-center justify-between border-b border-white/8 pb-4">
      {/* Lives */}
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Heart
            key={i}
            size={16}
            className={i < light ? "fill-red-400 text-red-400" : "text-white/15"}
          />
        ))}
      </div>

      {/* Floor */}
      <div className="text-center">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Floor</div>
        <div className="text-lg font-black text-white" style={{ fontFamily: "var(--font-bebas)" }}>
          {depth} / 8
        </div>
      </div>

      {/* Shards + combo */}
      <div className="flex items-center gap-3">
        {combo >= 2 && (
          <motion.span
            key={combo}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-xs font-black text-orange-300"
          >
            <Flame size={13} /> {combo}×
          </motion.span>
        )}
        <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-300">
          <Gem size={13} /> {shards}
        </span>
      </div>
    </div>
  );
}

// ─── Room (question + answers) ────────────────────────────────────────────────

function RoomScreen({ question, order, picked, timedOut, eliminated, modifier, timerPct, timerColor, timer, onEcho, onAnswer }: {
  question: VaultQuestion;
  order: number[];
  picked: number | null;
  timedOut: boolean;
  eliminated: number | null;
  modifier: Modifier;
  timerPct: number;
  timerColor: string;
  timer: number;
  onEcho: () => void;
  onAnswer: (i: number) => void;
}) {
  const isAnswered = picked !== null || timedOut;

  return (
    <div>
      {/* Timer bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: timerColor }}
          animate={{ width: `${timerPct}%` }}
          transition={{ duration: 0.85, ease: "linear" }}
        />
      </div>

      {/* Subject + timer number */}
      <div className="mt-3 mb-5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {question.subject}
        </span>
        <motion.span
          className="text-sm font-black tabular-nums"
          style={{ color: timerColor }}
          animate={timer <= 3 && !isAnswered ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.6 }}
        >
          {timer}s
        </motion.span>
      </div>

      {/* Question text */}
      <h2 className="mb-7 text-xl font-bold leading-snug text-white sm:text-2xl">
        {question.prompt}
      </h2>

      {/* Echo lifeline */}
      {modifier === "echo" && eliminated === null && !isAnswered && (
        <button
          onClick={onEcho}
          className="mb-5 flex items-center gap-2 text-xs font-bold text-cyan-400 transition-colors hover:text-cyan-200"
        >
          <Zap size={13} /> Echo Lens — erase one wrong answer
        </button>
      )}

      {/* 2×2 answer grid */}
      <div className="grid grid-cols-2 gap-3">
        {order.map((choiceIndex, pos) => {
          const isCorrect = choiceIndex === question.answer;
          const isPicked = picked === choiceIndex;
          const isDead = eliminated === choiceIndex;

          let bg = ANSWER_COLORS[pos] as string;
          let borderColor = "transparent";
          let opacity = isDead ? 0.18 : 1;

          if (isAnswered && !isDead) {
            if (isCorrect) { bg = "#15803d"; borderColor = "#4ade80"; }
            else if (isPicked) { bg = "#991b1b"; borderColor = "#f87171"; }
            else { opacity = 0.35; }
          }

          return (
            <motion.button
              key={choiceIndex}
              onClick={() => onAnswer(choiceIndex)}
              disabled={isAnswered || isDead}
              style={{ background: bg, borderColor, opacity }}
              whileHover={!isAnswered && !isDead ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isAnswered && !isDead ? { scale: 0.97 } : {}}
              animate={isAnswered && isPicked && !isCorrect
                ? { x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.38 } }
                : {}
              }
              className="relative flex min-h-[90px] flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left text-white transition-opacity sm:min-h-[100px]"
            >
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                {ANSWER_LABELS[pos]}
              </span>
              <span className="text-sm font-semibold leading-snug sm:text-base">
                {isDead
                  ? <span className="opacity-25 line-through">{question.choices[choiceIndex]}</span>
                  : question.choices[choiceIndex]
                }
              </span>
              {isAnswered && isCorrect && (
                <Check size={16} className="absolute right-3 top-3" />
              )}
              {isAnswered && isPicked && !isCorrect && (
                <X size={16} className="absolute right-3 top-3 text-red-300" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Time-up message */}
      <AnimatePresence>
        {timedOut && (
          <motion.p
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm font-bold text-red-400"
          >
            Time&apos;s up — correct answer was{" "}
            <span className="text-white">{question.choices[question.answer]}</span>
          </motion.p>
        )}
      </AnimatePresence>

      {/* Explanation after answer */}
      <AnimatePresence>
        {picked !== null && (
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-5 border-l-2 border-cyan-500/40 pl-4 text-sm leading-relaxed text-slate-400"
          >
            {question.explanation}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Repair (misconception fix) ───────────────────────────────────────────────

function RepairScreen({ question, picked, onPick }: {
  question: VaultQuestion;
  picked: number | null;
  onPick: (i: number) => void;
}) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/15">
        <ShieldAlert size={28} className="text-fuchsia-300" />
      </div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-fuchsia-400">
        Glitch Detected
      </p>
      <h2 className="mb-3 max-w-md text-xl font-bold text-white">{question.repairPrompt}</h2>
      <p className="mb-8 max-w-sm text-sm leading-relaxed text-slate-500">{question.misconception}</p>

      <div className="grid w-full max-w-xs gap-3 sm:grid-cols-2">
        {question.repairChoices.map((choice, i) => (
          <motion.button
            key={choice}
            disabled={picked !== null}
            onClick={() => onPick(i)}
            whileHover={picked === null ? { scale: 1.02 } : {}}
            whileTap={picked === null ? { scale: 0.97 } : {}}
            className={`rounded-xl border-2 p-4 text-sm font-semibold text-white transition-colors ${
              picked === i
                ? i === question.repairAnswer
                  ? "border-emerald-400 bg-emerald-500/20"
                  : "border-red-400 bg-red-500/10"
                : "border-white/10 bg-white/5 hover:border-white/25"
            }`}
          >
            {choice}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Shrine (modifier choice + extract option) ─────────────────────────────────

function ShrineScreen({ depth, shards, active, onChoose }: {
  depth: number;
  shards: number;
  active: Modifier;
  onChoose: (mod: Exclude<Modifier, null>, extractNow: boolean) => void;
}) {
  const [picked, setPicked] = useState<Exclude<Modifier, null> | null>(null);

  const options: Array<{ id: Exclude<Modifier, null>; name: string; icon: string; desc: string }> = [
    { id: "echo", name: "Echo Lens", icon: "◉", desc: "Eliminate one wrong answer each floor." },
    { id: "fortune", name: "Fortune Oath", icon: "⚡", desc: "+50% shards earned. Mistakes cost 2 lives." },
    { id: "lantern", name: "Deep Lantern", icon: "🔦", desc: "Restore one lost life." },
  ];

  if (picked) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <Sparkles className="mb-4 text-violet-300" size={32} />
        <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-violet-400">Boon acquired</p>
        <h2 className="mb-2 text-4xl text-white" style={{ fontFamily: "var(--font-bebas)" }}>
          {options.find(o => o.id === picked)?.name}
        </h2>
        <p className="mb-10 text-sm text-slate-500">
          {options.find(o => o.id === picked)?.desc}
        </p>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            onClick={() => onChoose(picked, false)}
            className="rounded-xl bg-cyan-500 px-6 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-cyan-400 transition-colors"
          >
            Continue to Floor {depth + 1}
          </button>
          <button
            onClick={() => onChoose(picked, true)}
            className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-6 py-3.5 text-sm font-bold text-yellow-200 hover:bg-yellow-400/20 transition-colors"
          >
            Extract with {shards} shards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-violet-400">Shrine</p>
      <h2 className="mb-8 text-5xl text-white" style={{ fontFamily: "var(--font-bebas)" }}>
        CHOOSE A BOON
      </h2>
      <div className="flex w-full max-w-sm flex-col gap-3">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => setPicked(opt.id)}
            className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${
              active === opt.id
                ? "border-violet-400/60 bg-violet-400/15"
                : "border-white/10 bg-white/5 hover:border-violet-400/40 hover:bg-violet-400/10"
            }`}
          >
            <span className="text-2xl">{opt.icon}</span>
            <div>
              <div className="font-bold text-white">{opt.name}</div>
              <div className="mt-0.5 text-xs text-slate-500">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Relic ────────────────────────────────────────────────────────────────────

function RelicScreen({ artifact, onContinue }: { artifact: VaultArtifact; onContinue: () => void }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <p className="mb-6 text-[10px] font-black uppercase tracking-widest text-yellow-400">Relic Found</p>
      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="mb-6 flex h-36 w-36 items-center justify-center rounded-3xl border-2 border-yellow-300/25 bg-yellow-300/10 text-7xl shadow-[0_0_80px_rgba(234,179,8,0.18)]"
      >
        {artifact.glyph}
      </motion.div>
      <h2
        className="mb-2 text-4xl text-white"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        {artifact.name}
      </h2>
      <p className="mb-8 max-w-xs text-sm italic text-slate-500">
        &ldquo;{artifact.lore}&rdquo;
      </p>
      <button
        onClick={onContinue}
        className="rounded-xl bg-yellow-300 px-7 py-3.5 text-xs font-black uppercase tracking-widest text-black hover:bg-yellow-200 transition-colors"
      >
        Continue Descent
      </button>
    </div>
  );
}

// ─── End screen ───────────────────────────────────────────────────────────────

function EndScreen({ lost, shards, depth, onAgain, onHome }: {
  lost?: boolean;
  shards: number;
  depth: number;
  onAgain: () => void;
  onHome: () => void;
}) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border ${
          lost
            ? "border-red-400/30 bg-red-500/15"
            : "border-cyan-400/30 bg-cyan-400/15"
        }`}
      >
        {lost
          ? <Flame size={36} className="text-red-300" />
          : <Gem size={36} className="text-cyan-300" />
        }
      </motion.div>

      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
        {lost ? "Lantern Out · Floor " + depth : "Extracted · Floor " + depth}
      </p>
      <h2
        className="mb-4 text-6xl text-white"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        {lost ? "VAULT WINS." : "YOU MADE IT."}
      </h2>
      <p className="mb-8 text-slate-400">
        <span className="text-xl font-black text-yellow-300">{shards}</span>{" "}
        shards recovered.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onHome}
          className="rounded-xl border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors hover:bg-white/5"
        >
          Home
        </button>
        <button
          onClick={onAgain}
          className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition-colors hover:bg-white/90"
        >
          <RotateCcw size={13} /> Run Again
        </button>
      </div>
    </div>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────

function HomeScreen({ deck, customSet, save, onDeck, onStart }: {
  deck: string;
  customSet: VaultCustomSet | null;
  save: Save;
  onDeck: (v: string) => void;
  onStart: () => void;
}) {
  return (
    <section className="relative flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-6 py-16 text-center">
      {/* Subtle glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(6,182,212,0.07),transparent_55%)]" />

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <p className="mb-5 text-[10px] font-black uppercase tracking-[0.35em] text-cyan-400">
          Knowledge Descent
        </p>
        <h1
          className="text-[clamp(5rem,20vw,11rem)] leading-none text-white"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          THE
          <br />
          <span className="text-yellow-300">VAULT</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xs text-sm leading-relaxed text-slate-400">
          8 floors. 3 lives. 12 seconds per question.
          <br />
          Answer fast, build a combo, get out richer.
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="relative mt-10 flex w-full max-w-xs flex-col items-center gap-3"
      >
        <select
          value={deck}
          onChange={e => onDeck(e.target.value)}
          className="w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option>Mixed Descent</option>
          <option>World History</option>
          <option>Biology</option>
          <option>Algebra</option>
          {customSet && <option>{customSet.title}</option>}
        </select>

        <button
          onClick={onStart}
          className="w-full rounded-xl bg-yellow-300 py-4 text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-yellow-200 active:scale-[.98]"
        >
          Enter the Vault
        </button>

        <Link
          href="/vault/build"
          className="text-xs text-slate-600 transition-colors hover:text-slate-300"
        >
          Build a custom question set →
        </Link>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative mt-12 flex gap-10"
      >
        {[
          { label: "Deepest floor", value: save.bestDepth || 0, color: "text-cyan-300" },
          { label: "Total shards", value: save.shards, color: "text-yellow-300" },
          { label: "Relics held", value: save.artifacts.length, color: "text-violet-300" },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-600">
              {label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Depth indicator decoration */}
      <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
        <ChevronDown size={18} className="animate-bounce text-slate-700" />
      </div>
    </section>
  );
}
