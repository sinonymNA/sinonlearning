"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CapIcon from "@/components/capsule/CapIcon";
import type { Cap } from "@/lib/capsuleData";
import { CAPSULE_COST } from "@/lib/capsuleData";

type Phase = "idle" | "shaking" | "splitting" | "reveal" | "done";

const RARITY_COLOR: Record<string, string> = {
  common: "#94a3b8",
  rare:   "#60a5fa",
  epic:   "#a78bfa",
  mythic: "#fde047",
};

const RARITY_GLOW: Record<string, string> = {
  common: "rgba(148,163,184,0.3)",
  rare:   "rgba(96,165,250,0.4)",
  epic:   "rgba(167,139,250,0.5)",
  mythic: "rgba(253,224,71,0.6)",
};

export default function OpenPage() {
  const router = useRouter();
  const [coins, setCoins] = useState<number | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Cap | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/capsule/auth/me")
      .then(r => r.json())
      .then(d => {
        if (!d.user) { router.push("/capsule"); return; }
        setCoins(d.user.coins);
        setIsDemo(d.user.email?.endsWith("@capsule.demo") ?? false);
      });
  }, [router]);

  async function openCapsule() {
    if (phase !== "idle") return;
    setError("");
    setPhase("shaking");

    await delay(700);
    setPhase("splitting");

    const res = await fetch("/api/capsule/open", { method: "POST" });
    const data = await res.json() as { cap?: Cap; coins?: number; error?: string };

    if (!res.ok || !data.cap) {
      setPhase("idle");
      setError(data.error ?? "Something went wrong.");
      return;
    }

    await delay(600);
    setResult(data.cap);
    setCoins(data.coins ?? null);
    setPhase("reveal");

    await delay(400);
    setPhase("done");
  }

  function reset() {
    setResult(null);
    setPhase("idle");
    setError("");
  }

  const canOpen = (isDemo || (coins !== null && coins >= CAPSULE_COST)) && phase === "idle";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12" style={{ background: "#06163E" }}>

      {/* Header */}
      <Link href="/capsule" className="mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/capsule/logo.png" alt="Capsule" style={{ height: 56, objectFit: "contain" }} />
      </Link>

      {/* Coins display */}
      {coins !== null && (
        <div className="mb-8 flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/8 px-5 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 20, height: 20, objectFit: "contain" }} />
          <span className="text-sm font-black text-yellow-300">{coins} coins</span>
          <span className="text-xs text-yellow-300/40">· {CAPSULE_COST} per open</span>
        </div>
      )}

      {/* Stage */}
      <div className="relative flex h-72 w-72 items-center justify-center">

        {/* Background glow on reveal */}
        {(phase === "reveal" || phase === "done") && result && (
          <div
            style={{
              position: "absolute", inset: -40, borderRadius: "50%",
              background: `radial-gradient(circle, ${RARITY_GLOW[result.rarity]} 0%, transparent 70%)`,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        )}

        {/* Ball closed */}
        {(phase === "idle" || phase === "shaking") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/assets/capsule/space-ball-closed.png"
            alt="capsule"
            style={{
              width: 200,
              objectFit: "contain",
              animation: phase === "shaking" ? "shake 0.15s ease-in-out infinite" : undefined,
              filter: phase === "shaking" ? "drop-shadow(0 0 28px rgba(168,85,247,0.7))" : undefined,
            }}
          />
        )}

        {/* Ball splitting */}
        {phase === "splitting" && (
          <div style={{ position: "relative", width: 200, height: 220 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/capsule/space-ball-top.png"
              alt=""
              style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 160, objectFit: "contain",
                animation: "flyUp 0.5s ease-out forwards",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/capsule/space-ball-bottom.png"
              alt=""
              style={{
                position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: 160, objectFit: "contain",
                animation: "flyDown 0.5s ease-out forwards",
              }}
            />
          </div>
        )}

        {/* Cap reveal */}
        {(phase === "reveal" || phase === "done") && result && (
          <div
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
              animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            <CapIcon capId={result.id} size={160} />
          </div>
        )}
      </div>

      {/* Rarity + name on reveal */}
      {(phase === "reveal" || phase === "done") && result && (
        <div
          style={{
            marginTop: 24, textAlign: "center",
            animation: "fadeUp 0.4s ease-out 0.15s both",
          }}
        >
          <p
            className="mb-1 text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: RARITY_COLOR[result.rarity] }}
          >
            {result.rarity}
          </p>
          <p className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.06em" }}>
            {result.name}
          </p>
        </div>
      )}

      {/* CTA buttons */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs">
        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        {phase === "idle" || phase === "done" ? (
          <>
            {phase === "done" && (
              <Link
                href="/capsule/collection"
                className="w-full rounded-2xl border border-white/15 py-3.5 text-center text-sm font-bold text-white hover:bg-white/5"
              >
                View Collection
              </Link>
            )}
            <button
              onClick={phase === "done" ? reset : openCapsule}
              disabled={!canOpen && phase === "idle"}
              className="w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest text-[#06163E] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              style={{ background: "#19CDD2" }}
            >
              {phase === "done"
                ? (canOpen ? "Open Another" : `Need ${CAPSULE_COST} coins`)
                : canOpen
                  ? (isDemo ? "Open Capsule" : `Open Capsule · ${CAPSULE_COST} coins`)
                  : `Need ${CAPSULE_COST} coins`}
            </button>
            <Link href="/capsule" className="text-xs text-white/30 hover:text-white/50">← Back</Link>
          </>
        ) : (
          <p className="text-sm text-white/30 animate-pulse">Opening…</p>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-6px) rotate(-3deg); }
          40% { transform: translateX(6px) rotate(3deg); }
          60% { transform: translateX(-4px) rotate(-2deg); }
          80% { transform: translateX(4px) rotate(2deg); }
        }
        @keyframes flyUp {
          from { transform: translateX(-50%) translateY(0); opacity: 1; }
          to   { transform: translateX(-50%) translateY(-120px); opacity: 0; }
        }
        @keyframes flyDown {
          from { transform: translateX(-50%) translateY(0); opacity: 1; }
          to   { transform: translateX(-50%) translateY(80px); opacity: 0; }
        }
        @keyframes popIn {
          from { transform: scale(0.3); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
