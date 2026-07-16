"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { EventBus } from "./EventBus";

interface CapsulePartyProps {
  playerId?: string;
  displayName?: string;
  capId?: string;
  isHost?: boolean;
  gameCode?: string;
}

// React only mounts and destroys Phaser. All playable UI is rendered in Phaser.
export default function CapsuleParty({
  playerId,
  displayName = "Player",
  capId = "cap-fox",
}: CapsulePartyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [phaserReady, setPhaserReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

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
    const handleReady = () => setPhaserReady(true);
    EventBus.on("phaser:ready", handleReady);
    return () => { EventBus.off("phaser:ready", handleReady); };
  }, []);

  useEffect(() => {
    if (phaserReady && playerId && displayName) {
      EventBus.emit("party:join", { playerId, displayName, capId });
    }
  }, [phaserReady, playerId, displayName, capId]);

  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#0a0e1a",
      position: "relative", overflow: "hidden",
    }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", aspectRatio: "16/9", position: "relative" }} />
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
    </div>
  );
}

