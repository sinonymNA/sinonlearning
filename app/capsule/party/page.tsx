"use client";
import dynamic from "next/dynamic";

// Capsule Party game page — loads Phaser dynamically to avoid SSR issues
const CapsuleParty = dynamic(
  () => import("@/components/capsule/party/CapsuleParty"),
  { ssr: false, loading: () => (
    <div style={{
      width: "100%", height: "100%", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0a0e1a", color: "#19cdd2",
      fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 18,
    }}>
      Loading Capsule Party...
    </div>
  )},
);

export default function CapsulePartyPage() {
  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100dvh", overflow: "hidden", background: "#020817" }}>
      <CapsuleParty />
    </div>
  );
}

