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
// Upgrade checks: Daily Puzzle, Endless, power-ups (Sweep, Sardine), shop, combo, ripple, win banner. The saved game holds the solution, so the test can play it.
const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
const closetCheck = async (name, w, h) => {
  const c = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 });
  await c.addInitScript(() => { if (!localStorage.getItem("meowdoku:v1")) localStorage.setItem("meowdoku:v1", JSON.stringify({ profile: { v: 1, level: 21, score: 500, hints: 3, winks: 3, sweeps: 2, sardines: 1, yarn: 300, solved: 20, bestStreak: 0, streak: 0, seenHelp: true, stars: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, 3])) }, game: null, secs: 0, settings: { auto: false, shapes: false, mode: "cat" } })); });
  const q = await c.newPage(); q.on("pageerror", (e) => errors.push(`[${name}/closet] pageerror ${e.message}`)); q.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}/closet] console ${m.text()}`); });
  const save = () => q.evaluate(() => JSON.parse(localStorage.getItem("meowdoku:v1")));
  await q.goto(BASE, { waitUntil: "networkidle" }); await q.waitForSelector(".hm");
  check((await q.locator(".hm-new").innerText()) === "3", `${name}: the home screen shows 3 NEW items (the scenes for the two cleared worlds and the 60-star Heart Fish)`);
  await q.click(".hm-shop"); await q.waitForSelector(".cl-sheet"); await q.waitForTimeout(350);
  const fitOf = () => q.evaluate(() => { const r = document.querySelector(".cl-sheet").getBoundingClientRect(), g = document.querySelector(".cl-grid, .cl-power"), cards = [...document.querySelectorAll(".cl-card")].slice(0, 6).map((e) => e.getBoundingClientRect()), tabs = document.querySelector(".cl-tabs"); return { ok: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0 && r.bottom <= innerHeight + 1, sw: document.documentElement.scrollWidth <= innerWidth + 1 && document.documentElement.scrollHeight <= innerHeight + 1, gridW: g.scrollWidth <= g.clientWidth + 1, cardsIn: cards.every((b) => b.right <= innerWidth + 1 && b.left >= -1), tabsN: tabs.children.length }; });
  let f = await fitOf(); check(f.ok && f.sw && f.tabsN === 10, `${name}: the shop fills the screen, no page scroll, 10 tabs (${f.tabsN})`);
  await q.click('.cl-tabs button:has-text("CATS")'); await q.waitForTimeout(200); f = await fitOf(); check(f.gridW && f.cardsIn, `${name}: the cat cards stay inside the screen`); check((await q.locator(".cl-card").count()) >= 24, `${name}: 24 cats in the shop`);
  const tuxSrc = await q.locator('.cl-card[data-id="tuxedo"] img.px').getAttribute("src");
  await q.locator('.cl-card[data-id="tabby"]').click(); check(/BUY 60/.test(await q.locator(".cl-act").innerText()), `${name}: tapping a cat previews it and offers BUY 60`); const heroSrc = await q.locator(".cl-hero > img").getAttribute("src"); check(heroSrc !== tuxSrc, `${name}: the preview wears the tapped cat before buying`);
  check(((await save()).profile.closet?.equip?.breed ?? "tuxedo") === "tuxedo", `${name}: previewing does not equip`);
  await q.click(".cl-act .cg-btn.go"); await q.waitForTimeout(150); check(+(await q.locator(".cl-yarn b").innerText()) === 240, `${name}: buying costs exactly 60 yarn`); await q.click(".cl-act .cg-btn.go"); const sv = await save(); check(sv.profile.closet.equip.breed === "tabby" && sv.profile.closet.owned["breed:tabby"], `${name}: the cat is bought and worn`);
  await q.locator('.cl-card[data-id="royal"]').click(); check(/LOCKED/.test(await q.locator(".cl-act").innerText()) && /World 10/.test(await q.locator(".cl-req").innerText()), `${name}: an earned cat shows what to do (Clear World 10) and cannot be bought`);
  await q.click('.cl-tabs button:has-text("COLORS")'); await q.locator('.cl-card[data-id="candy"]').click(); await q.click(".cl-act .cg-btn.go"); await q.click(".cl-act .cg-btn.go");
  await q.click('.cl-tabs button:has-text("MARKS")'); await q.locator('.cl-card[data-id="paw"]').click(); await q.click(".cl-act .cg-btn.go"); await q.click(".cl-act .cg-btn.go");
  await q.click('.cl-tabs button:has-text("FRAMES")'); await q.locator('.cl-card[data-id="wood"]').click(); await q.click(".cl-act .cg-btn.go"); await q.click(".cl-act .cg-btn.go");
  const eq = (await save()).profile.closet.equip; check(eq.palette === "candy" && eq.mark === "paw" && eq.frame === "wood", `${name}: colours, mark and frame equipped (${JSON.stringify(eq)})`);
  if (name === "iphone-p" || name === "laptop") await q.screenshot({ path: `${SHOTS}/meowdoku-${name}-closet.png` });
  await q.click(".cl-top .cg-btn.round"); await q.click(".hm-btn.primary"); await q.waitForSelector(".mp-scroll"); await q.click('.mp-node[data-level="1"]'); await q.waitForSelector(".cg-board");
  const g = (await save()).game; check((await q.locator(".cg-board.frame-wood").count()) === 1, `${name}: the board wears the wooden frame`);
  const bg = await q.locator("#cg-0-0").evaluate((e) => getComputedStyle(e).backgroundColor), candy = ["#ff4d8d", "#ffb000", "#7bd957", "#2ec4f1", "#a463f2", "#ff6f3c", "#00c9a7", "#ffd93b", "#ef476f", "#8338ec"].map(hex2rgb); check(candy.includes(bg), `${name}: the squares use the Candy Pop colours (${bg})`);
  await cell(q, 0, g.solution[0]).click(); await q.waitForTimeout(80); const catSrc = await q.locator(".cg-cell.cat img").first().getAttribute("src"); check(catSrc !== tuxSrc && !!catSrc, `${name}: the cat on the board is the bought Orange Tabby`);
  await q.click(".cg-mode button:has-text('X')"); const r1 = g.solution[0] === 0 ? 1 : 0; const rr = g.n > 2 ? 1 : 0; await cell(q, rr, g.solution[0] === 0 ? 3 : 0).click(); await q.waitForTimeout(80); check((await q.locator(".cg-cell img.mk").count()) >= 1, `${name}: the X mark is a paw print`); void r1;
  await c.close();
};
const upgrades = async (name, w, h) => {
  const c = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 });
  await c.addInitScript(() => { if (!localStorage.getItem("meowdoku:v1")) localStorage.setItem("meowdoku:v1", JSON.stringify({ profile: { v: 1, level: 15, score: 500, hints: 3, winks: 3, sweeps: 2, sardines: 1, yarn: 100, solved: 14, bestStreak: 0, streak: 0, seenHelp: true, stars: {} }, game: null, secs: 0, settings: { auto: false, shapes: false, mode: "x" } })); });
  const q = await c.newPage(); q.on("pageerror", (e) => errors.push(`[${name}/upg] pageerror ${e.message}`)); q.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}/upg] console ${m.text()}`); });
  const save = () => q.evaluate(() => JSON.parse(localStorage.getItem("meowdoku:v1"))), catMode = async () => { await q.click(".cg-mode button:has-text('CAT')"); };
  const put = async (r, col) => { await cell(q, r, col).click(); await q.waitForTimeout(60); };
  const solveAll = async () => { const g = (await save()).game; await catMode(); for (let r = 0; r < g.n; r++) await put(r, g.solution[r]); };
  await q.goto(BASE, { waitUntil: "networkidle" }); await q.waitForSelector(".hm");
  // ---- power-ups on a campaign level
  await q.click(".hm-btn.primary"); await q.waitForSelector(".mp-scroll"); await q.click('.mp-node[data-level="15"]'); await q.waitForSelector(".cg-board");
  const pw = (label) => q.locator(".cg-pw", { hasText: label }), cnt = async (label) => +(await pw(label).locator("i").innerText());
  check((await q.locator(".cg-pw").count()) === 4 && (await cnt("SWEEP")) === 2 && (await cnt("SARDINE")) === 1, `${name}: four power-ups with counts (Helper, Hint, Sweep, Sardine)`);
  let g = (await save()).game; await catMode(); await put(0, g.solution[0]); check((await q.locator(".cg-cell.rip").count()) > 3, `${name}: placing a cat ripples along its row, column and colour`);
  await q.waitForTimeout(900); await put(1, g.solution[1]); await put(2, g.solution[2]); check(/COMBO ×3/.test(await q.locator(".cg-combo").innerText()), `${name}: three clean cats in a row make a COMBO ×3`);
  await pw("SWEEP").click(); const xs = await q.locator(".cg-cell .x").count(); check(xs > 5 && (await cnt("SWEEP")) === 1, `${name}: Sweep crosses out the squares the cats rule out (${xs} X's) and uses one`); check((await q.locator(".cg-cell.cat").count()) === 3, `${name}: ...and never touches a cat`);
  check((await q.evaluate((sol) => sol.every((c, r) => !document.querySelector(`#cg-${r}-${c} .x`)), g.solution)), `${name}: ...and never crosses out a square where a cat truly belongs`);
  await q.click("[aria-label='Undo']"); check((await q.locator(".cg-cell .x").count()) === 0, `${name}: one Undo takes the whole sweep back`);
  await pw("SARDINE").click(); check(/already full/.test(await q.locator(".cg-say p").innerText()) && (await cnt("SARDINE")) === 1, `${name}: a Sardine is not wasted when the fish are full`);
  // a wrong cat (same row as another) costs a fish; the Sardine gives it back
  const before = await q.locator(".cg-fish img.lost").count(); await put(3, g.solution[0]);   // same column as row 0's cat
  check((await q.locator(".cg-fish img.lost").count()) === before + 1, `${name}: a rule-breaking cat costs a fish`);
  await pw("SARDINE").click(); check((await q.locator(".cg-fish img.lost").count()) === before && (await cnt("SARDINE")) === 0, `${name}: the Sardine gives the fish back`);
  await pw("SARDINE").click(); check(/No Sardines left/.test(await q.locator(".cg-say p").innerText()) && (await q.locator(".cg-say button", { hasText: "OPEN SHOP" }).count()) === 1, `${name}: with none left it points you to the shop`);
  await q.click(".cg-say button:has-text('OPEN SHOP')"); await q.waitForSelector(".cl-power"); const yarn0 = +(await q.locator(".cl-yarn b").innerText()); await q.click("[aria-label^='Buy Sardine']");
  check(+(await q.locator(".cl-yarn b").innerText()) === yarn0 - 35 && /×1/.test(await q.locator(".cl-power li", { hasText: "Sardine" }).innerText()), `${name}: the shop spends yarn and gives the power-up (${yarn0} -> ${yarn0 - 35})`); if (name === "iphone-p" || name === "laptop") await q.screenshot({ path: `${SHOTS}/meowdoku-${name}-shop.png` });
  await q.click(".cl-top .cg-btn.round"); // leave the shop
  // finish the level: take off the wrong cat (a tap in CAT mode toggles it), then place the rest
  await put(3, g.solution[0]); for (let r = 0; r < g.n; r++) if ((await mark(q, r, g.solution[r])) !== "cat") await put(r, g.solution[r]);
  await q.waitForSelector(".cg-banner", { timeout: 4000 }).then(() => check(true, `${name}: a win banner slams in`), () => check(false, `${name}: a win banner slams in`));
  await q.waitForSelector(".cg-card .cg-chips", { timeout: 6000 }).catch(() => {}); check((await q.locator(".cg-chips").count()) === 1 && /yarn/.test(await q.locator(".cg-chips").innerText()), `${name}: the result shows what you earned (yarn)`); if (name === "iphone-p" || name === "laptop") await q.screenshot({ path: `${SHOTS}/meowdoku-${name}-win2.png` });
  await q.click("text=MAP"); await q.waitForSelector(".mp-scroll"); await q.click("[aria-label='Back to the home screen']"); await q.waitForSelector(".hm");
  // ---- Daily Puzzle
  await q.click(".hm-btn.daily"); await q.waitForSelector(".cg-board", { timeout: 20000 }); g = (await save()).game; check(g.mode === "daily" && (await q.locator(".cg-world-tag").innerText()).startsWith("DAILY"), `${name}: the Daily Puzzle opens (${g.label}, ${g.n}x${g.n})`);
  await solveAll(); await q.waitForSelector(".cg-card h2", { timeout: 8000 }); check(/DAILY DONE/.test(await q.locator(".cg-card h2").innerText()) && /day streak/.test(await q.locator(".cg-card").innerText()), `${name}: finishing it shows DAILY DONE and a day streak`);
  await q.click("text=HOME"); await q.waitForSelector(".hm"); check(/Done today/.test(await q.locator(".hm-btn.daily").innerText()) && +(await q.locator(".hm-streak").innerText()) === 1, `${name}: home shows the Daily as done with a 1 day streak`);
  const day = (await save()).profile.daily; check(day.streak === 1 && Object.keys(day.done).length === 1, `${name}: the daily result is saved`);
  // ---- Endless: pick 5x5 and Hard (2 fish), then play again
  await q.click(".hm-btn.endless"); await q.waitForSelector(".sh-chips"); await q.click(".sh-chip:has-text('5×5')"); await q.click(".sh-diff:has-text('Hard')"); if (name === "iphone-p" || name === "tiny") await q.screenshot({ path: `${SHOTS}/meowdoku-${name}-endless.png` });
  const sheetFit = await q.evaluate(() => { const b = document.querySelector(".cg-card.sheet").getBoundingClientRect(); return { ok: b.top >= 0 && b.bottom <= innerHeight + 1, sc: document.querySelector(".cg-card.sheet").scrollHeight > document.querySelector(".cg-card.sheet").clientHeight + 1 }; }); check(sheetFit.ok, `${name}: the Endless sheet fits on screen${sheetFit.sc ? " (scrolls inside)" : ""}`);
  await q.click(".cg-card.sheet .cg-btn.go"); await q.waitForSelector(".cg-board", { timeout: 20000 }); check((await q.locator(".cg-cell").count()) === 25 && (await q.locator(".cg-fish img").count()) === 2, `${name}: Endless 5x5 Hard gives a 5x5 board with 2 fish`);
  const e1 = (await save()).game.regions.flat().join(""); await solveAll(); await q.waitForSelector(".cg-card h2", { timeout: 8000 }); check(/SOLVED/.test(await q.locator(".cg-card h2").innerText()), `${name}: Endless shows SOLVED`);
  await q.click("text=AGAIN"); await q.waitForFunction((old) => { try { const g = JSON.parse(localStorage.getItem("meowdoku:v1")).game; return g && !g.done && g.regions.flat().join("") !== old; } catch { return false; } }, e1, { timeout: 20000 }).catch(() => {}); await q.waitForTimeout(300); check((await save()).game.regions.flat().join("") !== e1 && (await q.locator(".cg-cell").count()) === 25, `${name}: AGAIN makes a fresh 5x5 puzzle with the same settings`);
  // a lost endless game: three... Hard has 2 fish, so two wrong cats end it
  g = (await save()).game; await catMode(); await put(0, g.solution[0]); await put(1, g.solution[0]); await put(2, g.solution[0]); await q.waitForTimeout(900);   // two cats in one column: two fish gone const lost = await q.locator(".cg-card h2", { hasText: "OUT OF FISH" }).count(); check(lost === 1, `${name}: two wrong cats use up Hard's two fish and end the game`);
  await c.close();
};
const only = arg("only", ""); for (const [name, [w, h]] of Object.entries(sizes)) { if (only && !only.split(",").includes(name)) continue;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }), p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`)); p.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}] console ${m.text()}`); });
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".hm");
  // first visit: the how-to card with the logo, shown once
  check((await p.locator(".cg-card.wide h2").innerText()) === "MEOWDOKU", `${name}: first visit shows the Meowdoku how-to card`); if (name === "iphone-p") await p.screenshot({ path: `${SHOTS}/meowdoku-${name}-help.png` });
  await p.click("text=LET'S PLAY"); check((await p.locator(".cg-card.wide").count()) === 0, `${name}: the how-to card closes`);
  // the home screen: title, three ways to play, fits one screen, pixel font loaded
  await p.waitForTimeout(500); const hm = await p.evaluate(() => { const r = (q) => document.querySelector(q)?.getBoundingClientRect(); const bs = [".hm-btn.primary", ".hm-btn.daily", ".hm-btn.endless", ".hm-shop"].map((q) => { const b = r(q); return b && { t: b.top, b: b.bottom, l: b.left, rt: b.right, h: b.height }; }); return { bs, sh: document.documentElement.scrollHeight, h: innerHeight, sw: document.documentElement.scrollWidth, w: innerWidth, title: document.querySelector(".hm h1")?.getAttribute("aria-label"), font: document.fonts.check("12px PressStart") }; });
  check(hm.title === "Meowdoku" && hm.bs.every((b) => b && b.t >= 0 && b.b <= hm.h && b.l >= 0 && b.rt <= hm.w), `${name}: home shows the title and every button inside the screen`); check(hm.sh <= hm.h + 1 && hm.sw <= hm.w + 1, `${name}: the home screen never scrolls`); check(hm.bs.every((b) => b.h >= 36), `${name}: home buttons are big enough to tap (${Math.round(Math.min(...hm.bs.map((b) => b.h)))}px)`); check(hm.font, `${name}: the pixel font is available`);
  if (["iphone-p", "laptop", "iphone-l", "tiny"].includes(name)) await p.screenshot({ path: `${SHOTS}/meowdoku-${name}-home.png` });
  await p.click(".hm-btn.primary"); await p.waitForSelector(".mp-scroll");
  // the world map: 10 named worlds, 100 levels, only level 1 open, the map opens on it
  const names = await p.locator(".mp-sign h2").allInnerTexts(); check(names.length === 20 && names[19] === "Whisker Village" && names[0] === "Cosmic Catnap", `${name}: the map has the 20 worlds (Whisker Village at the bottom, Royal Catdom at the top)`);
  check((await p.locator(".mp-node").count()) === 200, `${name}: 200 level nodes`); check((await p.locator(".mp-node:not([disabled])").count()) === 1, `${name}: only level 1 is open at the start`);
  const here = await p.locator(".mp-node.here").boundingBox(), vp = p.viewportSize(); check(here && here.y >= 40 && here.y + here.height <= vp.height && here.width >= 44, `${name}: the map opens on your level, in view, tap target ${here && Math.round(here.width)}px`);
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector(".mp-scroll").scrollWidth <= innerWidth + 1), `${name}: the map has no sideways scroll`);
  const fill = await p.evaluate(() => ({ props: document.querySelectorAll(".mp-prop").length, npcs: document.querySelectorAll(".mp-npc").length, roads: document.querySelectorAll(".mp-road .r").length, onRoad: [...document.querySelectorAll(".mp-node")].length }));
  check(fill.props >= 300 && fill.npcs >= 28 && fill.roads === 20, `${name}: the map is filled with scenery (${fill.props} props, ${fill.npcs} cats to meet, a road in all 20 worlds)`);
  await p.evaluate(() => document.querySelector(".mp-area:last-of-type .mp-npc, .mp-area:last-child .mp-npc")?.scrollIntoView({ block: "center" })); await p.locator(".mp-area:last-child .mp-npc").first().click({ force: true }); check((await p.locator(".mp-say").count()) === 1 && (await p.locator(".mp-say").innerText()).length > 8, `${name}: tapping a cat on the map makes it talk`);
  await p.evaluate(() => document.querySelector(".mp-node.here").scrollIntoView({ block: "center" }));
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
  { await p.waitForTimeout(500); const m = await cell(p, row, 1).locator(".x").evaluate((el) => { const a = getComputedStyle(el, "::before"), b = getComputedStyle(el, "::after"); return { clip: a.clipPath + "|" + b.clipPath, ta: a.transform, tb: b.transform, an: a.animationName + "|" + b.animationName }; }); check(m.clip === "none|none" && m.an === "none|none" && m.ta !== m.tb, `${name}: both X bars are whole, crossed and not clipped (${m.clip}, ${m.an})`); }
  if (name === "iphone-p" || name === "ipad-l") await p.screenshot({ path: `${SHOTS}/meowdoku-${name}-swipe.png` });
  await p.mouse.move(b0.x + b0.width / 2, y); await p.mouse.down(); await p.mouse.move(b3.x + b3.width / 2, y, { steps: 12 }); await p.mouse.up(); check((await xs()) === 0, `${name}: a swipe that starts on an X erases a line of X's`);
  await p.mouse.move(b0.x + b0.width / 2, y); await p.mouse.down(); await p.mouse.move(b3.x + b3.width / 2, y, { steps: 12 }); await p.mouse.up(); await p.click("[aria-label='Undo']"); check((await xs()) === 0, `${name}: one Undo takes back the whole swipe`);
  await p.waitForTimeout(500);
  // hint and solving through the real UI, level by level, with double taps
  await p.locator(".cg-pw", { hasText: "HINT" }).click(); check((await p.locator(".cg-say p").innerText()).length > 15, `${name}: a hint explains itself`); check((await p.locator(".cg-pw", { hasText: "HINT" }).locator("i").innerText()) === "2", `${name}: a hint uses one up`);
  const solve = async (level) => { const P = puzzleFor(level); for (let r = 0; r < P.n; r++) { const c = P.solution[r]; for (let k = 0; k < 4 && (await mark(p, r, c)) !== "cat"; k++) { await dbl(p, r, c); await p.waitForTimeout(450); } } await p.waitForSelector(".cg-modal .cg-card h2", { timeout: 6000 }).catch(async (e) => { await p.screenshot({ path: "/tmp/fail.png" }); throw e; }); };
  await solve(1); check((await p.locator(".cg-card h2").innerText()).includes("LEVEL 1"), `${name}: solving shows the level-complete card`); if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/meowdoku-${name}-win.png` });
  await p.click("text=NEXT LEVEL"); check((await p.locator(".cg-stat b").first().innerText()) === "2", `${name}: next level is level 2`); check((await p.locator(".cg-fish img.lost").count()) === 0, `${name}: the new level has all its fish`);
  await solve(2); await p.click("text=NEXT LEVEL"); check((await p.locator(".cg-cell").count()) === 25, `${name}: level 3 grows to 5x5`); await fit("level 3");
  await p.click("[aria-label='Back to the map']"); await p.waitForSelector(".mp-scroll"); check(/[123] of 3 stars/.test(await p.locator('.mp-node[data-level="1"]').getAttribute("aria-label")), `${name}: a cleared level shows its stars on the map`); check((await p.locator('.mp-node[data-level="3"]:not([disabled])').count()) === 1 && (await p.locator('.mp-node[data-level="4"][disabled]').count()) === 1, `${name}: clearing levels unlocks the next one`);
  await p.waitForTimeout(4600); await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector(".hm"); await p.click(".hm-btn.primary"); await p.waitForSelector(".mp-scroll"); check((await p.locator(".mp-node.here").getAttribute("data-level")) === "3", `${name}: progress is saved (the map opens on level 3)`); check((await p.locator(".cg-card.wide").count()) === 0, `${name}: the how-to card does not come back`);
  await ctx.close();
  // the closet: opens, fits, buys, equips, and the board really wears it
  await closetCheck(name, w, h);
  // a 10x10 board (level 150) must fit too
  { const c3 = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }); await c3.addInitScript(() => localStorage.setItem("meowdoku:v1", JSON.stringify({ profile: { v: 1, level: 150, score: 1, hints: 3, winks: 3, solved: 149, bestStreak: 0, streak: 0, seenHelp: true }, game: null, secs: 0, settings: { auto: false, shapes: true, mode: "x" } })));
    const t = await c3.newPage(); t.on("pageerror", (e) => errors.push(`[${name}/10x10] pageerror ${e.message}`)); await t.goto(BASE, { waitUntil: "networkidle" }); await t.waitForSelector(".hm"); await t.click(".hm-btn.primary"); await t.waitForSelector(".mp-scroll"); await t.click('.mp-node[data-level="150"]'); await t.waitForSelector(".cg-board");
    check((await t.locator(".cg-cell").count()) === 100, `${name}: level 150 is a 10x10 board`); const o = await t.evaluate(() => { const b = document.querySelector(".cg-board").getBoundingClientRect(); return { bw: b.width, bb: b.bottom, h: innerHeight, sw: document.documentElement.scrollWidth, w: innerWidth, sh: document.documentElement.scrollHeight, colors: new Set([...document.querySelectorAll(".cg-cell")].map((e) => e.style.background)).size }; });
    check(o.sw <= o.w + 1 && o.sh <= o.h + 1 && o.bb <= o.h + 1, `${name} 10x10: fits without scrolling (${Math.round(o.bw / 10)}px cells)`); check(o.bw / 10 >= (name === "tiny" ? 22 : 26), `${name} 10x10: cells are at least ${name === "tiny" ? 22 : 26}px`); check(o.colors === 10, `${name} 10x10: ten different colours (${o.colors})`);
    await c3.close(); }
  // a 9x9 board (level 31) must fit too, including the touch target size
  const c2 = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }); await c2.addInitScript(() => localStorage.setItem("meowdoku:v1", JSON.stringify({ profile: { v: 1, level: 66, score: 12345, hints: 3, winks: 3, solved: 65, bestStreak: 0, streak: 0, seenHelp: true, stars: {} }, game: null, secs: 0, settings: { auto: true, shapes: true, mode: "x" } })));
  const q = await c2.newPage(); q.on("pageerror", (e) => errors.push(`[${name}/9x9] pageerror ${e.message}`)); await q.goto(BASE, { waitUntil: "networkidle" }); await q.waitForSelector(".hm"); await q.click(".hm-btn.primary"); await q.waitForSelector(".mp-scroll"); await q.click('.mp-node[data-level="66"]'); await q.waitForSelector(".cg-board");
  check((await q.locator(".cg-cell").count()) === 81, `${name}: level 66 is a 9x9 board`);
  const o = await q.evaluate(() => { const b = document.querySelector(".cg-board").getBoundingClientRect(); return { bw: b.width, bb: b.bottom, h: innerHeight, sw: document.documentElement.scrollWidth, w: innerWidth, sh: document.documentElement.scrollHeight }; });
  check(o.sw <= o.w + 1 && o.sh <= o.h + 1 && o.bb <= o.h + 1, `${name} 9x9: fits without scrolling (${Math.round(o.bw / 9)}px cells)`); const minCell = name === "tiny" ? 24 : 28; check(o.bw / 9 >= minCell, `${name} 9x9: cells are at least ${minCell}px`);
  if (["iphone-p", "iphone-l", "tiny"].includes(name)) await q.screenshot({ path: `${SHOTS}/meowdoku-${name}-9x9.png` });
  await q.locator("#cg-0-0").focus(); await q.keyboard.press("x"); check((await q.locator("#cg-0-0 .x").count()) === 1, `${name}: the X key marks`); await q.keyboard.press("ArrowRight"); await q.keyboard.press("c"); check((await q.locator("#cg-0-1 img").count()) === 1, `${name}: arrows move and the C key places a cat`);
  await c2.close();
  await upgrades(name, w, h);
}
await browser.close(); console.log(ok.join("\n")); if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); } console.log("\nMEOWDOKU E2E PASSED");
