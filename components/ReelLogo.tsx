import { Clapperboard } from "lucide-react";

// Simple wordmark for Reel (mirrors the lightweight logo components for the
// other apps). Uses Tailwind's built-in sky/slate palette — no custom scale.
export default function ReelLogo({ width = 96, light = false }: { width?: number; light?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 font-bold tracking-tight"
      style={{ fontSize: width / 5 }}
    >
      <Clapperboard size={width / 4.5} className={light ? "text-white" : "text-sky-500"} />
      <span className={light ? "text-white" : "text-slate-900"}>Reel</span>
    </span>
  );
}
