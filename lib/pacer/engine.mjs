// Pacer engine: turns paragraphs into timed words and answers every "how long / where next" question. Pure ESM (no DOM, no Date.now): the UI passes time in, so it is unit-tested with node --test.
// Flags on each word (bit set): SENT = ends a sentence, CLAUSE = a comma-like pause, PARA = ends a paragraph, HEAD = part of a heading.
export const SENT = 1, CLAUSE = 2, PARA = 4, HEAD = 8;
export const MIN_WPM = 60, MAX_WPM = 1200;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const END_SENT = /[.!?…]["'”’)\]]*$/, END_CLAUSE = /[,;:—–]["'”’)\]]*$/;
const ABBREV = /^(mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|e\.g|i\.e|no|fig|approx|inc|ltd|co)\.$/i;

/** paras: [{ text, kind: "p" | "h" }] -> { words: string[], flags: Uint8Array, paraStart: number[] (word index where each paragraph begins), paraOf: Uint32Array }. */
export function tokenize(paras) {
  const words = [], flags = [], paraStart = [], paraOf = [];
  paras.forEach((p) => {
    const toks = String(p.text || "").split(/\s+/).filter(Boolean); if (!toks.length) return; paraStart.push(words.length);
    toks.forEach((w, i) => {
      let f = 0; if (END_SENT.test(w) && !ABBREV.test(w) && !/^\d+\.$/.test(w)) f |= SENT; else if (END_CLAUSE.test(w)) f |= CLAUSE; if (i === toks.length - 1) f |= PARA | SENT; if (p.kind === "h") f |= HEAD | (i === toks.length - 1 ? SENT : 0);
      words.push(w); flags.push(f); paraOf.push(paraStart.length - 1);
    });
  });
  return { words, flags: Uint8Array.from(flags), paraStart, paraOf: Uint32Array.from(paraOf) };
}

/** Where the eye should land in a word (the "pivot"): about a third in, ignoring quotes and brackets at the front. Returns the index into the full string. */
export function orpIndex(word) {
  const lead = (/^[\s"'“‘([{—–-]+/.exec(word) || [""])[0].length, core = word.slice(lead).replace(/[^\p{L}\p{N}]+$/u, ""), n = [...core].length;
  const k = n <= 1 ? 0 : n <= 5 ? 1 : n <= 9 ? 2 : n <= 13 ? 3 : 4; return Math.min(word.length - 1, lead + k);
}
/** [before, pivot letter, after]. */
export function splitOrp(word) { const i = orpIndex(word); return [word.slice(0, i), word[i] ?? "", word.slice(i + 1)]; }

/** Time multiplier for one word (1 = the plain beat of the chosen speed). Long words and numbers take longer, tiny words a touch less, and punctuation adds a breath. */
export function factorFor(word, flag, smart = true) {
  if (!smart) return 1; const n = [...word.replace(/[^\p{L}\p{N}]/gu, "")].length; let f = n <= 3 ? 0.85 : n <= 6 ? 1 : 1 + Math.min(0.55, (n - 6) * 0.07); if (/\d/.test(word)) f += 0.25;
  if (flag & HEAD) f += 0.2; if (flag & SENT) f += 0.9; else if (flag & CLAUSE) f += 0.45; if (flag & PARA) f += 0.9; return f;
}
export const beatMs = (wpm) => 60000 / clamp(wpm, MIN_WPM, MAX_WPM);
/** How long to show word i. */
export const delayMs = (doc, i, wpm, smart = true) => beatMs(wpm) * factorFor(doc.words[i], doc.flags[i], smart);
/** Prefix sums of the time factors, so "time left" is exact and instant: sum(i..j) = P[j] - P[i]. */
export function buildFactorPrefix(doc, smart = true) { const P = new Float64Array(doc.words.length + 1); for (let i = 0; i < doc.words.length; i++) P[i + 1] = P[i] + factorFor(doc.words[i], doc.flags[i], smart); return P; }
export const timeLeftMs = (P, i, wpm) => (P[P.length - 1] - P[Math.min(i, P.length - 1)]) * beatMs(wpm);

/** End (exclusive) of the chunk that starts at i, at most n words, never crossing a sentence or paragraph end. */
export function chunkEnd(doc, i, n = 1) { let j = i; while (j < doc.words.length && j - i < n) { j++; if (doc.flags[j - 1] & (SENT | PARA)) break; } return Math.max(j, Math.min(doc.words.length, i + 1)); }
export const chunkText = (doc, i, j) => doc.words.slice(i, j).join(" ");
/** Sentence navigation: the start of the sentence containing i, the start of the next one, and the previous one. */
export function sentenceStart(doc, i) { let j = clamp(i, 0, doc.words.length - 1); while (j > 0 && !(doc.flags[j - 1] & SENT)) j--; return j; }
export function nextSentence(doc, i) { let j = clamp(i, 0, doc.words.length - 1); while (j < doc.words.length - 1 && !(doc.flags[j] & SENT)) j++; return Math.min(doc.words.length - 1, j + 1); }
export function prevSentence(doc, i) { const s = sentenceStart(doc, i); return s === sentenceStart(doc, Math.max(0, i)) && i > s ? s : sentenceStart(doc, Math.max(0, s - 1)); }
/** Paragraph index and the word range of the paragraph that contains word i. */
export function paragraphRange(doc, i) { const p = doc.paraOf[clamp(i, 0, doc.words.length - 1)], a = doc.paraStart[p], b = p + 1 < doc.paraStart.length ? doc.paraStart[p + 1] : doc.words.length; return { p, a, b }; }

// ---------------------------------------------------------------- training
/** The speed to use after `wordsRead` words in a ramp: it climbs `step` wpm every `every` words, from `start` up to `max`. */
export function rampWpm({ start, max, step = 10, every = 100 }, wordsRead) { return clamp(start + Math.floor(wordsRead / every) * step, MIN_WPM, Math.max(start, max)); }
/** Speed after a recall check-in: a miss takes ~12% off, three clean checks in a row put ~6% back (never above `ceiling`). Returns { wpm, streak }. */
export function adaptWpm(wpm, hit, streak = 0, ceiling = MAX_WPM) {
  if (!hit) return { wpm: clamp(Math.round(wpm * 0.88), MIN_WPM, ceiling), streak: 0 }; const s = streak + 1; return s >= 3 ? { wpm: clamp(Math.round(wpm * 1.06), MIN_WPM, ceiling), streak: 0 } : { wpm, streak: s };
}
/** Reading-session numbers: the real speed (words over active time, excluding pauses) and the share of recall checks you got. */
export function sessionStats({ words, activeMs, checks = [] }) { return { words, wpm: activeMs > 1500 ? Math.round((words / activeMs) * 60000) : 0, minutes: Math.round(activeMs / 6000) / 10, recall: checks.length ? Math.round((100 * checks.filter(Boolean).length) / checks.length) : null, checks: checks.length }; }
/** A comfort label for a speed, so a student knows where they are (these are typical adult silent-reading ranges). */
export function paceLabel(wpm) { return wpm < 150 ? "Slow and careful" : wpm < 250 ? "Comfortable" : wpm < 350 ? "Typical adult reading" : wpm < 500 ? "Fast. Check you still follow it" : "Skimming speed. Great for review, hard for new ideas"; }

/** Lowercase a word and strip punctuation at its edges, so "Lantern," matches "lantern". */
export const normWord = (w) => String(w ?? "").toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
const NORM = new WeakMap();
/**
 * Find a word or phrase in the book. Words must be consecutive; the last one may be a prefix (so results appear while you type).
 * Returns { hits: start indices in reading order, len: words per hit, total, capped }.
 */
export function findMatches(doc, query, { max = 300 } = {}) {
  const terms = String(query ?? "").split(/\s+/).map(normWord).filter(Boolean), n = terms.length;
  if (!n) return { hits: [], len: 0, total: 0, capped: false };
  let norm = NORM.get(doc); if (!norm) { norm = doc.words.map(normWord); NORM.set(doc, norm); }
  const last = terms[n - 1], prefix = last.length >= 2, hits = []; let total = 0;
  for (let i = 0; i + n <= norm.length; i++) {
    let ok = true;
    for (let k = 0; k < n - 1; k++) if (norm[i + k] !== terms[k]) { ok = false; break; }
    if (!ok) continue; const w = norm[i + n - 1];
    if (prefix ? w.startsWith(last) : w === last) { total++; if (hits.length < max) hits.push(i); }
  }
  return { hits, len: n, total, capped: total > hits.length };
}
