const SUF = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
/** Short numbers for incremental games: 1.23K, 4.5M ... then scientific. */
export function fmt(n: number, d = 2): string {
  if (!isFinite(n)) return "∞"; if (n < 0) return "-" + fmt(-n, d);
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(n < 1 ? 2 : 1) : String(Math.floor(n));
  const e = Math.floor(Math.log10(n) / 3); if (e >= SUF.length) { const x = Math.floor(Math.log10(n)); return (n / 10 ** x).toFixed(2) + "e" + x; }
  const v = n / 1000 ** e; return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(d)) + SUF[e];
}
export const fmtTime = (s: number) => (s < 60 ? `${Math.ceil(s)}s` : s < 3600 ? `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`);
