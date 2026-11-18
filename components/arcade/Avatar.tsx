import type { ReactNode } from "react";

/** Original SVG characters. 4 free "rookie" avatars + 12 collectibles. Everything is drawn in a 100x100 box. */
const INK = "#14163a";

function Eyes({ kind = "dots", y = 50, gap = 14 }: { kind?: string; y?: number; gap?: number }) {
  const l = 50 - gap, r = 50 + gap;
  if (kind === "wide") return <g><circle cx={l} cy={y} r="8" fill="#fff" stroke={INK} strokeWidth="3" /><circle cx={r} cy={y} r="8" fill="#fff" stroke={INK} strokeWidth="3" /><circle cx={l + 1} cy={y + 1} r="3.5" fill={INK} /><circle cx={r + 1} cy={y + 1} r="3.5" fill={INK} /></g>;
  if (kind === "sleepy") return <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none"><path d={`M${l - 6} ${y} q6 6 12 0`} /><path d={`M${r - 6} ${y} q6 6 12 0`} /></g>;
  if (kind === "visor") return <g><rect x={l - 10} y={y - 8} width={gap * 2 + 20} height="16" rx="8" fill={INK} /><circle cx={l} cy={y} r="3" fill="#7dffd8" /><circle cx={r} cy={y} r="3" fill="#7dffd8" /></g>;
  if (kind === "happy") return <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none"><path d={`M${l - 6} ${y + 3} q6 -9 12 0`} /><path d={`M${r - 6} ${y + 3} q6 -9 12 0`} /></g>;
  return <g fill={INK}><circle cx={l} cy={y} r="4.5" /><circle cx={r} cy={y} r="4.5" /><circle cx={l + 1.5} cy={y - 1.5} r="1.4" fill="#fff" /><circle cx={r + 1.5} cy={y - 1.5} r="1.4" fill="#fff" /></g>;
}
const Mouth = ({ y = 64, kind = "smile" }: { y?: number; kind?: string }) =>
  kind === "open" ? <path d={`M42 ${y} q8 14 16 0 z`} fill={INK} /> : kind === "grin" ? <path d={`M38 ${y} q12 16 24 0 z`} fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" /> : <path d={`M40 ${y} q10 9 20 0`} stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />;
const Cheeks = ({ c = "#ff9bb0", y = 60 }: { c?: string; y?: number }) => <g fill={c} opacity=".7"><ellipse cx="28" cy={y} rx="6" ry="4" /><ellipse cx="72" cy={y} rx="6" ry="4" /></g>;
const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const };

const ART: Record<string, () => ReactNode> = {
  "rk-sun": () => <g>{Array.from({ length: 10 }, (_, i) => <rect key={i} x="47" y="3" width="6" height="14" rx="3" fill="#ff9d2e" transform={`rotate(${i * 36} 50 50)`} />)}<circle cx="50" cy="50" r="32" fill="#ffd23d" {...S} /><Eyes kind="happy" y={46} /><Mouth y={58} kind="grin" /><Cheeks y={56} /></g>,
  "rk-moon": () => <g><path d="M66 14 A38 38 0 1 0 86 62 A30 30 0 1 1 66 14Z" fill="#cfd8ff" {...S} /><circle cx="42" cy="50" r="3.5" fill={INK} /><path d="M32 62 q8 8 16 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" /><circle cx="76" cy="26" r="3" fill="#ffd23d" /><circle cx="86" cy="38" r="2" fill="#ffd23d" /></g>,
  "rk-leaf": () => <g><path d="M50 8 C86 24 90 62 50 92 C10 62 14 24 50 8Z" fill="#59d46f" {...S} /><path d="M50 22 V84" stroke="#2c9a45" strokeWidth="4" fill="none" /><Eyes y={50} gap={12} /><Mouth y={64} /></g>,
  "rk-wave": () => <g><path d="M10 56 C10 28 40 12 62 24 C86 18 94 46 88 66 C80 90 24 94 10 56Z" fill="#4cc3ff" {...S} /><path d="M24 72 q10 -8 20 0 t20 0" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".8" /><Eyes kind="wide" y={46} /><Mouth y={58} kind="open" /></g>,
  "c-blip": () => <g><path d="M50 12 C78 12 90 36 88 58 C86 80 68 90 50 90 C30 90 12 80 12 58 C12 34 24 12 50 12Z" fill="#7be0c3" {...S} /><circle cx="50" cy="8" r="5" fill="#ff5d73" {...S} strokeWidth="3" /><Eyes kind="wide" y={48} /><Mouth y={64} kind="open" /><Cheeks /></g>,
  "c-mossy": () => <g><path d="M16 80 C8 50 18 24 50 22 C82 24 92 50 84 80 Z" fill="#9aa4b2" {...S} /><path d="M22 30 q8 -16 16 -4 q8 -14 16 -2 q8 -12 16 2 q8 -8 10 6 q-26 -6 -58 0z" fill="#59c56a" {...S} strokeWidth="3" /><Eyes y={54} /><Mouth y={68} /></g>,
  "c-pepper": () => <g><path d="M30 24 L36 6 L46 20 M70 24 L64 6 L54 20" fill="#ff5d73" {...S} /><circle cx="50" cy="56" r="34" fill="#ff5d73" {...S} /><path d="M40 20 q10 -10 20 0" stroke="#59c56a" strokeWidth="6" fill="none" strokeLinecap="round" /><Eyes kind="wide" y={52} /><path d="M38 70 q12 -10 24 0" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" /></g>,
  "c-boop": () => <g><circle cx="22" cy="30" r="12" fill="#ffb347" {...S} /><circle cx="78" cy="30" r="12" fill="#ffb347" {...S} /><circle cx="50" cy="54" r="36" fill="#ffb347" {...S} /><ellipse cx="50" cy="64" rx="16" ry="12" fill="#fff0d6" {...S} strokeWidth="3" /><circle cx="50" cy="60" r="5" fill={INK} /><Eyes y={44} /><path d="M50 65 v4 M44 72 q6 4 12 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" /></g>,
  "c-fizz": () => <g><circle cx="50" cy="56" r="32" fill="#4cc3ff" {...S} /><circle cx="22" cy="22" r="7" fill="#c9f1ff" {...S} strokeWidth="3" /><circle cx="40" cy="12" r="4" fill="#c9f1ff" {...S} strokeWidth="3" /><circle cx="78" cy="18" r="9" fill="#c9f1ff" {...S} strokeWidth="3" /><Eyes kind="wide" y={52} /><Mouth y={66} kind="grin" /></g>,
  "c-wisp": () => <g><path d="M18 90 V44 C18 14 82 14 82 44 V90 l-10 -8 l-11 8 l-11 -8 l-11 8 l-11 -8 Z" fill="#f2f4ff" {...S} /><Eyes y={46} /><ellipse cx="50" cy="62" rx="6" ry="7" fill={INK} /><Cheeks c="#b9c4ff" y={56} /></g>,
  "c-biscuit": () => <g><rect x="12" y="14" width="76" height="74" rx="22" fill="#e9a85d" {...S} /><circle cx="28" cy="30" r="5" fill="#6b3b1f" /><circle cx="72" cy="26" r="4" fill="#6b3b1f" /><circle cx="70" cy="76" r="5" fill="#6b3b1f" /><circle cx="26" cy="74" r="4" fill="#6b3b1f" /><Eyes kind="happy" y={48} /><Mouth y={62} kind="grin" /></g>,
  "c-zap": () => <g><path d="M30 26 L42 4 L46 22 L58 2 L60 22 L74 8 L70 30" fill="#ffd23d" {...S} /><circle cx="50" cy="58" r="32" fill="#ffe066" {...S} /><path d="M54 36 L42 56 H54 L46 78 L66 50 H54 Z" fill="#ff9d2e" stroke={INK} strokeWidth="3" strokeLinejoin="round" opacity=".0" /><Eyes kind="wide" y={54} /><Mouth y={68} kind="open" /><Cheeks c="#ff9d2e" y={64} /></g>,
  "c-nova": () => <g><path d="M50 4 L61 34 L94 36 L68 56 L78 90 L50 70 L22 90 L32 56 L6 36 L39 34 Z" fill="#a98bff" {...S} /><Eyes y={50} gap={10} /><Mouth y={62} /><circle cx="76" cy="14" r="3" fill="#fff" /><circle cx="20" cy="18" r="2" fill="#fff" /></g>,
  "c-gizmo": () => <g><path d="M50 6 V20" stroke={INK} strokeWidth="4" /><circle cx="50" cy="8" r="6" fill="#ff5d73" {...S} strokeWidth="3" /><rect x="14" y="20" width="72" height="66" rx="16" fill="#8fb3ff" {...S} /><rect x="6" y="44" width="10" height="20" rx="4" fill="#5d86e0" {...S} strokeWidth="3" /><rect x="84" y="44" width="10" height="20" rx="4" fill="#5d86e0" {...S} strokeWidth="3" /><Eyes kind="visor" y={46} /><path d="M36 68 h28" stroke={INK} strokeWidth="4" strokeLinecap="round" /><path d="M42 68 v6 M50 68 v6 M58 68 v6" stroke={INK} strokeWidth="3" /></g>,
  "c-pearl": () => <g><path d="M10 50 C10 24 30 12 50 12 C70 12 90 24 90 50 C90 76 70 90 50 90 C30 90 10 76 10 50Z" fill="#ff9bd0" {...S} /><path d="M2 40 L16 50 L4 64 Z M98 40 L84 50 L96 64 Z" fill="#ff6fb8" {...S} strokeWidth="3" /><path d="M30 20 Q50 6 70 20" fill="none" stroke="#fff" strokeWidth="4" opacity=".6" strokeLinecap="round" /><Eyes kind="wide" y={46} /><circle cx="50" cy="68" r="9" fill="#fff" {...S} strokeWidth="3" /><circle cx="47" cy="65" r="2.5" fill="#dff" /></g>,
  "c-ember": () => <g><path d="M24 30 L18 8 L38 22 M76 30 L82 8 L62 22" fill="#ffd23d" {...S} /><path d="M50 4 q10 14 0 22 q-10 -8 0 -22Z" fill="#ff7a3d" {...S} strokeWidth="3" /><path d="M14 56 C14 30 32 22 50 22 C68 22 86 30 86 56 C86 80 70 90 50 90 C30 90 14 80 14 56Z" fill="#ff5d3d" {...S} /><ellipse cx="50" cy="72" rx="20" ry="14" fill="#ffc27a" {...S} strokeWidth="3" /><Eyes kind="wide" y={48} /><circle cx="43" cy="70" r="2.5" fill={INK} /><circle cx="57" cy="70" r="2.5" fill={INK} /></g>,
};

export const avatarName = (id: string) => id;

export default function Avatar({ id, size = 64, className = "", title }: { id?: string; size?: number; className?: string; title?: string }) {
  const art = ART[id ?? "rk-sun"] ?? ART["rk-sun"];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={title ?? "avatar"} style={{ flex: "none", overflow: "visible" }}>
      {art()}
    </svg>
  );
}
