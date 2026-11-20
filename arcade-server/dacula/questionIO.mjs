// Teacher question import for Dacula Dash: CSV or JSON -> validated questions. No HTML is ever stored or rendered: text is plain.
// Columns (CSV header, case-insensitive): category, question, correct, wrong1, wrong2, wrong3, explanation, difficulty
import { CAT_IDS } from "./board.mjs";

export const LIMITS = { question: 220, answer: 80, explanation: 240, max: 600 };
const ALIASES = {
  geo: "geo", geography: "geo", blue: "geo", "geography (blue)": "geo",
  history: "history", yellow: "history",
  science: "science", "science & nature": "science", "science and nature": "science", nature: "science", green: "science",
  ent: "ent", entertainment: "ent", pink: "ent", "pop culture": "ent",
  arts: "arts", art: "arts", "arts & literature": "arts", "arts and literature": "arts", literature: "arts", purple: "arts",
  sports: "sports", sport: "sports", "sports & leisure": "sports", "sports and leisure": "sports", leisure: "sports", orange: "sports",
};
export const normCategory = (s) => ALIASES[String(s ?? "").trim().toLowerCase()] ?? null;
/** Plain text only: strip tags, control characters, collapse whitespace. */
export const clean = (s) => String(s ?? "").replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
const key = (s) => clean(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, newlines inside quotes). */
export function parseCsv(text) {
  const rows = []; let row = [], cur = "", q = false;
  const s = String(text ?? "").replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x.trim() !== "")) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

/** Validate one raw question object. Returns { q } or { error }. */
export function validateQuestion(raw, i = 0) {
  const cat = normCategory(raw.category ?? raw.cat);
  if (!cat) return { error: `category "${raw.category ?? raw.cat ?? ""}" is not one of: ${CAT_IDS.join(", ")} (or Geography, History, Science & Nature, Entertainment, Arts & Literature, Sports & Leisure)` };
  const q = clean(raw.question ?? raw.q), a = clean(raw.correct ?? raw.a);
  const w = (raw.wrong ?? [raw.wrong1, raw.wrong2, raw.wrong3]).map(clean);
  if (!q) return { error: "question is empty" };
  if (q.length > LIMITS.question) return { error: `question is longer than ${LIMITS.question} characters` };
  if (!a) return { error: "correct answer is empty" };
  if (w.length !== 3 || w.some((x) => !x)) return { error: "needs exactly three wrong answers" };
  const all = [a, ...w];
  if (all.some((x) => x.length > LIMITS.answer)) return { error: `an answer is longer than ${LIMITS.answer} characters` };
  if (new Set(all.map(key)).size !== 4) return { error: "the four answers must all be different" };
  const x = clean(raw.explanation ?? raw.x ?? "").slice(0, LIMITS.explanation);
  let d = Number(raw.difficulty ?? raw.d ?? 2); if (!Number.isFinite(d)) d = 2; d = Math.max(1, Math.min(3, Math.round(d)));
  return { q: { id: `teacher-${cat}-${i + 1}`, cat, d, q, a, w, x, src: "teacher", review: "teacher-supplied" } };
}

/**
 * Import CSV text or a JSON array/string. Duplicates (same normalised question, in the file or in `existing`) are reported, not silently kept.
 * @returns {{ questions: object[], errors: {row:number, message:string}[], duplicates: number }}
 */
export function importQuestions(input, { format = "auto", existing = [] } = {}) {
  const errors = [], questions = [], seen = new Set(existing.map((e) => key(e.q)));
  let rows = [];
  const text = typeof input === "string" ? input : null;
  const fmt = format !== "auto" ? format : Array.isArray(input) || (text && /^\s*[\[{]/.test(text)) ? "json" : "csv";
  try {
    if (fmt === "json") { const data = Array.isArray(input) ? input : JSON.parse(text); rows = (Array.isArray(data) ? data : data.questions ?? []).map((r, i) => ({ n: i + 1, raw: r })); }
    else {
      const t = parseCsv(text); if (!t.length) return { questions, errors: [{ row: 0, message: "the file is empty" }], duplicates: 0 };
      const head = t[0].map((h) => h.trim().toLowerCase());
      const col = (name, alt = []) => head.findIndex((h) => h === name || alt.includes(h));
      const idx = { category: col("category", ["cat"]), question: col("question", ["q"]), correct: col("correct", ["answer", "a", "correct answer"]), w1: col("wrong1", ["wrong 1", "incorrect1"]), w2: col("wrong2", ["wrong 2", "incorrect2"]), w3: col("wrong3", ["wrong 3", "incorrect3"]), explanation: col("explanation", ["x", "why"]), difficulty: col("difficulty", ["d", "level"]) };
      for (const [k, v] of Object.entries(idx)) if (v < 0 && ["category", "question", "correct", "w1", "w2", "w3"].includes(k)) return { questions, errors: [{ row: 1, message: `missing column "${k === "w1" ? "wrong1" : k === "w2" ? "wrong2" : k === "w3" ? "wrong3" : k}"` }], duplicates: 0 };
      rows = t.slice(1).map((r, i) => ({ n: i + 2, raw: { category: r[idx.category], question: r[idx.question], correct: r[idx.correct], wrong: [r[idx.w1], r[idx.w2], r[idx.w3]], explanation: idx.explanation >= 0 ? r[idx.explanation] : "", difficulty: idx.difficulty >= 0 ? r[idx.difficulty] : 2 } }));
    }
  } catch (e) { return { questions, errors: [{ row: 0, message: `could not read the file: ${e.message}` }], duplicates: 0 }; }
  let duplicates = 0;
  if (rows.length > LIMITS.max) { errors.push({ row: 0, message: `too many questions (max ${LIMITS.max}); the rest were ignored` }); rows = rows.slice(0, LIMITS.max); }
  for (const { n, raw } of rows) {
    const r = validateQuestion(raw ?? {}, questions.length);
    if (r.error) { errors.push({ row: n, message: r.error }); continue; }
    const k = key(r.q.q); if (seen.has(k)) { duplicates++; errors.push({ row: n, message: "duplicate question (skipped)" }); continue; }
    seen.add(k); questions.push(r.q);
  }
  return { questions, errors, duplicates };
}

/** Which categories can host the game? Each needs at least `min` questions (6 for the final challenge draws from difficulty >= 2). */
export function coverage(bank, min = 4) {
  const n = Object.fromEntries(CAT_IDS.map((c) => [c, 0])); for (const q of bank) if (n[q.cat] !== undefined) n[q.cat]++;
  return { counts: n, ok: CAT_IDS.every((c) => n[c] >= min), missing: CAT_IDS.filter((c) => n[c] < min) };
}
