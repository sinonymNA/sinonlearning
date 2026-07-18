"use client";

import dynamic from "next/dynamic";

const WildsGame = dynamic(() => import("@/components/wilds/WildsGame"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#08121f", color: "#bff5ff", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 18,
    }}>
      Loading Wilds...
    </div>
  ),
});

export default function WildsPage() {
  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", overflow: "hidden", background: "#08121f" }}>
      <WildsGame />
    </div>
  );
}
