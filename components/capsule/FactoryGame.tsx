"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import type { ChestResult } from "@/lib/capsuleData";

// ── Types ──────────────────────────────────────────────────────────────────
type FactoryPhase =
  | "question"     // factory idles, question overlaid
  | "activating"   // factory powers up (0.75 s flash)
  | "selecting"    // player picks one of 3 machines
  | "lever"        // lever pull (0.9 s)
  | "gears"        // gears spin + capsule forms (1.0 s)
  | "dropping"     // capsule falls to tray (0.7 s)
  | "shaking"      // capsule bounces (0.5 s)
  | "opening"      // capsule pops open + flash (0.6 s)
  | "reward"       // reward sprite shown (3 s)
  | "wrong"        // wrong-answer waiting state
  | "reaction"     // tap-the-capsule mini-game (4 s window)
  | "consolation"; // +3 gold result (success or fail)

type MachineColor = "blue" | "gold" | "red";

const ANSWER_BG = [
  "linear-gradient(180deg,#ff6b7a 0%,#d42035 100%)",
  "linear-gradient(180deg,#3dd9e8 0%,#0babbb 100%)",
  "linear-gradient(180deg,#ffd740 0%,#e6a800 100%)",
  "linear-gradient(180deg,#c274ff 0%,#8b2fd6 100%)",
];
const ANSWER_SHADOW = ["#9a1525", "#067a88", "#a07500", "#5a0090"];
const ANSWER_LABELS = ["A", "B", "C", "D"];

const MACHINE_ACCENT: Record<MachineColor, string> = {
  blue: "#19CDD2", gold: "#fde047", red: "#ef4444",
};
const MACHINE_LABEL: Record<MachineColor, string> = {
  blue: "⚡ VOLT", gold: "★ AURUM", red: "♦ RUBY",
};

function rewardSprite(r: ChestResult): string {
  if (r.type === "gold") return r.amount >= 150 ? "reward-gold-big" : "reward-gold";
  if (r.type === "steal") return "reward-steal";
  if (r.type === "lose") return "reward-lose";
  if (r.type === "double") return "reward-double";
  return "reward-gold";
}

// ── CSS animations injected once ──────────────────────────────────────────
const FACTORY_CSS = `
@keyframes fc-conveyor{to{transform:translateX(-50%)}}
@keyframes fc-pulley{to{transform:rotate(360deg)}}
@keyframes fc-sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes fc-beacon{0%,100%{opacity:.25}50%{opacity:.95}}
@keyframes fc-cablesway{0%,100%{transform:rotate(-1.5deg)translateY(0)}50%{transform:rotate(1.5deg)translateY(2px)}}
@keyframes fc-steam{0%{opacity:0;transform:scale(.5)translateY(0)}20%{opacity:.9}80%{opacity:.5}100%{opacity:0;transform:scale(1.3)translateY(-36px)}}
@keyframes fc-lever{0%{transform-origin:50% 100%;transform:rotate(0deg)}100%{transform-origin:50% 100%;transform:rotate(155deg)}}
@keyframes fc-gear{to{transform:rotate(360deg)}}
@keyframes fc-gearctr{to{transform:rotate(-360deg)}}
@keyframes fc-drop{0%{transform:translateY(-80px);opacity:0}60%{transform:translateY(6px)}80%{transform:translateY(-4px)}100%{transform:translateY(0);opacity:1}}
@keyframes fc-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-5px)}80%{transform:translateX(4px)}}
@keyframes fc-capopen{0%{transform:translateY(0)opacity:1}100%{transform:translateY(-60px);opacity:0}}
@keyframes fc-flash{0%{opacity:.9}100%{opacity:0}}
@keyframes fc-rewardpop{0%{transform:scale(0)rotate(-15deg)}60%{transform:scale(1.15)rotate(4deg)}100%{transform:scale(1)rotate(0deg)}}
@keyframes fc-activeglow{0%,100%{box-shadow:0 0 20px 4px rgba(253,224,71,0.3)}50%{box-shadow:0 0 40px 12px rgba(253,224,71,0.7)}}
@keyframes fc-capsule-bounce{0%{transform:translateX(0) translateY(0)}25%{transform:translateX(60px) translateY(-18px)}50%{transform:translateX(120px) translateY(0)}75%{transform:translateX(60px) translateY(-18px)}100%{transform:translateX(0) translateY(0)}}
`;

// ── Sub-components ────────────────────────────────────────────────────────

function Img({ name, alt = "", style }: { name: string; alt?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/assets/capsule/game/${name}.png`} alt={alt} style={{ objectFit: "contain", ...style }} />;
}

function FactoryIdle({ active }: { active: boolean }) {
  const bright = active ? 1 : 0.55;
  const speed = active ? 0.8 : 1.8;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {/* Conveyor — scrolling band at bottom */}
      <div style={{ position: "absolute", bottom: "2%", left: "2%", overflow: "hidden", width: "32%", height: "14%" }}>
        <div style={{ display: "flex", width: "200%", animationName: "fc-conveyor", animationDuration: `${speed}s`, animationTimingFunction: "linear", animationIterationCount: "infinite" }}>
          <Img name="factory-conveyor" style={{ width: "50%", opacity: bright, flexShrink: 0 }} />
          <Img name="factory-conveyor" style={{ width: "50%", opacity: bright, flexShrink: 0 }} />
        </div>
      </div>
      {/* Pulley — upper left area */}
      <Img name="factory-pulley" style={{
        position: "absolute", top: "6%", left: "16%", width: "12%", opacity: bright,
        animationName: "fc-pulley", animationDuration: `${speed * 1.5}s`,
        animationTimingFunction: "linear", animationIterationCount: "infinite",
      }} />
      {/* Robot arm — upper center-right */}
      <Img name="factory-robot-arm" style={{
        position: "absolute", top: "2%", right: "28%", width: "18%", opacity: bright,
        animationName: "fc-sway", animationDuration: "3.2s",
        animationTimingFunction: "ease-in-out", animationIterationCount: "infinite",
        transformOrigin: "50% 0%",
      }} />
      {/* Beacon — far right */}
      <Img name="factory-beacon" style={{
        position: "absolute", top: "8%", right: "4%", width: "7%", opacity: bright,
        animationName: "fc-beacon", animationDuration: "2.0s",
        animationTimingFunction: "ease-in-out", animationIterationCount: "infinite",
      }} />
      {/* Cable — hangs from upper area */}
      <Img name="factory-cable" style={{
        position: "absolute", top: 0, left: "8%", width: "4%", opacity: bright * 0.75,
        animationName: "fc-cablesway", animationDuration: "4.5s",
        animationTimingFunction: "ease-in-out", animationIterationCount: "infinite",
        transformOrigin: "50% 0%",
      }} />
      {/* Steam puff — periodic via CSS animation delay */}
      <Img name="factory-steam" style={{
        position: "absolute", top: "25%", right: "30%", width: "8%",
        animationName: "fc-steam", animationDuration: "2.8s",
        animationTimingFunction: "ease-out", animationIterationCount: "infinite", animationDelay: "0.5s",
      }} />
      <Img name="factory-steam" style={{
        position: "absolute", top: "20%", right: "26%", width: "6%",
        animationName: "fc-steam", animationDuration: "2.2s",
        animationTimingFunction: "ease-out", animationIterationCount: "infinite", animationDelay: "1.4s",
      }} />
    </div>
  );
}

function MachineCard({ color, index, onSelect }: { color: MachineColor; index: number; onSelect: () => void }) {
  const accent = MACHINE_ACCENT[color];
  const label = MACHINE_LABEL[color];
  return (
    <motion.button
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      transition={{ type: "spring", damping: 18, stiffness: 240, delay: index * 0.10 }}
      whileTap={{ scale: 0.92 }}
      onClick={onSelect}
      style={{
        position: "relative", background: "none", border: "none", padding: 0, cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      }}
    >
      {/* Machine body (stacked layers) */}
      <div style={{ position: "relative", width: 240, height: 355 }}>
        <Img name={`machine-${color}`} style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", height: "100%", filter: `drop-shadow(0 0 18px ${accent}66)` }} />
        <Img name={`machine-window-${color}`} style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", width: "58%" }} />
        <Img name={`machine-lever-${color}`} style={{ position: "absolute", top: "8%", right: "4%", width: "28%", transformOrigin: "50% 90%" }} />
        <Img name={`machine-lights-${color}`} style={{ position: "absolute", bottom: "28%", left: "6%", width: "38%" }} />
      </div>
      {/* Label */}
      <div style={{
        fontSize: 13, fontWeight: 900, letterSpacing: "0.10em", color: accent,
        background: `${accent}18`, borderRadius: 6, padding: "4px 14px",
        border: `1px solid ${accent}40`,
      }}>
        {label}
      </div>
    </motion.button>
  );
}

function AnimatingMachine({
  color, step, chestResult,
}: { color: MachineColor; step: number; chestResult: ChestResult | null }) {
  const accent = MACHINE_ACCENT[color];
  const isOpen = step >= 4;

  const windowBg = color === "blue" ? "#04091a" : color === "gold" ? "#120c00" : "#120404";

  return (
    <div style={{ position: "relative", width: 380, height: 532, margin: "0 auto" }}>
      {/* Machine body */}
      <Img name={`machine-${color}`} style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", height: "85%", filter: `drop-shadow(0 0 28px ${accent}90)` }} />

      {/* Window — dark interior so gears don't show on transparent/checkered bg */}
      <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", width: "52%", height: "30%", overflow: "hidden", borderRadius: 6, background: windowBg }}>
        <Img name={`machine-window-${color}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2 }} />
        {step >= 1 && (
          <>
            <Img name="gear-large" style={{
              position: "absolute", left: "5%", top: "10%", width: "55%", zIndex: 1,
              animationName: "fc-gear", animationDuration: "0.5s",
              animationTimingFunction: "linear", animationIterationCount: "infinite",
            }} />
            <Img name="gear-small" style={{
              position: "absolute", right: "5%", bottom: "5%", width: "38%", zIndex: 1,
              animationName: "fc-gearctr", animationDuration: "0.35s",
              animationTimingFunction: "linear", animationIterationCount: "infinite",
            }} />
          </>
        )}
      </div>

      {/* Lever — rotates at step 0 */}
      <Img name={`machine-lever-${color}`} style={{
        position: "absolute", top: "10%", right: "2%", width: "22%",
        transformOrigin: "50% 90%",
        animationName: step >= 0 ? "fc-lever" : undefined,
        animationDuration: "0.85s",
        animationTimingFunction: "cubic-bezier(.6,0,.4,1)",
        animationFillMode: "forwards",
        animationIterationCount: 1,
      }} />

      {/* Lights active */}
      <Img name={`machine-lights-${color}`} style={{
        position: "absolute", bottom: "28%", left: "4%", width: "32%",
        animationName: step >= 0 ? "fc-beacon" : undefined,
        animationDuration: "0.4s", animationIterationCount: "infinite",
      }} />

      {/* Tray */}
      <Img name={`machine-tray-${color}`} style={{ position: "absolute", bottom: "2%", left: "50%", transform: "translateX(-50%)", width: "60%" }} />

      {/* Capsule falling — step 2 */}
      {step >= 2 && !isOpen && (
        <Img name="capsule-closed" style={{
          position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", width: "30%",
          animationName: step === 3 ? "fc-shake" : "fc-drop",
          animationDuration: step === 3 ? "0.5s" : "0.65s",
          animationTimingFunction: "ease-out",
          animationFillMode: "forwards",
        }} />
      )}

      {/* Capsule opening — step 4 */}
      {isOpen && (
        <>
          {/* Dust puff */}
          <Img name="dust-puff" style={{
            position: "absolute", bottom: "12%", left: "50%", transform: "translateX(-50%)", width: "45%",
            animationName: "fc-flash", animationDuration: "0.6s", animationFillMode: "forwards",
          }} />
          {/* Flash burst */}
          <Img name="flash-burst" style={{
            position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%)", width: "55%",
            animationName: "fc-flash", animationDuration: "0.5s", animationFillMode: "forwards",
          }} />
          {/* Capsule top flying off */}
          <Img name="capsule-open-top" style={{
            position: "absolute", bottom: "20%", left: "50%", transform: "translateX(-50%)", width: "28%",
            animationName: "fc-capopen", animationDuration: "0.55s", animationFillMode: "forwards",
          }} />
          {/* Capsule bottom stays */}
          <Img name="capsule-bottom" style={{
            position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)", width: "28%",
          }} />
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

interface Props {
  question: { prompt: string; choices: string[]; timeLimit: number } | null;
  answered: boolean;
  myAnswer: { isCorrect: boolean; chestResult: ChestResult | null } | null;
  timer: number;
  currentQuestion: number;
  onSubmit: (i: number) => void;
  onResolve: (machine: MachineColor) => Promise<void>;
  onConsolation: () => Promise<void>;
}

export default function FactoryGame({
  question, answered, myAnswer, timer, currentQuestion, onSubmit, onResolve, onConsolation,
}: Props) {
  const [phase, setPhase] = useState<FactoryPhase>("question");
  const [selectedMachine, setSelectedMachine] = useState<MachineColor | null>(null);
  const [animStep, setAnimStep] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [reactionTimeLeft, setReactionTimeLeft] = useState(4);
  const [consolationResult, setConsolationResult] = useState<"success" | "fail" | null>(null);
  const prevAnswered = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resolvePromiseRef = useRef<Promise<void> | null>(null);

  function clearTimers() {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  }

  function after(ms: number, fn: () => void) {
    const id = setTimeout(fn, ms);
    timerRef.current.push(id);
  }

  // Reset on new question
  useEffect(() => {
    prevAnswered.current = false;
    clearTimers();
    setPhase("question");
    setSelectedMachine(null);
    setAnimStep(0);
    setTapCount(0);
    setReactionTimeLeft(4);
    setConsolationResult(null);
    resolvePromiseRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  // Trigger when answer arrives
  useEffect(() => {
    if (!myAnswer || prevAnswered.current) return;
    prevAnswered.current = true;

    if (myAnswer.isCorrect) {
      setPhase("activating");
      after(750, () => setPhase("selecting"));
    } else {
      setPhase("wrong");
      after(1500, () => {
        setTapCount(0);
        setReactionTimeLeft(4);
        setConsolationResult(null);
        setPhase("reaction");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myAnswer]);

  // Reaction phase: countdown timer
  useEffect(() => {
    if (phase !== "reaction") return;
    if (reactionTimeLeft <= 0) {
      setConsolationResult("fail");
      setPhase("consolation");
      after(2000, () => setPhase("wrong"));
      return;
    }
    const id = setTimeout(() => setReactionTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reactionTimeLeft]);

  async function handleCapsuleTap() {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 3) {
      resolvePromiseRef.current = onConsolation();
      await resolvePromiseRef.current;
      setConsolationResult("success");
      setPhase("consolation");
      confetti({ particleCount: 50, spread: 55, origin: { y: 0.6 }, colors: ["#19CDD2","#fde047","#fff"] });
      after(2000, () => setPhase("wrong"));
    }
  }

  async function selectMachine(color: MachineColor) {
    setSelectedMachine(color);
    setPhase("lever");
    setAnimStep(0);
    // Fire resolve immediately — result arrives while 3.6s animation plays
    resolvePromiseRef.current = onResolve(color);
    after(900, () => { setPhase("gears"); setAnimStep(1); });
    after(1800, () => { setPhase("dropping"); setAnimStep(2); });
    after(2500, () => { setPhase("shaking"); setAnimStep(3); });
    after(3000, () => { setPhase("opening"); setAnimStep(4); });
    after(3600, async () => {
      await resolvePromiseRef.current;
      setPhase("reward");
      if (myAnswer?.chestResult?.type === "gold" || myAnswer?.chestResult?.type === "double") {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 }, colors: ["#fde047","#fbbf24","#f59e0b","#fff"], shapes: ["circle"], scalar: 1.1, gravity: 1.0 });
      }
    });
  }

  const isAnimPhase = ["lever", "gears", "dropping", "shaking", "opening"].includes(phase);
  const timerColor = timer > 8 ? "#22c55e" : timer > 4 ? "#eab308" : "#ef4444";

  return (
    <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
      {/* CSS keyframes */}
      <style dangerouslySetInnerHTML={{ __html: FACTORY_CSS }} />

      {/* Factory background layer — always present */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Img name="factory-bg" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center bottom" }} />
        {/* Darkening overlay during question */}
        <div style={{
          position: "absolute", inset: 0,
          background: phase === "question" || phase === "wrong"
            ? "rgba(4,10,32,0.62)"
            : phase === "activating"
            ? "rgba(253,224,71,0.12)"
            : "rgba(4,10,32,0.20)",
          transition: "background 0.4s ease",
        }} />
        <FactoryIdle active={isAnimPhase || phase === "selecting" || phase === "activating" || phase === "reward"} />
      </div>

      {/* Content layer */}
      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">

          {/* ── QUESTION phase ── */}
          {(phase === "question" || phase === "wrong") && question && (
            <motion.div
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", padding: "18px 16px 14px" }}
            >
              {/* Question header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(25,205,210,0.65)" }}>
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
              <div style={{ flex: 1, marginBottom: 16 }}>
                <h2 style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.4, color: "#fff", margin: 0 }}>
                  {question.prompt}
                </h2>
              </div>

              {/* Wrong answer state */}
              {phase === "wrong" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingBottom: 16 }}>
                  <motion.img
                    src="/assets/capsule/game/badge-wrong.png"
                    alt="Wrong"
                    initial={{ x: -24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 14 }}
                    style={{ height: 60, objectFit: "contain" }}
                  />
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#f87171" }}>Waiting for next question…</p>
                </div>
              )}

              {/* Answer buttons */}
              {!answered && (
                <motion.div
                  key={`q-${currentQuestion}`}
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } }}
                  style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
                >
                  {question.choices.map((choice, i) => (
                    <motion.button
                      key={i}
                      variants={{
                        hidden: { y: 28, opacity: 0, scale: 0.95 },
                        visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring" as const, damping: 18, stiffness: 280 } },
                      }}
                      whileTap={{ scale: 0.89, boxShadow: "none" }}
                      onClick={() => onSubmit(i)}
                      style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "space-between",
                        minHeight: 110, borderRadius: 18, border: "none",
                        padding: "6px 8px 12px",
                        background: ANSWER_BG[i],
                        boxShadow: `0 5px 0 ${ANSWER_SHADOW[i]}`,
                        cursor: "pointer",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/assets/capsule/game/answer-btn-${ANSWER_LABELS[i].toLowerCase()}.png`}
                        alt={ANSWER_LABELS[i]}
                        style={{ width: "88%", maxWidth: 140, objectFit: "contain", pointerEvents: "none" }}
                      />
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: "#fff",
                        textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                        textAlign: "center", lineHeight: 1.3, padding: "0 4px",
                      }}>
                        {choice}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {answered && phase === "question" && (
                <div style={{ display: "flex", justifyContent: "center", paddingBottom: 20 }}>
                  <motion.img
                    src="/assets/capsule/game/badge-correct.png"
                    alt="Correct!"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 260 }}
                    style={{ height: 52, objectFit: "contain" }}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* ── ACTIVATING phase ── */}
          {phase === "activating" && (
            <motion.div
              key="activating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.4, repeat: 1 }}
                style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.25em", textTransform: "uppercase", color: "#fde047" }}
              >
                FACTORY ACTIVATED
              </motion.div>
              <motion.div
                animate={{ scaleX: [0, 1.1, 1] }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                style={{ height: 3, width: 160, background: "linear-gradient(90deg, transparent, #fde047, transparent)", borderRadius: 2 }}
              />
            </motion.div>
          )}

          {/* ── SELECTING phase ── */}
          {phase === "selecting" && (
            <motion.div
              key="selecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "16px 12px" }}
            >
              <motion.p
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.20em", textTransform: "uppercase", color: "#fde047", margin: 0 }}
              >
                PICK A MACHINE
              </motion.p>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-end", justifyContent: "center" }}>
                {(["blue", "gold", "red"] as MachineColor[]).map((color, i) => (
                  <MachineCard key={color} color={color} index={i} onSelect={() => selectMachine(color)} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── ANIMATION phases (lever → gears → dropping → shaking → opening) ── */}
          {isAnimPhase && selectedMachine && (
            <motion.div
              key="animating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}
            >
              <AnimatingMachine color={selectedMachine} step={animStep} chestResult={myAnswer?.chestResult ?? null} />
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: MACHINE_ACCENT[selectedMachine], margin: 0 }}>
                {phase === "lever" && "PULLING LEVER…"}
                {phase === "gears" && "PROCESSING…"}
                {phase === "dropping" && "INCOMING…"}
                {(phase === "shaking" || phase === "opening") && ""}
              </p>
            </motion.div>
          )}

          {/* ── REWARD phase ── */}
          {phase === "reward" && myAnswer?.chestResult && (
            <motion.div
              key="reward"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}
            >
              <motion.img
                src={`/assets/capsule/game/${rewardSprite(myAnswer.chestResult)}.png`}
                alt="reward"
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10, stiffness: 220 }}
                style={{ width: 140, objectFit: "contain", filter: "drop-shadow(0 0 20px rgba(253,224,71,0.5))" }}
              />
              <motion.p
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                style={{ fontSize: 20, fontWeight: 900, color: "#fff", textAlign: "center", margin: 0, padding: "0 16px" }}
              >
                {myAnswer.chestResult.label}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", margin: 0 }}
              >
                Waiting for teacher to advance…
              </motion.p>
            </motion.div>
          )}

          {/* ── REACTION phase — tap the bouncing capsule ── */}
          {phase === "reaction" && (
            <motion.div
              key="reaction"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "16px 20px", position: "relative", overflow: "hidden" }}
            >
              <p style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.20em", textTransform: "uppercase", color: "#fde047", margin: 0, textAlign: "center" }}>
                QUICK — TAP THE CAPSULE!
              </p>

              {/* Bouncing capsule button */}
              <div style={{ position: "relative", width: "100%", height: 80, overflow: "hidden" }}>
                <button
                  onClick={handleCapsuleTap}
                  style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    position: "absolute", left: "15%",
                    animationName: "fc-capsule-bounce", animationDuration: "1.2s",
                    animationTimingFunction: "ease-in-out", animationIterationCount: "infinite",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/capsule/game/capsule-closed.png" alt="Capsule" style={{ width: 52, objectFit: "contain", filter: "drop-shadow(0 0 10px rgba(25,205,210,0.6))" }} />
                </button>
              </div>

              {/* Tap counter */}
              <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>
                {tapCount} / 3
              </p>

              {/* Countdown bar */}
              <div style={{ width: "80%", height: 6, background: "rgba(255,255,255,0.10)", borderRadius: 3, overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${(reactionTimeLeft / 4) * 100}%` }}
                  transition={{ duration: 0.9, ease: "linear" }}
                  style={{ height: "100%", background: reactionTimeLeft > 2 ? "#22c55e" : "#ef4444", borderRadius: 3 }}
                />
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>{reactionTimeLeft}s left</p>
            </motion.div>
          )}

          {/* ── CONSOLATION phase — result of reaction game ── */}
          {phase === "consolation" && (
            <motion.div
              key="consolation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}
            >
              {consolationResult === "success" ? (
                <>
                  <motion.img
                    src="/assets/capsule/game/badge-correct.png"
                    alt="Nice!"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 260 }}
                    style={{ height: 60, objectFit: "contain" }}
                  />
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#22c55e", margin: 0 }}>+3 Gold! NICE REFLEXES!</p>
                </>
              ) : (
                <>
                  <motion.img
                    src="/assets/capsule/game/badge-wrong.png"
                    alt="Miss"
                    initial={{ x: -24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: "spring", damping: 14 }}
                    style={{ height: 60, objectFit: "contain" }}
                  />
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#f87171", margin: 0 }}>Better luck next time…</p>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
