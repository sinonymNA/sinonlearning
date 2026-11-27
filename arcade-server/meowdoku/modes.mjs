// Meowdoku game modes beyond the campaign: the Daily Puzzle, Endless play, the shop, and the board-level power-ups (Sweep, Sardine).
// Pure ESM. Dates are passed in as "YYYY-MM-DD" strings and seeds as numbers, so everything is deterministic and testable.
import { grantUnlocks } from "./closet.mjs";
import { generateWith, newGame, puzzleFor, transformPuzzle, blocked, setCell, beginStroke, endStroke, levelScore, starsFor, ITEMS, MAX_POWERUPS, STYLES } from "./engine.mjs";
import { makeRng } from "../gridiron/rng.mjs";

// ---------------------------------------------------------------- difficulty choices for Endless
export const SIZES = [5, 6, 7, 8, 9];
/** Endless difficulties: the technique tiers a puzzle may need, and how many fish you get. */
export const DIFFS = {
  easy: { name: "Easy", maxTier: 1, minTier: 0, fish: 3, text: "Gentle. Only simple deductions." },
  medium: { name: "Medium", maxTier: 2, minTier: 1, fish: 3, text: "Lines and pairs. Needs some thinking." },
  hard: { name: "Hard", maxTier: 3, minTier: 2, fish: 2, text: "Real puzzles. Two fish." },
  expert: { name: "Expert", maxTier: 3, minTier: 3, fish: 1, text: "Deep logic. One fish. No mistakes." },
};
export const DIFF_KEYS = Object.keys(DIFFS);

// ---------------------------------------------------------------- dates
const toUtc = (day) => { const [y, m, d] = day.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const dayOfWeek = (day) => new Date(toUtc(day)).getUTCDay();
export const prevDay = (day) => new Date(toUtc(day) - 86400000).toISOString().slice(0, 10);
export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hash = (str) => { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---------------------------------------------------------------- the daily puzzle: gentle on Monday, a 9x9 on Sunday
const DAILY_PLAN = [
  { n: 9, maxTier: 3, minTier: 2, name: "Sunday Stumper" }, { n: 5, maxTier: 1, minTier: 0, name: "Monday Warm-up" }, { n: 6, maxTier: 1, minTier: 1, name: "Tuesday Tabby" },
  { n: 6, maxTier: 2, minTier: 1, name: "Wednesday Whiskers" }, { n: 7, maxTier: 2, minTier: 1, name: "Thursday Thinker" }, { n: 7, maxTier: 3, minTier: 2, name: "Friday Fur-ball" }, { n: 8, maxTier: 3, minTier: 2, name: "Saturday Showdown" },
];
export function dailySpec(day) {
  const plan = DAILY_PLAN[dayOfWeek(day)], seed = hash("meowdoku-daily-" + day);
  return { ...plan, seed, style: STYLES[seed % STYLES.length], fish: 3 };
}
function fallback(n, seed) { const base = puzzleFor(60 + (seed % 40)); return transformPuzzle(base, seed % 8, makeRng(seed)); }   // never fails: a shipped 8x8/9x9 with a new look
/** The same puzzle for everyone on a given day (same engine version). */
export function dailyPuzzle(day) {
  const sp = dailySpec(day);
  return generateWith({ ...sp, attempts: 500 }) || generateWith({ ...sp, minTier: Math.max(0, sp.minTier - 1), style: "blob", seed: sp.seed + 1, attempts: 500 }) || fallback(sp.n, sp.seed);
}
export function newDailyGame(day) {
  const sp = dailySpec(day), pz = dailyPuzzle(day);
  return newGame(0, pz, { mode: "daily", label: `${sp.name}`, fish: sp.fish, tier: sp.maxTier });
}
export function endlessPuzzle({ n, diff, seed, style }) {
  const d = DIFFS[diff] || DIFFS.medium, st = style || STYLES[seed % STYLES.length];
  return generateWith({ n, seed, maxTier: d.maxTier, minTier: d.minTier, style: st, attempts: 500 }) || generateWith({ n, seed: seed + 1, maxTier: d.maxTier, minTier: Math.max(0, d.minTier - 1), style: "blob", attempts: 500 }) || fallback(n, seed);
}
export function newEndlessGame({ n = 6, diff = "medium", seed = 1 } = {}) {
  const d = DIFFS[diff] || DIFFS.medium, pz = endlessPuzzle({ n, diff, seed });
  return newGame(0, pz, { mode: "endless", label: `${n}×${n} ${d.name}`, fish: d.fish, tier: d.maxTier });
}

// ---------------------------------------------------------------- finishing a daily / endless game
const give = (p, item, n) => { const k = ITEMS[item].key, before = p[k]; p[k] = Math.min(MAX_POWERUPS, p[k] + n); return p[k] - before; };
/** Daily: pays once per day. Playing on consecutive days builds a streak and a bigger yarn bonus. */
export function completeDaily(p, st, seconds, day) {
  const d = p.daily, first = !d.done[day], stars = starsFor(st);
  if (!first) return { first: false, stars, streak: d.streak, reward: { yarn: 0 }, points: 0 };
  d.streak = d.last === prevDay(day) ? d.streak + 1 : 1; d.best = Math.max(d.best, d.streak); d.last = day; d.done[day] = stars;
  const keep = Object.keys(d.done).sort().slice(-60); d.done = Object.fromEntries(keep.map((k) => [k, d.done[k]]));
  const pts = levelScore(st, seconds), yarn = 15 + stars * 5 + Math.min(d.streak, 7) * 3;
  p.score += pts; p.yarn += yarn; p.solved++; p.bestCombo = Math.max(p.bestCombo || 0, st.bestCombo || 0);
  const reward = { yarn, hint: give(p, "hint", 1), sardine: d.streak % 3 === 0 ? give(p, "sardine", 1) : 0, sweep: d.streak % 2 === 0 ? give(p, "sweep", 1) : 0, wink: d.streak % 7 === 0 ? give(p, "helper", 1) : 0 };
  reward.unlocked = grantUnlocks(p);
  return { first: true, stars, streak: d.streak, reward, points: pts };
}
export const ENDLESS_PAID_PER_DAY = 5;
/** Endless: tracks your best time per size and difficulty, and pays yarn for the first few wins each day (so it is never a grind). */
export function completeEndless(p, st, seconds, day, diff) {
  const e = p.endless, stars = starsFor(st); if (e.day !== day) { e.day = day; e.today = 0; }
  const key = `${st.n}-${diff}`, prev = e.best[key], record = !prev || seconds < prev; if (record) e.best[key] = seconds;
  const paid = e.today < ENDLESS_PAID_PER_DAY && st.helps === 0, yarn = paid ? 3 + st.n + stars * 2 : 0, pts = paid ? levelScore(st, seconds) : 0;
  e.wins++; if (paid) { e.today++; p.yarn += yarn; p.score += pts; } p.bestCombo = Math.max(p.bestCombo || 0, st.bestCombo || 0);
  return { stars, yarn, points: pts, record, prev: prev || 0, paid, left: Math.max(0, ENDLESS_PAID_PER_DAY - e.today), unlocked: grantUnlocks(p) };
}

// ---------------------------------------------------------------- shop
/** Spend yarn on a power-up. */
export function buy(p, item) {
  const it = ITEMS[item]; if (!it) return { ok: false, reason: "unknown" };
  if (p[it.key] >= MAX_POWERUPS) return { ok: false, reason: "full" };
  if (p.yarn < it.price) return { ok: false, reason: "poor" };
  p.yarn -= it.price; p[it.key]++; return { ok: true };
}

// ---------------------------------------------------------------- board power-ups
/** Sweep: put an X on every empty square that your cats already rule out (row, column, colour, neighbours). One undo takes it all back. Reveals nothing new, so it never costs a star. */
export function sweepBoard(st) {
  if (st.done) return 0; const b = blocked(st); let n = 0; beginStroke(st);
  for (let r = 0; r < st.n; r++) for (let c = 0; c < st.n; c++) if (b[r][c] && st.marks[r][c] === 0) { setCell(st, r, c, 1); n++; }
  endStroke(st); return n;
}
/** Sardine: gives a fish back. Fails if you are already full. */
export function feedFish(st) { if (st.done || st.fish >= st.maxFish) return false; st.fish++; return true; }
