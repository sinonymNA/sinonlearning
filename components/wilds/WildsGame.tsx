"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { EventBus } from "./EventBus";

export default function WildsGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [ready, setReady] = useState(false);
  const [portrait, setPortrait] = useState(false);

  useEffect(() => {
    const updateOrientation = () => setPortrait(window.innerHeight > window.innerWidth);
    updateOrientation();
    window.addEventListener("resize", updateOrientation);
    return () => window.removeEventListener("resize", updateOrientation);
  }, []);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    let disposed = false;
    Promise.all([
      import("./PhaserGame"),
      fetch("/api/capsule/auth/me").then((response) => response.ok ? response.json() : null).catch(() => null),
    ]).then(([{ createPhaserGame }, account]) => {
      if (disposed || !containerRef.current || gameRef.current) return;
      const regionId = new URLSearchParams(window.location.search).get("region") ?? undefined;
      gameRef.current = createPhaserGame(containerRef.current, account?.user?.equippedCapId ?? "cap-fox", regionId);
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
      <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100vw", height: "100dvh", visibility: portrait ? "hidden" : "visible" }} />
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#bff5ff", fontFamily: "Nunito, sans-serif", fontSize: 20, fontWeight: 900,
        }}>
          Loading Wilds...
        </div>
      )}
      {portrait && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 22, padding: 32,
          background: "radial-gradient(circle at 50% 38%, #174f65 0%, #081b2b 48%, #050f1d 100%)",
          color: "#effff9", textAlign: "center", fontFamily: "Nunito, sans-serif",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/wilds/logos/wilds_logo_transparent.png" alt="Wilds" style={{ width: "min(88vw, 430px)", height: "auto" }} />
          <div style={{ width: 86, height: 52, border: "4px solid #9ff7df", borderRadius: 12, transform: "rotate(90deg)", boxShadow: "0 0 30px rgba(111,255,218,0.28)" }} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 1000, letterSpacing: "0.02em" }}>Rotate your device</div>
            <div style={{ marginTop: 8, fontSize: 15, fontWeight: 700, color: "rgba(226,255,248,0.72)", lineHeight: 1.5 }}>Wilds is designed as a landscape adventure.</div>
          </div>
        </div>
      )}
    </div>
  );
}
