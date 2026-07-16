"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEMO_QUESTIONS, type CapsuleQuestion } from "@/lib/capsuleData";

interface Me { username: string; role: string; }

const ANSWER_LABELS = ["A", "B", "C", "D"];

export default function CapsuleHostPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Cap Raid");
  const [useDemo, setUseDemo] = useState(true);
  const [customRaw, setCustomRaw] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/capsule/auth/me").then(r => r.json()).then(d => {
      setMe(d.user);
      setLoading(false);
      if (d.user && d.user.role !== "teacher") router.push("/capsule");
      if (!d.user) router.push("/capsule/login");
    });
  }, [router]);

  function parseQuestions(raw: string): CapsuleQuestion[] {
    return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(line => {
      const parts = line.split("\t");
      if (parts.length < 5) return null;
      const [prompt, a, b, c, d] = parts;
      return { prompt, choices: [a, b, c, d] as [string, string, string, string], answer: 0, timeLimit: 20 };
    }).filter(Boolean) as CapsuleQuestion[];
  }

  async function createGame() {
    setCreating(true); setError("");
    const questions = useDemo ? DEMO_QUESTIONS : parseQuestions(customRaw);
    if (!useDemo && questions.length < 2) {
      setError("Add at least 2 questions. Format: Question [tab] Correct [tab] Wrong [tab] Wrong [tab] Wrong");
      setCreating(false); return;
    }
    const res = await fetch("/api/capsule/games", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, questions }),
    });
    const data = await res.json() as { code?: string; error?: string };
    if (!res.ok || !data.code) { setError(data.error ?? "Failed to create game."); setCreating(false); return; }
    router.push(`/capsule/host/${data.code}`);
  }

  if (loading) return <div style={{ minHeight: "100dvh", background: "#07183F" }} />;

  return (
    <div style={{ minHeight: "100dvh", background: "#07183F", paddingBottom: 48 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 20px 0" }}>

        <Link href="/capsule" style={{
          display: "inline-block", marginBottom: 28,
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "rgba(25,205,210,0.6)", textDecoration: "none",
        }}>← Capsule</Link>

        {/* Logo + heading */}
        <div style={{ marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/capsule/logo.png"
            alt="Capsule"
            style={{ height: 44, objectFit: "contain", marginBottom: 12, filter: "drop-shadow(0 2px 12px rgba(25,205,210,0.4))" }}
          />
          <h1 style={{
            fontSize: 40, fontWeight: 900, color: "#fff",
            letterSpacing: "0.06em", fontFamily: "var(--font-bebas)", margin: 0,
          }}>
            HOST A GAME
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

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

          {/* Question set toggle */}
          <div>
            <label style={{
              display: "block", marginBottom: 8,
              fontSize: 10, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase",
              color: "rgba(25,205,210,0.70)",
            }}>
              Questions
            </label>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
              borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)", padding: 4,
            }}>
              {[
                { label: `Demo Set (${DEMO_QUESTIONS.length}Q)`, active: useDemo, onClick: () => setUseDemo(true) },
                { label: "Custom", active: !useDemo, onClick: () => setUseDemo(false) },
              ].map(({ label, active, onClick }) => (
                <button key={label} onClick={onClick} style={{
                  borderRadius: 10, padding: "10px 0",
                  fontSize: 11, fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase",
                  border: "none", cursor: "pointer",
                  background: active ? "#19CDD2" : "none",
                  color: active ? "#06163E" : "rgba(255,255,255,0.40)",
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom paste area */}
          {!useDemo && (
            <div>
              <p style={{ marginBottom: 8, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                Paste rows: Question [tab] Correct answer [tab] Wrong [tab] Wrong [tab] Wrong
              </p>
              <textarea
                value={customRaw}
                onChange={e => setCustomRaw(e.target.value)}
                rows={8}
                placeholder={"What is 2+2?\t4\t3\t5\t6\nWho painted the Mona Lisa?\tLeonardo da Vinci\tMichelangelo\tRaphael\tBotticelli"}
                style={{
                  width: "100%", boxSizing: "border-box",
                  borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(7,24,63,0.80)", padding: 16,
                  fontFamily: "monospace", fontSize: 12, lineHeight: 1.6,
                  color: "rgba(255,255,255,0.80)", outline: "none", resize: "vertical",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(25,205,210,0.40)")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
              />
            </div>
          )}

          {/* Demo preview */}
          {useDemo && (
            <div style={{
              borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)", padding: 16,
            }}>
              <p style={{
                marginBottom: 12, fontSize: 10, fontWeight: 900,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(25,205,210,0.6)",
              }}>Preview</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {DEMO_QUESTIONS.slice(0, 3).map((q, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ marginTop: 2, fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>
                      Q{i + 1}
                    </span>
                    <div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.70)", marginBottom: 6 }}>{q.prompt}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {q.choices.map((c, ci) => (
                          <span key={ci} style={{
                            borderRadius: 6, padding: "2px 8px",
                            fontSize: 10, fontWeight: 700,
                            background: ci === q.answer ? "rgba(22,163,74,0.20)" : "rgba(255,255,255,0.05)",
                            color: ci === q.answer ? "#86efac" : "rgba(255,255,255,0.30)",
                          }}>
                            {ANSWER_LABELS[ci]} {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {DEMO_QUESTIONS.length > 3 && (
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.20)" }}>
                    …and {DEMO_QUESTIONS.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}

          <button
            onClick={createGame}
            disabled={creating}
            style={{
              borderRadius: 18, background: "#FF5965", border: "none",
              padding: "16px 24px",
              fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#fff", cursor: creating ? "not-allowed" : "pointer",
              opacity: creating ? 0.4 : 1,
              boxShadow: "0 4px 0 rgba(0,0,0,0.25)",
            }}
          >
            {creating ? "Creating…" : "Create Game →"}
          </button>
        </div>
      </div>
    </div>
  );
}
