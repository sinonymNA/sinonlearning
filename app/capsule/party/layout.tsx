// Full-screen layout for Capsule Party — no nav, no padding
export default function CapsulePartyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      background: "#0a0e1a", display: "flex", flexDirection: "column",
    }}>
      {children}
    </div>
  );
}
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/900.css";

