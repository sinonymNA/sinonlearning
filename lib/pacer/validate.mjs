// Server-side checks for what a client uploads to Pacer sync, plus the small merge rules that keep two devices in agreement. Pure ESM (unit-tested).
export const LIMITS = { maxBookBytes: 25 * 1024 * 1024, maxInflated: 120 * 1024 * 1024, maxBooks: 60, maxTotalBytes: 200 * 1024 * 1024, maxChapters: 3000, maxParas: 300000, maxWords: 3000000, maxSessions: 60 };
const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
/** Validate and rebuild an extracted book ({ id, title, author?, chapters: [{ title, paras: [{ text, kind, pg? }] }] }). Unknown fields are dropped. */
export function validateBook(j) {
  if (!j || typeof j !== "object") return { ok: false, error: "That is not a book." };
  const id = String(j.id || ""); if (!/^[a-z0-9]{1,24}$/.test(id)) return { ok: false, error: "The book id is not valid." };
  const title = str(j.title, 300).trim(); if (!title) return { ok: false, error: "The book has no title." };
  if (!Array.isArray(j.chapters) || j.chapters.length < 1 || j.chapters.length > LIMITS.maxChapters) return { ok: false, error: "The book has no chapters, or too many." };
  let words = 0, paras = 0; const chapters = [];
  for (const c of j.chapters) {
    if (!c || !Array.isArray(c.paras)) return { ok: false, error: "A chapter is malformed." }; const ps = [];
    for (const p of c.paras) {
      if (!p || typeof p.text !== "string") return { ok: false, error: "A paragraph is malformed." }; const text = p.text.slice(0, 60000).trim(); if (!text) continue;
      paras++; words += text.split(/\s+/).length; if (paras > LIMITS.maxParas || words > LIMITS.maxWords) return { ok: false, error: "That book is too large to save." };
      const q = { text, kind: p.kind === "h" ? "h" : "p" }; if (Number.isInteger(p.pg) && p.pg >= 0 && p.pg < 100000) q.pg = p.pg; ps.push(q);
    }
    if (ps.length) chapters.push({ title: str(c.title, 200) || "Section", paras: ps });
  }
  if (words < 5 || !chapters.length) return { ok: false, error: "There is no readable text in that book." };
  return { ok: true, book: { id, title, author: str(j.author, 200) || undefined, chapters, words, added: Number.isFinite(j.added) ? j.added : 0 } };
}
const MODES = ["focus", "pacer", "scroll"], FONTS = ["serif", "sans", "mono"], WIDTHS = ["narrow", "medium", "wide"], THEMES = ["paper", "sepia", "night", "contrast"], CHECKS = [0, 250, 500, 1000];
const num = (v, a, b, d) => (Number.isFinite(+v) ? Math.min(b, Math.max(a, Math.round(+v))) : d);
/** Reader settings from the wire, forced into their allowed values. */
export function sanitizeSettings(s = {}) {
  return { mode: MODES.includes(s.mode) ? s.mode : "pacer", wpm: num(s.wpm, 60, 1200, 250), chunk: num(s.chunk, 1, 3, 1), smart: s.smart !== false, font: FONTS.includes(s.font) ? s.font : "serif", size: num(s.size, 16, 44, 24), width: WIDTHS.includes(s.width) ? s.width : "medium", theme: THEMES.includes(s.theme) ? s.theme : "paper", dim: !!s.dim, ramp: !!s.ramp, rampMax: num(s.rampMax, 150, 900, 400), checks: CHECKS.includes(s.checks) ? s.checks : 0 };
}
export function sanitizeSessions(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(-LIMITS.maxSessions).map((x) => ({ t: num(x?.t, 0, 9e15, 0), title: str(x?.title, 200), words: num(x?.words, 0, 5e6, 0), wpm: num(x?.wpm, 0, 3000, 0), recall: x?.recall === null || x?.recall === undefined ? null : num(x.recall, 0, 100, 0), minutes: Math.max(0, Math.min(10000, +x?.minutes || 0)) })).filter((x) => x.t > 0);
}

// ---------------------------------------------------------------- merging two devices' views
/** Newest write wins for the reading position. local/cloud items: { id, title, author, words, pos, wpm, at }. `cloud: true` marks anything the server has. */
export function mergeLibraries(local, cloud) {
  const out = new Map();
  for (const l of local) out.set(l.id, { ...l, at: l.at || l.updated || 0, cloud: !!l.cloud && false });
  for (const c of cloud) { const l = out.get(c.id), ca = c.at || 0; if (!l) { out.set(c.id, { ...c, updated: c.updated ?? ca, cloud: true }); continue; } const useCloud = ca > (l.at || 0); out.set(c.id, { ...l, title: c.title || l.title, author: c.author ?? l.author, words: c.words || l.words, pos: useCloud ? c.pos : l.pos, wpm: useCloud ? c.wpm : l.wpm, at: Math.max(ca, l.at || 0), updated: Math.max(l.updated || 0, ca), cloud: true }); }
  return [...out.values()].sort((a, b) => (b.updated || 0) - (a.updated || 0));
}
export function mergeSessions(a, b) { const m = new Map(); for (const s of [...(a || []), ...(b || [])]) m.set(`${s.t}|${s.title}`, s); return [...m.values()].sort((x, y) => x.t - y.t).slice(-LIMITS.maxSessions); }
