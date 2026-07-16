"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CapIcon from "@/components/capsule/CapIcon";

interface Me {
  id: string; email: string; username: string; role: string; equippedCapId: string; coins: number;
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      position: "relative",
      minHeight: "100dvh",
      background: "#07183F",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Full-bleed scene background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/capsule/scene.png"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center bottom",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* Dark overlay so UI reads clearly */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(7,24,63,0.55) 0%, rgba(7,24,63,0.10) 40%, rgba(7,24,63,0.55) 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Top bar ───────────────────────────────────────── */}
      <div style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px 0",
      }}>
        {loading ? (
          <div style={{ height: 40 }} />
        ) : !me ? (
          /* Logged-out: sign-in / create / demo buttons */
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/capsule/login" style={smallBtn("#07183F", "rgba(255,255,255,0.18)")}>Sign in</Link>
            <Link href="/capsule/signup" style={smallBtn("#19CDD2", "#0e8d91")}>Create account</Link>
          </div>
        ) : (
          /* Logged-in: avatar + name + coins */
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CapIcon capId={me.equippedCapId} size={40} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{me.username}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "capitalize" }}>{me.role}</div>
            </div>
          </div>
        )}

        {/* Coin counter + sign-out */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {me && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,197,46,0.15)",
              border: "1px solid rgba(255,197,46,0.35)",
              borderRadius: 99, padding: "5px 12px",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/capsule/coin.png" alt="coin" style={{ width: 18, height: 18, objectFit: "contain" }} />
              <span style={{ fontSize: 13, fontWeight: 900, color: "#FFC52E" }}>{me.coins}</span>
            </div>
          )}
          {me && (
            <button
              onClick={signOut}
              disabled={signingOut}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 99, padding: "5px 12px",
                fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.50)",
                cursor: "pointer",
              }}
            >
              {signingOut ? "…" : "Sign out"}
            </button>
          )}
        </div>
      </div>

      {/* ── Logo — big, centered over the machine ─────────── */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -60%)",
        zIndex: 10,
        pointerEvents: "none",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/capsule/logo.png"
          alt="Capsule"
          style={{
            width: "clamp(200px, 55vw, 340px)",
            objectFit: "contain",
            filter: "drop-shadow(0 6px 32px rgba(25,205,210,0.65)) drop-shadow(0 2px 8px rgba(0,0,0,0.8))",
          }}
        />
      </div>

      {/* ── Spacer ────────────────────────────────────────── */}
      <div style={{ flex: "1 1 auto" }} />

      {/* ── Action buttons ───────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 12, padding: "0 20px",
      }}>
        {!loading && !me ? (
          /* Logged-out CTA */
          <>
            <PillButton color="#19CDD2" textColor="#06163E" onClick={() => setShowJoin(v => !v)}>
              Join Game
            </PillButton>

            {showJoin && (
              <form onSubmit={join} style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  maxLength={6}
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    borderRadius: 18, border: "2px solid rgba(255,255,255,0.20)",
                    background: "rgba(255,255,255,0.08)",
                    padding: "14px 20px",
                    textAlign: "center", fontSize: 22, fontWeight: 900,
                    letterSpacing: "0.3em", color: "#fff",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={code.trim().length !== 6}
                  style={{
                    ...pillStyle("#19CDD2", "#06163E"),
                    opacity: code.trim().length === 6 ? 1 : 0.35,
                    cursor: code.trim().length === 6 ? "pointer" : "not-allowed",
                  }}
                >
                  Let&apos;s Go →
                </button>
              </form>
            )}

            {/* Demo row */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={() => loginAsDemo("student")}
                disabled={demoLoading !== null}
                style={{
                  ...pillStyle("rgba(25,205,210,0.15)", "#19CDD2"),
                  border: "1.5px solid rgba(25,205,210,0.40)",
                  fontSize: 12, padding: "10px 20px",
                }}
              >
                {demoLoading === "student" ? "…" : "Demo Student"}
              </button>
              <button
                onClick={() => loginAsDemo("teacher")}
                disabled={demoLoading !== null}
                style={{
                  ...pillStyle("rgba(255,89,101,0.15)", "#FF5965"),
                  border: "1.5px solid rgba(255,89,101,0.40)",
                  fontSize: 12, padding: "10px 20px",
                }}
              >
                {demoLoading === "teacher" ? "…" : "Demo Teacher"}
              </button>
            </div>
          </>
        ) : me ? (
          /* Logged-in action grid */
          <>
            {me.role === "teacher" && (
              <Link href="/capsule/host" style={pillStyle("#FF5965", "#fff")}>
                Host a Game
              </Link>
            )}

            <PillButton color="#19CDD2" textColor="#06163E" onClick={() => setShowJoin(v => !v)}>
              Join Game
            </PillButton>

            {showJoin && (
              <form onSubmit={join} style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  maxLength={6}
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    borderRadius: 18, border: "2px solid rgba(255,255,255,0.20)",
                    background: "rgba(255,255,255,0.08)",
                    padding: "14px 20px",
                    textAlign: "center", fontSize: 22, fontWeight: 900,
                    letterSpacing: "0.3em", color: "#fff",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={code.trim().length !== 6}
                  style={{
                    ...pillStyle("#19CDD2", "#06163E"),
                    opacity: code.trim().length === 6 ? 1 : 0.35,
                    cursor: code.trim().length === 6 ? "pointer" : "not-allowed",
                  }}
                >
                  Let&apos;s Go →
                </button>
              </form>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <Link href="/capsule/store" style={{ ...pillStyle("#FFC52E", "#06163E"), flex: 1, textAlign: "center" }}>
                Open Capsule
              </Link>
              <Link href="/capsule/collection" style={{ ...pillStyle("rgba(255,255,255,0.10)", "#fff"), border: "1.5px solid rgba(255,255,255,0.20)", flex: 1, textAlign: "center" }}>
                Collection
              </Link>
            </div>

            {/* Switch demo role */}
            {me.email?.endsWith("@capsule.demo") && (
              <button
                onClick={() => loginAsDemo(me.role === "teacher" ? "student" : "teacher")}
                disabled={demoLoading !== null}
                style={{
                  background: "none", border: "none", padding: "6px 0",
                  fontSize: 12, color: "rgba(255,255,255,0.35)", cursor: "pointer",
                }}
              >
                {demoLoading ? "…" : `Switch to Demo ${me.role === "teacher" ? "Student" : "Teacher"}`}
              </button>
            )}
          </>
        ) : null}
      </div>

      {/* ── Spacer ───────────────────────────────────────── */}
      <div style={{ flex: "0 0 32px" }} />

      {/* ── Bottom nav ───────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", justifyContent: "center", gap: 6,
        padding: "12px 16px 20px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(7,24,63,0.70)",
        backdropFilter: "blur(12px)",
      }}>
        {[
          { label: "Daily", icon: "☀️" },
          { label: "Leaderboard", icon: "🏆" },
          { label: "Achievements", icon: "⭐" },
          { label: "Inbox", icon: "📬" },
        ].map(({ label, icon }) => (
          <button key={label} style={{
            flex: 1, background: "none", border: "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "6px 4px", cursor: "pointer",
          }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        zIndex: 20, fontSize: 9, color: "rgba(255,255,255,0.12)", whiteSpace: "nowrap",
        pointerEvents: "none",
      }}>
        A Sinon Learning product
      </p>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────── */

function pillStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    maxWidth: 320,
    padding: "16px 24px",
    borderRadius: 99,
    background: bg,
    color,
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "center" as const,
    boxShadow: `0 4px 0 rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.08) inset`,
  };
}

function PillButton({ color, textColor, onClick, children }: {
  color: string; textColor: string; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={pillStyle(color, textColor)}>
      {children}
    </button>
  );
}

function smallBtn(bg: string, border: string): React.CSSProperties {
  return {
    padding: "7px 14px",
    borderRadius: 99,
    background: bg,
    border: `1px solid ${border}`,
    fontSize: 12, fontWeight: 700, color: "#fff",
    textDecoration: "none", display: "inline-block",
    cursor: "pointer",
  };
}
