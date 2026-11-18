/** Original potato character. The face and colour react to the (hidden-fuse) heat level 0-3, 4 = exploded. */
const INK = "#14163a";
const BODY = ["#e0a867", "#eb8f4c", "#f26a3b", "#ff3d2e"];

export default function PotatoSvg({ heat = 0, mode = "live", size = 200 }: { heat?: number; mode?: "live" | "boom" | "done"; size?: number }) {
  const h = Math.min(3, Math.max(0, heat));
  const boom = mode === "boom";
  const fill = boom ? "#5b3a26" : BODY[h];
  return (
    <svg viewBox="0 0 200 230" width={size} height={size * 1.15} role="img" aria-label={boom ? "Exploded potato" : `Potato, heat level ${h}`} style={{ overflow: "visible" }}>
      {boom && (
        <g className="pop">
          <path d="M100 -20 L122 40 L186 10 L150 70 L214 100 L146 118 L190 180 L120 150 L100 220 L80 150 L10 180 L54 118 L-14 100 L50 70 L14 10 L78 40Z" fill="#ffd23d" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <path d="M100 20 L112 62 L158 40 L134 88 L176 104 L128 116 L150 156 L108 136 L100 186 L92 136 L50 156 L72 116 L24 104 L66 88 L42 40 L88 62Z" fill="#ff7a3d" />
        </g>
      )}
      {h >= 3 && !boom && (
        <g>
          <path className="ar-flame" d="M70 52 C60 20 90 18 84 -6 C110 10 112 34 100 50 Z" fill="#ff9d2e" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path className="ar-flame" style={{ animationDelay: ".15s" }} d="M110 50 C108 22 138 16 132 -8 C156 14 150 38 134 56 Z" fill="#ffd23d" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        </g>
      )}
      {h === 2 && !boom && <g fill="#fff" opacity=".85" stroke={INK} strokeWidth="3"><circle className="ar-steam" cx="72" cy="30" r="9" /><circle className="ar-steam" style={{ animationDelay: ".4s" }} cx="104" cy="22" r="11" /><circle className="ar-steam" style={{ animationDelay: ".8s" }} cx="136" cy="32" r="8" /></g>}
      <path d="M100 40 C150 30 184 70 180 122 C176 176 148 214 100 214 C52 214 22 178 20 122 C18 70 52 30 100 40Z" fill={fill} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      {!boom && h < 3 && <g fill="#00000026"><ellipse cx="62" cy="168" rx="7" ry="5" /><ellipse cx="136" cy="176" rx="8" ry="5" /><ellipse cx="150" cy="96" rx="5" ry="4" /></g>}
      {!boom && h >= 3 && <path d="M60 80 l16 14 l-8 10 l18 12 M142 120 l-14 10 l10 12" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
      {/* eyes */}
      {boom ? (
        <g stroke={INK} strokeWidth="6" strokeLinecap="round"><path d="M64 96 l24 24 M88 96 l-24 24 M112 96 l24 24 M136 96 l-24 24" /></g>
      ) : (
        <g>
          <ellipse cx="72" cy="104" rx={h >= 2 ? 19 : 15} ry={h >= 2 ? 23 : 17} fill="#fff" stroke={INK} strokeWidth="5" />
          <ellipse cx="128" cy="104" rx={h >= 2 ? 19 : 15} ry={h >= 2 ? 23 : 17} fill="#fff" stroke={INK} strokeWidth="5" />
          <circle className={h >= 3 ? "ar-jitter" : ""} cx={h >= 2 ? 72 : 76} cy="106" r={h >= 2 ? 5 : 7.5} fill={INK} />
          <circle className={h >= 3 ? "ar-jitter" : ""} cx={h >= 2 ? 128 : 132} cy="106" r={h >= 2 ? 5 : 7.5} fill={INK} />
          {h >= 1 && <path d="M52 78 q20 -14 40 -2 M148 78 q-20 -14 -40 -2" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" transform={h >= 2 ? "rotate(0)" : "translate(0,4)"} />}
        </g>
      )}
      {/* mouth */}
      {boom ? <path d="M78 160 q22 -22 44 0" stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />
        : h === 0 ? <path d="M76 150 q24 26 48 0" stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />
        : h === 1 ? <path d="M78 156 q8 -8 14 0 t14 0 t14 0" stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />
        : h === 2 ? <g><rect x="74" y="146" width="52" height="26" rx="10" fill="#fff" stroke={INK} strokeWidth="5" /><path d="M86 146 v26 M100 146 v26 M114 146 v26" stroke={INK} strokeWidth="3" /></g>
        : <g><ellipse cx="100" cy="162" rx="22" ry="26" fill={INK} /><ellipse cx="100" cy="176" rx="12" ry="8" fill="#ff5d73" /></g>}
      {/* sweat */}
      {!boom && h >= 1 && <path className="ar-drip" d="M168 90 q-10 18 0 24 q10 -6 0 -24Z" fill="#7fd6ff" stroke={INK} strokeWidth="3" />}
      {!boom && h >= 2 && <path className="ar-drip" style={{ animationDelay: ".5s" }} d="M28 100 q-9 16 0 22 q9 -6 0 -22Z" fill="#7fd6ff" stroke={INK} strokeWidth="3" />}
      {mode === "done" && <path d="M64 28 l16 -24 l20 18 l20 -18 l16 24 Z" fill="#ffd23d" stroke={INK} strokeWidth="5" strokeLinejoin="round" />}
      {/* feet */}
      <ellipse cx="70" cy="218" rx="22" ry="9" fill={INK} opacity=".25" /><ellipse cx="132" cy="218" rx="22" ry="9" fill={INK} opacity=".25" />
    </svg>
  );
}
