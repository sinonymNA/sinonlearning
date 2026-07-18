"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { EventBus } from "./EventBus";

export default function WildsGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    let disposed = false;
    Promise.all([
      import("./PhaserGame"),
      fetch("/api/capsule/auth/me").then((response) => response.ok ? response.json() : null).catch(() => null),
    ]).then(([{ createPhaserGame }, account]) => {
      if (disposed || !containerRef.current || gameRef.current) return;
      gameRef.current = createPhaserGame(containerRef.current, account?.user?.equippedCapId ?? "cap-fox");
    });

    return () => {
      disposed = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onReady = () => setReady(true);
    EventBus.on("phaser:ready", onReady);
    return () => { EventBus.off("phaser:ready", onReady); };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#08121f" }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100vw", height: "100dvh" }} />
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#bff5ff", fontFamily: "Nunito, sans-serif", fontSize: 20, fontWeight: 900,
        }}>
          Loading Wilds...
        </div>
      )}
    </div>
  );
}
