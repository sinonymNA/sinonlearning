// Meowdoku engine: place one cat in every row, every column and every colour region, and no two cats may touch (corners count).
// Pure ESM, JSON state, seeded RNG (a level number always makes the same puzzle). No Date.now/Math.random: callers pass elapsed seconds.
import { makeRng } from "../gridiron/rng.mjs";

export const MAX_FISH = 3;
export const LEVEL_COUNT = 100;
export const MAX_POWERUPS = 9;
/** Board size by level: 5x5 for the first levels, growing to 9x9. */
export const sizeFor = (level) => (level <= 2 ? 4 : level <= 8 ? 5 : level <= 20 ? 6 : level <= 40 ? 7 : level <= 65 ? 8 : 9);
/** The hardest technique tier a level may need: levels 1-4 only ever need "one spot left"; the ladder opens slowly after that. */
export const tierFor = (level) => (level <= 6 ? 0 : level <= 25 ? 1 : level <= 55 ? 2 : 3);
/** ...and the easiest it may be, so the ladder keeps climbing instead of staying flat. */
export const minTierFor = (level) => (level <= 8 ? 0 : level <= 40 ? 1 : 2);
const key = (r, c) => `${r},${c}`;

// ---------------------------------------------------------------- puzzles
function randomCats(n, rng) {
  const cols = Array(n).fill(-1), used = Array(n).fill(false);
  const go = (r) => {
    if (r === n) return true;
    const order = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = rng.int(i + 1); [order[i], order[j]] = [order[j], order[i]]; }
    for (const c of order) { if (used[c] || (r > 0 && Math.abs(c - cols[r - 1]) < 2)) continue; cols[r] = c; used[c] = true; if (go(r + 1)) return true; used[c] = false; }
    cols[r] = -1; return false;
  };
  return go(0) ? cols : null;
}
/** Grow n connected colour regions out of the n cat cells until every cell belongs to one. `frozen` regions stay tiny (they only grow if nothing else can), which makes obvious "only one spot" moves for easy levels. */
export const STYLES = ["blob", "round", "snake"];
function growRegions(n, cols, rng, frozen = new Set(), style = "blob") {
  const reg = Array.from({ length: n }, () => Array(n).fill(-1)); for (let r = 0; r < n; r++) reg[r][cols[r]] = r;
  let left = n * n - n;
  while (left > 0) {
    const open = [], any = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (reg[r][c] < 0) {
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => (reg[r + a]?.[c + b] ?? -1)).filter((x) => x >= 0); if (!near.length) continue;
      any.push([r, c, near]); const free = near.filter((g) => !frozen.has(g)); if (free.length) open.push([r, c, free]);
    }
    const pool = open.length ? open : any; let pick = pool[rng.int(pool.length)];
    if (style !== "blob") {   // "round" fills in concave notches (compact blobs); "snake" extends tips (long twisty regions)
      const w = pool.map(([, , near]) => (style === "round" ? near.length * near.length : near.length === 1 ? 1 : 0.12)), tot = w.reduce((a, b) => a + b, 0); let x = rng() * tot, i = 0; while (i < w.length - 1 && x >= w[i]) { x -= w[i]; i++; } pick = pool[i];
    }
    const [r, c, near] = pick; reg[r][c] = near[rng.int(near.length)]; left--;
  }
  return reg;
}
/** All solutions of a colour map, up to `limit` (each is the cat column for every row). */
export function solutions(regions, limit = 2) {
  const n = regions.length, cols = Array(n).fill(-1), usedC = Array(n).fill(false), usedR = Array(n).fill(false), out = [];
  const go = (r) => {
    if (out.length >= limit) return; if (r === n) { out.push([...cols]); return; }
    for (let c = 0; c < n; c++) { const g = regions[r][c]; if (usedC[c] || usedR[g] || (r > 0 && Math.abs(c - cols[r - 1]) < 2)) continue; cols[r] = c; usedC[c] = usedR[g] = true; go(r + 1); usedC[c] = usedR[g] = false; }
  };
  go(0); return out;
}
export const countSolutions = (regions, limit = 2) => solutions(regions, limit).length;
const connected = (regions, g) => {   // is region g one connected piece?
  const n = regions.length, cells = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === g) cells.push([r, c]);
  if (!cells.length) return false; const seen = new Set([key(...cells[0])]), q = [cells[0]];
  while (q.length) { const [r, c] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = r + a, y = c + b; if (regions[x]?.[y] === g && !seen.has(key(x, y))) { seen.add(key(x, y)); q.push([x, y]); } } }
  return seen.size === cells.length;
};
/** Make a colour map have exactly one solution by recolouring cells that an alternative solution relies on (cat cells and connectivity are protected). */
function repair(regions, cols, rng) {
  const n = regions.length, home = new Set(cols.map((c, r) => key(r, c)));
  for (let iter = 0; iter < 400; iter++) {
    const sols = solutions(regions, 6); if (sols.length === 1) return true;
    const alt = sols.find((x) => x.some((c, r) => c !== cols[r])), cells = alt.map((c, r) => [r, c]).filter(([r, c]) => cols[r] !== c && !home.has(key(r, c)));
    for (let i = cells.length - 1; i > 0; i--) { const j = rng.int(i + 1); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    let improved = false;
    for (const [r, c] of cells) {
      const old = regions[r][c], opts = [...new Set([[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => regions[r + a]?.[c + b]).filter((g) => g !== undefined && g !== old))];
      for (let i = opts.length - 1; i > 0; i--) { const j = rng.int(i + 1); [opts[i], opts[j]] = [opts[j], opts[i]]; }
      for (const g of opts) { regions[r][c] = g; if (connected(regions, old) && countSolutions(regions, 6) < sols.length) { improved = true; break; } regions[r][c] = old; }
      if (improved) break;
    }
    if (!improved && cells.length) { const [r, c] = cells[rng.int(cells.length)], old = regions[r][c], opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => regions[r + a]?.[c + b]).filter((g) => g !== undefined && g !== old); if (opts.length) { const g = opts[rng.int(opts.length)]; regions[r][c] = g; if (!connected(regions, old)) regions[r][c] = old; } }
  }
  return countSolutions(regions, 2) === 1;
}
/** Solve a puzzle with only hint techniques up to `maxTier` (0 = "one spot left", 1 = a colour/row confined to one line, 2 = pairs, 3 = bigger groups and look-ahead). Returns the number of steps, or -1 if it cannot be done. */
export function logicSteps(puzzle, maxTier = 3) {
  const st = newGame(0, puzzle); let steps = 0;
  for (; steps < 400 && !st.won; steps++) {
    const h = hint(st, true, maxTier); if (h.kind === "cat") st.marks[h.cell[0]][h.cell[1]] = 2; else if (h.kind === "cross") { for (const [r, c] of h.cells) st.marks[r][c] = 1; } else return -1;
    if (conflictCells(st).size) return -1; if (cats(st).length === st.n) st.won = true;
  }
  return st.won ? steps : -1;
}
export const logicSolvable = (puzzle, maxTier = 3) => logicSteps(puzzle, maxTier) >= 0;
/** How hard a puzzle is: the lowest technique tier that solves it (0 easiest), 4 if even tier 3 is not enough. */
export function puzzleTier(puzzle) { for (let t = 0; t <= 3; t++) if (logicSolvable(puzzle, t)) return t; return 4; }
/** The puzzle for a level: {n, regions[n][n] (0..n-1), solution[n] (column of the cat in each row)}. Deterministic.
 *  It has exactly one solution and its hardest needed technique tier fits the level (tierFor), never easier than minTierFor. */
export function generateWith({ n, seed, maxTier, minTier = 0, style = "blob", attempts = 600 }) {
  const rng = makeRng(seed >>> 0);
  for (let attempt = 0; attempt < attempts; attempt++) {
    const cols = randomCats(n, rng); if (!cols) continue;
    const frozen = new Set(); const f = maxTier === 0 ? (n <= 4 ? 1 : 2) : maxTier === 1 ? 1 : 0; while (frozen.size < f) frozen.add(rng.int(n));
    const regions = growRegions(n, cols, rng, frozen, style); if (!repair(regions, cols, rng)) continue;
    const draft = { n, regions, solution: cols }; if (!logicSolvable(draft, maxTier)) continue; if (minTier > 0 && logicSolvable(draft, minTier - 1)) continue;   // too easy for this setting
    const perm = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = rng.int(i + 1); [perm[i], perm[j]] = [perm[j], perm[i]]; }   // shuffle which colour each region gets
    return { n, regions: regions.map((row) => row.map((g) => perm[g])), solution: cols };
  }
  return null;
}
/** The region style a world uses, so the worlds look different from each other (the shipped table was built with these). */
export const styleFor = (level) => STYLES[[0, 1, 0, 2, 1, 0, 2, 1, 2, 0][Math.floor((Math.max(1, level) - 1) / 10) % 10]];
export function generate(level, opts = {}) {
  const n = sizeFor(level), maxTier = opts.maxTier ?? tierFor(level), minTier = opts.minTier ?? minTierFor(level), seed = (level * 7919 + 13) >>> 0, style = opts.style ?? styleFor(level);
  const p = generateWith({ n, seed, maxTier, minTier, style }) || generateWith({ n, seed: seed + 1, maxTier, minTier: Math.max(0, minTier - 1), style: "blob" });
  if (!p) throw new Error("could not make a puzzle for level " + level);
  return p;
}

// ---------------------------------------------------------------- game state
/** Seconds a quick solve takes (the lightning-bolt badge): more room on bigger boards. */
export const parFor = (n) => n * n * 4;
/** opts: mode ("campaign" | "daily" | "endless"), label, fish (lives, default 3), tier (shown difficulty 0-3), seed. */
export function newGame(level, puzzle = puzzleFor(level), opts = {}) {
  const { n, regions, solution } = puzzle, fish = opts.fish ?? MAX_FISH;
  return { v: 1, level, mode: opts.mode || "campaign", label: opts.label || "", tier: opts.tier ?? (level > 0 ? tierFor(level) : 1), n, regions, solution, marks: Array.from({ length: n }, () => Array(n).fill(0)), fish, startFish: fish, maxFish: opts.maxFish ?? (fish < MAX_FISH ? fish + 1 : fish), moves: 0, mistakes: 0, helps: 0, combo: 0, bestCombo: 0, history: [], stroke: 0, curStroke: 0, done: false, won: false, lost: false };
}
export const cats = (st) => { const out = []; for (let r = 0; r < st.n; r++) for (let c = 0; c < st.n; c++) if (st.marks[r][c] === 2) out.push([r, c]); return out; };
/** Cats that break a rule with another cat (same row, column, colour, or touching). Returns a Set of "r,c". */
export function conflictCells(st) {
  const cs = cats(st), bad = new Set();
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    const [a, b] = cs[i], [x, y] = cs[j];
    if (a === x || b === y || st.regions[a][b] === st.regions[x][y] || (Math.abs(a - x) <= 1 && Math.abs(b - y) <= 1)) { bad.add(key(a, b)); bad.add(key(x, y)); }
  }
  return bad;
}
/** Cells that cannot hold a cat because of the cats already placed (their row, column, colour and neighbours). */
export function blocked(st) {
  const g = Array.from({ length: st.n }, () => Array(st.n).fill(false));
  for (const [r, c] of cats(st)) for (let a = 0; a < st.n; a++) for (let b = 0; b < st.n; b++) {
    if (a === r && b === c) continue;
    if (a === r || b === c || st.regions[a][b] === st.regions[r][c] || (Math.abs(a - r) <= 1 && Math.abs(b - c) <= 1)) g[a][b] = true;
  }
  return g;
}
function settle(st) {
  const cs = cats(st);
  if (cs.length === st.n && conflictCells(st).size === 0) { st.done = true; st.won = true; }
  else if (st.fish <= 0) { st.done = true; st.lost = true; }
}
/** Put exactly this mark on a cell (0 empty, 1 X note, 2 cat). A cat that breaks a rule costs a fish. The one place marks change, so gestures can never disagree. */
export function setCell(st, r, c, mark) {
  if (st.done) return { changed: false };
  const before = st.marks[r][c]; if (before === mark) return { changed: false };
  st.marks[r][c] = mark; st.moves++;
  let conflict = false; if (mark === 2 && conflictCells(st).has(key(r, c))) { conflict = true; st.mistakes++; st.fish--; st.combo = 0; } else if (mark === 2) { st.combo = (st.combo || 0) + 1; st.bestCombo = Math.max(st.bestCombo || 0, st.combo); }
  st.history.push([r, c, before, conflict ? 1 : 0, st.curStroke || 0]); settle(st); return { changed: true, mark, before, conflict, combo: st.combo || 0, won: st.won, lost: st.lost };
}
/** X note on or off (a cat is simply taken off). */
export const toggleX = (st, r, c) => setCell(st, r, c, st.marks[r][c] === 0 ? 1 : 0);
/** Put an X here (a cat is replaced by the X), or take the X off. Used by the double-tap in cat mode and the X key. */
export const markX = (st, r, c) => setCell(st, r, c, st.marks[r][c] === 1 ? 0 : 1);
/** Cat on or off. Always ends in a cat unless there was one already. */
export const toggleCat = (st, r, c) => setCell(st, r, c, st.marks[r][c] === 2 ? 0 : 2);
export function setMark(st, r, c, mark) { st.history.push([r, c, st.marks[r][c]]); st.marks[r][c] = mark; settle(st); }
/** Cancel the move that was JUST made (the first tap of a double-tap), including the fish it cost. Not for general use: Undo keeps lost fish. */
export function retract(st) {
  if (st.done || !st.history.length) return false;
  const [r, c, before, fish] = st.history.pop(), was = st.marks[r][c]; st.marks[r][c] = before; st.moves = Math.max(0, st.moves - 1);
  if (fish) { st.fish = Math.min(st.maxFish || MAX_FISH, st.fish + 1); st.mistakes = Math.max(0, st.mistakes - 1); } else if (was === 2) st.combo = Math.max(0, (st.combo || 0) - 1);
  return true;
}
/** A swipe across the board is one stroke: everything it marks is undone together. */
export function beginStroke(st) { st.stroke = (st.stroke || 0) + 1; st.curStroke = st.stroke; }
export function endStroke(st) { st.curStroke = 0; }
/** Take back the last change, or the whole last swipe (a fish you lost stays lost). */
export function undo(st) {
  if (st.done || !st.history.length) return false;
  const [r, c, before, , stroke] = st.history.pop(); st.marks[r][c] = before;
  if (stroke) while (st.history.length && st.history[st.history.length - 1][4] === stroke) { const [a, b, bf] = st.history.pop(); st.marks[a][b] = bf; }
  return true;
}
export function clearBoard(st) { if (st.done) return; for (let r = 0; r < st.n; r++) for (let c = 0; c < st.n; c++) st.marks[r][c] = 0; st.history = []; }

// ---------------------------------------------------------------- help
/** Candidate grid: cells where a cat could still go given the cats placed (ignores your X notes). */
function candidates(st, useX = false) {
  const b = blocked(st), cs = cats(st), rows = new Set(cs.map(([r]) => r)), colsU = new Set(cs.map(([, c]) => c)), regs = new Set(cs.map(([r, c]) => st.regions[r][c]));
  return Array.from({ length: st.n }, (_, r) => Array.from({ length: st.n }, (_, c) => st.marks[r][c] !== 2 && !(useX && st.marks[r][c] === 1) && !b[r][c] && !rows.has(r) && !colsU.has(c) && !regs.has(st.regions[r][c])));
}
const REG_NAME = ["green", "red", "pink", "orange", "purple", "yellow", "blue", "teal", "tan"];
export const regionName = (g) => REG_NAME[g] ?? `colour ${g + 1}`;
/** A hint that teaches: a cat that is forced (and why), or cells that can be crossed out (and why), else a gentle nudge toward a real cat. */
export function hint(st, useX = false, maxTier = 3) {
  const bad = conflictCells(st);
  if (bad.size) return { kind: "conflict", cells: [...bad].map((k) => k.split(",").map(Number)), text: "These cats break a rule. Take one of them away." };
  const cand = candidates(st, useX), n = st.n, cs = cats(st), rows = new Set(cs.map(([r]) => r)), colsU = new Set(cs.map(([, c]) => c)), regs = new Set(cs.map(([r, c]) => st.regions[r][c]));
  const units = [];
  for (let r = 0; r < n; r++) if (!rows.has(r)) units.push({ name: `row ${r + 1}`, cells: [...Array(n).keys()].map((c) => [r, c]) });
  for (let c = 0; c < n; c++) if (!colsU.has(c)) units.push({ name: `column ${c + 1}`, cells: [...Array(n).keys()].map((r) => [r, c]) });
  for (let g = 0; g < n; g++) if (!regs.has(g)) { const cells = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (st.regions[r][c] === g) cells.push([r, c]); units.push({ name: `the ${regionName(g)} area`, cells, region: g }); }
  for (const u of units) { const open = u.cells.filter(([r, c]) => cand[r][c]); if (open.length === 1) return { kind: "cat", cell: open[0], text: `${u.name[0].toUpperCase() + u.name.slice(1)} has only one spot left. A cat goes here.` }; }
  // groups: k units of one kind (colours, rows or columns) whose open spots all sit inside exactly k units of another kind. Those k units are used up by the group, so everything else in them can be crossed out.
  const kinds = [0, 1, 2], val = (kind, r, c) => (kind === 0 ? st.regions[r][c] : kind === 1 ? r : c);
  const label = (kind, i) => (kind === 0 ? `the ${regionName(i)} area` : kind === 1 ? `row ${i + 1}` : `column ${i + 1}`);
  const free = (kind) => [...Array(n).keys()].filter((i) => !(kind === 0 ? regs : kind === 1 ? rows : colsU).has(i));
  const combos = (arr, k) => (k === 0 ? [[]] : arr.flatMap((x, i) => combos(arr.slice(i + 1), k - 1).map((rest) => [x, ...rest])));
  for (let k = 1; k <= (maxTier >= 3 ? 4 : maxTier >= 2 ? 2 : maxTier >= 1 ? 1 : 0); k++) for (const a of kinds) for (const bk of kinds) {
    if (a === bk) continue;
    for (const S of combos(free(a), k)) {
      const mine = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (cand[r][c] && S.includes(val(a, r, c))) mine.push([r, c]);
      const T = [...new Set(mine.map(([r, c]) => val(bk, r, c)))]; if (T.length !== k) continue;
      const out = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (cand[r][c] && T.includes(val(bk, r, c)) && !S.includes(val(a, r, c))) out.push([r, c]);
      if (!out.length) continue;
      const names = (kind, list) => list.map((i) => label(kind, i)).join(" and "), text = `${names(a, S)} can only use ${names(bk, T)}${k > 1 ? ` (${k} of ${k})` : ""}, so no other cat can go there. Cross these out.`;
      return { kind: "cross", cells: out, text: text[0].toUpperCase() + text.slice(1), why: mine };
    }
  }
  // look ahead one move: if a cat here would leave some row, column or colour with nowhere to go, this spot cannot hold a cat
  if (maxTier >= 3) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!cand[r][c]) continue; const g = st.regions[r][c], gone = (a, b) => a === r || b === c || st.regions[a][b] === g || (Math.abs(a - r) <= 1 && Math.abs(b - c) <= 1);
    for (const u of units) {
      if (u.name === `row ${r + 1}` || u.name === `column ${c + 1}` || u.region === g) continue;   // that cat would fill this unit itself
      if (u.cells.every(([a, b]) => !cand[a][b] || gone(a, b))) return { kind: "cross", cells: [[r, c]], text: `A cat in row ${r + 1}, column ${c + 1} would leave ${u.name} with no spot, so cross this one out.`, why: [[r, c]] };
    }
  }
  const missing = st.solution.map((c, r) => [r, c]).filter(([r, c]) => st.marks[r][c] !== 2);
  if (!missing.length) return { kind: "done", text: "You already have every cat." };
  const pick = missing[0]; return { kind: "nudge", cell: pick, text: "No easy move here. Look at this spot: a cat belongs in it." };
}
/** The hint a player gets: first catch a wrong X of their own, otherwise hint() while trusting their other X notes. */
export function smartHint(st) {
  for (let r = 0; r < st.n; r++) if (st.marks[r][st.solution[r]] === 1) return { kind: "badx", cells: [[r, st.solution[r]]], text: "This X is in a spot where a cat belongs. Take the X off." };
  return hint(st, true);
}
/** Cat Helper: remove a wrong cat, or place one correct cat. Returns the cell touched. */
export function wink(st) {
  if (st.done) return null; st.helps++;
  for (let r = 0; r < st.n; r++) for (let c = 0; c < st.n; c++) if (st.marks[r][c] === 2 && st.solution[r] !== c) { setMark(st, r, c, 0); return { cell: [r, c], placed: false }; }
  for (let r = 0; r < st.n; r++) if (st.marks[r][st.solution[r]] !== 2) { setMark(st, r, st.solution[r], 2); return { cell: [r, st.solution[r]], placed: true }; }
  return null;
}

// ---------------------------------------------------------------- score and profile
/** Points for a finished level: more for bigger boards and speed, a bonus for each fish left and for your best combo, small cost for using help. */
export function levelScore(st, seconds) { return Math.max(0, Math.round(st.n * 100 + Math.max(0, st.n * 45 - seconds) * 3 + st.fish * 50 + Math.min(st.bestCombo || 0, st.n) * 10 - st.helps * 30)); }
export const ITEMS = {
  hint: { key: "hints", name: "Hint", price: 25, text: "Explains the next move and why." },
  helper: { key: "winks", name: "Cat Helper", price: 40, text: "Puts one correct cat on the board, or removes a wrong one." },
  sweep: { key: "sweeps", name: "Sweep", price: 30, text: "Crosses out every spot your cats already rule out." },
  sardine: { key: "sardines", name: "Sardine", price: 35, text: "Gives you a fish back." },
};
export const newProfile = () => ({ v: 1, level: 1, score: 0, hints: 3, winks: 3, sweeps: 2, sardines: 1, yarn: 0, solved: 0, bestStreak: 0, streak: 0, seenHelp: false, stars: {}, fast: {}, daily: { last: "", streak: 0, best: 0, done: {} }, endless: { wins: 0, day: "", today: 0, best: {} }, bestCombo: 0 });
/** Old saves keep working: fill in anything a newer version added. */
export function normalizeProfile(p) {
  const d = newProfile(), o = { ...d, ...p, stars: { ...(p.stars || {}) }, fast: { ...(p.fast || {}) }, daily: { ...d.daily, ...(p.daily || {}), done: { ...(p.daily?.done || {}) } }, endless: { ...d.endless, ...(p.endless || {}), best: { ...(p.endless?.best || {}) } } };
  for (const k of ["hints", "winks", "sweeps", "sardines"]) o[k] = Math.min(MAX_POWERUPS, Math.max(0, +o[k] || 0)); o.yarn = Math.max(0, Math.floor(+o.yarn || 0)); return o;
}
/** 1 to 3 stars: a clean level (no wrong cat, no help) is 3; each of those costs one star, never below 1. */
export const starsFor = (st) => Math.max(1, 3 - (st.mistakes > 0 ? 1 : 0) - (st.helps > 0 ? 1 : 0));
export const totalStars = (p) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
const give = (p, item, n) => { const k = ITEMS[item].key, before = p[k]; p[k] = Math.min(MAX_POWERUPS, p[k] + n); return p[k] - before; };
/** Apply a won level to the profile. Points and rewards only the first time a level is cleared; replays can only raise its stars (and earn the speed badge once). */
export function completeLevel(p, st, seconds) {
  p.stars ||= {}; p.fast ||= {}; const stars = starsFor(st), first = !(p.stars[st.level] > 0), pts = first ? levelScore(st, seconds) : 0;
  const speedy = st.helps === 0 && seconds <= parFor(st.n), newSpeedy = speedy && !p.fast[st.level]; if (speedy) p.fast[st.level] = true;
  p.stars[st.level] = Math.max(p.stars[st.level] || 0, stars); p.level = Math.min(LEVEL_COUNT + 1, Math.max(p.level, st.level + 1)); p.bestCombo = Math.max(p.bestCombo || 0, st.bestCombo || 0);
  const reward = { hint: 0, wink: 0, sweep: 0, sardine: 0, yarn: 0 };
  if (first) {
    p.score += pts; p.solved++; p.streak = st.mistakes === 0 ? p.streak + 1 : 0; p.bestStreak = Math.max(p.bestStreak, p.streak);
    reward.hint = give(p, "hint", 1); reward.wink = give(p, "helper", p.solved % 3 === 0 ? 1 : 0); reward.sweep = give(p, "sweep", p.solved % 4 === 0 ? 1 : 0);
    if (st.level % 10 === 0) { reward.sardine = give(p, "sardine", 1); reward.sweep += give(p, "sweep", 1); }   // a finale chest
    reward.yarn = stars * 4 + 6 + (st.level % 10 === 0 ? 30 : 0);
  }
  if (newSpeedy) reward.yarn += 5; p.yarn += reward.yarn;
  return { points: pts, reward, stars, first, speedy, newSpeedy };
}

// ---------------------------------------------------------------- shipped levels
import { LEVELS } from "./levels.mjs";
const decode = (str) => { const [n, reg, sol] = str.split(":"), size = +n; return { n: size, regions: Array.from({ length: size }, (_, r) => [...reg.slice(r * size, r * size + size)].map(Number)), solution: [...sol].map(Number) }; };
export const encodePuzzle = (p) => `${p.n}:${p.regions.map((r) => r.join("")).join("")}:${p.solution.join("")}`;
/** Rotate/mirror a puzzle (rules are symmetric, so it stays valid and unique) and shuffle its colours: free variety for levels past the shipped table. */
export function transformPuzzle(p, k, rng) {
  const n = p.n, f = [(r, c) => [r, c], (r, c) => [c, n - 1 - r], (r, c) => [n - 1 - r, n - 1 - c], (r, c) => [n - 1 - c, r], (r, c) => [r, n - 1 - c], (r, c) => [n - 1 - r, c], (r, c) => [c, r], (r, c) => [n - 1 - c, n - 1 - r]][k % 8];
  const perm = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = rng.int(i + 1); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const regions = Array.from({ length: n }, () => Array(n).fill(0)), solution = Array(n).fill(0);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { const [a, b] = f(r, c); regions[a][b] = perm[p.regions[r][c]]; }
  for (let r = 0; r < n; r++) { const [a, b] = f(r, p.solution[r]); solution[a] = b; }
  return { n, regions, solution };
}
/** The puzzle for a level: from the shipped table (made by scripts/meowdoku-build-levels.mjs), recycled with rotations and new colours after that. */
export function puzzleFor(level) {
  if (!LEVELS.length) return generate(level);
  if (level >= 1 && level <= LEVELS.length) return decode(LEVELS[level - 1]);
  const hard = Math.max(0, LEVELS.findIndex((l) => l.startsWith("9:"))), base = decode(LEVELS[hard + ((level - 1 - hard) % (LEVELS.length - hard))]);   // recycle the 9x9 levels
  return transformPuzzle(base, level * 5 + 1, makeRng((level * 31 + 7) >>> 0));
}
