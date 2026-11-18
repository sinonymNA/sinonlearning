import { useId } from "react";

/** Procedural fish for the Abyss collection. Everything is drawn in a 100x100 box, facing right. Original designs. */
const INK = "#14163a";
export type FishLook = { body: string; color: string; color2: string; pattern: string; fin: string; extra: string };
const GEO: Record<string, { rx: number; ry: number; cx: number; cy: number }> = {
  round: { rx: 28, ry: 26, cx: 56, cy: 54 }, long: { rx: 34, ry: 15, cx: 56, cy: 54 }, flat: { rx: 32, ry: 12, cx: 56, cy: 58 },
  tall: { rx: 21, ry: 31, cx: 56, cy: 52 }, puffer: { rx: 28, ry: 28, cx: 58, cy: 54 },
};

export default function FishArt({ look }: { look: FishLook }) {
  const uid = useId().replace(/:/g, "");
  const { body, color, color2, pattern, fin, extra } = look;
  const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const halo = extra === "glow" ? <circle cx="52" cy="54" r="46" fill={color2} opacity=".28" /> : null;

  if (body === "eel") {
    const path = "M8 60 C22 30 38 82 54 54 C68 28 80 70 90 46";
    return (
      <g>
        {halo}
        <path d={path} fill="none" stroke={INK} strokeWidth="22" strokeLinecap="round" />
        <path d={path} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
        {pattern === "stripes" && <path d={path} fill="none" stroke={color2} strokeWidth="14" strokeDasharray="5 9" opacity=".55" />}
        {pattern === "bands" && <path d={path} fill="none" stroke={color2} strokeWidth="14" strokeDasharray="8 10" />}
        {pattern === "spots" && <path d={path} fill="none" stroke={color2} strokeWidth="6" strokeDasharray="1 13" strokeLinecap="round" />}
        {extra === "lure" && <g><path d="M88 40 Q94 22 86 14" fill="none" stroke={INK} strokeWidth="3" /><circle cx="86" cy="13" r="6" fill="#ffe066" {...S} strokeWidth="3" /></g>}
        <circle cx="88" cy="45" r="6" fill="#fff" {...S} strokeWidth="3" /><circle cx="89.5" cy="45.5" r="2.6" fill={INK} />
      </g>
    );
  }

  const g = GEO[body] ?? GEO.round;
  const { rx, ry, cx, cy } = g;
  const left = cx - rx;
  const tail = `M${left + 6} ${cy} L${left - 18} ${cy - Math.max(14, ry * 0.8)} Q${left - 10} ${cy} ${left - 18} ${cy + Math.max(14, ry * 0.8)} Z`;
  const eyeX = cx + rx * 0.55, eyeY = cy - ry * 0.2;
  const clip = `fish-${uid}`, grad = `grad-${uid}`;
  return (
    <g>
      {halo}
      <defs>
        <clipPath id={clip}><ellipse cx={cx} cy={cy} rx={rx} ry={ry} /></clipPath>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} /><stop offset="1" stopColor={color2} /></linearGradient>
      </defs>
      {extra === "lure" && <g><path d={`M${cx + 6} ${cy - ry + 2} Q${cx + 16} ${cy - ry - 22} ${cx + 32} ${cy - ry - 8}`} fill="none" stroke={INK} strokeWidth="3" /><circle cx={cx + 32} cy={cy - ry - 8} r="9" fill="#ffe066" opacity=".35" /><circle cx={cx + 32} cy={cy - ry - 8} r="5.5" fill="#ffe066" {...S} strokeWidth="3" /></g>}
      <path d={tail} fill={color2} {...S} />
      {fin === "round" && <ellipse cx={cx - 2} cy={cy - ry} rx="12" ry="8" fill={color2} {...S} />}
      {fin === "spiky" && <path d={`M${cx - 16} ${cy - ry + 3} L${cx - 10} ${cy - ry - 12} L${cx - 3} ${cy - ry + 1} L${cx + 4} ${cy - ry - 14} L${cx + 10} ${cy - ry + 2} L${cx + 16} ${cy - ry - 8} L${cx + 20} ${cy - ry + 4}Z`} fill={color2} {...S} strokeWidth="3" />}
      {fin === "long" && <path d={`M${cx - rx + 8} ${cy - ry + 3} Q${cx} ${cy - ry - 20} ${cx + rx - 6} ${cy - ry + 2}Z`} fill={color2} {...S} strokeWidth="3" />}
      {extra === "sword" && <path d={`M${cx + rx - 3} ${cy - 3} L${cx + rx + 24} ${cy} L${cx + rx - 3} ${cy + 3}Z`} fill="#e6eefc" {...S} strokeWidth="3" />}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={pattern === "gradient" ? `url(#${grad})` : color} {...S} />
      <g clipPath={`url(#${clip})`}>
        {pattern === "stripes" && [-12, 0, 12].map((o) => <rect key={o} x={cx + o - 3} y={cy - ry} width="6" height={ry * 2} fill={color2} opacity=".5" />)}
        {pattern === "bands" && [-10, 8].map((o) => <rect key={o} x={cx + o - 4} y={cy - ry} width="8" height={ry * 2} fill={color2} />)}
        {pattern === "spots" && [[-12, -4], [-2, 8], [8, -8], [14, 6], [-16, 6]].map(([dx, dy], i) => <circle key={i} cx={cx + dx} cy={cy + dy * (ry / 20)} r="3.4" fill={color2} opacity=".7" />)}
        <ellipse cx={cx - rx * 0.25} cy={cy - ry * 0.5} rx={rx * 0.35} ry={ry * 0.14} fill="#fff" opacity=".35" />
      </g>
      <ellipse cx={cx - 4} cy={cy + ry * 0.35} rx="8" ry="4.5" fill={color2} {...S} strokeWidth="3" transform={`rotate(-20 ${cx - 4} ${cy + ry * 0.35})`} />
      <circle cx={eyeX} cy={eyeY} r="6.5" fill="#fff" {...S} strokeWidth="3" /><circle cx={eyeX + 1.5} cy={eyeY + 0.5} r="3" fill={INK} /><circle cx={eyeX + 2.4} cy={eyeY - 1} r="1" fill="#fff" />
      <path d={`M${cx + rx - 6} ${cy + ry * 0.35} q4 3 8 0`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      {extra === "crown" && <path d={`M${cx - 10} ${cy - ry - 2} l3 -14 l7 8 l7 -10 l5 14Z`} fill="#ffd23d" {...S} strokeWidth="3" />}
    </g>
  );
}

export const isFishId = (id?: string) => !!id && id.startsWith("f-");
