import dynamic from "next/dynamic";

// Capsule Party game page — loads Phaser dynamically to avoid SSR issues
const CapsuleParty = dynamic(
  () => import("@/components/capsule/party/CapsuleParty"),
  { ssr: false, loading: () => (
    <div style={{
      width: "100%", height: "100%", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0a0e1a", color: "#19cdd2",
      fontFamily: "sans-serif", fontSize: 18,
    }}>
      Loading Capsule Party...
    </div>
  )},
);

export default function CapsulePartyPage() {
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <CapsuleParty />
    </div>
  );
}
