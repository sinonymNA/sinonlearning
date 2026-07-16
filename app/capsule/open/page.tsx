"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { animate, stagger } from "animejs";
import confetti from "canvas-confetti";
import CapIcon from "@/components/capsule/CapIcon";
import type { Cap } from "@/lib/capsuleData";
import { CAPSULE_SETS } from "@/lib/capsuleData";

type Phase = "idle" | "shaking" | "splitting" | "reveal" | "done";

const RARITY_CONFETTI: Record<string, { colors: string[]; count: number; shapes: confetti.Shape[] }> = {
  common: { colors: ["#fff", "#94a3b8", "#e2e8f0"], count: 40,  shapes: ["circle"] },
  rare:   { colors: ["#60a5fa", "#3b82f6", "#bfdbfe", "#fff"], count: 70,  shapes: ["circle"] },
  epic:   { colors: ["#a78bfa", "#8b5cf6", "#ddd6fe", "#fff", "#c4b5fd"], count: 100, shapes: ["circle", "square"] },
  mythic: { colors: ["#fde047", "#fbbf24", "#fff", "#fef3c7", "#f59e0b"],  count: 140, shapes: ["star", "circle"] },
};

function fireRevealConfetti(rarity: string) {
  const cfg = RARITY_CONFETTI[rarity] ?? RARITY_CONFETTI.common;
  confetti({
    particleCount: cfg.count,
    spread: 80,
    origin: { y: 0.55 },
    colors: cfg.colors,
    shapes: cfg.shapes,
    scalar: rarity === "mythic" ? 1.3 : 1.1,
    startVelocity: 28,
    gravity: 0.9,
  });
  // Second burst slightly offset for mythic
  if (rarity === "mythic" || rarity === "epic") {
    setTimeout(() => {
      confetti({
        particleCount: Math.round(cfg.count * 0.5),
        spread: 50,
        origin: { y: 0.50, x: 0.3 + Math.random() * 0.4 },
        colors: cfg.colors,
        shapes: cfg.shapes,
        scalar: 1.0,
      });
    }, 200);
  }
}

function OpenPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setId = params.get("set") ?? "classic";
  const capsuleSet = CAPSULE_SETS.find(s => s.id === setId) ?? CAPSULE_SETS[0];

  const [coins, setCoins] = useState<number | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Cap | null>(null);
  const [error, setError] = useState("");

  const ballRef = useRef<HTMLImageElement>(null);
  const sparkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/capsule/auth/me").then(r => r.json()).then(d => {
      if (!d.user) { router.push("/capsule"); return; }
      setCoins(d.user.coins);
      setIsDemo(d.user.email?.endsWith("@capsule.demo") ?? false);
    });
  }, [router]);

  function spawnSparks() {
    if (!ballRef.current) return;
    const rect = ballRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const sparkColors = [capsuleSet.accentColor, "#19CDD2", "#ffffff", capsuleSet.accentColor, "#fff"];
    const count = 8;
    const sparks: HTMLDivElement[] = [];

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      const color = sparkColors[i % sparkColors.length];
      const sz = 3 + Math.random() * 6;
      el.style.cssText = [
        "position:fixed",
        `left:${cx}px`,
        `top:${cy}px`,
        `width:${sz}px`,
        `height:${sz}px`,
        "border-radius:50%",
        `background:${color}`,
        `box-shadow:0 0 ${sz * 2}px ${color}`,
        "pointer-events:none",
        "z-index:9999",
        "transform:translate(-50%,-50%)",
      ].join(";");
      document.body.appendChild(el);
      sparks.push(el);
    }

    const angles = sparks.map(() => Math.random() * Math.PI * 2);
    const dists  = sparks.map(() => 45 + Math.random() * 90);

    animate(sparks, {
      translateX: sparks.map((_, i) => Math.cos(angles[i]) * dists[i]),
      translateY: sparks.map((_, i) => Math.sin(angles[i]) * dists[i]),
      opacity: [{ value: 1, duration: 50 }, { value: 0, duration: 500 }],
      scale:   [{ value: 1.3, duration: 60 }, { value: 0, duration: 480 }],
      duration: 580,
      easing: "outQuad",
      delay: stagger(22),
      onComplete: () => sparks.forEach(el => el.remove()),
    });
  }

  async function openCapsule() {
    if (phase !== "idle") return;
    setError("");
    setPhase("shaking");

    // Emit sparks on a tight interval during shake
    sparkTimerRef.current = setInterval(spawnSparks, 110);

    const res = await fetch("/api/capsule/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ set: setId }),
    });
    const data = await res.json() as { cap?: Cap; coins?: number; error?: string };

    clearInterval(sparkTimerRef.current!);
    sparkTimerRef.current = null;

    if (!res.ok || !data.cap) {
      setPhase("idle");
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setPhase("splitting");
    await delay(600);

    setResult(data.cap);
    setCoins(data.coins ?? null);
    setPhase("reveal");

    // Fire confetti after a brief pause so the cap is visible first
    setTimeout(() => fireRevealConfetti(data.cap!.rarity), 180);

    await delay(400);
    setPhase("done");
  }

  function reset() { setResult(null); setPhase("idle"); setError(""); }

  const canOpen = (isDemo || (coins !== null && coins >= capsuleSet.cost)) && phase === "idle";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12" style={{ background: "#06163E" }}>

      {/* Header */}
      <Link href="/capsule/store" className="mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/capsule/logo.png" alt="Capsule" style={{ height: 56, objectFit: "contain", filter: "drop-shadow(0 2px 12px rgba(25,205,210,0.4))" }} />
      </Link>

      {/* Set label */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: capsuleSet.accentColor }}>
          {capsuleSet.name} Set
        </span>
      </div>

      {/* Coins display */}
      {coins !== null && (
        <div className="mb-8 flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/8 px-5 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 20, height: 20, objectFit: "contain" }} />
          <span className="text-sm font-black text-yellow-300">{isDemo ? "∞" : coins} coins</span>
          {!isDemo && <span className="text-xs text-yellow-300/40">· {capsuleSet.cost} per open</span>}
        </div>
      )}

      {/* Stage */}
      <div className="relative flex items-center justify-center" style={{ width: 288, height: 288 }}>

        {/* Background glow on reveal */}
        <AnimatePresence>
          {(phase === "reveal" || phase === "done") && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute", inset: -48, borderRadius: "50%",
                background: `radial-gradient(circle, ${RARITY_GLOW[result.rarity]} 0%, transparent 70%)`,
                animation: "cap-pulse 1.8s ease-in-out infinite",
              }}
            />
          )}
        </AnimatePresence>

        {/* Ball closed — shakes via CSS, sparks via anime.js */}
        <AnimatePresence>
          {(phase === "idle" || phase === "shaking") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ position: "absolute" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={ballRef}
                src={capsuleSet.ballClosed}
                alt="capsule"
                style={{
                  width: 200, objectFit: "contain",
                  animation: phase === "shaking" ? "shake 0.14s ease-in-out infinite" : undefined,
                  filter: phase === "shaking" ? `drop-shadow(0 0 28px ${capsuleSet.glowColor}) drop-shadow(0 0 56px ${capsuleSet.glowColor})` : undefined,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ball splitting */}
        <AnimatePresence>
          {phase === "splitting" && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "absolute", width: 200, height: 220 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capsuleSet.ballTop} alt="" style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 160, objectFit: "contain",
                animation: "flyUp 0.5s ease-out forwards",
              }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capsuleSet.ballBottom} alt="" style={{
                position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: 160, objectFit: "contain",
                animation: "flyDown 0.5s ease-out forwards",
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cap reveal — spring pop with framer-motion */}
        <AnimatePresence>
          {(phase === "reveal" || phase === "done") && result && (
            <motion.div
              initial={{ scale: 0.15, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 11, stiffness: 220, mass: 0.8 }}
              style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <CapIcon capId={result.id} size={160} animated />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rarity + name on reveal */}
      <AnimatePresence>
        {(phase === "reveal" || phase === "done") && result && (
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18, type: "spring", damping: 20 }}
            style={{ marginTop: 28, textAlign: "center" }}
          >
            <p className="mb-1 text-xs font-black uppercase tracking-[0.2em]" style={{ color: RARITY_COLOR[result.rarity] }}>
              {result.rarity}
            </p>
            <p className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.06em" }}>
              {result.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs">
        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        {phase === "idle" || phase === "done" ? (
          <>
            {phase === "done" && (
              <Link href="/capsule/collection" className="w-full rounded-2xl border border-white/15 py-3.5 text-center text-sm font-bold text-white hover:bg-white/5">
                View Collection
              </Link>
            )}
            <button
              onClick={phase === "done" ? reset : openCapsule}
              disabled={!canOpen && phase === "idle"}
              className="w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-[#06163E] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: capsuleSet.accentColor }}
            >
              {phase === "done"
                ? (canOpen ? "Open Another" : `Need ${capsuleSet.cost} coins`)
                : canOpen
                  ? (isDemo ? `Open ${capsuleSet.name} Capsule` : `Open · ${capsuleSet.cost} coins`)
                  : `Need ${capsuleSet.cost} coins`}
            </button>
            <Link href="/capsule/store" className="text-xs text-white/30 hover:text-white/50">← Back to Store</Link>
          </>
        ) : (
          <p className="text-sm text-white/30 animate-pulse">Opening…</p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform:translateX(0) rotate(0deg); }
          20%      { transform:translateX(-7px) rotate(-4deg); }
          40%      { transform:translateX(7px)  rotate(4deg); }
          60%      { transform:translateX(-5px) rotate(-2deg); }
          80%      { transform:translateX(5px)  rotate(2deg); }
        }
        @keyframes flyUp   { from{transform:translateX(-50%) translateY(0);opacity:1}   to{transform:translateX(-50%) translateY(-130px);opacity:0} }
        @keyframes flyDown { from{transform:translateX(-50%) translateY(0);opacity:1}   to{transform:translateX(-50%) translateY(90px);opacity:0} }
      `}</style>
    </div>
  );
}

const RARITY_COLOR: Record<string, string> = {
  common: "#94a3b8", rare: "#60a5fa", epic: "#a78bfa", mythic: "#fde047",
};
const RARITY_GLOW: Record<string, string> = {
  common: "rgba(148,163,184,0.35)",
  rare:   "rgba(96,165,250,0.45)",
  epic:   "rgba(167,139,250,0.55)",
  mythic: "rgba(253,224,71,0.65)",
};

export default function OpenPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#06163E" }} />}>
      <OpenPageInner />
    </Suspense>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
