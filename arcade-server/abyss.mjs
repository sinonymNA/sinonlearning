// Abyss engine: rarity-scored open-answer trivia. Pure functions (no I/O) so the API and the tests share them.
import { ABYSS_PROMPTS as P1 } from "./data/abyssPrompts.mjs";
import { CATEGORIES } from "./data/categories.mjs";
import { ABYSS_PROMPTS_2 as P2 } from "./data/abyssPrompts2.mjs";
import { ABYSS_PROMPTS_3 as P3 } from "./data/abyssPrompts3.mjs";
import { THEME_PROMPT_DATA } from "./data/themePrompts.mjs";
import { THEME_META } from "./data/themeMeta.mjs";
import { dayKey, hash, rng } from "./shop.mjs";

export const TIME_LIMIT_MS = 25_000;
export const GRACE_MS = 3_000;
export const LEAD_MS = 2_500;       // the dive animation plays and the clock starts this long after a question is first shown       // network latency allowance on top of the limit
export const DAILY_COUNT = 7;
export const LIVES = 3;
export const MAX_GUESSES = 12;     // per question: enough for typos, too few to brute-force an answer list
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

const HAND = [...P1, ...P2, ...P3];

// ---- answer matching helpers (declared early: the auto-tiered bank below needs norm) ----
export function norm(s) {
  return String(s ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
}

/** Flat lists (most obvious first) are split into the six tiers by position: ~6 bubble, ~3 show-off, then roughly 30% shoal, 28% reef, 17% trench, 7% pearl. */
export const DROPPED = [];
function fromCategory(c) {
  const seen = new Set(), list = [];
  for (const e of c.list) {
    const forms = e.split("=").map((x) => x.trim());
    const key = norm(forms[0]);
    if (!key || seen.has(key)) continue;
    let bad = false;
    if (c.rule) for (const f of forms) { const n = norm(f).replace(/ /g, ""); if ((c.rule.startsWith && !n.startsWith(c.rule.startsWith)) || (c.rule.endsWith && !n.endsWith(c.rule.endsWith))) bad = true; }
    if (bad) { DROPPED.push(`${c.id}: ${forms[0]}`); continue; }
    for (const f of forms) seen.add(norm(f));
    list.push(e);
  }
  const n = list.length;
  const pearl = Math.max(1, Math.round(n * 0.07)), trench = Math.max(1, Math.round(n * 0.17)), reef = Math.max(1, Math.round(n * 0.28));
  const clever = n >= 30 ? 3 : 2, bubble = n >= 30 ? 6 : 4;
  const shoal = Math.max(1, n - bubble - clever - reef - trench - pearl);
  let i = 0; const take = (k) => { const out = list.slice(i, i + k); i += k; return out; };
  const tiers = { bubble: take(bubble), clever: take(clever), shoal: take(shoal), reef: take(reef), trench: take(trench), pearl: take(pearl) };
  return { id: c.id, cat: c.cat, prompt: c.prompt, rule: c.rule, auto: true, count: n, tiers };
}
// ---- fame-aware tiering -------------------------------------------------------------------------------------------------
// Flat lists are written in topical or chronological groups, so "position in the list" is a weak rarity signal on its own (a cartoon
// character, a mainstream sequel or last year's blockbuster at the END of a list is not a deep cut). Pass 2 uses what the rest of the
// bank already knows: how common an answer was judged anywhere else, how many prompts mention it, and whether it just extends a famous
// name ("Iron Man 3", "Deadpool and Wolverine"). Famous entries are re-ranked EARLIER in their list and the six tiers are then
// re-split from the new order, so every tier still holds genuinely obscure answers instead of collapsing.
const TIER_IDX = Object.fromEntries(TIER_ORDER.map((t, i) => [t, i]));
const STOP_TOKENS = new Set("with from that this city united town club film movie game games show name time love girl boy king queen lord lady miss mister doctor captain black white green blue gold silver super mega mini little great grand royal baby dark light night world star stars land park street house home water fire".split(" "));
const formsOf = (e) => e.split("=").map((x) => norm(x)).filter(Boolean);
const keyToken = (n) => { const t = n.split(" ").filter((w) => w.length >= 4 && !STOP_TOKENS.has(w)); return n.split(" ").length <= 2 && t.length === 1 ? t[0] : null; };
function buildFame(prompts) {
  const best = new Map(), seen = new Map(), tok = new Map();
  for (const p of prompts) for (const tier of TIER_ORDER) for (const e of p.tiers[tier] ?? []) {
    const ti = TIER_IDX[tier];
    for (const f of formsOf(e)) {
      best.set(f, Math.min(best.get(f) ?? 9, ti));
      (seen.get(f) ?? seen.set(f, new Set()).get(f)).add(p.id);
      const k = keyToken(f); if (k) (tok.get(k) ?? tok.set(k, new Set()).get(k)).add(p.id);
    }
  }
  // famous multi-word / single-word names indexed by their first word, to spot "iron man 3" or "deadpool and wolverine" quickly
  const famous = new Map();
  for (const [name, ti] of best) if (ti <= 2 && name.length >= 4 && !STOP_TOKENS.has(name)) { const w = name.split(" ")[0]; (famous.get(w) ?? famous.set(w, []).get(w)).push({ name, ti }); }
  return { best, seen, tok, famous };
}
/** Highest (most obscure) tier index an entry may keep, from cross-bank evidence. 5 = no cap. */
function fameCap(entry, fame) {
  let cap = 5;
  for (const f of formsOf(entry)) {
    const b = fame.best.get(f); if (b !== undefined) cap = Math.min(cap, b <= 2 ? 2 : b);            // judged common anywhere -> at most "shoal" (hulk, elephant ...)
    const n = fame.seen.get(f)?.size ?? 0; if (n >= 6) cap = Math.min(cap, 2); else if (n >= 4) cap = Math.min(cap, 3); else if (n >= 3) cap = Math.min(cap, 4);
    const k = keyToken(f), kn = k ? (fame.tok.get(k)?.size ?? 0) : 0; if (kn >= 6) cap = Math.min(cap, 2); else if (kn >= 4) cap = Math.min(cap, 3);
    const words = f.split(" ");                                                                       // extends a famous name: "iron man 3", "deadpool and wolverine"
    for (let i = 0; i < words.length; i++) for (const c of fame.famous.get(words[i]) ?? []) {
      if (c.name === f) continue;
      const tail = words.slice(i).join(" "); if (tail === c.name || tail.startsWith(c.name + " ")) cap = Math.min(cap, Math.max(2, c.ti + 1));
    }
  }
  return cap;
}
const FRACTIONS = ["bubble", "clever", "shoal", "reef", "trench", "pearl"];
function refine(p, fame) {
  const entries = []; let pos = 0; const n = TIER_ORDER.reduce((a, t) => a + p.tiers[t].length, 0);
  const sizes = TIER_ORDER.map((t) => p.tiers[t].length);
  for (const t of TIER_ORDER) for (const e of p.tiers[t]) entries.push({ e, pos: pos++ / Math.max(1, n - 1), cap: Math.min(fameCap(e, fame), 5) });
  // upper edge (as a fraction of the list) of each tier, used to pull famous entries earlier
  const edge = []; { let acc = 0; for (const sz of sizes) { acc += sz; edge.push(acc / n); } }
  for (const x of entries) x.adj = x.cap >= 5 ? x.pos : Math.min(x.pos, (edge[x.cap] ?? 1) - 1e-3 + x.pos * 1e-4);
  entries.sort((a, b) => a.adj - b.adj);
  const out = Object.fromEntries(FRACTIONS.map((t) => [t, []]));
  let i = 0;
  for (let ti = 0; ti < sizes.length; ti++) for (let k = 0; k < sizes[ti]; k++, i++) { const x = entries[i]; out[FRACTIONS[Math.min(ti, x.cap)]].push(x.e); }
  // never leave a prompt without anything rarer than "shoal": its most obscure answer stays at reef
  if (!out.reef.length && !out.trench.length && !out.pearl.length && out.shoal.length) { const last = entries[entries.length - 1].e; out.shoal = out.shoal.filter((e) => e !== last); out.reef.push(last); }
  return { ...p, tiers: out, refined: true };
}

const handIds = new Set(HAND.map((p) => p.id));
const RAW_AUTO = CATEGORIES.filter((c) => !handIds.has(c.id)).map(fromCategory).filter((p) => p.count >= 12);
const RAW_THEME = THEME_PROMPT_DATA.map((c) => ({ ...fromCategory(c), theme: c.theme })).filter((p) => p.count >= 12);
const FAME = buildFame([...HAND, ...RAW_AUTO, ...RAW_THEME]);
const AUTO_ALL = RAW_AUTO.map((p) => refine(p, FAME));
const AUTO = AUTO_ALL.filter((p) => p.count >= 30);
/** The Abyss bank: hand-tiered prompts plus auto-tiered categories with enough answers to make rarity meaningful. */
/** Themed banks (movies, sports, music, TV, games): auto-tiered like the categories, tagged with their theme. */
export const THEME_PROMPTS = RAW_THEME.map((p) => refine(p, FAME));
export { THEME_META };
export const THEME_BY_ID = Object.fromEntries(THEME_META.map((t) => [t.id, t]));
export const THEME_COUNT = 7;
export const PROMPTS = [...HAND, ...AUTO, ...THEME_PROMPTS];
/** Everything playable in Puffer Party (validity only): the Abyss bank plus the smaller categories. */
export const PUFFER_PROMPTS = [...PROMPTS, ...AUTO_ALL.filter((p) => p.count < 30)];
const BY_ID = new Map(PUFFER_PROMPTS.map((p) => [p.id, p]));
export const getPrompt = (id) => BY_ID.get(id) ?? null;

// ---------- answer matching ----------
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

/** Seven distinct prompts from one theme, chosen from the run id so a themed run is reproducible but different every time. */
export function themeIds(theme, seed) {
  const r = rng(hash(`abyss-theme:${theme}:${seed}`));
  const pool = THEME_PROMPTS.filter((p) => p.theme === theme);
  const out = [];
  while (out.length < THEME_COUNT && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0].id);
  return out;
}

export function newRun(mode, { date = null, id = null, theme = null } = {}) {
  return {
    v: 1, mode, date, id, theme: mode === "theme" ? theme : null, i: 0, guesses: [], points: 0, lives: mode === "unlimited" ? LIVES : null, done: false,
    ids: mode === "unlimited" ? [] : mode === "theme" ? themeIds(theme, id ?? "x") : dailyIds(date), results: [], qStartedAt: null, finishedAt: null,
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
  if (run.qStartedAt == null) run.qStartedAt = now + LEAD_MS;
  return { n: run.i, total: total(run), cat: p.cat, prompt: p.prompt, limit: TIME_LIMIT_MS, startedAt: run.qStartedAt, startsIn: Math.max(0, run.qStartedAt - now), msLeft: Math.max(0, TIME_LIMIT_MS - Math.max(0, now - run.qStartedAt)), guesses: run.guesses ?? [], guessesLeft: Math.max(0, MAX_GUESSES - (run.guesses?.length ?? 0)) };
}

/**
 * Answers that are not on the list do NOT end the question: the player keeps guessing until something scores, the clock
 * runs out (`opts.expired` is the client's "time's up" auto-submit), or they run out of guesses.
 */
export function submit(run, answer, now, rand = Math.random, opts = {}) {
  if (run.done) return { error: "This dive is over." };
  if (run.qStartedAt == null) return { error: "Ask for the question first." };
  const p = getPrompt(run.ids[run.i]);
  if (now < run.qStartedAt - 400) return { error: "The clock hasn't started yet." };
  const text = String(answer ?? "").trim();
  const elapsed = now - run.qStartedAt;
  const late = elapsed > TIME_LIMIT_MS + GRACE_MS;
  const expired = !!opts.expired && elapsed >= TIME_LIMIT_MS - 1500;
  const m = late || !text ? null : matchAnswer(p, text);
  run.guesses ??= [];
  if (!m && !late && !expired) {
    if (!text) return { error: "Type an answer first." };
    run.guesses.push(text.slice(0, 60));
    if (run.guesses.length < MAX_GUESSES) return { retry: true, guess: text.slice(0, 60), guesses: run.guesses, guessesLeft: MAX_GUESSES - run.guesses.length };
  }
  const tier = m?.tier ?? null;
  const points = tier ? TIERS[tier].points : 0;
  if (!m && expired && text) run.guesses.push(text.slice(0, 60));   // the buzzer-beater guess counts too (so it can be reported)
  const wrong = [...run.guesses];
  const res = {
    n: run.i, promptId: p.id, prompt: p.prompt, answer: text.slice(0, 60), matched: m?.name ?? null, tier, points,
    timedOut: late || expired, outOfGuesses: !m && !late && !expired, fuzzy: !!m?.fuzzy, wrong,
  };
  run.points += points; run.results.push({ ...res, wrong: wrong.slice(0, 12) });
  if (run.mode === "unlimited" && !points) run.lives--;
  run.i++; run.qStartedAt = null; run.guesses = [];
  if (run.mode === "unlimited" ? run.lives <= 0 : run.i >= run.ids.length) { run.done = true; run.finishedAt = now; }
  return { result: { ...res, tierInfo: tier ? TIERS[tier] : null, examples: examples(p, tier, rand), depth: run.points * METRES_PER_POINT }, done: run.done };
}

export function finish(run, now) { if (!run.done) { run.done = true; run.finishedAt = now; run.qStartedAt = null; } return run; }

/** What the client may see of a run (no future prompt ids for the daily). */
export function publicRun(run) {
  return {
    mode: run.mode, theme: run.theme ?? null, date: run.date, i: run.i, total: total(run), points: run.points, depth: run.points * METRES_PER_POINT, lives: run.lives, done: run.done,
    results: run.results.map((r) => ({ n: r.n, prompt: r.prompt, answer: r.answer, matched: r.matched, tier: r.tier, points: r.points, timedOut: r.timedOut, wrong: (r.wrong ?? []).slice(0, 12) })),
  };
}

/** Validates a client-held run (guests). Only shape matters: the worst a guest can do is cheat their own score. */
export function sanitizeRun(raw) {
  if (!raw || raw.v !== 1 || !["daily", "archive", "unlimited", "theme"].includes(raw.mode)) return null;
  if (raw.mode === "theme" && !THEME_BY_ID[raw.theme]) return null;
  const run = newRun(raw.mode, { date: raw.mode === "unlimited" || raw.mode === "theme" ? null : String(raw.date ?? "").slice(0, 10), id: raw.id ? String(raw.id).slice(0, 40) : null, theme: raw.mode === "theme" ? raw.theme : null });
  if (raw.mode === "theme") run.ids = Array.isArray(raw.ids) ? raw.ids.filter((x) => BY_ID.get(x)?.theme === raw.theme).slice(0, THEME_COUNT) : run.ids;
  if (raw.mode === "unlimited") run.ids = Array.isArray(raw.ids) ? raw.ids.filter((x) => BY_ID.has(x)).slice(0, 500) : [];
  run.i = Math.max(0, Math.min(Number(raw.i) || 0, run.ids.length));
  run.points = Math.max(0, Math.min(Number(raw.points) || 0, 100_000));
  run.lives = run.mode === "unlimited" ? Math.max(0, Math.min(Number(raw.lives) || 0, LIVES)) : null;
  run.done = !!raw.done; run.qStartedAt = Number.isFinite(raw.qStartedAt) ? raw.qStartedAt : null;
  run.results = Array.isArray(raw.results) ? raw.results.slice(0, 500) : [];
  run.guesses = Array.isArray(raw.guesses) ? raw.guesses.slice(0, MAX_GUESSES).map((g) => String(g).slice(0, 60)) : [];
  return run;
}

// ---------- profile: streaks + collectible fish ----------
export const STREAK_FISH = [
  { days: 5, id: "f-pearl-guppy" }, { days: 14, id: "f-lantern-eel" }, { days: 30, id: "f-moon-jelly" }, { days: 60, id: "f-anglerlord" }, { days: 100, id: "f-old-kraken" },
];

export const newProfile = () => ({ v: 1, streak: 0, best: 0, lastDone: null, dives: 0, bestScore: 0, bestDepth: 0, bestUnlimited: 0, unlimitedRuns: 0, themeRuns: 0, themeBest: {}, fish: null, totalPoints: 0 });
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
/** Record a finished themed run (best score is kept per theme). */
export function recordTheme(profile, run) {
  profile.themeRuns = (profile.themeRuns ?? 0) + 1; profile.totalPoints += run.points;
  profile.themeBest = { ...(profile.themeBest ?? {}) }; profile.themeBest[run.theme] = Math.max(profile.themeBest[run.theme] ?? 0, run.points);
  profile.bestDepth = Math.max(profile.bestDepth, run.points * METRES_PER_POINT);
}
/** A streak is alive if the last dive was today or yesterday. */
export function liveStreak(profile, date) { return profile.lastDone && daysBetween(profile.lastDone, date) <= 1 ? profile.streak : 0; }

export const pearlsForDaily = (points) => Math.floor(points / 5);
export const pearlsForUnlimited = (points) => Math.floor(points / 10);
export const pearlsForTheme = (points) => Math.floor(points / 8);

export function shareText(run, date) {
  const icons = run.results.map((r) => (r.tier ? TIERS[r.tier].icon : "💀")).join("");
  const head = run.theme ? THEME_BY_ID[run.theme]?.name ?? "Abyss" : `Abyss ${date ?? ""}`;
  return `${head}\n${icons}\n${run.points}/${(run.ids.length || run.results.length) * 100} · ${run.points * METRES_PER_POINT} m deep`.trim();
}
