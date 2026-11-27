// Turning loose text into paragraphs, and the rules for cleaning what a PDF gives us. Pure ESM.
/** Plain text or pasted text -> paragraphs. Blank lines separate paragraphs; single line breaks inside a paragraph are re-flowed; a line ending in a hyphen is rejoined. */
export function textToParas(text) {
  const t = String(text || "").replace(/\r\n?/g, "\n").replace(/­/g, ""), blocks = t.split(/\n\s*\n+/), out = [];
  for (const b of blocks) {
    const lines = b.split("\n").map((l) => l.trim()).filter(Boolean); if (!lines.length) continue; let s = "";
    for (const l of lines) { if (!s) s = l; else if (/[a-z]-$/.test(s) && /^[a-z]/.test(l)) s = s.slice(0, -1) + l; else s += " " + l; }
    s = s.replace(/\s+/g, " ").trim(); if (s) out.push({ text: s, kind: s.length < 70 && !/[.!?,;]$/.test(s) && lines.length === 1 ? "h" : "p" });
  }
  return out;
}
const median = (a) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const normKey = (s) => s.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim();
/** pdf.js text items -> paragraphs. pages: [{ height, items: [{ str, x, y, h }] }] with y measured from the BOTTOM of the page (pdf.js convention).
 *  Rebuilds lines, drops running headers/footers and page numbers, rejoins hyphenated words, splits paragraphs by spacing, marks big lines as headings, and joins paragraphs that run across a page break. */
export function pagesToParas(pages) {
  const perPage = pages.map((pg) => {
    const items = pg.items.filter((it) => String(it.str).trim() !== "" || it.gap).sort((a, b) => b.y - a.y || a.x - b.x), lines = [];
    for (const it of items) { const L = lines.find((l) => Math.abs(l.y - it.y) <= Math.max(2, it.h * 0.45)); if (L) L.items.push(it); else lines.push({ y: it.y, items: [it] }); }
    return lines.map((l) => { l.items.sort((a, b) => a.x - b.x); let s = ""; let prevEnd = null; for (const it of l.items) { const w = it.w ?? it.str.length * it.h * 0.5; if (prevEnd !== null && it.x - prevEnd > it.h * 0.18 && !s.endsWith(" ") && !it.str.startsWith(" ")) s += " "; s += it.str; prevEnd = it.x + w; } return { text: s.replace(/\s+/g, " ").trim(), y: l.y, x: l.items[0].x, h: Math.max(...l.items.map((i) => i.h)), end: prevEnd ?? 0, height: pg.height }; }).filter((l) => l.text);
  });
  // running headers and footers: the same text (digits ignored) in the top or bottom band of many pages
  const zone = (l) => (l.y > l.height * 0.9 ? "top" : l.y < l.height * 0.1 ? "bottom" : ""), seen = new Map();
  perPage.forEach((lines) => { for (const k of new Set(lines.filter(zone).map((l) => zone(l) + normKey(l.text)))) seen.set(k, (seen.get(k) || 0) + 1); });
  const minRepeat = Math.max(3, Math.ceil(pages.length * 0.4)), pageNum = /^(page\s*)?[-–—]?\s*\d{1,4}\s*[-–—]?(\s*(of|\/)\s*\d{1,4})?$/i;
  const kept = perPage.map((lines) => lines.filter((l) => { const z = zone(l); if (!z) return true; if (pageNum.test(l.text)) return false; return !(pages.length >= 3 && (seen.get(z + normKey(l.text)) || 0) >= minRepeat); }));
  const bodyH = median(kept.flat().map((l) => l.h)) || 10, paras = [];
  let pendingCross = null;
  kept.forEach((lines, pageIdx) => {
    if (!lines.length) return; const left = median(lines.map((l) => l.x)), gaps = []; for (let i = 1; i < lines.length; i++) gaps.push(lines[i - 1].y - lines[i].y); const gap = median(gaps) || bodyH * 1.3, maxEnd = Math.max(...lines.map((l) => l.end));
    let cur = null; const flush = () => { if (cur && cur.text) paras.push(cur); cur = null; };
    lines.forEach((l, i) => {
      const head = l.h > bodyH * 1.22 && l.text.length < 120, prev = lines[i - 1], bigGap = prev && prev.y - l.y > gap * 1.45, indent = prev && l.x > left + bodyH * 1.1 && /[.!?”"']$/.test(prev.text), shortPrev = prev && prev.end < maxEnd * 0.62 && /[.!?”"']$/.test(prev.text);
      if (head) { flush(); paras.push({ text: l.text, kind: "h", pg: pageIdx }); return; }
      if (!cur || bigGap || indent || shortPrev) { flush(); cur = { text: l.text, kind: "p", pg: pageIdx }; if (i === 0 && pendingCross && /^[a-z]/.test(l.text)) { cur = pendingCross; cur.text = /[a-z]-$/.test(cur.text) ? cur.text.slice(0, -1) + l.text : cur.text + " " + l.text; pendingCross = null; paras.pop?.(); } return; }
      cur.text = /[a-z]-$/.test(cur.text) && /^[a-z]/.test(l.text) ? cur.text.slice(0, -1) + l.text : cur.text + " " + l.text;
    });
    flush(); const last = paras[paras.length - 1]; pendingCross = last && last.kind === "p" && !/[.!?”"')\]]$/.test(last.text) ? last : null;
  });
  return paras.map(({ text, kind, pg }) => ({ text, kind, pg }));
}
