// Back Issues puzzle generators. Pure ESM, seeded (a seed always makes the same puzzle), no Date.now/Math.random.
// crossword (free-form, built from the word bank), sudoku (4x4, 6x6, 9x9; always exactly one solution), word search, cryptogram.
import { makeRng } from "../gridiron/rng.mjs";

const shuffle = (arr, rng) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rng.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------------------------------------------------------------- crossword
const DIRS = { across: [0, 1], down: [1, 0] };
/** Can `word` go at (r,c) in `dir` on this grid without making any unintended word? Returns the number of crossings, or -1. */
function fits(grid, N, word, r, c, dir) {
  const [dr, dc] = DIRS[dir], er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1); if (r < 0 || c < 0 || er >= N || ec >= N) return -1;
  const before = grid[r - dr]?.[c - dc], after = grid[er + dr]?.[ec + dc]; if (before || after) return -1;
  let cross = 0;
  for (let i = 0; i < word.length; i++) {
    const rr = r + dr * i, cc = c + dc * i, cur = grid[rr][cc];
    if (cur) { if (cur !== word[i]) return -1; cross++; }
    else if (grid[rr + dc]?.[cc + dr] || grid[rr - dc]?.[cc - dr]) return -1;   // a new letter may not touch a letter beside it
  }
  return cross;
}
/** Build a crossword of about `target` words from `pool` ([{w, c}]). Returns {rows, cols, cells, words[{num, dir, r, c, answer, clue}]} or null. */
export function buildCrossword(seed, pool, target, maxSize = 13) {
  const rng = makeRng(seed >>> 0), N = 31, mid = 15;
  for (let attempt = 0; attempt < 60; attempt++) {
    const grid = Array.from({ length: N }, () => Array(N).fill(null)), placed = [], bag = shuffle(pool, rng).sort((a, b) => b.w.length - a.w.length + (rng() - 0.5) * 3);
    const first = bag.shift(); first && (() => { const c0 = mid - Math.floor(first.w.length / 2); for (let i = 0; i < first.w.length; i++) grid[mid][c0 + i] = first.w[i]; placed.push({ ...first, dir: "across", r: mid, c: c0 }); })();
    let minR = mid, maxR = mid, minC = mid - Math.floor((first?.w.length ?? 0) / 2), maxC = minC + (first?.w.length ?? 1) - 1;
    for (const cand of bag) {
      if (placed.length >= target) break; let best = null;
      for (const pw of placed) {
        const odir = pw.dir === "across" ? "down" : "across", [pdr, pdc] = DIRS[pw.dir], [dr, dc] = DIRS[odir];
        for (let i = 0; i < pw.w.length; i++) for (let j = 0; j < cand.w.length; j++) {
          if (pw.w[i] !== cand.w[j]) continue; const r = pw.r + pdr * i - dr * j, c = pw.c + pdc * i - dc * j, x = fits(grid, N, cand.w, r, c, odir); if (x < 1) continue;
          const nr0 = Math.min(minR, r), nr1 = Math.max(maxR, r + dr * (cand.w.length - 1)), nc0 = Math.min(minC, c), nc1 = Math.max(maxC, c + dc * (cand.w.length - 1)); if (nr1 - nr0 + 1 > maxSize || nc1 - nc0 + 1 > maxSize) continue;
          const score = x * 3 - ((nr1 - nr0 + 1) + (nc1 - nc0 + 1)) * 0.2 + rng(); if (!best || score > best.score) best = { r, c, dir: odir, score };
        }
      }
      if (best) { const [dr, dc] = DIRS[best.dir]; for (let i = 0; i < cand.w.length; i++) grid[best.r + dr * i][best.c + dc * i] = cand.w[i]; placed.push({ ...cand, dir: best.dir, r: best.r, c: best.c }); minR = Math.min(minR, best.r); maxR = Math.max(maxR, best.r + dr * (cand.w.length - 1)); minC = Math.min(minC, best.c); maxC = Math.max(maxC, best.c + dc * (cand.w.length - 1)); }
    }
    if (placed.length < Math.max(3, target - 1)) continue;
    const rows = maxR - minR + 1, cols = maxC - minC + 1, cells = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => grid[minR + r][minC + c]));
    const words = placed.map((p) => ({ dir: p.dir, r: p.r - minR, c: p.c - minC, answer: p.w, clue: p.c_ ?? p.c, len: p.w.length }));
    for (const wd of words) wd.clue = (pool.find((x) => x.w === wd.answer) || {}).c;
    // number the cells the way a newspaper does: left to right, top to bottom
    let n = 0; const num = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (words.some((w) => w.r === r && w.c === c)) num[r][c] = ++n;
    for (const w of words) w.num = num[w.r][w.c]; words.sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === "across" ? -1 : 1));
    return { rows, cols, cells, words, num };
  }
  return null;
}
/** Every run of 2+ letters in the finished grid must be one of the placed words (no accidental words). */
export function crosswordConsistent(cw) {
  const want = new Set(cw.words.map((w) => `${w.dir}:${w.r}:${w.c}:${w.answer}`)), got = new Set();
  for (let r = 0; r < cw.rows; r++) { let c = 0; while (c < cw.cols) { if (!cw.cells[r][c]) { c++; continue; } let e = c; while (e < cw.cols && cw.cells[r][e]) e++; if (e - c >= 2) got.add(`across:${r}:${c}:${cw.cells[r].slice(c, e).join("")}`); c = e; } }
  for (let c = 0; c < cw.cols; c++) { let r = 0; while (r < cw.rows) { if (!cw.cells[r][c]) { r++; continue; } let e = r; while (e < cw.rows && cw.cells[e][c]) e++; if (e - r >= 2) got.add(`down:${r}:${c}:${cw.cells.slice(r, e).map((x) => x[c]).join("")}`); r = e; } }
  return want.size === got.size && [...want].every((k) => got.has(k));
}

// ---------------------------------------------------------------- sudoku
const BOX = { 4: [2, 2], 6: [2, 3], 9: [3, 3] };
export const boxOf = (n) => BOX[n];
const peersOk = (g, n, r, c, v) => { const [bh, bw] = BOX[n]; for (let i = 0; i < n; i++) if (g[r][i] === v || g[i][c] === v) return false; const r0 = r - (r % bh), c0 = c - (c % bw); for (let i = 0; i < bh; i++) for (let j = 0; j < bw; j++) if (g[r0 + i][c0 + j] === v) return false; return true; };
function countSolutions(g, n, limit = 2) {
  let count = 0;
  const go = () => {
    if (count >= limit) return; let br = -1, bc = -1, bestN = 99, bestV = null;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!g[r][c]) { const vs = []; for (let v = 1; v <= n; v++) if (peersOk(g, n, r, c, v)) vs.push(v); if (vs.length < bestN) { bestN = vs.length; br = r; bc = c; bestV = vs; if (!vs.length) return; } }
    if (br < 0) { count++; return; } for (const v of bestV) { g[br][bc] = v; go(); g[br][bc] = 0; if (count >= limit) return; }
  };
  go(); return count;
}
/** A sudoku with exactly one solution. n is 4, 6 or 9; `givens` is how many cells to leave filled. */
export function buildSudoku(seed, n, givens) {
  const rng = makeRng(seed >>> 0), grid = Array.from({ length: n }, () => Array(n).fill(0));
  const fill = (idx) => { if (idx === n * n) return true; const r = Math.floor(idx / n), c = idx % n; for (const v of shuffle([...Array(n).keys()].map((x) => x + 1), rng)) if (peersOk(grid, n, r, c, v)) { grid[r][c] = v; if (fill(idx + 1)) return true; grid[r][c] = 0; } return false; };
  fill(0); const solution = grid.map((row) => row.slice()), puzzle = grid.map((row) => row.slice()); let left = n * n;
  for (const idx of shuffle([...Array(n * n).keys()], rng)) { if (left <= givens) break; const r = Math.floor(idx / n), c = idx % n, keep = puzzle[r][c]; puzzle[r][c] = 0; if (countSolutions(puzzle.map((x) => x.slice()), n) !== 1) puzzle[r][c] = keep; else left--; }
  return { n, box: BOX[n], puzzle, solution, givens: left };
}
export const sudokuUnique = (p) => countSolutions(p.puzzle.map((x) => x.slice()), p.n) === 1;

// ---------------------------------------------------------------- word search
const D8 = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1], [-1, 1]];
/** A word search. `dirCount` unlocks directions: 2 (right, down), 3 (+ diagonal), 6 (+ backwards), 8 (every direction). */
export function buildWordSearch(seed, words, size, dirCount) {
  const rng = makeRng(seed >>> 0), dirs = D8.slice(0, dirCount);
  for (let attempt = 0; attempt < 40; attempt++) {
    const grid = Array.from({ length: size }, () => Array(size).fill("")), placed = [];
    for (const w of shuffle(words, rng).sort((a, b) => b.length - a.length)) {
      let ok = false;
      for (let t = 0; t < 120 && !ok; t++) {
        const [dr, dc] = dirs[rng.int(dirs.length)], r = rng.int(size), c = rng.int(size), er = r + dr * (w.length - 1), ec = c + dc * (w.length - 1); if (er < 0 || ec < 0 || er >= size || ec >= size) continue;
        let good = true; for (let i = 0; i < w.length && good; i++) { const cur = grid[r + dr * i][c + dc * i]; if (cur && cur !== w[i]) good = false; } if (!good) continue;
        for (let i = 0; i < w.length; i++) grid[r + dr * i][c + dc * i] = w[i]; placed.push({ word: w, r, c, dr, dc }); ok = true;
      }
      if (!ok) { placed.length = 0; break; }
    }
    if (placed.length !== words.length) continue;
    const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!grid[r][c]) grid[r][c] = abc[rng.int(26)];
    return { size, grid, words: placed };
  }
  return null;
}
/** The letters along a straight line from (r1,c1) to (r2,c2), or null if it is not a straight (row, column or diagonal) line. */
export function lineLetters(grid, r1, c1, r2, c2) {
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1), len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1)) + 1; if (Math.abs(r2 - r1) !== 0 && Math.abs(c2 - c1) !== 0 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return null;
  let s = ""; for (let i = 0; i < len; i++) s += grid[r1 + dr * i]?.[c1 + dc * i] ?? "?"; return s.includes("?") ? null : s;
}

// ---------------------------------------------------------------- cryptogram
/** A cryptogram of `text`: every letter is swapped for a different letter. `reveal` letters are given away at the start. */
export function buildCipher(seed, text, reveal = 0) {
  const rng = makeRng(seed >>> 0), abc = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"], used = [...new Set(text.replace(/ /g, ""))];
  for (let attempt = 0; attempt < 200; attempt++) {
    const targets = shuffle(abc, rng), map = {}; used.forEach((ch, i) => { map[ch] = targets[i]; }); if (used.some((ch) => map[ch] === ch)) continue;
    const cipherText = [...text].map((ch) => (ch === " " ? " " : map[ch])).join(""), back = Object.fromEntries(used.map((ch) => [map[ch], ch])), given = {};
    for (const cl of shuffle(Object.keys(back), rng).slice(0, reveal)) given[cl] = back[cl];
    return { text, cipherText, key: back, given };
  }
  return null;
}
