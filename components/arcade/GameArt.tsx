import PotatoSvg from "./PotatoSvg";
import { PufferSvg } from "./games/PufferParty";

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
    case "piggy_bank":
      return <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden><ellipse cx="50" cy="58" rx="36" ry="28" fill="#ff9bc4" {...s} /><path d="M24 38 l-4 -16 l16 8Z M66 30 l8 -14 l6 18Z" fill="#ff7ab0" {...s} strokeWidth="4" /><ellipse cx="82" cy="60" rx="9" ry="12" fill="#ff7ab0" {...s} strokeWidth="4" /><circle cx="84" cy="58" r="2.2" fill={INK} /><circle cx="84" cy="64" r="2.2" fill={INK} /><circle cx="64" cy="48" r="4" fill={INK} /><rect x="40" y="28" width="22" height="6" rx="3" fill={INK} /><rect x="30" y="82" width="10" height="10" rx="3" fill="#ff7ab0" {...s} strokeWidth="4" /><rect x="60" y="82" width="10" height="10" rx="3" fill="#ff7ab0" {...s} strokeWidth="4" /><circle cx="51" cy="14" r="9" fill="#ffd23d" {...s} strokeWidth="4" /></svg>;
    case "imposter":
      return <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden><path d="M14 52 H86 L78 40 C76 20 24 20 22 40Z" fill="#3b3f6b" {...s} /><rect x="8" y="50" width="84" height="8" rx="4" fill="#14163a" /><circle cx="42" cy="74" r="12" fill="#fff" {...s} /><path d="M52 83 l16 12" stroke={INK} strokeWidth="7" strokeLinecap="round" /><circle cx="42" cy="74" r="4" fill="#ef476f" /></svg>;
    case "puffer_party":
      return <PufferSvg size={size} />;
    case "dacula_dash":
      return <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden shapeRendering="crispEdges"><rect x="6" y="6" width="88" height="88" fill="#3f9c4b" stroke={INK} strokeWidth="5" /><path d="M6 62 H94 M46 6 V94" stroke="#3a3f50" strokeWidth="14" /><path d="M6 62 H94 M46 6 V94" stroke="#f2c94c" strokeWidth="2" strokeDasharray="6 5" /><rect x="58" y="14" width="24" height="18" fill="#b9724f" stroke={INK} strokeWidth="3" /><rect x="58" y="14" width="24" height="6" fill="#7a3f33" /><rect x="14" y="14" width="22" height="22" fill="#ec4899" stroke={INK} strokeWidth="3" /><circle cx="25" cy="25" r="6" fill="#facc15" /><rect x="60" y="52" width="26" height="14" rx="3" fill="#ef476f" stroke={INK} strokeWidth="3" /><rect x="70" y="55" width="8" height="8" fill="#bfe3ff" /><circle cx="64" cy="68" r="4" fill={INK} /><circle cx="82" cy="68" r="4" fill={INK} /></svg>;
    default: return null;
  }
}
