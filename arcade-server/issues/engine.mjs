// Back Issues engine. Every level is a new old newspaper pulled from a crate; solve every puzzle on it before the presses roll (the time limit).
// Puzzle types unlock one at a time: crossword (level 1), sudoku (4), word search (7), cryptogram (11); later papers carry more puzzles.
// Pure ESM, JSON state, seeded (a level number always makes the same newspaper). Time only moves through advance(st, seconds): no Date.now/Math.random.
import { makeRng } from "../gridiron/rng.mjs";
import { WORDS, ALL_WORDS, SAYINGS, THEMES } from "./words.mjs";
import { buildCrossword, buildSudoku, buildWordSearch, buildCipher, lineLetters } from "./puzzles.mjs";

export const PER_CRATE = 10;
export const MAX_HINTS = 20;
export const TYPES = ["crossword", "sudoku", "wordsearch", "cipher"];
export const TYPE_NAMES = { crossword: "Crossword", sudoku: "Sudoku", wordsearch: "Word Search", cipher: "Cryptogram" };
export const UNLOCK = { crossword: 1, sudoku: 4, wordsearch: 7, cipher: 11 };
export const CRATES = [
  { name: "The Town Tattler", theme: "animals", year: 1921 }, { name: "Harbor Herald", theme: "geography", year: 1934 }, { name: "The Daily Spark", theme: "science", year: 1947 }, { name: "Kitchen Chronicle", theme: "food", year: 1952 },
  { name: "The Old Courier", theme: "history", year: 1908 }, { name: "Starlight Standard", theme: "space", year: 1969 }, { name: "Sports Bugle", theme: "sports", year: 1936 }, { name: "Evergreen Echo", theme: "nature", year: 1927 },
  { name: "Schoolhouse Post", theme: "school", year: 1955 }, { name: "Melody Mail", theme: "music", year: 1948 },
];
const HEADLINES = {
  animals: ["WILD PARADE DRAWS HUGE CROWD", "ZOO WELCOMES NEW ARRIVAL", "FARMYARD FUN AT THE COUNTY FAIR"], geography: ["EXPLORERS MAP NEW SHORELINE", "GRAND TOUR CROSSES THREE COUNTRIES", "BRIDGE OPENS ACROSS THE RIVER"],
  science: ["INVENTOR DEMONSTRATES WONDER MACHINE", "LAB STAFF CHEER A BIG DISCOVERY", "ELECTRIC LIGHTS COME TO MAIN STREET"], food: ["BAKERY SELLS RECORD NUMBER OF PIES", "SUPPER CLUB SERVES A FEAST", "MARKET DAY BRINGS FRESH HARVEST"],
  history: ["TOWN UNVEILS STATUE OF ITS FOUNDER", "OLD CASTLE OPENS TO VISITORS", "BIG CELEBRATION FOR CITY ANNIVERSARY"], space: ["ROCKET SCIENTISTS READY FOR LAUNCH", "STARGAZERS SPOT A RARE COMET", "MOON PROGRAM CAPTURES THE NATION"],
  sports: ["HOME TEAM WINS THE BIG GAME", "RECORD BROKEN AT THE TRACK MEET", "COUNTY CUP COMES DOWN TO THE WIRE"], nature: ["EARLY SPRING SURPRISES GARDENERS", "FOREST TRAIL REOPENS AFTER STORM", "RAINBOW ARCS OVER THE VALLEY"],
  school: ["SCHOOL FAIR RAISES FUNDS FOR NEW LIBRARY", "SPELLING CHAMPION CROWNED", "STUDENTS BUILD THE TOWN CLOCK"], music: ["BRASS BAND LEADS THE PARADE", "CHOIR SINGS TO A FULL HALL", "NEW SONG TOPS THE CHARTS"],
};
export const crateOf = (level) => Math.floor((Math.max(1, Math.floor(level) || 1) - 1) / PER_CRATE);
export const posOf = (level) => ((Math.max(1, Math.floor(level) || 1) - 1) % PER_CRATE) + 1;
export const crateInfo = (level) => CRATES[crateOf(level) % CRATES.length];
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/** Which puzzles a newspaper carries: [{type}]. The first three are crossword only; each new type appears on a fixed level, and papers grow from there. */
export function puzzlesFor(level) {
  const L = Math.max(1, Math.floor(level) || 1), i = posOf(L), boss = i === 10;
  if (L <= 3) return [{ type: "crossword" }];
  if (L <= 6) return [{ type: "crossword" }, { type: "sudoku" }];
  if (L <= 9) return L === 8 ? [{ type: "crossword" }, { type: "sudoku" }, { type: "wordsearch" }] : [{ type: "crossword" }, { type: "wordsearch" }];
  if (L === 10) return [{ type: "crossword" }, { type: "sudoku" }, { type: "wordsearch" }];
  if (L === 11) return [{ type: "crossword" }, { type: "cipher" }];
  const rng = makeRng(L * 7717 + 3), count = clamp(2 + Math.floor((L - 9) / 12), 2, 4) + (boss ? 1 : 0), avail = TYPES.filter((t) => UNLOCK[t] <= L), out = [{ type: "crossword" }];
  const rest = []; while (rest.length < count - 1) { const pool = avail.filter((t) => t !== "crossword"); rest.push(pool[rng.int(pool.length)]); }
  rest.sort((a, b) => TYPES.indexOf(a) - TYPES.indexOf(b)); for (const t of rest) out.push({ type: t });
  if (count >= 4 && !out.some((p) => p.type === "cipher") && L >= UNLOCK.cipher) out[out.length - 1] = { type: "cipher" };
  return out;
}
/** The newest type a level introduces (null if it adds nothing new): used for the "new puzzle" how-to card. */
export const introFor = (level) => TYPES.find((t) => UNLOCK[t] === level) || null;

// ---------------------------------------------------------------- building a newspaper
function poolFor(level, theme) {
  const maxD = clamp(1 + Math.floor(level / 14), 1, 3), own = WORDS[theme].filter((w) => w.d <= maxD), others = ALL_WORDS.filter((w) => w.t !== theme && w.d <= maxD);
  return [...own, ...own, ...others];   // the crate's theme is favoured, other themes fill the gaps
}
function buildPuzzle(level, type, index, theme) {
  const seed = level * 100003 + index * 7919 + 17, rng = makeRng(seed);
  if (type === "crossword") {
    const target = clamp(4 + Math.floor((level + 1) / 2), 5, 14), size = clamp(9 + Math.floor(level / 6), 9, 13), seen = new Set(), pool = poolFor(level, theme).filter((w) => !seen.has(w.w) && seen.add(w.w));
    for (let t = 0; t < 12; t++) { const cw = buildCrossword(seed + t * 31, pool, target, size); if (cw) return { type, data: cw, st: { g: Array.from({ length: cw.rows }, () => Array(cw.cols).fill("")) } }; }
    return null;
  }
  if (type === "sudoku") {
    const n = level < 10 ? 4 : level < 25 ? 6 : 9, givens = n === 4 ? clamp(10 - Math.floor(level / 6), 7, 10) : n === 6 ? clamp(22 - Math.floor((level - 10) / 3), 15, 22) : clamp(40 - Math.floor((level - 25) / 3), 29, 40), d = buildSudoku(seed, n, givens);
    return { type, data: d, st: { g: d.puzzle.map((r) => r.slice()), notes: {} } };
  }
  if (type === "wordsearch") {
    const nWords = clamp(5 + Math.floor(level / 4), 5, 12), size = clamp(8 + Math.floor(level / 5), 8, 14), dirs = level <= 9 ? 2 : level <= 15 ? 3 : level <= 22 ? 6 : 8, own = WORDS[theme].filter((w) => w.w.length <= size && w.d <= clamp(1 + Math.floor(level / 14), 1, 3)).map((w) => w.w);
    const words = [...new Set(own)].sort((a, b) => ((a.charCodeAt(0) * 31 + seed) % 97) - ((b.charCodeAt(0) * 31 + seed) % 97)).slice(0, nWords);
    for (let t = 0; t < 8; t++) { const ws = buildWordSearch(seed + t * 13, words, size, dirs); if (ws) return { type, data: ws, st: { found: [] } }; }
    return null;
  }
  const text = SAYINGS[rng.int(SAYINGS.length)], c = buildCipher(seed, text, clamp(4 - Math.floor((level - 11) / 4), 0, 4)); return { type: "cipher", data: c, st: { g: { ...c.given } } };
}
const secondsFor = (p) => {
  if (p.type === "crossword") return p.data.words.length * 28 + 45;
  if (p.type === "sudoku") return p.data.n === 4 ? 90 : p.data.n === 6 ? 200 : 420;
  if (p.type === "wordsearch") return p.data.words.length * 18 + 40;
  return Object.keys(p.data.key).length * 6 + 60;
};
/** The time limit in seconds for a set of puzzles: the sum of fair per-puzzle times plus 15%, rounded up to 10 seconds. */
export const timeLimitFor = (puzzles) => Math.ceil((puzzles.reduce((t, p) => t + secondsFor(p), 0) * 1.15) / 10) * 10;
export function newIssue(level) {
  const L = Math.max(1, Math.floor(level) || 1), crate = crateInfo(L), rng = makeRng(L * 31 + 5), puzzles = puzzlesFor(L).map((s, i) => { const p = buildPuzzle(L, s.type, i, crate.theme); if (!p) throw new Error(`could not build ${s.type} for issue ${L}`); return { id: i, ...p }; });
  const limit = timeLimitFor(puzzles), months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], year = crate.year + (crateOf(L) >= CRATES.length ? 10 * Math.floor(crateOf(L) / CRATES.length) : 0);
  return { v: 1, level: L, crate: crateOf(L), masthead: crate.name, theme: crate.theme, date: `${months[rng.int(12)]} ${1 + rng.int(28)}, ${year + posOf(L) - 1}`, vol: 1 + crateOf(L), no: posOf(L) + 100 * crateOf(L), headline: HEADLINES[crate.theme][rng.int(3)], boss: posOf(L) === 10, puzzles, timeLimit: limit, timeLeft: limit, hintsUsed: 0, relaxed: false, failed: false, done: false, won: false };
}

// ---------------------------------------------------------------- time
/** Move the clock. Relaxed papers have no deadline. Returns true if the presses just rolled (time ran out). */
export function advance(st, seconds) {
  if (st.done || st.failed || st.relaxed || seconds <= 0) return false; st.timeLeft = Math.max(0, st.timeLeft - seconds); if (st.timeLeft <= 0) { st.failed = true; return true; } return false;
}
/** Keep going without a deadline (the paper then earns one star). */
export function relax(st) { st.relaxed = true; st.failed = false; if (st.timeLeft <= 0) st.timeLeft = 0; }

// ---------------------------------------------------------------- puzzle checks
export function puzzleDone(p) {
  if (p.type === "crossword") return p.data.cells.every((row, r) => row.every((ch, c) => !ch || p.st.g[r][c] === ch));
  if (p.type === "sudoku") return p.data.solution.every((row, r) => row.every((v, c) => p.st.g[r][c] === v));
  if (p.type === "wordsearch") return p.st.found.length === p.data.words.length;
  return Object.entries(p.data.key).every(([cl, pl]) => p.st.g[cl] === pl);
}
const settle = (st) => { if (st.puzzles.every(puzzleDone)) { st.done = true; st.won = true; } return st.won; };
const live = (st) => !st.done && !st.failed;

// crossword
export function cwSet(st, pi, r, c, ch) { const p = st.puzzles[pi]; if (!live(st) || p.type !== "crossword" || !p.data.cells[r]?.[c]) return { changed: false }; const v = /^[A-Za-z]$/.test(ch) ? ch.toUpperCase() : ""; if (p.st.g[r][c] === v) return { changed: false }; p.st.g[r][c] = v; return { changed: true, puzzleDone: puzzleDone(p), won: settle(st) }; }
/** Cells holding a wrong letter (the paper's "check" button). */
export const cwWrong = (st, pi) => { const p = st.puzzles[pi], out = []; p.data.cells.forEach((row, r) => row.forEach((ch, c) => { if (ch && p.st.g[r][c] && p.st.g[r][c] !== ch) out.push([r, c]); })); return out; };
export function cwReveal(st, pi, r, c) { const p = st.puzzles[pi]; if (!live(st) || !p.data.cells[r]?.[c] || p.st.g[r][c] === p.data.cells[r][c]) return { changed: false }; p.st.g[r][c] = p.data.cells[r][c]; st.hintsUsed++; return { changed: true, puzzleDone: puzzleDone(p), won: settle(st) }; }
export function cwRevealWord(st, pi, wi) { const p = st.puzzles[pi], w = p.data.words[wi]; if (!live(st) || !w) return { changed: false }; let n = 0; for (let i = 0; i < w.len; i++) { const r = w.r + (w.dir === "down" ? i : 0), c = w.c + (w.dir === "across" ? i : 0); if (p.st.g[r][c] !== w.answer[i]) { p.st.g[r][c] = w.answer[i]; n++; } } if (!n) return { changed: false }; st.hintsUsed++; return { changed: true, puzzleDone: puzzleDone(p), won: settle(st) }; }

// sudoku
export const sdIsGiven = (p, r, c) => p.data.puzzle[r][c] !== 0;
export function sdSet(st, pi, r, c, v) { const p = st.puzzles[pi]; if (!live(st) || p.type !== "sudoku" || sdIsGiven(p, r, c) || v < 0 || v > p.data.n || p.st.g[r][c] === v) return { changed: false }; p.st.g[r][c] = v; delete p.st.notes[`${r},${c}`]; return { changed: true, puzzleDone: puzzleDone(p), won: settle(st) }; }
export function sdNote(st, pi, r, c, v) { const p = st.puzzles[pi]; if (!live(st) || sdIsGiven(p, r, c) || p.st.g[r][c] || v < 1 || v > p.data.n) return { changed: false }; const k = `${r},${c}`; p.st.notes[k] = (p.st.notes[k] || 0) ^ (1 << v); if (!p.st.notes[k]) delete p.st.notes[k]; return { changed: true }; }
/** Cells that break a rule right now (a repeated number in a row, column or box). */
export function sdConflicts(st, pi) {
  const p = st.puzzles[pi], n = p.data.n, [bh, bw] = p.data.box, g = p.st.g, bad = new Set(); const mark = (cells) => { const seen = {}; for (const [r, c] of cells) { const v = g[r][c]; if (!v) continue; (seen[v] ||= []).push([r, c]); } for (const v in seen) if (seen[v].length > 1) for (const [r, c] of seen[v]) bad.add(`${r},${c}`); };
  for (let i = 0; i < n; i++) { mark(Array.from({ length: n }, (_, j) => [i, j])); mark(Array.from({ length: n }, (_, j) => [j, i])); }
  for (let r0 = 0; r0 < n; r0 += bh) for (let c0 = 0; c0 < n; c0 += bw) { const cells = []; for (let i = 0; i < bh; i++) for (let j = 0; j < bw; j++) cells.push([r0 + i, c0 + j]); mark(cells); } return bad;
}
export function sdReveal(st, pi, r, c) { const p = st.puzzles[pi]; if (!live(st) || sdIsGiven(p, r, c) || p.st.g[r][c] === p.data.solution[r][c]) return { changed: false }; p.st.g[r][c] = p.data.solution[r][c]; delete p.st.notes[`${r},${c}`]; st.hintsUsed++; return { changed: true, puzzleDone: puzzleDone(p), won: settle(st) }; }

// word search
/** Try the line from (r1,c1) to (r2,c2): it counts if it spells a word that is still hidden (forwards or backwards). */
export function wsSelect(st, pi, r1, c1, r2, c2) {
  const p = st.puzzles[pi]; if (!live(st) || p.type !== "wordsearch") return { found: null }; const s = lineLetters(p.data.grid, r1, c1, r2, c2); if (!s || s.length < 2) return { found: null };
  const hit = p.data.words.find((w) => (w.word === s || w.word === [...s].reverse().join("")) && !p.st.found.some((f) => f.word === w.word)); if (!hit) return { found: null };
  p.st.found.push({ word: hit.word, r1, c1, r2, c2 }); return { found: hit.word, puzzleDone: puzzleDone(p), won: settle(st) };
}
export function wsReveal(st, pi) { const p = st.puzzles[pi]; if (!live(st)) return { changed: false }; const w = p.data.words.find((x) => !p.st.found.some((f) => f.word === x.word)); if (!w) return { changed: false }; p.st.found.push({ word: w.word, r1: w.r, c1: w.c, r2: w.r + w.dr * (w.word.length - 1), c2: w.c + w.dc * (w.word.length - 1), hinted: true }); st.hintsUsed++; return { changed: true, word: w.word, puzzleDone: puzzleDone(p), won: settle(st) }; }

// cryptogram
export function cpSet(st, pi, cl, pl) { const p = st.puzzles[pi]; if (!live(st) || p.type !== "cipher" || !(cl in p.data.key) || cl in p.data.given) return { changed: false }; const v = /^[A-Za-z]$/.test(pl) ? pl.toUpperCase() : ""; if ((p.st.g[cl] || "") === v) return { changed: false }; if (v) p.st.g[cl] = v; else delete p.st.g[cl]; return { changed: true, puzzleDone: puzzleDone(p), won: settle(st) }; }
export function cpReveal(st, pi, cl) { const p = st.puzzles[pi]; if (!live(st) || !(cl in p.data.key) || p.st.g[cl] === p.data.key[cl]) return { changed: false }; p.st.g[cl] = p.data.key[cl]; st.hintsUsed++; return { changed: true, puzzleDone: puzzleDone(p), won: settle(st) }; }
/** Cipher letters whose guess is shared with another cipher letter (two different letters cannot mean the same plain letter). */
export function cpClashes(st, pi) { const p = st.puzzles[pi], by = {}; for (const [cl, pl] of Object.entries(p.st.g)) (by[pl] ||= []).push(cl); return new Set(Object.values(by).filter((x) => x.length > 1).flat()); }

// ---------------------------------------------------------------- scoring and profile
/** 3 stars with at least 45% of the time left, 2 with 20%, else 1; leaning on four or more hints costs a star; a relaxed paper earns 1 star. */
export function starsFor(st) { if (st.relaxed) return 1; const f = st.timeLeft / st.timeLimit, base = f >= 0.45 ? 3 : f >= 0.2 ? 2 : 1; return Math.max(1, base - (st.hintsUsed >= 4 ? 1 : 0)); }
export const newProfile = () => ({ v: 1, level: 1, hints: 5, solved: 0, stars: {}, best: {}, seen: {} });
export const totalStars = (p) => Object.values(p.stars || {}).reduce((a, b) => a + b, 0);
export function normalizeProfile(p = {}) { const d = newProfile(), o = { ...d, ...p, stars: { ...(p.stars || {}) }, best: { ...(p.best || {}) }, seen: { ...(p.seen || {}) } }; o.hints = clamp(Math.floor(+o.hints || 0), 0, MAX_HINTS); o.level = Math.max(1, Math.floor(o.level) || 1); return o; }
/** Apply a finished newspaper. Stars and best times only improve; the first clear opens the next issue and earns hints (more for a crate's last issue). */
export function completeIssue(p, st) {
  const stars = starsFor(st), first = !(p.stars[st.level] > 0), spent = st.timeLimit - st.timeLeft; p.stars[st.level] = Math.max(p.stars[st.level] || 0, stars); if (!st.relaxed) p.best[st.level] = Math.min(p.best[st.level] || 1e9, spent);
  p.level = Math.max(p.level, st.level + 1); let hints = 0; if (first) { p.solved++; hints = 2 + (st.boss ? 3 : 0); const got = Math.min(hints, MAX_HINTS - p.hints); p.hints += got; hints = got; }
  return { stars, first, spent, reward: { hints }, boss: !!st.boss };
}
export function useHint(p) { if (p.hints < 1) return false; p.hints--; return true; }
