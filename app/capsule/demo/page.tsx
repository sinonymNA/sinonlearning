"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BOTS = [
  { name: "Bot Alex",   cap: "cap-fox"    },
  { name: "Bot Sam",    cap: "cap-cat"    },
  { name: "Bot Jordan", cap: "cap-owl"    },
  { name: "Bot Riley",  cap: "cap-bear"   },
  { name: "Bot Casey",  cap: "cap-hamster" },
];

export default function DemoLauncher() {
  const router = useRouter();
  const [loading, setLoading] = useState<"teacher" | "student" | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function launchDemo(mode: "teacher" | "student") {
    setLoading(mode);
    setError("");

    try {
      // 1. Auth as DemoTeacher (sets session cookie for this browser tab)
      setStatus("Authenticating…");
      const authRes = await fetch("/api/capsule/auth/demo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "teacher" }),
      });
      if (!authRes.ok) throw new Error("Auth failed — check /api/capsule/auth/demo");

      // 2. Create game
      setStatus("Creating game…");
      const gameRes = await fetch("/api/capsule/games", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Cap Raid Demo" }),
      });
      if (!gameRes.ok) throw new Error("Failed to create game");
      const { code } = await gameRes.json() as { code: string };

      // 3. Join 5 bots — must use credentials:"omit" so the DemoTeacher session
      //    cookie is NOT sent; otherwise joinGame() deduplicates all bots onto
      //    the single DemoTeacher user record, yielding only 1 real player.
      setStatus("Joining bots…");
      const botPlayerIds: string[] = [];
      for (const bot of BOTS) {
        const res = await fetch(`/api/capsule/games/${code}/join`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: bot.name, capId: bot.cap }),
          credentials: "omit",
        });
        if (res.ok) {
          const d = await res.json() as { playerId: string };
          botPlayerIds.push(d.playerId);
        }
      }

      // 4. Optionally join a "you" player for student view (also anonymous)
      let studentPlayerId: string | null = null;
      let studentCap = "cap-frog";
      if (mode === "student") {
        setStatus("Joining as student…");
        const res = await fetch(`/api/capsule/games/${code}/join`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: "You", capId: "cap-frog" }),
          credentials: "omit",
        });
        if (res.ok) {
          const d = await res.json() as { playerId: string; capId: string };
          studentPlayerId = d.playerId;
          studentCap = d.capId ?? "cap-frog";
        }
      }

      // 5. Start game
      setStatus("Starting game…");
      const startRes = await fetch(`/api/capsule/games/${code}/start`, { method: "POST" });
      if (!startRes.ok) throw new Error("Failed to start game");

      // 6. Persist demo state
      localStorage.setItem("capsule-demo", JSON.stringify({ code, botPlayerIds }));

      if (mode === "student" && studentPlayerId) {
        localStorage.setItem(
          `capsule-player-${code}`,
          JSON.stringify({ pid: studentPlayerId, name: "You", cap: studentCap }),
        );
        router.push(`/capsule/play/${code}?demo=1`);
      } else {
        router.push(`/capsule/host/${code}?demo=1`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
      setStatus("");
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#07183F",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 20px",
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/capsule/logo.png"
        alt="Capsule"
        style={{ height: 56, objectFit: "contain", marginBottom: 32, filter: "drop-shadow(0 2px 16px rgba(25,205,210,0.5))" }}
      />

      <h1 style={{
        fontFamily: "var(--font-bebas)", fontSize: 40, letterSpacing: "0.08em",
        color: "#fff", marginBottom: 8, textAlign: "center",
      }}>
        DEMO MODE
      </h1>
      <p style={{ marginBottom: 32, fontSize: 13, color: "rgba(255,255,255,0.40)", textAlign: "center" }}>
        Launches a live game with 5 AI bots · questions auto-advance · no login needed
      </p>

      {error && (
        <p style={{ marginBottom: 16, fontSize: 12, color: "#f87171", textAlign: "center" }}>{error}</p>
      )}
      {status && loading && (
        <p style={{ marginBottom: 16, fontSize: 12, color: "rgba(25,205,210,0.70)" }}>{status}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 300 }}>
        <button
          onClick={() => launchDemo("teacher")}
          disabled={!!loading}
          style={{
            borderRadius: 16, background: "#FF5965", border: "none",
            padding: "18px 0", fontSize: 15, fontWeight: 900,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#fff", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading && loading !== "teacher" ? 0.35 : 1,
            boxShadow: "0 4px 0 rgba(0,0,0,0.25)",
          }}
        >
          {loading === "teacher" ? "Setting up…" : "Teacher View →"}
        </button>

        <button
          onClick={() => launchDemo("student")}
          disabled={!!loading}
          style={{
            borderRadius: 16, background: "#19CDD2", border: "none",
            padding: "18px 0", fontSize: 15, fontWeight: 900,
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: "#06163E", cursor: loading ? "not-allowed" : "pointer",
            opacity: loading && loading !== "student" ? 0.35 : 1,
            boxShadow: "0 4px 0 #067a88",
          }}
        >
          {loading === "student" ? "Setting up…" : "Student View →"}
        </button>
      </div>

      <p style={{ marginTop: 28, fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center", maxWidth: 280 }}>
        Bot names: Alex · Sam · Jordan · Riley · Casey<br />
        Questions pulled from the default question bank
      </p>
    </div>
  );
}
