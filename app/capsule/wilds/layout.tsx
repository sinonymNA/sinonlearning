import "@fontsource/nunito/700.css";
import "@fontsource/nunito/900.css";

export default function WildsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#08121f", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}
