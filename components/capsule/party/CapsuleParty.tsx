"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type Phaser from "phaser";
import { EventBus, type PlayerScore } from "./EventBus";

interface CapsulePartyProps {
  playerId?: string;
  displayName?: string;
  capId?: string;
  isHost?: boolean;
  gameCode?: string;
}

// CapsuleParty React shell.
// - Mounts the Phaser game inside a div
// - Communicates with server APIs (lobby polling, checkpoints)
// - Relays join/start events to Phaser via EventBus
// - Renders NO game UI — all HUD is Phaser UIScene
export default function CapsuleParty({
  playerId,
  displayName = "Player",
  capId = "cap-default",
  isHost = false,
}: CapsulePartyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [phaserReady, setPhaserReady] = useState(false);
  const [gamePhase, setGamePhase] = useState<string>("loading");
  const [scores, setScores] = useState<PlayerScore[]>([]);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    // Dynamic import avoids SSR crash (Phaser needs window)
    import("./PhaserGame").then(({ createPhaserGame }) => {
      if (!containerRef.current) return;
      gameRef.current = createPhaserGame(containerRef.current);
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    EventBus.on("phaser:ready", () => setPhaserReady(true));
    EventBus.on("phaser:phase-change", (d) => setGamePhase(d.phase));
    EventBus.on("phaser:score-update", (data) => setScores(data));

    return () => {
      EventBus.off("phaser:ready", () => setPhaserReady(true));
      EventBus.off("phaser:phase-change", (d) => setGamePhase(d.phase));
      EventBus.off("phaser:score-update", (data) => setScores(data));
    };
  }, []);

  // Once Phaser is ready, send the player join event
  useEffect(() => {
    if (phaserReady && playerId && displayName) {
      EventBus.emit("party:join", { playerId, displayName, capId });
    }
  }, [phaserReady, playerId, displayName, capId]);

  const handleStart = useCallback(() => {
    EventBus.emit("party:start");
  }, []);

  const handleJoinQuick = useCallback(() => {
    // Quick-start for solo testing: join as "You" and fill with bots
    EventBus.emit("party:join", {
      playerId: "player-local",
      displayName: "You",
      capId: "cap-default",
    });
    setTimeout(() => EventBus.emit("party:start"), 800);
  }, []);

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#0a0e1a",
      position: "relative", overflow: "hidden",
    }}>
      {/* Phaser canvas container */}
      <div
        ref={containerRef}
        style={{ width: "100%", maxWidth: 1200, aspectRatio: "16/9", position: "relative" }}
      />

      {/* Quick-start overlay — shown before game starts */}
      {!phaserReady && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "#0a0e1a",
        }}>
          <div style={{ color: "#19cdd2", fontSize: 18, fontFamily: "sans-serif" }}>
            Loading Capsule Party...
          </div>
        </div>
      )}

      {/* Solo quick-start button (shown while in lobby/title, no active game) */}
      {phaserReady && (gamePhase === "loading" || gamePhase === "lobby" || gamePhase === "title") && !playerId && (
        <div style={{
          position: "absolute", bottom: 24, display: "flex", gap: 12,
        }}>
          <button
            onClick={handleJoinQuick}
            style={{
              padding: "10px 24px", background: "#19cdd2", color: "#0f172a",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "sans-serif",
            }}
          >
            Quick Start (Solo + Bots)
          </button>
        </div>
      )}

      {isHost && phaserReady && (
        <div style={{ position: "absolute", bottom: 24, right: 24 }}>
          <button
            onClick={handleStart}
            style={{
              padding: "10px 24px", background: "#ffd700", color: "#0f172a",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "sans-serif",
            }}
          >
            Start Game
          </button>
        </div>
      )}
    </div>
  );
}
