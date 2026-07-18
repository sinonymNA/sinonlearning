"use client";

import dynamic from "next/dynamic";

const WildsGame = dynamic(() => import("@/components/wilds/WildsGame"), { ssr: false });

export default function WildsPage() {
  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", overflow: "hidden", background: "#08121f" }}>
      <WildsGame />
    </div>
  );
}
