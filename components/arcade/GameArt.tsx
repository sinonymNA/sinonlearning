import PotatoSvg from "./PotatoSvg";

const INK = "#14163a";
/** Hand-built SVG mark for each game (used on tiles/headers instead of emoji). */
export default function GameArt({ id, size = 96 }: { id: string; size?: number }) {
  const s = { stroke: INK, strokeWidth: 5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (id) {
    case "hot_potato": return <PotatoSvg heat={2} size={size * 0.9} />;
    case "quick_draw":
      return <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden><rect x="10" y="16" width="70" height="58" rx="8" fill="#fff" {...s} /><path d="M22 58 q10 -26 22 -8 t24 -14" fill="none" stroke="#ff5d73" strokeWidth="6" strokeLinecap="round" /><g transform="rotate(35 70 70)"><rect x="60" y="30" width="14" height="52" rx="4" fill="#ffd23d" {...s} /><path d="M60 82 l7 14 l7 -14Z" fill="#14163a" /></g></svg>;
    case "last_one_standing":
      return <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden><rect x="8" y="74" width="84" height="14" rx="5" fill="#8a5d3f" {...s} /><path d="M56 6 L30 52 H48 L40 82 L74 36 H56 Z" fill="#ffd23d" {...s} /></svg>;
    case "telephone":
      return <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden><path d="M14 40 C14 14 86 14 86 40 L86 50 L68 50 L68 40 C68 34 32 34 32 40 L32 50 L14 50Z" fill="#ff5d73" {...s} /><rect x="10" y="54" width="80" height="34" rx="10" fill="#ffb02e" {...s} /><circle cx="50" cy="71" r="11" fill="#fff" {...s} /><circle cx="50" cy="71" r="3" fill={INK} /></svg>;
    case "imposter":
      return <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden><path d="M14 52 H86 L78 40 C76 20 24 20 22 40Z" fill="#3b3f6b" {...s} /><rect x="8" y="50" width="84" height="8" rx="4" fill="#14163a" /><circle cx="42" cy="74" r="12" fill="#fff" {...s} /><path d="M52 83 l16 12" stroke={INK} strokeWidth="7" strokeLinecap="round" /><circle cx="42" cy="74" r="4" fill="#ef476f" /></svg>;
    default: return null;
  }
}
