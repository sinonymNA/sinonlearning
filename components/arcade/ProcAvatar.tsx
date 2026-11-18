import type { ReactNode } from "react";

const INK = "#14163a";
export type Look = { body: string; color: string; eyes: string; mouth: string; acc: string; accColor: string };
const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const BODY: Record<string, { d: ReactNode; eye: number }> = {
  round: { d: <circle cx="50" cy="56" r="34" />, eye: 52 },
  blob: { d: <path d="M50 18 C80 16 90 42 86 62 C82 84 62 90 46 88 C26 86 12 72 14 50 C16 32 30 20 50 18Z" />, eye: 52 },
  square: { d: <rect x="16" y="22" width="68" height="66" rx="20" />, eye: 52 },
  tall: { d: <ellipse cx="50" cy="56" rx="28" ry="38" />, eye: 46 },
  drop: { d: <path d="M50 12 C60 32 84 46 84 66 C84 84 68 94 50 94 C32 94 16 84 16 66 C16 46 40 32 50 12Z" />, eye: 64 },
  cloud: { d: <path d="M26 84 C6 84 6 54 28 54 C26 30 56 22 64 42 C86 36 96 62 80 74 C86 88 70 90 66 84 Z" />, eye: 60 },
  tri: { d: <path d="M50 16 C58 16 90 70 88 80 C86 90 14 90 12 80 C10 70 42 16 50 16Z" />, eye: 66 },
  bean: { d: <path d="M30 22 C56 10 88 30 82 58 C78 82 52 92 34 82 C14 72 12 34 30 22Z" />, eye: 52 },
};

function Eyes({ kind, y }: { kind: string; y: number }) {
  const l = 38, r = 62;
  if (kind === "wide") return <g><circle cx={l} cy={y} r="8" fill="#fff" {...S} strokeWidth="3" /><circle cx={r} cy={y} r="8" fill="#fff" {...S} strokeWidth="3" /><circle cx={l + 1} cy={y + 1} r="3.5" fill={INK} /><circle cx={r + 1} cy={y + 1} r="3.5" fill={INK} /></g>;
  if (kind === "sleepy") return <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none"><path d={`M${l - 6} ${y} q6 6 12 0`} /><path d={`M${r - 6} ${y} q6 6 12 0`} /></g>;
  if (kind === "happy") return <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none"><path d={`M${l - 6} ${y + 3} q6 -9 12 0`} /><path d={`M${r - 6} ${y + 3} q6 -9 12 0`} /></g>;
  if (kind === "visor") return <g><rect x="24" y={y - 8} width="52" height="16" rx="8" fill={INK} /><rect x="30" y={y - 4} width="14" height="4" rx="2" fill="#fff" opacity=".5" /></g>;
  return <g fill={INK}><circle cx={l} cy={y} r="4.5" /><circle cx={r} cy={y} r="4.5" /><circle cx={l + 1.5} cy={y - 1.5} r="1.4" fill="#fff" /><circle cx={r + 1.5} cy={y - 1.5} r="1.4" fill="#fff" /></g>;
}
function Mouth({ kind, y }: { kind: string; y: number }) {
  if (kind === "open") return <path d={`M42 ${y} q8 14 16 0 z`} fill={INK} />;
  if (kind === "grin") return <path d={`M38 ${y} q12 16 24 0 z`} fill="#fff" {...S} strokeWidth="3" />;
  if (kind === "flat") return <path d={`M42 ${y + 4} h16`} stroke={INK} strokeWidth="4" strokeLinecap="round" />;
  return <path d={`M40 ${y} q10 9 20 0`} stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />;
}

function Accessory({ kind, c }: { kind: string; c: string }): ReactNode {
  switch (kind) {
    case "horns": return <g fill={c} {...S}><path d="M26 30 L20 8 L40 22Z" /><path d="M74 30 L80 8 L60 22Z" /></g>;
    case "antenna": return <g><path d="M50 24 V6" stroke={INK} strokeWidth="4" /><circle cx="50" cy="6" r="6" fill={c} {...S} strokeWidth="3" /></g>;
    case "bunny": return <g fill={c} {...S}><ellipse cx="36" cy="14" rx="7" ry="16" /><ellipse cx="64" cy="14" rx="7" ry="16" /></g>;
    case "sprout": return <g><path d="M50 26 q-2 -10 2 -16" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M52 12 q16 -10 22 4 q-14 8 -22 -4Z" fill={c} {...S} strokeWidth="3" /><path d="M50 14 q-16 -10 -22 4 q14 8 22 -4Z" fill={c} {...S} strokeWidth="3" /></g>;
    case "halo": return <ellipse cx="50" cy="12" rx="22" ry="6" fill="none" stroke={c === "#ffe066" ? "#ffd23d" : "#ffd23d"} strokeWidth="5" />;
    case "crown": return <path d="M28 28 l6 -20 l16 12 l16 -12 l6 20Z" fill={c} {...S} strokeWidth="3" />;
    case "wizard": return <g><path d="M30 30 L50 -4 L70 30Z" fill={c} {...S} /><ellipse cx="50" cy="30" rx="26" ry="6" fill="#5a3fd0" {...S} /><circle cx="50" cy="14" r="3" fill="#fff" /></g>;
    case "pirate": return <g><path d="M22 30 C24 6 76 6 78 30Z" fill="#14163a" {...S} /><circle cx="50" cy="18" r="4" fill="#fff" /><path d="M46 24 h8" stroke="#fff" strokeWidth="2" /></g>;
    case "bandana": return <g><path d="M20 38 C30 28 70 28 80 38 L76 46 C64 38 36 38 24 46Z" fill={c} {...S} strokeWidth="3" /><circle cx="40" cy="38" r="2" fill="#fff" /><circle cx="52" cy="35" r="2" fill="#fff" /><circle cx="62" cy="38" r="2" fill="#fff" /></g>;
    case "headphones": return <g><path d="M20 50 C18 14 82 14 80 50" fill="none" stroke={INK} strokeWidth="5" /><rect x="12" y="44" width="14" height="22" rx="6" fill={c} {...S} strokeWidth="3" /><rect x="74" y="44" width="14" height="22" rx="6" fill={c} {...S} strokeWidth="3" /></g>;
    case "spikes": return <g fill={c} {...S} strokeWidth="3"><path d="M26 30 l4 -16 l8 12Z" /><path d="M40 24 l6 -18 l8 18Z" /><path d="M58 26 l8 -12 l6 16Z" /></g>;
    case "scarf": return <g><path d="M24 78 C40 90 60 90 76 78 L78 88 C60 100 40 100 22 88Z" fill={c} {...S} strokeWidth="3" /><path d="M62 88 l4 12 l10 -4 l-6 -10Z" fill={c} {...S} strokeWidth="3" /></g>;
    case "bow": return <g fill={c} {...S} strokeWidth="3"><path d="M64 24 l-16 -8 v16Z" /><path d="M64 24 l16 -8 v16Z" /><circle cx="64" cy="24" r="4" /></g>;
    default: return null;
  }
}

export default function ProcAvatar({ look }: { look: Look }) {
  const b = BODY[look.body] ?? BODY.round;
  return (
    <g>
      <g fill={look.color} {...S}>{b.d}</g>
      <path d="M26 60 q4 -10 14 -12" stroke="#ffffff" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" fill="none" />
      <Eyes kind={look.eyes} y={b.eye} />
      <Mouth kind={look.mouth} y={b.eye + 14} />
      <g fill="#ff9bb0" opacity=".55"><ellipse cx="28" cy={b.eye + 8} rx="5" ry="3.5" /><ellipse cx="72" cy={b.eye + 8} rx="5" ry="3.5" /></g>
      <Accessory kind={look.acc} c={look.accColor} />
    </g>
  );
}
