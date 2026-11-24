// Browser check for Bolt Sort. Usage: node scripts/nuts-e2e.mjs [--url http://localhost:3100] [--shots dir] [--only iphone-p,laptop]
// Plays real levels through the UI (the saved game holds the board, the engine's solver finds the moves), checks the layout fits every screen, and measures
// frame times and long tasks while nuts are moving: the "no lag" check.
import { chromium } from "playwright";
import { solve } from "../arcade-server/nuts/index.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100") + "/arcade/nuts", SHOTS = arg("shots", "/tmp");
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const sizes = { "iphone-p": [390, 844], "iphone-l": [844, 390], "ipad-p": [820, 1180], "ipad-l": [1180, 820], laptop: [1366, 768], tiny: [320, 568] };
const only = arg("only", "");
const seedProfile = (level) => () => {};
const mkCtx = async (w, h, level) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 });
  await ctx.addInitScript((L) => { if (!localStorage.getItem("boltsort:v1") && L) localStorage.setItem("boltsort:v1", JSON.stringify({ profile: { v: 1, level: L, solved: L - 1, hints: 3, bolts: 2, stars: {}, best: {} }, game: null, settings: {} })); }, level);
  return ctx;
};
const save = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("boltsort:v1")));
const hit = (p, b) => p.locator(".nt-hit").nth(b);
const tapBolt = async (p, b) => { const r = await hit(p, b).boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + r.height * 0.6); };
const plain = (g) => g.bolts.map((b) => b.map((n) => n.c));
const settle = (p, ms = 700) => p.waitForTimeout(ms);

/** Measure frame gaps and long tasks in the page while `fn` runs. */
const perf = async (p, fn) => {
  await p.evaluate(() => { window.__gaps = []; window.__long = []; let last = performance.now(); window.__raf = true; const tick = (t) => { window.__gaps.push(t - last); last = t; if (window.__raf) requestAnimationFrame(tick); }; requestAnimationFrame(tick); try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.duration))).observe({ entryTypes: ["longtask"] }); } catch { /* not supported */ } });
  await fn(); await p.evaluate(() => { window.__raf = false; });
  return p.evaluate(() => { const g = window.__gaps.slice(2).sort((a, b) => a - b); return { frames: g.length, p95: g[Math.floor(g.length * 0.95)] || 0, max: g[g.length - 1] || 0, long: Math.max(0, ...window.__long) }; });
};

for (const [name, [w, h]] of Object.entries(sizes)) {
  if (only && !only.split(",").includes(name)) continue;
  // ---- first visit, level 1: help card, layout, rules, undo, hint, add bolt, solve with real taps
  let ctx = await mkCtx(w, h, 0), p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`)); p.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}] console ${m.text()}`); });
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".nt-stage .nt-nut");
  check((await p.locator(".nt-card h2").innerText()) === "BOLT SORT", `${name}: first visit shows the how-to card`); if (name === "iphone-p") await p.screenshot({ path: `${SHOTS}/nuts-${name}-help.png` });
  await p.click("text=LET'S SORT"); check((await p.locator(".nt-card").count()) === 0, `${name}: the how-to card closes`);
  const fit = async (label) => { const o = await p.evaluate(() => { const st = document.querySelector(".nt-stage").getBoundingClientRect(), nuts = [...document.querySelectorAll(".nt-nut")].map((e) => e.getBoundingClientRect()), hits = [...document.querySelectorAll(".nt-hit")].map((e) => e.getBoundingClientRect());
    return { sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, w: innerWidth, h: innerHeight, nutW: nuts[0]?.width || 0, nutsIn: nuts.every((r) => r.left >= -1 && r.right <= innerWidth + 1 && r.top >= st.top - 4 && r.bottom <= innerHeight + 1), hitsIn: hits.every((r) => r.left >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1), hitH: Math.min(...hits.map((r) => r.height)), bars: document.querySelector(".nt-bar").getBoundingClientRect().top, stageB: st.bottom }; });
    check(o.sh <= o.h + 1 && o.sw <= o.w + 1, `${name} ${label}: the page never scrolls`); check(o.nutsIn && o.hitsIn, `${name} ${label}: every nut and bolt is on screen (nuts ${Math.round(o.nutW)}px wide)`); check(o.nutW >= 22, `${name} ${label}: nuts are big enough to see`); check(o.hitH >= 60 || h < 420, `${name} ${label}: bolt tap targets are tall (${Math.round(o.hitH)}px)`); return o; };
  await fit("level 1");
  let g = (await save(p)).game; check(g.level === 1 && g.bolts.length === 5 && g.bolts.flat().length === 12, `${name}: level 1 is 3 colours on 5 bolts`);
  // tap rules: lift, put back, a wrong target moves the lift
  const filled = g.bolts.map((b, i) => (b.length ? i : -1)).filter((i) => i >= 0), emp = g.bolts.map((b, i) => (b.length ? -1 : i)).filter((i) => i >= 0);
  await tapBolt(p, filled[0]); check((await p.locator(".nt-bolt.sel").count()) === 1 && (await p.locator(".nt-nut.lifted").count()) >= 1, `${name}: tapping a bolt lifts its top nuts`);
  await tapBolt(p, filled[0]); check((await p.locator(".nt-bolt.sel").count()) === 0 && (await p.locator(".nt-nut.lifted").count()) === 0, `${name}: tapping it again puts them back`);
  const A = filled.find((a) => filled.some((b) => b !== a && g.bolts[b].at(-1).c !== g.bolts[a].at(-1).c && g.bolts[b].length)); const Bv = filled.find((b) => b !== A && g.bolts[b].at(-1).c !== g.bolts[A].at(-1).c);
  await tapBolt(p, A); await tapBolt(p, Bv); await settle(p, 300); g = (await save(p)).game; check(g.moves === 0 && (await p.locator(".nt-bolt.sel").count()) === 1, `${name}: an illegal drop is refused and the lift moves to the bolt you tapped`);
  await tapBolt(p, A); await tapBolt(p, emp[0]); await settle(p, 800); g = (await save(p)).game; check(g.moves === 1 && g.bolts[emp[0]].length >= 1, `${name}: a legal drop onto an empty bolt moves the nuts`); check((await p.locator(".nt-hex").first().isEnabled()), `${name}: undo is available after a move`);
  await p.click("[aria-label='Undo the last move']"); await settle(p, 800); g = (await save(p)).game; check(g.moves === 0 && g.bolts[emp[0]].length === 0, `${name}: undo puts the nuts back`);
  await p.click("[aria-label^='Hint']"); check((await p.locator(".nt-bolt.hint").count()) === 2 && (await save(p)).profile.hints === 2, `${name}: a hint highlights the two bolts and uses one hint`);
  await p.click("[aria-label^='Add a bolt']"); check((await p.locator(".nt-hit").count()) === 6, `${name}: add a bolt gives a sixth bolt`); await fit("with an extra bolt");
  await p.click("[aria-label^='Add a bolt']"); await p.click("[aria-label^='Add a bolt']"); check((await p.locator(".nt-hit").count()) === 7 && /2 extra bolts/.test(await p.locator(".nt-msg").innerText()), `${name}: only 2 extra bolts per level`);
  if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/nuts-${name}-l1.png` });
  // restart and solve for real, measuring frame time while moves play
  await p.click("[aria-label='Restart this level']"); await settle(p, 300);
  g = (await save(p)).game; const path = solve(plain(g), g.cap, 60000); check(!!path && path.length > 3, `${name}: the solver finds ${path?.length} moves for level 1`);
  const stats = await perf(p, async () => { for (const [a, b] of path) { await tapBolt(p, a); await tapBolt(p, b); await settle(p, 650); } });
  await p.waitForSelector(".nt-card h2", { timeout: 6000 }); check(/LEVEL 1 CLEAR/.test(await p.locator(".nt-card h2").innerText()), `${name}: solving shows LEVEL 1 CLEAR`); check((await p.locator(".nt-stars span.on").count()) >= 1, `${name}: the result shows stars`);
  check(stats.max < 180 && stats.p95 < 60, `${name}: smooth while moving (${stats.frames} frames, p95 ${Math.round(stats.p95)}ms, worst ${Math.round(stats.max)}ms, longest task ${Math.round(stats.long)}ms)`);
  if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/nuts-${name}-win.png` });
  await p.click("text=NEXT LEVEL"); await settle(p, 300); check((await save(p)).game.level === 2 && (await p.locator(".nt-level b").innerText()) === "2", `${name}: next level is level 2`);
  await p.waitForTimeout(300); await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector(".nt-nut"); check((await p.locator(".nt-level b").innerText()) === "2" && (await p.locator(".nt-card").count()) === 0, `${name}: progress is saved and the how-to does not come back`);
  await p.click(".nt-level"); check((await p.locator(".nt-lv:not(.locked)").count()) >= 2 && (await p.locator(".nt-lv.locked").count()) >= 1, `${name}: the level picker lists open and locked levels`); await p.click("text=CLOSE");
  await ctx.close();
  // ---- a heavy board (level 40: 12 colours, 14 bolts, 84 nuts with mystery nuts): fits, and stays smooth
  ctx = await mkCtx(w, h, 40); p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/40] pageerror ${e.message}`));
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".nt-nut"); await p.click("text=LET'S SORT").catch(() => {});
  g = (await save(p)).game; check(g.level === 40 && g.bolts.length === 14 && (await p.locator(".nt-nut").count()) === g.bolts.flat().length, `${name}: level 40 draws ${g.bolts.flat().length} nuts on 14 bolts`); check((await p.locator(".nt-nut[src]").count()) > 0, `${name}: nuts are images`);
  await fit("level 40"); if (["iphone-p", "tiny", "laptop"].includes(name)) await p.screenshot({ path: `${SHOTS}/nuts-${name}-l40.png` });
  const path40 = solve(plain(g), g.cap, 90000); check(!!path40, `${name}: level 40 is solvable (${path40?.length} moves)`);
  const s40 = await perf(p, async () => { for (const [a, b] of path40.slice(0, 8)) { await tapBolt(p, a); await tapBolt(p, b); await settle(p, 600); } });
  check((await save(p)).game.moves === 8, `${name}: 8 real moves played on the heavy board`); check(s40.max < 200 && s40.p95 < 70, `${name}: heavy board is smooth (${s40.frames} frames, p95 ${Math.round(s40.p95)}ms, worst ${Math.round(s40.max)}ms, longest task ${Math.round(s40.long)}ms)`);
  await p.click("[aria-label='Settings']"); await p.locator(".nt-panel input").check(); await settle(p, 200); const syms = await p.evaluate(() => [...document.querySelectorAll(".nt-nut")].length); check(syms > 0 && (await save(p)).settings.symbols === true, `${name}: the colour-blind symbols switch works`);
  if (name === "iphone-p") await p.screenshot({ path: `${SHOTS}/nuts-${name}-symbols.png` });
  await ctx.close();
}
await browser.close(); console.log(ok.join("\n")); if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); } console.log("\nNUTS E2E PASSED");
