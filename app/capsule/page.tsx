"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CapIcon from "@/components/capsule/CapIcon";

interface Me {
  id: string; email: string; username: string; role: string; equippedCapId: string; coins: number;
}

/* Sprite-image button — wraps <img> in a pressable element */
function SpriteBtn({
  src, alt, onClick, disabled, style,
}: {
  src: string; alt: string;
  onClick?: () => void; disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.93, y: 4 }}
      style={{
        background: "none", border: "none", padding: 0, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1, display: "block",
        ...style,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }} draggable={false} />
    </motion.button>
  );
}

function SpriteLink({ src, alt, href, style }: { src: string; alt: string; href: string; style?: React.CSSProperties }) {
  return (
    <motion.a
      href={href}
      whileTap={{ scale: 0.93, y: 4 }}
      style={{ display: "block", textDecoration: "none", ...style }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }} draggable={false} />
    </motion.a>
  );
}

/* HOST button — not in spritesheet, CSS only */
function HostBtn({ href }: { href: string }) {
  return (
    <motion.a
      href={href}
      whileTap={{ scale: 0.93, y: 4 }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        width: "100%", maxWidth: 340, height: 68, borderRadius: 18,
        background: "linear-gradient(180deg, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.10) 42%, transparent 42%), #FF5965",
        border: "3px solid #b53040",
        boxShadow: "0 7px 0 #7e1d2a, 0 14px 28px rgba(0,0,0,0.44)",
        fontSize: 16, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase",
        color: "#fff", textDecoration: "none",
        textShadow: "0 1px 4px rgba(0,0,0,0.55)",
        userSelect: "none" as const,
      }}
    >
      <span style={{ fontSize: 22 }}>🎯</span>
      <span>Host a Game</span>
    </motion.a>
  );
}

export default function CapsulePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState<"student" | "teacher" | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    fetch("/api/capsule/auth/me")
      .then(r => r.json())
      .then(d => { setMe(d.user); setLoading(false); });
  }, []);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length === 6) router.push(`/capsule/play/${c}`);
  };

  async function loginAsDemo(role: "student" | "teacher") {
    setDemoLoading(role);
    const res = await fetch("/api/capsule/auth/demo", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json() as { user?: Me };
    setDemoLoading(null);
    if (data.user) {
      setMe(data.user);
      if (role === "teacher") router.push("/capsule/host");
    }
  }

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/capsule/auth/logout", { method: "POST" });
    setMe(null);
    setSigningOut(false);
  }

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", background: "#07183F",
      overflow: "hidden", display: "flex", flexDirection: "column",
    }}>

      {/* Scene background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/capsule/scene.png" alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", objectPosition: "center bottom",
        pointerEvents: "none", userSelect: "none",
      }} />
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(7,24,63,0.60) 0%, rgba(7,24,63,0.06) 42%, rgba(7,24,63,0.72) 100%)",
      }} />

      {/* ── Top bar ─────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px 0",
      }}>
        {loading ? <div style={{ height: 40 }} /> : !me ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/capsule/login" style={topBtn("#07183F", "rgba(255,255,255,0.18)")}>Sign in</Link>
            <Link href="/capsule/signup" style={topBtn("#19CDD2", "#0e8d91")}>Create account</Link>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CapIcon capId={me.equippedCapId} size={40} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{me.username}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "capitalize" }}>{me.role}</div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {me && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,197,46,0.15)", border: "1px solid rgba(255,197,46,0.35)",
              borderRadius: 99, padding: "5px 12px",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 18, height: 18, objectFit: "contain" }} />
              <span style={{ fontSize: 13, fontWeight: 900, color: "#FFC52E" }}>{me.coins}</span>
            </div>
          )}
          {me && (
            <button onClick={signOut} disabled={signingOut} style={{
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 99, padding: "5px 12px",
              fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.50)", cursor: "pointer",
            }}>
              {signingOut ? "…" : "Sign out"}
            </button>
          )}
        </div>
      </div>

      {/* ── Logo: slam down → float ──────────────────────── */}
      <div style={{ position: "relative", zIndex: 10, pointerEvents: "none" }}>
        <motion.div
          style={{ display: "flex", justifyContent: "center", paddingTop: 16, willChange: "transform" }}
          animate={{ y: [0, -18, 0] }}
          transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 1.9 }}
        >
          <motion.div
            initial={{ y: -520, scale: 1.65, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 9, stiffness: 95, mass: 1.5, delay: 0.12 }}
            style={{ willChange: "transform, opacity" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/capsule/logo.png"
              alt="Capsule"
              style={{
                width: "min(88vw, 500px)", objectFit: "contain", display: "block",
                filter: "drop-shadow(0 6px 32px rgba(25,205,210,0.70)) drop-shadow(0 2px 8px rgba(0,0,0,0.90))",
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      <div style={{ flex: "1 1 auto" }} />

      {/* ── Action buttons ──────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 12, padding: "0 20px",
      }}>

        {/* Logged-out */}
        {!loading && !me && (
          <>
            <SpriteBtn
              src="/assets/capsule/ui/btn-join-game.png"
              alt="Join Game"
              onClick={() => setShowJoin(v => !v)}
              style={{ width: "100%", maxWidth: 340 }}
            />

            <AnimatePresence>
              {showJoin && (
                <motion.form
                  key="join-form"
                  onSubmit={join}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <input
                    value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE" maxLength={6} autoFocus
                    style={codeInputStyle}
                  />
                  <button type="submit" disabled={code.trim().length !== 6} style={{
                    ...submitBtnStyle,
                    opacity: code.trim().length === 6 ? 1 : 0.35,
                    cursor: code.trim().length === 6 ? "pointer" : "not-allowed",
                  }}>
                    Let&apos;s Go →
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 340 }}>
              <DemoBtn color="#19CDD2" label={demoLoading === "student" ? "…" : "Demo Student"} onClick={() => loginAsDemo("student")} disabled={demoLoading !== null} />
              <DemoBtn color="#FF5965" label={demoLoading === "teacher" ? "…" : "Demo Teacher"} onClick={() => loginAsDemo("teacher")} disabled={demoLoading !== null} />
            </div>
          </>
        )}

        {/* Logged-in */}
        {me && (
          <>
            {me.role === "teacher" && <HostBtn href="/capsule/host" />}

            <SpriteBtn
              src="/assets/capsule/ui/btn-join-game.png"
              alt="Join Game"
              onClick={() => setShowJoin(v => !v)}
              style={{ width: "100%", maxWidth: 340 }}
            />

            <AnimatePresence>
              {showJoin && (
                <motion.form
                  key="join-form-auth"
                  onSubmit={join}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <input
                    value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE" maxLength={6} autoFocus
                    style={codeInputStyle}
                  />
                  <button type="submit" disabled={code.trim().length !== 6} style={{
                    ...submitBtnStyle,
                    opacity: code.trim().length === 6 ? 1 : 0.35,
                    cursor: code.trim().length === 6 ? "pointer" : "not-allowed",
                  }}>
                    Let&apos;s Go →
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* CAPSULE STORE + COLLECTION side by side */}
            <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 340 }}>
              <SpriteLink src="/assets/capsule/ui/btn-capsule-store.png" alt="Capsule Store" href="/capsule/store" style={{ flex: 1 }} />
              <SpriteLink src="/assets/capsule/ui/btn-collection.png" alt="Collection" href="/capsule/collection" style={{ flex: 1 }} />
            </div>

            {me.email?.endsWith("@capsule.demo") && (
              <button onClick={() => loginAsDemo(me.role === "teacher" ? "student" : "teacher")} disabled={demoLoading !== null} style={{
                background: "none", border: "none", padding: "4px 0",
                fontSize: 12, color: "rgba(255,255,255,0.32)", cursor: "pointer",
              }}>
                {demoLoading ? "…" : `Switch to Demo ${me.role === "teacher" ? "Student" : "Teacher"}`}
              </button>
            )}
          </>
        )}
      </div>

      <div style={{ flex: "0 0 20px" }} />

      {/* ── Bottom nav — sprite buttons ─────────────────── */}
      <nav style={{
        position: "relative", zIndex: 10,
        background: "rgba(6,16,50,0.90)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "20px 14px 18px",
      }}>
        <div style={{ display: "flex", gap: 8, maxWidth: 440, margin: "0 auto", alignItems: "flex-end" }}>
          {[
            { src: "/assets/capsule/ui/btn-daily.png",        alt: "Daily" },
            { src: "/assets/capsule/ui/btn-leaderboard.png",  alt: "Leaderboard" },
            { src: "/assets/capsule/ui/btn-achievements.png", alt: "Achievements" },
            { src: "/assets/capsule/ui/btn-inbox.png",        alt: "Inbox" },
          ].map(({ src, alt }) => (
            <motion.button
              key={alt}
              whileTap={{ scale: 0.90, y: 4 }}
              style={{ flex: 1, background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }} draggable={false} />
            </motion.button>
          ))}
        </div>
      </nav>

      <p style={{
        position: "relative", zIndex: 20, margin: 0,
        background: "rgba(6,16,50,0.90)",
        fontSize: 9, color: "rgba(255,255,255,0.09)", whiteSpace: "nowrap",
        pointerEvents: "none", textAlign: "center", padding: "2px 0 8px",
      }}>
        A Sinon Learning product
      </p>
    </div>
  );
}

/* ── Tiny helpers ──────────────────────────────────────── */

function DemoBtn({ color, label, onClick, disabled }: {
  color: string; label: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick} disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.94 }}
      style={{
        flex: 1, height: 52, borderRadius: 14,
        background: `${color}18`, border: `2px solid ${color}50`,
        fontSize: 12, fontWeight: 800, color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        letterSpacing: "0.04em", textTransform: "uppercase" as const,
      }}
    >
      {label}
    </motion.button>
  );
}

function topBtn(bg: string, border: string): React.CSSProperties {
  return {
    padding: "7px 14px", borderRadius: 99,
    background: bg, border: `1px solid ${border}`,
    fontSize: 12, fontWeight: 700, color: "#fff",
    textDecoration: "none", display: "inline-block", cursor: "pointer",
  };
}

const codeInputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  borderRadius: 18, border: "3px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.09)",
  padding: "14px 20px", textAlign: "center",
  fontSize: 24, fontWeight: 900, letterSpacing: "0.28em",
  color: "#fff", outline: "none",
};

const submitBtnStyle: React.CSSProperties = {
  width: "100%", padding: "16px 24px", borderRadius: 99,
  background: "#19CDD2", color: "#06163E",
  fontSize: 15, fontWeight: 900, letterSpacing: "0.08em",
  textTransform: "uppercase", border: "none",
  boxShadow: "0 6px 0 #056870, 0 10px 20px rgba(0,0,0,0.35)",
};
