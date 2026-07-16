"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import CapIcon from "@/components/capsule/CapIcon";

interface Me {
  id: string; email: string; username: string; role: string; equippedCapId: string; coins: number;
}

// Glossy top-stripe identical to spritesheet buttons
const GLOSS = "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.10) 42%, transparent 42%)";

function gameStyle(
  color: string, dark: string, shadow: string, textColor: string, half?: boolean,
): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    flex: half ? 1 : undefined,
    width: half ? undefined : "100%",
    maxWidth: half ? undefined : 340,
    height: 68, borderRadius: 18,
    background: `${GLOSS}, ${color}`,
    border: `3px solid ${dark}`,
    boxShadow: `0 7px 0 ${shadow}, 0 14px 28px rgba(0,0,0,0.44), inset 0 1px 0 rgba(255,255,255,0.28)`,
    fontSize: 16, fontWeight: 900, letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: textColor, textDecoration: "none",
    cursor: "pointer", userSelect: "none" as const,
    textShadow: textColor === "#06163E" ? "none" : "0 1px 4px rgba(0,0,0,0.55)",
  };
}

const TAP_LIFT = (shadow: string) => ({
  y: 6,
  boxShadow: `0 1px 0 ${shadow}, 0 4px 8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.28)`,
});

/* ── Sub-components ────────────────────────────────────── */

function GameBtn({ color, dark, shadow, textColor, icon, label, onClick, disabled, type }: {
  color: string; dark: string; shadow: string; textColor: string;
  icon: string; label: string;
  onClick?: () => void; disabled?: boolean; type?: "button" | "submit";
}) {
  return (
    <motion.button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : TAP_LIFT(shadow)}
      style={{ ...gameStyle(color, dark, shadow, textColor), opacity: disabled ? 0.4 : 1 }}
    >
      <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}

function GameLink({ color, dark, shadow, textColor, icon, label, href, half }: {
  color: string; dark: string; shadow: string; textColor: string;
  icon: string; label: string; href: string; half?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href={href} style={gameStyle(color, dark, shadow, textColor, half)}>
      <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
      <span>{label}</span>
    </a>
  );
}

function DemoBtn({ textColor, bgColor, borderColor, label, onClick, disabled }: {
  textColor: string; bgColor: string; borderColor: string;
  label: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.94 }}
      style={{
        flex: 1, height: 52, borderRadius: 14,
        background: bgColor, border: `2px solid ${borderColor}`,
        fontSize: 12, fontWeight: 800, color: textColor,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        letterSpacing: "0.04em", textTransform: "uppercase" as const,
      }}
    >
      {label}
    </motion.button>
  );
}

function NavBtn({ icon, label }: { icon: string; label: string }) {
  return (
    <motion.button
      whileTap={{ y: 5, boxShadow: "0 1px 0 #0a1535, 0 4px 8px rgba(0,0,0,0.28)" }}
      style={{
        flex: 1, position: "relative",
        height: 64, borderRadius: 14,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-end",
        paddingBottom: 10,
        background: "linear-gradient(180deg, #172965 0%, #111f50 100%)",
        border: "2px solid #1e3278",
        boxShadow: "0 5px 0 #0a1535, 0 8px 18px rgba(0,0,0,0.38)",
        cursor: "pointer",
      }}
    >
      {/* Icon bursts out above the button edge */}
      <span style={{
        position: "absolute", top: -22, fontSize: 30,
        filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.65))",
        lineHeight: 1,
      }}>
        {icon}
      </span>
      <span style={{
        fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.55)",
        letterSpacing: "0.07em", textTransform: "uppercase" as const,
      }}>
        {label}
      </span>
    </motion.button>
  );
}

/* ── Page ──────────────────────────────────────────────── */

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

      {/* Dark vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(7,24,63,0.62) 0%, rgba(7,24,63,0.06) 42%, rgba(7,24,63,0.68) 100%)",
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

      {/* ── Logo — SLAMS DOWN, then floats ──────────────── */}
      <div style={{ position: "relative", zIndex: 10, pointerEvents: "none" }}>
        {/* Float wrapper — starts after slam settles */}
        <motion.div
          style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}
          animate={{ y: [0, -18, 0] }}
          transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 1.9 }}
        >
          {/* Slam-in */}
          <motion.div
            initial={{ y: -520, scale: 1.65, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 9, stiffness: 95, mass: 1.5, delay: 0.12 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/capsule/logo.png"
              alt="Capsule"
              style={{
                width: "min(88vw, 500px)",
                objectFit: "contain",
                display: "block",
                filter: [
                  "drop-shadow(0 12px 56px rgba(25,205,210,0.85))",
                  "drop-shadow(0 4px 18px rgba(0,0,0,0.98))",
                  "drop-shadow(0 0 100px rgba(25,205,210,0.45))",
                ].join(" "),
              }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* ── Spacer ──────────────────────────────────────── */}
      <div style={{ flex: "1 1 auto" }} />

      {/* ── Action buttons ──────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 12, padding: "0 20px",
      }}>

        {/* ── Logged-out ── */}
        {!loading && !me && (
          <>
            <GameBtn
              color="#19CDD2" dark="#0a8d93" shadow="#056870" textColor="#06163E"
              icon="🎮" label="Join Game"
              onClick={() => setShowJoin(v => !v)}
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
                    style={{
                      width: "100%", boxSizing: "border-box",
                      borderRadius: 18, border: "3px solid rgba(255,255,255,0.25)",
                      background: "rgba(255,255,255,0.09)",
                      padding: "14px 20px", textAlign: "center",
                      fontSize: 24, fontWeight: 900, letterSpacing: "0.28em",
                      color: "#fff", outline: "none",
                    }}
                  />
                  <GameBtn
                    color="#19CDD2" dark="#0a8d93" shadow="#056870" textColor="#06163E"
                    icon="▶" label="Let's Go"
                    disabled={code.trim().length !== 6} type="submit"
                  />
                </motion.form>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 340 }}>
              <DemoBtn
                textColor="#19CDD2" bgColor="rgba(25,205,210,0.10)" borderColor="rgba(25,205,210,0.35)"
                label={demoLoading === "student" ? "…" : "Demo Student"}
                onClick={() => loginAsDemo("student")} disabled={demoLoading !== null}
              />
              <DemoBtn
                textColor="#FF5965" bgColor="rgba(255,89,101,0.10)" borderColor="rgba(255,89,101,0.35)"
                label={demoLoading === "teacher" ? "…" : "Demo Teacher"}
                onClick={() => loginAsDemo("teacher")} disabled={demoLoading !== null}
              />
            </div>
          </>
        )}

        {/* ── Logged-in ── */}
        {me && (
          <>
            {me.role === "teacher" && (
              <GameLink
                color="#FF5965" dark="#b53040" shadow="#7e1d2a" textColor="#fff"
                icon="🎯" label="Host a Game" href="/capsule/host"
              />
            )}

            <GameBtn
              color="#19CDD2" dark="#0a8d93" shadow="#056870" textColor="#06163E"
              icon="🎮" label="Join Game"
              onClick={() => setShowJoin(v => !v)}
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
                    style={{
                      width: "100%", boxSizing: "border-box",
                      borderRadius: 18, border: "3px solid rgba(255,255,255,0.25)",
                      background: "rgba(255,255,255,0.09)",
                      padding: "14px 20px", textAlign: "center",
                      fontSize: 24, fontWeight: 900, letterSpacing: "0.28em",
                      color: "#fff", outline: "none",
                    }}
                  />
                  <GameBtn
                    color="#19CDD2" dark="#0a8d93" shadow="#056870" textColor="#06163E"
                    icon="▶" label="Let's Go"
                    disabled={code.trim().length !== 6} type="submit"
                  />
                </motion.form>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 340 }}>
              <GameLink
                color="#FFC52E" dark="#b88514" shadow="#8a5f0a" textColor="#06163E"
                icon="🎲" label="Capsule Store" href="/capsule/store"
                half
              />
              <GameLink
                color="#7C3AED" dark="#5825b5" shadow="#3d1680" textColor="#fff"
                icon="📒" label="Collection" href="/capsule/collection"
                half
              />
            </div>

            {me.email?.endsWith("@capsule.demo") && (
              <button
                onClick={() => loginAsDemo(me.role === "teacher" ? "student" : "teacher")}
                disabled={demoLoading !== null}
                style={{
                  background: "none", border: "none", padding: "4px 0",
                  fontSize: 12, color: "rgba(255,255,255,0.32)", cursor: "pointer",
                }}
              >
                {demoLoading ? "…" : `Switch to Demo ${me.role === "teacher" ? "Student" : "Teacher"}`}
              </button>
            )}
          </>
        )}
      </div>

      <div style={{ flex: "0 0 26px" }} />

      {/* ── Bottom nav ──────────────────────────────────── */}
      {/* Extra top padding gives room for icons that burst above the button edge */}
      <nav style={{
        position: "relative", zIndex: 10,
        background: "rgba(6,16,50,0.90)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        padding: "32px 14px 22px",
      }}>
        <div style={{ display: "flex", gap: 10, maxWidth: 440, margin: "0 auto" }}>
          <NavBtn icon="📅" label="Daily" />
          <NavBtn icon="🏆" label="Leaderboard" />
          <NavBtn icon="⭐" label="Achievements" />
          <NavBtn icon="✉️" label="Inbox" />
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

function topBtn(bg: string, border: string): React.CSSProperties {
  return {
    padding: "7px 14px", borderRadius: 99,
    background: bg, border: `1px solid ${border}`,
    fontSize: 12, fontWeight: 700, color: "#fff",
    textDecoration: "none", display: "inline-block", cursor: "pointer",
  };
}
