// Browser check for Cat Grid. Usage: node scripts/catgrid-e2e.mjs [--url http://localhost:3100] [--shots dir]
import { chromium } from "playwright";
import { puzzleFor, newGame, smartHint, conflictCells } from "../arcade-server/catgrid/index.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100") + "/arcade/catgrid", SHOTS = arg("shots", "/tmp");
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const sizes = { "iphone-p": [390, 844], "iphone-l": [844, 390], "ipad-p": [820, 1180], "ipad-l": [1180, 820], laptop: [1366, 768], tiny: [320, 568] };
const cell = (p, r, c) => p.locator(`#cg-${r}-${c}`);
for (const [name, [w, h]] of Object.entries(sizes)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }), p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`)); p.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}] console ${m.text()}`); });
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".cg-board");
  const fit = async (label) => { const o = await p.evaluate(() => { const b = document.querySelector(".cg-board").getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight, bw: b.width, bh: b.height, bt: b.top, bb: b.bottom, bl: b.left, br: b.right }; }); check(o.sw <= o.w + 1 && o.sh <= o.h + 1, `${name} ${label}: page does not scroll`); check(o.bl >= 0 && o.br <= o.w + 1 && o.bt >= 0 && o.bb <= o.h + 1 && Math.abs(o.bw - o.bh) < 2, `${name} ${label}: board is square and fully on screen (${Math.round(o.bw)}px)`); return o; };
  await fit("level 1");
  const P = puzzleFor(1); check((await p.locator(".cg-cell").count()) === 25, `${name}: level 1 is a 5x5 board`);
  // a tap makes an X, a second tap a cat; a cat that touches another costs a fish
  await cell(p, 0, P.solution[0]).click(); check((await cell(p, 0, P.solution[0]).locator(".x").count()) === 1, `${name}: first tap marks an X`);
  await cell(p, 0, P.solution[0]).click(); check((await cell(p, 0, P.solution[0]).locator("img").count()) === 1, `${name}: second tap places a cat`);
  const near = P.solution[0] + 1 < 5 ? P.solution[0] + 1 : P.solution[0] - 1; await cell(p, 1, near).click(); await cell(p, 1, near).click();
  check((await p.locator(".cg-fish img.lost").count()) === 1, `${name}: a cat that touches another costs a fish`); check((await p.locator(".cg-cell.bad").count()) >= 1, `${name}: the conflicting cats are marked`);
  await p.click("text=UNDO"); await cell(p, 1, near).click(); await cell(p, 1, near).click(); await cell(p, 1, near).click();   // clear the bad cat
  // hint and helper
  await p.locator(".cg-pw", { hasText: "HINT" }).click(); check((await p.locator(".cg-say p").innerText()).length > 15, `${name}: a hint explains itself`); check((await p.locator(".cg-pw", { hasText: "HINT" }).locator("i").innerText()) === "2", `${name}: a hint uses one up`);
  if (name === "iphone-p" || name === "ipad-l") await p.screenshot({ path: `${SHOTS}/catgrid-${name}-hint.png` });
  // solve the level with the real solution
  for (let r = 0; r < 5; r++) { const c = P.solution[r]; for (let k = 0; k < 3; k++) { const mark = await cell(p, r, c).evaluate((e) => (e.querySelector("img") ? 2 : e.querySelector(".x") ? 1 : 0)); if (mark === 2) break; await cell(p, r, c).click(); } }
  await p.waitForSelector(".cg-modal"); check((await p.locator(".cg-card h2").innerText()).includes("LEVEL 1"), `${name}: solving shows the level-complete card`); if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/catgrid-${name}-win.png` });
  await p.click("text=NEXT LEVEL"); check((await p.locator(".cg-stat b").first().innerText()) === "2", `${name}: next level is level 2`);
  check((await p.locator(".cg-fish img.lost").count()) === 0, `${name}: the new level has all its fish`);
  await p.waitForTimeout(4600); await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector(".cg-board"); check((await p.locator(".cg-stat b").first().innerText()) === "2", `${name}: progress is saved`);
  await ctx.close();
  // a 9x9 board (level 30) must fit too, including the touch target size
  const c2 = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }); await c2.addInitScript(() => localStorage.setItem("catgrid:v1", JSON.stringify({ profile: { v: 1, level: 30, score: 12345, hints: 3, winks: 3, solved: 29, bestStreak: 0, streak: 0 }, game: null, secs: 0, settings: { auto: true, shapes: true } })));
  const q = await c2.newPage(); q.on("pageerror", (e) => errors.push(`[${name}/9x9] pageerror ${e.message}`)); await q.goto(BASE, { waitUntil: "networkidle" }); await q.waitForSelector(".cg-board");
  check((await q.locator(".cg-cell").count()) === 81, `${name}: level 30 is a 9x9 board`);
  const o = await q.evaluate(() => { const b = document.querySelector(".cg-board").getBoundingClientRect(); return { bw: b.width, bb: b.bottom, h: innerHeight, sw: document.documentElement.scrollWidth, w: innerWidth, sh: document.documentElement.scrollHeight }; });
  check(o.sw <= o.w + 1 && o.sh <= o.h + 1 && o.bb <= o.h + 1, `${name} 9x9: fits without scrolling (${Math.round(o.bw / 9)}px cells)`); check(o.bw / 9 >= 28, `${name} 9x9: cells are at least 28px`);
  if (["iphone-p", "iphone-l", "ipad-l", "tiny"].includes(name)) await q.screenshot({ path: `${SHOTS}/catgrid-${name}-9x9.png` });
  // keyboard: arrows move focus, X marks, C places a cat
  await q.locator("#cg-0-0").focus(); await q.keyboard.press("x"); check((await q.locator("#cg-0-0 .x").count()) === 1, `${name}: the X key marks`); await q.keyboard.press("ArrowRight"); await q.keyboard.press("c"); check((await q.locator("#cg-0-1 img").count()) === 1, `${name}: arrows move and the C key places a cat`);
  await c2.close();
}
await browser.close(); console.log(ok.join("\n")); if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); } console.log("\nCATGRID E2E PASSED");
