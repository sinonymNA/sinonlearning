// Browser check for Meowdoku. Usage: node scripts/meowdoku-e2e.mjs [--url http://localhost:3100] [--shots dir]
import { chromium } from "playwright";
import { puzzleFor } from "../arcade-server/meowdoku/index.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100") + "/arcade/meowdoku", SHOTS = arg("shots", "/tmp");
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const sizes = { "iphone-p": [390, 844], "iphone-l": [844, 390], "ipad-p": [820, 1180], "ipad-l": [1180, 820], laptop: [1366, 768], tiny: [320, 568] };
const cell = (p, r, c) => p.locator(`#cg-${r}-${c}`);
const mark = (p, r, c) => cell(p, r, c).evaluate((e) => (e.querySelector("img") ? "cat" : e.querySelector(".x") ? "x" : "empty"));
const dbl = async (p, r, c) => { const b = await cell(p, r, c).boundingBox(); await p.mouse.dblclick(b.x + b.width / 2, b.y + b.height / 2, { delay: 40 }); };   // two real taps, ~40ms apart
const seed = (level) => () => localStorage.setItem("meowdoku:v1", JSON.stringify({ profile: { v: 1, level: window.__L, score: 12345, hints: 3, winks: 3, solved: 0, bestStreak: 0, streak: 0, seenHelp: true }, game: null, secs: 0, settings: { auto: true, shapes: true, mode: "x" } }));
const only = arg("only", ""); for (const [name, [w, h]] of Object.entries(sizes)) { if (only && !only.split(",").includes(name)) continue;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }), p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`)); p.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}] console ${m.text()}`); });
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".mp-scroll");
  // first visit: the how-to card with the logo, shown once
  check((await p.locator(".cg-card.wide h2").innerText()) === "MEOWDOKU", `${name}: first visit shows the Meowdoku how-to card`); if (name === "iphone-p") await p.screenshot({ path: `${SHOTS}/meowdoku-${name}-help.png` });
  await p.click("text=PLAY ▶"); check((await p.locator(".cg-card.wide").count()) === 0, `${name}: the how-to card closes`);
  // the world map: 10 named worlds, 100 levels, only level 1 open, the map opens on it
  const names = await p.locator(".mp-sign h2").allInnerTexts(); check(names.length === 10 && names[9] === "Whisker Village" && names[0] === "The Royal Catdom", `${name}: the map has the 10 worlds (Whisker Village at the bottom, Royal Catdom at the top)`);
  check((await p.locator(".mp-node").count()) === 100, `${name}: 100 level nodes`); check((await p.locator(".mp-node:not([disabled])").count()) === 1, `${name}: only level 1 is open at the start`);
  const here = await p.locator(".mp-node.here").boundingBox(), vp = p.viewportSize(); check(here && here.y >= 40 && here.y + here.height <= vp.height && here.width >= 44, `${name}: the map opens on your level, in view, tap target ${here && Math.round(here.width)}px`);
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector(".mp-scroll").scrollWidth <= innerWidth + 1), `${name}: the map has no sideways scroll`);
  if (name === "iphone-p" || name === "laptop") { await p.screenshot({ path: `${SHOTS}/meowdoku-${name}-map.png` }); }
  if (name === "iphone-p") for (const [k, label] of [[9, "royal"], [6, "sardine"], [3, "catnip"], [4, "bakery"], [7, "peaks"], [8, "rooftops"], [5, "canyon"], [2, "milkshake"], [1, "yarn"]]) { await p.evaluate((i) => document.querySelectorAll(".mp-area")[9 - i].scrollIntoView({ block: "center" }), k); await p.waitForTimeout(150); await p.screenshot({ path: `${SHOTS}/meowdoku-world-${label}.png` }); }
  await p.evaluate(() => document.querySelector(".mp-node.here").scrollIntoView({ block: "center" }));
  await p.click('.mp-node[data-level="1"]'); await p.waitForSelector(".cg-board");
  const fit = async (label) => { const o = await p.evaluate(() => { const b = document.querySelector(".cg-board").getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight, bw: b.width, bh: b.height, bt: b.top, bb: b.bottom, bl: b.left, br: b.right }; }); check(o.sw <= o.w + 1 && o.sh <= o.h + 1, `${name} ${label}: page does not scroll`); check(o.bl >= 0 && o.br <= o.w + 1 && o.bt >= 0 && o.bb <= o.h + 1 && Math.abs(o.bw - o.bh) < 2, `${name} ${label}: board is square and fully on screen (${Math.round(o.bw)}px)`); };
  await fit("level 1"); const P1 = puzzleFor(1); check((await p.locator(".cg-cell").count()) === 16, `${name}: level 1 is a gentle 4x4 board`);
  // the free coach on level 1
  check(/^Start here!/.test(await p.locator(".cg-say p").innerText()), `${name}: level 1 opens with a free "Start here" tip`); check((await p.locator(".cg-cell.hint").count()) >= 1, `${name}: the tip highlights a square`); if (name === "iphone-p" || name === "ipad-l") await p.screenshot({ path: `${SHOTS}/meowdoku-${name}-coach.png` });
  // gestures: tap = X (and again = off); DOUBLE tap = cat from empty, from an X, and a double tap on a cat takes it off
  const [r0, c0] = [0, P1.solution[0]];
  await cell(p, r0, c0).click(); check((await mark(p, r0, c0)) === "x", `${name}: one tap makes an X`); await p.waitForTimeout(500); await cell(p, r0, c0).click(); check((await mark(p, r0, c0)) === "empty", `${name}: tapping an X takes it off`); await p.waitForTimeout(500);
  await dbl(p, r0, c0); check((await mark(p, r0, c0)) === "cat", `${name}: double-tap on an empty square puts a cat`); await p.waitForTimeout(500); await dbl(p, r0, c0); check((await mark(p, r0, c0)) === "empty", `${name}: double-tap on a cat takes it off`); await p.waitForTimeout(500);
  await cell(p, r0, c0).click(); await p.waitForTimeout(500); await dbl(p, r0, c0); check((await mark(p, r0, c0)) === "cat", `${name}: double-tap on a square that already has an X STILL puts a cat (the old bug)`);
  const r1 = 1, near = P1.solution[0] + 1 < 4 ? P1.solution[0] + 1 : P1.solution[0] - 1; await p.waitForTimeout(500);
  await p.click(".cg-mode button:has-text('CAT')"); await cell(p, r1, near).click(); check((await mark(p, r1, near)) === "cat", `${name}: with the TAP switch on CAT, one tap puts a cat`); check((await p.locator(".cg-fish img.lost").count()) === 1, `${name}: a cat that touches another costs a fish`);
  await p.waitForTimeout(500); await dbl(p, r1, near); check((await mark(p, r1, near)) === "x", `${name}: double-tapping a cat (cat mode) turns it into an X`); check((await p.locator(".cg-fish img.lost").count()) === 1, `${name}: ...and does not refund a fish lost earlier`);
  // one fast double-tap on an X square while in cat mode: the first tap would place a wrong cat (a fish), the second cancels it and refunds that fish
  await p.waitForTimeout(500); await dbl(p, r1, near); check((await p.locator(".cg-fish img.lost").count()) === 1, `${name}: a fast double-tap refunds the fish its first tap cost (still 1 lost)`); check((await mark(p, r1, near)) !== "cat", `${name}: ...and leaves no wrong cat behind`);
  await p.click(".cg-mode button:has-text('X')"); await p.waitForTimeout(500);
  // swipe: hold and drag across empty squares to draw a line of X's; start on an X and drag to erase them; one Undo takes back the whole swipe
  const row = 3, box = async (c) => (await cell(p, row, c).boundingBox()), b0 = await box(0), b3 = await box(3), y = b0.y + b0.height / 2;
  await p.mouse.move(b0.x + b0.width / 2, y); await p.mouse.down(); await p.mouse.move(b3.x + b3.width / 2, y, { steps: 12 }); await p.mouse.up();
  const xs = async () => { let n = 0; for (let c = 0; c < 4; c++) if ((await mark(p, row, c)) === "x") n++; return n; };
  check((await xs()) >= 3, `${name}: one swipe draws a line of X's (${await xs()} of 4 squares)`);
  const xShape = await cell(p, row, 1).locator(".x").evaluate((el) => { const cs = getComputedStyle(el, "::before"), w = parseFloat(cs.width), h = parseFloat(cs.height), [ox, oy] = cs.transformOrigin.split(" ").map(parseFloat); return { w, h, ox, oy }; });
  check(Math.abs(xShape.ox - xShape.w / 2) < 1.5 && Math.abs(xShape.oy - xShape.h / 2) < 1.5, `${name}: the X bars turn around their centre, so they really are X's (origin ${Math.round(xShape.ox)},${Math.round(xShape.oy)} of ${Math.round(xShape.w)}x${Math.round(xShape.h)})`);
  if (name === "iphone-p" || name === "ipad-l") await p.screenshot({ path: `${SHOTS}/meowdoku-${name}-swipe.png` });
  await p.mouse.move(b0.x + b0.width / 2, y); await p.mouse.down(); await p.mouse.move(b3.x + b3.width / 2, y, { steps: 12 }); await p.mouse.up(); check((await xs()) === 0, `${name}: a swipe that starts on an X erases a line of X's`);
  await p.mouse.move(b0.x + b0.width / 2, y); await p.mouse.down(); await p.mouse.move(b3.x + b3.width / 2, y, { steps: 12 }); await p.mouse.up(); await p.click("text=UNDO"); check((await xs()) === 0, `${name}: one Undo takes back the whole swipe`);
  await p.waitForTimeout(500);
  // hint and solving through the real UI, level by level, with double taps
  await p.locator(".cg-pw", { hasText: "HINT" }).click(); check((await p.locator(".cg-say p").innerText()).length > 15, `${name}: a hint explains itself`); check((await p.locator(".cg-pw", { hasText: "HINT" }).locator("i").innerText()) === "2", `${name}: a hint uses one up`);
  const solve = async (level) => { const P = puzzleFor(level); for (let r = 0; r < P.n; r++) { const c = P.solution[r]; for (let k = 0; k < 4 && (await mark(p, r, c)) !== "cat"; k++) { await dbl(p, r, c); await p.waitForTimeout(450); } } await p.waitForSelector(".cg-modal .cg-card h2", { timeout: 6000 }); };
  await solve(1); check((await p.locator(".cg-card h2").innerText()).includes("LEVEL 1"), `${name}: solving shows the level-complete card`); if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/meowdoku-${name}-win.png` });
  await p.click("text=NEXT LEVEL"); check((await p.locator(".cg-stat b").first().innerText()) === "2", `${name}: next level is level 2`); check((await p.locator(".cg-fish img.lost").count()) === 0, `${name}: the new level has all its fish`);
  await solve(2); await p.click("text=NEXT LEVEL"); check((await p.locator(".cg-cell").count()) === 25, `${name}: level 3 grows to 5x5`); await fit("level 3");
  await p.click("[aria-label='Back to the map']"); await p.waitForSelector(".mp-scroll"); check(/[123] of 3 stars/.test(await p.locator('.mp-node[data-level="1"]').getAttribute("aria-label")), `${name}: a cleared level shows its stars on the map`); check((await p.locator('.mp-node[data-level="3"]:not([disabled])').count()) === 1 && (await p.locator('.mp-node[data-level="4"][disabled]').count()) === 1, `${name}: clearing levels unlocks the next one`);
  await p.waitForTimeout(4600); await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector(".mp-scroll"); check((await p.locator(".mp-node.here").getAttribute("data-level")) === "3", `${name}: progress is saved (the map opens on level 3)`); check((await p.locator(".cg-card.wide").count()) === 0, `${name}: the how-to card does not come back`);
  await ctx.close();
  // a 9x9 board (level 31) must fit too, including the touch target size
  const c2 = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }); await c2.addInitScript(() => localStorage.setItem("meowdoku:v1", JSON.stringify({ profile: { v: 1, level: 66, score: 12345, hints: 3, winks: 3, solved: 65, bestStreak: 0, streak: 0, seenHelp: true, stars: {} }, game: null, secs: 0, settings: { auto: true, shapes: true, mode: "x" } })));
  const q = await c2.newPage(); q.on("pageerror", (e) => errors.push(`[${name}/9x9] pageerror ${e.message}`)); await q.goto(BASE, { waitUntil: "networkidle" }); await q.waitForSelector(".mp-scroll"); await q.click('.mp-node[data-level="66"]'); await q.waitForSelector(".cg-board");
  check((await q.locator(".cg-cell").count()) === 81, `${name}: level 66 is a 9x9 board`);
  const o = await q.evaluate(() => { const b = document.querySelector(".cg-board").getBoundingClientRect(); return { bw: b.width, bb: b.bottom, h: innerHeight, sw: document.documentElement.scrollWidth, w: innerWidth, sh: document.documentElement.scrollHeight }; });
  check(o.sw <= o.w + 1 && o.sh <= o.h + 1 && o.bb <= o.h + 1, `${name} 9x9: fits without scrolling (${Math.round(o.bw / 9)}px cells)`); const minCell = name === "tiny" ? 24 : 28; check(o.bw / 9 >= minCell, `${name} 9x9: cells are at least ${minCell}px`);
  if (["iphone-p", "iphone-l", "tiny"].includes(name)) await q.screenshot({ path: `${SHOTS}/meowdoku-${name}-9x9.png` });
  await q.locator("#cg-0-0").focus(); await q.keyboard.press("x"); check((await q.locator("#cg-0-0 .x").count()) === 1, `${name}: the X key marks`); await q.keyboard.press("ArrowRight"); await q.keyboard.press("c"); check((await q.locator("#cg-0-1 img").count()) === 1, `${name}: arrows move and the C key places a cat`);
  await c2.close();
}
await browser.close(); console.log(ok.join("\n")); if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); } console.log("\nMEOWDOKU E2E PASSED");
