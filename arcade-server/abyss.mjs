// Abyss engine: rarity-scored open-answer trivia. Pure functions (no I/O) so the API and the tests share them.
import { ABYSS_PROMPTS } from "./data/abyssPrompts.mjs";
import { dayKey, hash, rng } from "./shop.mjs";

export const TIME_LIMIT_MS = 25_000;
export const GRACE_MS = 3_000;       // network latency allowance on top of the limit
export const DAILY_COUNT = 7;
export const LIVES = 3;
export const METRES_PER_POINT = 10;

export const TIERS = {
  bubble: { id: "bubble", label: "Bubble", points: 10, icon: "🫧", blurb: "Everyone's first thought" },
  clever: { id: "clever", label: "Show-off", points: 15, icon: "😏", blurb: "Trying to be clever - lots of others did too" },
  shoal:  { id: "shoal",  label: "Shoal",  points: 30, icon: "🐟", blurb: "Solid, ordinary knowledge" },
  reef:   { id: "reef",   label: "Reef",   points: 60, icon: "🪸", blurb: "Noticeably less familiar" },
  trench: { id: "trench", label: "Trench", points: 85, icon: "🦑", blurb: "Specialist knowledge" },
  pearl:  { id: "pearl",  label: "Abyss Pearl", points: 100, icon: "🦪", blurb: "A standout deep cut" },
};
export const TIER_ORDER = ["bubble", "clever", "shoal", "reef", "trench", "pearl"];

export const PROMPTS = ABYSS_PROMPTS;
const BY_ID = new Map(PROMPTS.map((p) => [p.id, p]));
export const getPrompt = (id) => BY_ID.get(id) ?? null;

// ---------- answer matching ----------
export function norm(s) {
  return String(s ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
}

function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
  {
    dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1); // swapped neighbours count as one typo
  }
  return dp[a.length][b.length];
}

const INDEX = new Map();
export function indexFor(prompt) {
  if (INDEX.has(prompt.id)) return INDEX.get(prompt.id);
  const map = new Map();   // normalised alias -> { name, tier }
  for (const tier of TIER_ORDER) for (const entry of prompt.tiers[tier] ?? []) {
    const [name, ...aliases] = entry.split("=").map((x) => x.trim());
    for (const form of [name, ...aliases]) { const k = norm(form); if (k && !map.has(k)) map.set(k, { name, tier }); } // lowest (most common) tier wins on a clash
  }
  INDEX.set(prompt.id, map);
  return map;
}

/** Exact -> fuzzy (small typos) -> none. A fuzzy hit must be unambiguous; ties between tiers score the lower tier. */
export function matchAnswer(prompt, raw) {
  const q = norm(raw);
  if (q.length < 2) return null;
  const map = indexFor(prompt);
  const exact = map.get(q);
  if (exact) return { ...exact, fuzzy: false };
  const max = q.length <= 4 ? 0 : q.length <= 8 ? 1 : 2;
  if (!max) return null;
  let best = max + 1, hits = [];
  for (const [k, v] of map) {
    const d = lev(q, k, max);
    if (d < best) { best = d; hits = [v]; } else if (d === best && d <= max) hits.push(v);
  }
  if (best > max) return null;
  const names = new Set(hits.map((h) => h.name));
  if (names.size > 1) return null;                   // ambiguous typo: don't guess
  return { ...hits[0], fuzzy: true };
}

/** A few answers from the higher tiers, shown after answering so players learn what the rarer ones were. */
export function examples(prompt, scoredTier, r) {
  const idx = TIER_ORDER.indexOf(scoredTier ?? "bubble");
  const out = [];
  for (const tier of TIER_ORDER.slice(Math.min(idx + 1, TIER_ORDER.length - 1))) {
    const list = prompt.tiers[tier] ?? [];
    if (list.length) out.push({ tier, name: list[Math.floor(r() * list.length)].split("=")[0] });
  }
  return out.slice(-3);
}

// ---------- runs ----------
export function dailyIds(date = dayKey()) {
  const r = rng(hash(`abyss-daily:${date}`));
  const pool = [...PROMPTS];
  const out = [];
  // spread across categories: never two of the same category until every category is used
  const cats = new Set();
  while (out.length < DAILY_COUNT && pool.length) {
    const fresh = pool.filter((p) => !cats.has(p.cat));
    const from = fresh.length ? fresh : pool;
    const p = from[Math.floor(r() * from.length)];
    out.push(p.id); cats.add(p.cat); pool.splice(pool.indexOf(p), 1);
  }
  return out;
}

export function newRun(mode, { date = null, id = null } = {}) {
  return {
    v: 1, mode, date, id, i: 0, points: 0, lives: mode === "unlimited" ? LIVES : null, done: false,
    ids: mode === "unlimited" ? [] : dailyIds(date), results: [], qStartedAt: null, finishedAt: null,
  };
}

const total = (run) => (run.mode === "unlimited" ? null : run.ids.length);

function pickUnlimited(run) {
  const seen = new Set(run.ids);
  let pool = PROMPTS.filter((p) => !seen.has(p.id));
  if (!pool.length) pool = PROMPTS.filter((p) => p.id !== run.ids.at(-1));
  const r = rng(hash(`${run.id ?? "u"}:${run.ids.length}:${run.points}`));
  return pool[Math.floor(r() * pool.length)].id;
}

/** Public question for the current step (starts its clock the first time it is asked). */
export function question(run, now) {
  if (run.done) return null;
  if (run.mode === "unlimited" && run.ids.length === run.i) run.ids.push(pickUnlimited(run));
  const p = getPrompt(run.ids[run.i]);
  if (run.qStartedAt == null) run.qStartedAt = now;
  return { n: run.i, total: total(run), cat: p.cat, prompt: p.prompt, limit: TIME_LIMIT_MS, startedAt: run.qStartedAt, msLeft: Math.max(0, TIME_LIMIT_MS - (now - run.qStartedAt)) };
}

export function submit(run, answer, now, rand = Math.random) {
  if (run.done) return { error: "This dive is over." };
  if (run.qStartedAt == null) return { error: "Ask for the question first." };
  const p = getPrompt(run.ids[run.i]);
  const late = now - run.qStartedAt > TIME_LIMIT_MS + GRACE_MS;
  const m = late ? null : matchAnswer(p, answer);
  const tier = m?.tier ?? null;
  const points = tier ? TIERS[tier].points : 0;
  const res = {
    n: run.i, promptId: p.id, prompt: p.prompt, answer: String(answer ?? "").slice(0, 60), matched: m?.name ?? null, tier, points,
    timedOut: late || !String(answer ?? "").trim(), fuzzy: !!m?.fuzzy,
  };
  run.points += points; run.results.push(res);
  if (run.mode === "unlimited" && !points) run.lives--;
  run.i++; run.qStartedAt = null;
  if (run.mode === "unlimited" ? run.lives <= 0 : run.i >= run.ids.length) { run.done = true; run.finishedAt = now; }
  return { result: { ...res, tierInfo: tier ? TIERS[tier] : null, examples: examples(p, tier, rand), depth: run.points * METRES_PER_POINT }, done: run.done };
}

export function finish(run, now) { if (!run.done) { run.done = true; run.finishedAt = now; run.qStartedAt = null; } return run; }

/** What the client may see of a run (no future prompt ids for the daily). */
export function publicRun(run) {
  return {
    mode: run.mode, date: run.date, i: run.i, total: total(run), points: run.points, depth: run.points * METRES_PER_POINT, lives: run.lives, done: run.done,
    results: run.results.map((r) => ({ n: r.n, prompt: r.prompt, answer: r.answer, matched: r.matched, tier: r.tier, points: r.points, timedOut: r.timedOut })),
  };
}

/** Validates a client-held run (guests). Only shape matters: the worst a guest can do is cheat their own score. */
export function sanitizeRun(raw) {
  if (!raw || raw.v !== 1 || !["daily", "archive", "unlimited"].includes(raw.mode)) return null;
  const run = newRun(raw.mode, { date: raw.mode === "unlimited" ? null : String(raw.date ?? "").slice(0, 10), id: raw.id ? String(raw.id).slice(0, 40) : null });
  if (raw.mode === "unlimited") run.ids = Array.isArray(raw.ids) ? raw.ids.filter((x) => BY_ID.has(x)).slice(0, 500) : [];
  run.i = Math.max(0, Math.min(Number(raw.i) || 0, run.ids.length));
  run.points = Math.max(0, Math.min(Number(raw.points) || 0, 100_000));
  run.lives = run.mode === "unlimited" ? Math.max(0, Math.min(Number(raw.lives) || 0, LIVES)) : null;
  run.done = !!raw.done; run.qStartedAt = Number.isFinite(raw.qStartedAt) ? raw.qStartedAt : null;
  run.results = Array.isArray(raw.results) ? raw.results.slice(0, 500) : [];
  return run;
}

// ---------- profile: streaks + collectible fish ----------
export const STREAK_FISH = [
  { days: 5, id: "f-pearl-guppy" }, { days: 14, id: "f-lantern-eel" }, { days: 30, id: "f-moon-jelly" }, { days: 60, id: "f-anglerlord" }, { days: 100, id: "f-old-kraken" },
];

export const newProfile = () => ({ v: 1, streak: 0, best: 0, lastDone: null, dives: 0, bestScore: 0, bestDepth: 0, bestUnlimited: 0, unlimitedRuns: 0, fish: null, totalPoints: 0 });
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** Record a finished daily dive. Returns { newFish: [ids] }. */
export function recordDaily(profile, run, date) {
  profile.dives++; profile.totalPoints += run.points;
  profile.bestScore = Math.max(profile.bestScore, run.points); profile.bestDepth = Math.max(profile.bestDepth, run.points * METRES_PER_POINT);
  profile.streak = profile.lastDone && daysBetween(profile.lastDone, date) === 1 ? profile.streak + 1 : 1;
  profile.best = Math.max(profile.best, profile.streak); profile.lastDone = date;
  return { newFish: STREAK_FISH.filter((m) => profile.streak === m.days).map((m) => m.id) };
}
export function recordUnlimited(profile, run) {
  profile.unlimitedRuns++; profile.totalPoints += run.points;
  profile.bestUnlimited = Math.max(profile.bestUnlimited, run.points); profile.bestDepth = Math.max(profile.bestDepth, run.points * METRES_PER_POINT);
}
/** A streak is alive if the last dive was today or yesterday. */
export function liveStreak(profile, date) { return profile.lastDone && daysBetween(profile.lastDone, date) <= 1 ? profile.streak : 0; }

export const pearlsForDaily = (points) => Math.floor(points / 5);
export const pearlsForUnlimited = (points) => Math.floor(points / 10);

export function shareText(run, date) {
  const icons = run.results.map((r) => (r.tier ? TIERS[r.tier].icon : "💀")).join("");
  return `Abyss ${date ?? ""}\n${icons}\n${run.points}/${(run.ids.length || run.results.length) * 100} · ${run.points * METRES_PER_POINT} m deep`.trim();
}
