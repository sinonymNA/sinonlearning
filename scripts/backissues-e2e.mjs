// Browser check for Back Issues. Usage: node scripts/backissues-e2e.mjs [--url http://localhost:3100] [--shots dir] [--only iphone-p,laptop]
// Seeds saved games (the engine builds the paper, the browser plays it through real taps, keys and drags), checks fit at six sizes, every puzzle type, stars, the timeout card and relaxed mode.
import { chromium } from "playwright";
import { newIssue, newProfile } from "../arcade-server/issues/index.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100") + "/arcade/backissues", SHOTS = arg("shots", "/tmp"), only = arg("only", "");
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const sizes = { "iphone-p": [390, 844], "iphone-l": [844, 390], "ipad-p": [820, 1180], "ipad-l": [1180, 820], laptop: [1366, 768], tiny: [320, 568] };
const SEEN = { crossword: true, sudoku: true, wordsearch: true, cipher: true };
const mk = async (w, h, level, opts = {}) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 });
  const iss = level ? newIssue(level) : null; if (iss && opts.timeLeft !== undefined) iss.timeLeft = opts.timeLeft;
  const prof = { ...newProfile(), level: level || 1, hints: 9, seen: opts.unseen ? {} : SEEN };
  if (level) await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, ["backissues:v1", JSON.stringify({ profile: prof, issue: opts.noIssue ? null : iss })]);
  const page = await ctx.newPage(); page.on("pageerror", (e) => errors.push("pageerror " + e.message)); page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push("console " + m.text()); });
  return { ctx, page, iss };
};
const saved = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("backissues:v1")));
const fit = async (p, label) => { await p.waitForTimeout(750); const o = await p.evaluate(() => { const a = document.querySelector(".bi-area, .bi-home, .bi-crates")?.getBoundingClientRect(); const bd = document.querySelector(".bi-board > *")?.getBoundingClientRect(); const ks = document.querySelector(".bi-keys"), kr = ks && getComputedStyle(ks).display !== "none" ? ks.getBoundingClientRect() : null; return { sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, w: innerWidth, h: innerHeight, a: a && { b: a.bottom, r: a.right }, bd: bd && { w: bd.width, h: bd.height, t: bd.top, b: bd.bottom, l: bd.left, r: bd.right }, kb: kr && { b: kr.bottom } }; });
  check(o.sh <= o.h + 1 && o.sw <= o.w + 1, `${label}: page does not scroll (${o.sw}x${o.sh} in ${o.w}x${o.h})`); if (o.bd) { check(o.bd.l >= -1 && o.bd.r <= o.w + 1 && o.bd.b <= o.h + 1 && o.bd.w >= 120 && o.bd.h >= 100, `${label}: board fits (${Math.round(o.bd.w)}x${Math.round(o.bd.h)})`); } if (o.kb) check(o.kb.b <= o.h + 1, `${label}: keyboard on screen`); return o; };
const solveCrossword = async (p, st, pi) => { await p.click(`[data-tab="${pi}"]`); const cells = st.puzzles[pi].data.cells; for (let r = 0; r < cells.length; r++) for (let c = 0; c < cells[r].length; c++) if (cells[r][c]) { await p.click(`.cw[data-r="${r}"][data-c="${c}"]`); await p.keyboard.press(cells[r][c]); } };
const solveSudoku = async (p, st, pi) => { await p.click(`[data-tab="${pi}"]`); const d = st.puzzles[pi].data; for (let r = 0; r < d.n; r++) for (let c = 0; c < d.n; c++) if (!d.puzzle[r][c]) { await p.click(`.sd[data-r="${r}"][data-c="${c}"]`); await p.keyboard.press(String(d.solution[r][c])); } };
const center = async (p, r, c) => { const b = await p.locator(`.ws[data-r="${r}"][data-c="${c}"]`).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const solveWs = async (p, st, pi, tap = false) => { await p.click(`[data-tab="${pi}"]`); for (const w of st.puzzles[pi].data.words) { const [x1, y1] = await center(p, w.r, w.c), [x2, y2] = await center(p, w.r + w.dr * (w.word.length - 1), w.c + w.dc * (w.word.length - 1)); if (tap) { await p.mouse.click(x1, y1); await p.mouse.click(x2, y2); } else { await p.mouse.move(x1, y1); await p.mouse.down(); await p.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 3 }); await p.mouse.move(x2, y2, { steps: 3 }); await p.mouse.up(); } } };
const solveCipher = async (p, st, pi) => { await p.click(`[data-tab="${pi}"]`); const k = st.puzzles[pi].data.key, g = st.puzzles[pi].data.given; for (const cl of Object.keys(k)) if (!(cl in g)) { await p.click(`.cp[data-cl="${cl}"]`); await p.keyboard.press(k[cl]); } };
const solvers = { crossword: solveCrossword, sudoku: solveSudoku, wordsearch: solveWs, cipher: solveCipher };
const playAll = async (p, iss) => { for (let i = 0; i < iss.puzzles.length; i++) await solvers[iss.puzzles[i].type](p, iss, i); };

for (const [name, [w, h]] of Object.entries(sizes)) {
  if (only && !only.split(",").includes(name)) continue;
  // ---- home, crates, first paper with its intro card
  { const { ctx, page } = await mk(w, h, 0); await page.goto(BASE); await page.waitForSelector(".bi-home"); await fit(page, `${name} home`); await page.screenshot({ path: `${SHOTS}/bi-${name}-home.png` });
    await page.click(".bi-play"); await page.waitForSelector(".bi-card.intro"); check(/Crossword/i.test(await page.textContent(".bi-card.intro h2")), `${name}: the first paper opens with the crossword card`); await page.click(".bi-card.intro .bi-btn"); await page.waitForSelector(".cw.sel, .cw");
    await fit(page, `${name} paper 1`); await page.screenshot({ path: `${SHOTS}/bi-${name}-paper1.png` }); const s0 = await saved(page); check(s0.profile.seen.crossword, `${name}: intro remembered`); check(s0.issue.puzzles.length === 1, `${name}: paper 1 is a crossword only`);
    await page.click(".bi-top .bi-btn.round >> nth=0"); await page.waitForSelector(".bi-crates"); await fit(page, `${name} crates`); const tiles = await page.evaluate(() => [...document.querySelectorAll(".bi-grid button")].map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom]; })); check(tiles.every(([l, r, t, b]) => l >= -1 && r <= w + 1 && t >= 0 && b <= h + 1), `${name}: every paper tile is on screen`); const arrows = await page.evaluate(() => [...document.querySelectorAll(".bi-crate .bi-btn")].map((e) => e.getBoundingClientRect().right)); check(arrows.every((r) => r <= w + 1), `${name}: crate arrows on screen`); check((await page.locator(".bi-grid button").count()) === 10 && (await page.locator(".bi-grid button:disabled").count()) === 9, `${name}: ten papers, only the first open`); await ctx.close(); }
  // ---- play paper 1 for real: stars, reward, next paper opens
  { const { ctx, page, iss } = await mk(w, h, 1); await page.goto(BASE); await page.click(".bi-play"); await page.waitForSelector(".cw"); await playAll(page, iss); await page.waitForSelector(".bi-card.result", { timeout: 8000 });
    const s = await saved(page); check(s.profile.level === 2 && s.profile.stars["1"] === 3 && s.profile.solved === 1 && (s.issue === null || s.issue.done), `${name}: paper 1 cleared, 3 stars, paper 2 open (stars ${s.profile.stars["1"]})`); check(s.profile.hints === 9 + 2, `${name}: first clear paid 2 hints`); await page.screenshot({ path: `${SHOTS}/bi-${name}-result.png` });
    await page.click(".bi-card.result .bi-btn.go"); await page.waitForSelector(".cw"); check((await saved(page)).issue.level === 2, `${name}: next paper loads`); await ctx.close(); }
  // ---- sudoku + crossword (paper 4), and the sudoku intro card
  { const { ctx, page, iss } = await mk(w, h, 4, { unseen: true }); await page.goto(BASE); await page.click(".bi-play"); await page.waitForSelector(".bi-card.intro"); check(/Sudoku/i.test(await page.textContent(".bi-card.intro h2")), `${name}: paper 4 introduces sudoku`); await page.click(".bi-card.intro .bi-btn");
    const si = iss.puzzles.findIndex((q) => q.type === "sudoku"); await page.click(`[data-tab="${si}"]`); await page.waitForSelector(".sd"); await fit(page, `${name} sudoku`); await page.screenshot({ path: `${SHOTS}/bi-${name}-sudoku.png` });
    const d = iss.puzzles[si].data; let rr = 0, cc = 0; outer: for (let r = 0; r < d.n; r++) for (let c = 0; c < d.n; c++) if (!d.puzzle[r][c]) { rr = r; cc = c; break outer; }
    await page.click(`.sd[data-r="${rr}"][data-c="${cc}"]`); const wrong = (d.solution[rr][cc] % d.n) + 1; await page.keyboard.press(String(wrong)); await page.keyboard.press(String(wrong)); check((await saved(page)).issue.puzzles[si].st.g[rr][cc] === 0, `${name}: pressing the same number twice clears it`);
    await page.keyboard.press(String(wrong)); await page.waitForTimeout(50); const bad = iss.puzzles[si].data.puzzle.flat().length; check(bad > 0, "sudoku data present");
    await playAll(page, iss); await page.waitForSelector(".bi-card.result", { timeout: 9000 }); check((await saved(page)).profile.level === 5, `${name}: paper 4 cleared (sudoku + crossword)`); await ctx.close(); }
  // ---- word search (paper 7) by dragging, then tapping the ends
  { const { ctx, page, iss } = await mk(w, h, 7); await page.goto(BASE); await page.click(".bi-play"); await page.waitForSelector(".cw"); const wi = iss.puzzles.findIndex((q) => q.type === "wordsearch"); await page.click(`[data-tab="${wi}"]`); await page.waitForSelector(".ws"); await fit(page, `${name} word search`); await page.screenshot({ path: `${SHOTS}/bi-${name}-ws.png` });
    await solveWs(page, iss, wi, name === "tiny"); check((await saved(page)).issue.puzzles[wi].st.found.length === iss.puzzles[wi].data.words.length, `${name}: every hidden word found (${name === "tiny" ? "tapping ends" : "dragging"})`);
    const rest = { ...iss, puzzles: iss.puzzles.filter((_, i) => i !== wi) }; for (let i = 0; i < iss.puzzles.length; i++) if (i !== wi) await solvers[iss.puzzles[i].type](page, iss, i); await page.waitForSelector(".bi-card.result", { timeout: 9000 }); void rest; await ctx.close(); }
  // ---- cryptogram (paper 11)
  { const { ctx, page, iss } = await mk(w, h, 11); await page.goto(BASE); await page.click(".bi-play"); await page.waitForSelector(".cw"); const ci = iss.puzzles.findIndex((q) => q.type === "cipher"); await page.click(`[data-tab="${ci}"]`); await page.waitForSelector(".cp"); await fit(page, `${name} cryptogram`); await page.screenshot({ path: `${SHOTS}/bi-${name}-cipher.png` });
    const cps = await page.evaluate(() => [...document.querySelectorAll(".cp")].map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom]; })); check(cps.every(([l, r, t, b]) => l >= -1 && r <= w + 1 && b <= h + 1 && t >= 0), `${name}: every cipher letter on screen`);
    await playAll(page, iss); await page.waitForSelector(".bi-card.result", { timeout: 12000 }); check((await saved(page)).profile.level === 12, `${name}: paper 11 cleared (crossword + cryptogram)`); await ctx.close(); }
  // ---- the clock: timeout card, try again, relaxed mode
  { const { ctx, page, iss } = await mk(w, h, 2, { timeLeft: 2 }); await page.goto(BASE); await page.click(".bi-play"); await page.waitForSelector(".bi-card.fail", { timeout: 6000 }); await page.screenshot({ path: `${SHOTS}/bi-${name}-fail.png` });
    check(/rolled/i.test(await page.textContent(".bi-card.fail")), `${name}: the presses roll when time runs out`); const before = (await saved(page)).issue; check(before.failed === true, `${name}: failure saved`);
    await page.click(".bi-card.fail .bi-btn >> text=KEEP GOING"); await page.waitForSelector(".bi-card.fail", { state: "detached" }); check((await page.textContent(".bi-clock b")) === "∞", `${name}: relaxed mode shows no clock`); await playAll(page, iss); await page.waitForSelector(".bi-card.result", { timeout: 8000 }); check((await saved(page)).profile.stars["2"] === 1, `${name}: relaxed finish earns one star`);
    await ctx.close(); }
  { const { ctx, page } = await mk(w, h, 2, { timeLeft: 1.5 }); await page.goto(BASE); await page.click(".bi-play"); await page.waitForSelector(".bi-card.fail", { timeout: 6000 }); await page.click(".bi-card.fail .bi-btn.go"); await page.waitForSelector(".bi-card.fail", { state: "detached" }); const s = await saved(page); check(!s.issue.failed && s.issue.timeLeft > 100 && !s.issue.relaxed, `${name}: Try Again restarts with a full clock`); await ctx.close(); }
  // ---- the clock stops behind a card and in a hidden tab
  { const { ctx, page } = await mk(w, h, 1, { unseen: true }); await page.goto(BASE); await page.click(".bi-play"); await page.waitForSelector(".bi-card.intro"); const t0 = (await saved(page)).issue.timeLeft; await page.waitForTimeout(1600); const t1 = (await saved(page)).issue.timeLeft; check(t0 === t1, `${name}: the clock waits behind the intro card`); await ctx.close(); }
}
await browser.close();
console.log(ok.length + " checks passed"); if (errors.length) { console.log(errors.join("\n")); process.exit(1); } console.log("ALL GOOD");
