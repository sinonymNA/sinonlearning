// Browser check for Shelf Stocker. Usage: node scripts/shelf-e2e.mjs [--url http://localhost:3100] [--shots dir] [--only iphone-p,laptop]
// Plays real levels from all three departments through the UI (the saved game holds the board, the engine's solver finds the moves), checks the rules and their messages,
// the layout at every screen size, and measures frame times and long tasks while items fly: the "smooth and not laggy" check.
import { chromium } from "playwright";
import { solveState, whyNot } from "../arcade-server/shelf/index.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100") + "/arcade/shelf", SHOTS = arg("shots", "/tmp");
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const sizes = { "iphone-p": [390, 844], "iphone-l": [844, 390], "ipad-p": [820, 1180], "ipad-l": [1180, 820], laptop: [1366, 768], tiny: [320, 568] };
const only = arg("only", "");
const mkCtx = async (w, h, level, seen = true) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 });
  await ctx.addInitScript(([L, S]) => { if (!localStorage.getItem("shelfstocker:v1") && L) localStorage.setItem("shelfstocker:v1", JSON.stringify({ profile: { v: 1, level: L, solved: L - 1, hints: 3, carts: 2, coins: 300, stars: {}, best: {}, seen: S ? Object.fromEntries(Array.from({ length: 9 }, (_, i) => [i, true])) : {} }, game: null, settings: {} })); }, [level, seen]);
  return ctx;
};
const save = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("shelfstocker:v1")));
const hit = (p, b) => p.locator(".sh-hit").nth(b);
const tap = async (p, b) => { const r = await hit(p, b).boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + r.height * 0.65); };
const solveGame = (g) => solveState(g, 120000);   // the engine's own solver reads the saved game (rules, wrapped items, toy sizes, jar moves)
const settle = (p, ms = 760) => p.waitForTimeout(ms);
const enter = async (p) => { await p.waitForSelector(".sh-home"); await p.click(".sh-play"); await p.waitForSelector(".sh-stage .sh-item"); };
const perf = async (p, fn) => {
  await p.evaluate(() => { window.__gaps = []; window.__long = []; let last = performance.now(); window.__raf = true; const tick = (t) => { window.__gaps.push(t - last); last = t; if (window.__raf) requestAnimationFrame(tick); }; requestAnimationFrame(tick); try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.duration))).observe({ entryTypes: ["longtask"] }); } catch { /* not supported */ } });
  await fn(); await p.evaluate(() => { window.__raf = false; });
  return p.evaluate(() => { const g = window.__gaps.slice(2).sort((a, b) => a - b); return { frames: g.length, p95: g[Math.floor(g.length * 0.95)] || 0, max: g[g.length - 1] || 0, long: Math.max(0, ...window.__long) }; });
};
const fit = async (p, name, label) => {
  const o = await p.evaluate(() => { const st = document.querySelector(".sh-stage").getBoundingClientRect(), it = [...document.querySelectorAll(".sh-item")].map((e) => e.getBoundingClientRect()), hits = [...document.querySelectorAll(".sh-hit")].map((e) => e.getBoundingClientRect()), tags = [...document.querySelectorAll(".sh-tag")].map((e) => e.getBoundingClientRect());
    return { sh: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, w: innerWidth, h: innerHeight, itemW: it[0]?.width || 0, itemsIn: it.every((r) => r.left >= -1 && r.right <= innerWidth + 1 && r.top >= st.top - 2 && r.bottom <= innerHeight + 1), hitsIn: hits.every((r) => r.left >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1), tagsIn: tags.every((r) => r.left >= -1 && r.right <= innerWidth + 1 && r.top >= st.top - 1) }; });
  check(o.sh <= o.h + 1 && o.sw <= o.w + 1, `${name} ${label}: the page never scrolls`); check(o.itemsIn && o.hitsIn && o.tagsIn, `${name} ${label}: every item, sign and shelf is on screen (items ${Math.round(o.itemW)}px wide)`); check(o.itemW >= 26, `${name} ${label}: items are big enough to see`); return o;
};
/** Play a whole level by following the solver through real taps; returns the frame stats. */
const play = async (p, name, label) => {
  const g = (await save(p)).game, path = solveGame(g); check(!!path, `${name} ${label}: the solver finds ${path?.length} moves`); if (!path) return null;
  const stats = await perf(p, async () => { for (const [a, b] of path) { await tap(p, a); await tap(p, b); await settle(p, 720); } });
  await p.waitForSelector(".sh-card h2", { timeout: 8000 }); check(/STOCKED|DELIVERY DONE/.test(await p.locator(".sh-card h2").innerText()), `${name} ${label}: solving shows the level-complete card`);
  check(stats.max < 180 && stats.p95 < 60, `${name} ${label}: smooth while moving (${stats.frames} frames, p95 ${Math.round(stats.p95)}ms, worst ${Math.round(stats.max)}ms, longest task ${Math.round(stats.long)}ms)`); return stats;
};

for (const [name, [w, h]] of Object.entries(sizes)) {
  if (only && !only.split(",").includes(name)) continue;
  // ---- Clothing Corner (level 1), first visit
  let ctx = await mkCtx(w, h, 0, false), p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`)); p.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}] console ${m.text()}`); });
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".sh-home"); await p.waitForTimeout(600);
  // the home screen: sign, tappable display stack, PLAY, department progress; fits one screen
  const hm = await p.evaluate(() => { const r = (q) => document.querySelector(q)?.getBoundingClientRect(); const bs = [".sh-play", ".sh-three .sh-btn"].filter((q) => document.querySelector(q)?.offsetParent !== null).map((q) => { const b = r(q); return b && { t: b.top, b: b.bottom, l: b.left, rt: b.right, h: b.height }; }); return { bs, sh: document.documentElement.scrollHeight, h: innerHeight, sw: document.documentElement.scrollWidth, w: innerWidth, title: document.querySelector(".sh-sign h1")?.textContent, depts: document.querySelectorAll(".sh-dept").length, scene: document.querySelectorAll(".sc").length, motes: document.querySelectorAll(".sc-motes i").length }; });
  check(/SHELF\s*STOCKER/.test(hm.title || "") && hm.bs.every((b) => b && b.t >= 0 && b.b <= hm.h && b.l >= 0 && b.rt <= hm.w), `${name}: home shows the sign, PLAY, LEVELS and the departments inside the screen`); check(hm.sh <= hm.h + 1 && hm.sw <= hm.w + 1, `${name}: the home screen never scrolls`); check(hm.bs.every((b) => b.h >= 36), `${name}: home buttons are big enough to tap`);
  check(hm.depts === 9 && hm.scene === 1 && hm.motes >= 8, `${name}: home has 9 department cards and an animated shop scene behind it`);
  if (w >= 800 || h >= 700) { const hopped = await p.evaluate(async () => { const img = document.querySelector(".sh-dstack img"); if (!img || img.offsetParent === null) return "hidden"; img.click(); await new Promise((r) => setTimeout(r, 80)); return [...document.querySelectorAll(".sh-dstack img")].some((e) => e.getAnimations().length > 0); }); check(hopped === true || hopped === "hidden", `${name}: tapping the display stack makes an item hop`); }
  if (["iphone-p", "laptop", "iphone-l", "tiny"].includes(name)) await p.screenshot({ path: `${SHOTS}/shelf-${name}-home.png` });
  await p.click(".sh-play"); await p.waitForSelector(".sh-stage .sh-item");
  check((await p.locator(".sh-card h2").innerText()) === "CLOTHING CORNER", `${name}: PLAY on a first visit shows the Clothing Corner how-to card`); if (name === "iphone-p") await p.screenshot({ path: `${SHOTS}/shelf-${name}-intro.png` });
  await p.click("text=START STOCKING"); check((await p.locator(".sh-card").count()) === 0, `${name}: the card closes`); await p.waitForTimeout(900);
  await fit(p, name, "level 1");
  check((await p.locator(".sh-coachtip").count()) === 1 && (await p.locator(".sh-hand").count()) === 1, `${name}: level 1 shows a guided first move (a hand and one line of advice)`); if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-coach.png` });
  let g = (await save(p)).game; check(g.level === 1 && g.bays.length === 5 && g.bays.flatMap((b) => b.items).length === 12, `${name}: level 1 is 3 colours of shirts on 5 shelves`);
  const filled = g.bays.map((b, i) => (b.items.length ? i : -1)).filter((i) => i >= 0), emp = g.bays.map((b, i) => (b.items.length ? -1 : i)).filter((i) => i >= 0);
  await tap(p, filled[0]); check((await p.locator(".sh-bay.sel").count()) === 1 && (await p.locator(".sh-item.lifted").count()) >= 1, `${name}: tapping a shelf lifts its top items`);
  await tap(p, filled[0]); check((await p.locator(".sh-bay.sel").count()) === 0 && (await p.locator(".sh-item.lifted").count()) === 0, `${name}: tapping it again puts them back`);
  const A = filled.find((a) => filled.some((b) => b !== a && whyNot(g, a, b))), Bv = filled.find((b) => b !== A && whyNot(g, A, b));
  await tap(p, A); await tap(p, Bv); await settle(p, 300); g = (await save(p)).game; check(g.moves === 0 && /full|match/.test(await p.locator(".sh-msg").innerText()), `${name}: an illegal drop is refused and says why ("${(await p.locator(".sh-msg").innerText()).trim()}")`);
  await tap(p, A); if ((await p.locator(".sh-bay.sel").count()) === 0) await tap(p, A); await tap(p, emp[0]); await settle(p, 900); g = (await save(p)).game; check(g.moves === 1 && g.bays[emp[0]].items.length >= 1, `${name}: a legal drop onto an empty shelf moves the shirts`); check((await p.locator(".sh-coachtip").count()) === 0 && (await save(p)).profile.coached[1] === true, `${name}: the guide goes away after the first move`);
  check(await p.locator("[aria-label='Undo the last move']").isEnabled(), `${name}: undo is available after a move`); await p.click("[aria-label='Undo the last move']"); await settle(p, 700); g = (await save(p)).game; check(g.moves === 0 && g.bays[emp[0]].items.length === 0, `${name}: undo puts the shirts back`);
  await p.click("[aria-label^='Hint']"); check((await p.locator(".sh-bay.hint").count()) === 2 && (await save(p)).profile.hints === 2, `${name}: a hint highlights the two shelves and uses one hint`);
  await p.click("[aria-label^='Add a cart']"); check((await p.locator(".sh-hit").count()) === 6 && (await p.locator(".sh-tag", { hasText: "CART" }).count()) === 1, `${name}: add a cart gives a sixth shelf marked CART`); await fit(p, name, "with a cart");
  await p.click("[aria-label^='Add a cart']"); await p.click("[aria-label^='Add a cart']"); check((await p.locator(".sh-hit").count()) === 7 && /2 extra carts/.test(await p.locator(".sh-msg").innerText()), `${name}: only 2 extra carts per level`);
  if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-l1.png` });
  await p.click("[aria-label='Restart this level']"); await settle(p, 900);
  // home <-> game: a game in progress shows CONTINUE
  g = (await save(p)).game; { const pp = solveGame(g); await tap(p, pp[0][0]); await tap(p, pp[0][1]); await settle(p, 800); } await p.click("[aria-label='Back to the home screen']"); await p.waitForSelector(".sh-home");
  check(/CONTINUE/.test(await p.locator(".sh-play").innerText()) && /1 moves/.test(await p.locator(".sh-play").innerText()), `${name}: after a move the home screen offers CONTINUE`); await p.click(".sh-play"); await p.waitForSelector(".sh-stage .sh-item"); check((await save(p)).game.moves === 1, `${name}: CONTINUE keeps the game as it was`);
  await p.click("[aria-label='Restart this level']"); await settle(p, 900);
  // mid-flight frame: the arc shows the item in the air
  g = (await save(p)).game; const path = solveGame(g); const [a0, b0] = path[0]; await tap(p, a0); await tap(p, b0); await p.waitForTimeout(240);
  const air = await p.evaluate(() => { const st = document.querySelector(".sh-stage").getBoundingClientRect(), its = [...document.querySelectorAll(".sh-item")]; return its.some((e) => { const m = /rotate\(([-\d.]+)deg\)/.exec(e.style.transform) || [0, 0]; return false || e.getAnimations().length > 0; }); });
  check(air, `${name}: a move runs a Web Animation (the arc)`); if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-fly.png` }); await settle(p, 700);
  await p.click("[aria-label='Restart this level']"); await settle(p, 900);
  await play(p, name, "level 1");
  if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-win.png` });
  await p.click("text=NEXT LEVEL"); await settle(p, 400); check((await save(p)).game.level === 2 && /LEVEL 2/.test(await p.locator(".sh-level b").innerText()), `${name}: next level is level 2`);
  await p.waitForTimeout(300); await p.reload({ waitUntil: "networkidle" }); await enter(p); check(/LEVEL 2/.test(await p.locator(".sh-level b").innerText()) && (await p.locator(".sh-card").count()) === 0, `${name}: progress is saved and the how-to does not come back`);
  await p.click(".sh-level"); check((await p.locator(".sh-card h3").allInnerTexts()).join("|") === "Clothing Corner|Book Nook|Boutique|Toy Aisle|Pantry|Shoe Wall|Gift Corner|Customer Orders|Mixed Day" && (await p.locator(".sh-lv.locked").count()) >= 1, `${name}: the level picker groups levels by department`); await p.click("text=CLOSE");
  await ctx.close();

  // ---- Book Nook (level 11): signs, labelled shelves, a cart
  ctx = await mkCtx(w, h, 11, false); p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/11] pageerror ${e.message}`));
  await p.goto(BASE, { waitUntil: "networkidle" }); await enter(p); check((await p.locator(".sh-card h2").innerText()) === "BOOK NOOK", `${name}: Book Nook shows its own how-to card`); await p.click("text=START STOCKING"); await p.waitForTimeout(900);
  await fit(p, name, "Book Nook"); g = (await save(p)).game;
  const signs = await p.locator(".sh-tag span").allInnerTexts(); check(signs.filter((t) => /^(SCIENCE|HISTORY|FICTION|MATH|ART|MUSIC|NATURE|SPACE)$/.test(t)).length === g.keys.length && signs.includes("CART"), `${name}: every labelled shelf has a subject sign and there is a CART (${signs.join(", ")})`);
  // a book that does not belong on a labelled shelf is refused with the subject named
  let tried = false; for (let a = 0; a < g.bays.length && !tried; a++) for (let b = 0; b < g.bays.length && !tried; b++) { const w2 = whyNot(g, a, b); if (w2 && /is for/.test(w2)) { await tap(p, a); await tap(p, b); await settle(p, 300); check(/is for .* books/.test(await p.locator(".sh-msg").innerText()), `${name}: a wrong subject is refused: "${(await p.locator(".sh-msg").innerText()).trim()}"`); tried = true; } }
  check(tried, `${name}: found a wrong-subject move to try`);
  { await p.click("[aria-label='Restart this level']"); await settle(p, 900); const gg = (await save(p)).game, mv = solveGame(gg)[0]; await tap(p, mv[0]); await tap(p, mv[1]); await settle(p, 1500); const t = (await p.locator(".sh-msg").count()) ? await p.locator(".sh-msg").innerText() : ""; check(!/jar|crack/i.test(t), `${name}: a normal Book Nook move never mentions jars ("${t.trim()}")`); } await p.click("[aria-label='Restart this level']"); await settle(p, 900);
  await play(p, name, "Book Nook level 11"); g = (await save(p)).game; check(g.bays.every((b, i) => (b.s ? b.items.length === 0 : true)), `${name}: the carts are empty at the end`);
  if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-nook-win.png` });
  await ctx.close();

  // ---- Boutique (level 21): racks and shelves, shirts and books together
  ctx = await mkCtx(w, h, 21, false); p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/21] pageerror ${e.message}`));
  await p.goto(BASE, { waitUntil: "networkidle" }); await enter(p); check((await p.locator(".sh-card h2").innerText()) === "BOUTIQUE", `${name}: Boutique shows its own how-to card`); await p.click("text=START STOCKING"); await p.waitForTimeout(900);
  await fit(p, name, "Boutique"); g = (await save(p)).game; const kinds = await p.locator(".sh-tag span").allInnerTexts(); check(kinds.includes("SHIRTS") && kinds.includes("BOOKS") && kinds.includes("CART"), `${name}: racks, book shelves and a bin are signed (${[...new Set(kinds)].join(", ")})`);
  let t2 = false; for (let a = 0; a < g.bays.length && !t2; a++) for (let b = 0; b < g.bays.length && !t2; b++) { const w2 = whyNot(g, a, b); if (w2 && /Only (shirts|books)/.test(w2)) { await tap(p, a); await tap(p, b); await settle(p, 300); check(/Only (shirts|books)/.test(await p.locator(".sh-msg").innerText()), `${name}: the wrong kind of item is refused: "${(await p.locator(".sh-msg").innerText()).trim()}"`); t2 = true; } }
  check(t2, `${name}: found a wrong-kind move to try`); await p.click("[aria-label='Restart this level']"); await settle(p, 900);
  await play(p, name, "Boutique level 21");
  await ctx.close();

  // ---- Toy Aisle (level 31): size order
  ctx = await mkCtx(w, h, 31, false); p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/31] pageerror ${e.message}`));
  await p.goto(BASE, { waitUntil: "networkidle" }); await enter(p); check((await p.locator(".sh-card h2").innerText()) === "TOY AISLE", `${name}: Toy Aisle shows its own how-to card`); await p.click("text=START STOCKING"); await p.waitForTimeout(900);
  await fit(p, name, "Toy Aisle"); g = (await save(p)).game; check(g.rules.includes("size") && (await p.locator(".sc.d3").count()) === 1 && (await p.locator(".sc-balloons img").count()) >= 4, `${name}: Toy Aisle has its own balloon scene and size-order rule`);
  { const first = solveGame(g)[0]; await tap(p, first[0]); await tap(p, first[1]); await settle(p, 800); g = (await save(p)).game; }   // one move frees some room, so a size refusal (not just "full") can happen
  let t3 = false; for (let a = 0; a < g.bays.length && !t3; a++) for (let b = 0; b < g.bays.length && !t3; b++) { const w2 = whyNot(g, a, b); if (w2 && /bigger toy/.test(w2)) { await tap(p, a); await tap(p, b); await settle(p, 300); check(/bigger toy/.test(await p.locator(".sh-msg").innerText()), `${name}: a bigger toy on a smaller one is refused: "${(await p.locator(".sh-msg").innerText()).trim()}"`); t3 = true; } }
  check(t3, `${name}: found a size-order refusal to try`); if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-toys.png` }); await p.click("[aria-label='Restart this level']"); await settle(p, 900);
  await play(p, name, "Toy Aisle level 31"); g = (await save(p)).game; check(g.won, `${name}: Toy Aisle level won`);
  await ctx.close();

  // ---- Pantry (level 41): fragile jars
  ctx = await mkCtx(w, h, 41, false); p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/41] pageerror ${e.message}`));
  await p.goto(BASE, { waitUntil: "networkidle" }); await enter(p); check((await p.locator(".sh-card h2").innerText()) === "PANTRY", `${name}: Pantry shows its own how-to card`); await p.click("text=START STOCKING"); await p.waitForTimeout(900);
  await fit(p, name, "Pantry"); g = (await save(p)).game; check(g.rules.includes("fragile") && (await p.locator(".sc.d4").count()) === 1 && (await p.locator(".sc-herbs img").count()) >= 3, `${name}: Pantry has its own kitchen scene and fragile-jar rule`);
  { const jarBay = g.bays.findIndex((b) => b.items.length && g.keys[b.items.at(-1).k].kind === "jar"), emptyBays = g.bays.map((b, i) => (b.items.length ? -1 : i)).filter((i) => i >= 0); let from = jarBay, lastMsg = "", uses = 0;
    check(jarBay >= 0 && emptyBays.length >= 2, `${name}: there is a jar on top of a shelf and two empty shelves to shuffle it between`);
    for (let i = 0; i < 6 && !/crack/.test(lastMsg); i++) { const to = from === jarBay ? emptyBays[0] : from === emptyBays[0] ? emptyBays[1] : emptyBays[0]; await tap(p, from); await tap(p, to); await settle(p, 700); const s2 = (await save(p)).game; if (s2.moves > uses) { uses = s2.moves; from = to; } lastMsg = (await p.locator(".sh-msg").count()) ? await p.locator(".sh-msg").innerText() : ""; }
    check(/crack|last move/.test(lastMsg), `${name}: after enough moves the jar cracks and cannot be moved again ("${lastMsg.trim()}")`); const sj = (await save(p)).game; check(sj.bays.flatMap((b) => b.items).some((n) => g.keys[n.k].kind === "jar" && n.x === 0), `${name}: a worn-out jar has 0 moves left in the saved game`); }
  if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-pantry.png` }); await p.click("[aria-label='Restart this level']"); await settle(p, 900);
  await play(p, name, "Pantry level 41"); g = (await save(p)).game; check(g.won, `${name}: Pantry level won`);
  await ctx.close();

  // ---- new departments: Shoe Wall (51), Gift Corner (61), Customer Orders (71), Mixed Day (81, 84, 87)
  for (const [lv, title, scene] of [[51, "SHOE WALL", 5], [61, "GIFT CORNER", 6], [71, "CUSTOMER ORDERS", 7], [81, "MIXED DAY", 8]]) {
    ctx = await mkCtx(w, h, lv, false); p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/${lv}] pageerror ${e.message}`));
    await p.goto(BASE, { waitUntil: "networkidle" }); await enter(p); check((await p.locator(".sh-card h2").innerText()) === title, `${name}: ${title} shows its own how-to card`); await p.click("text=START STOCKING"); await p.waitForTimeout(900);
    await fit(p, name, title); g = (await save(p)).game; check((await p.locator(`.sc.d${scene}`).count()) === 1, `${name}: ${title} has its own animated scene`);
    if (lv === 51) { { const first = solveGame(g)[0]; await tap(p, first[0]); await tap(p, first[1]); await settle(p, 800); g = (await save(p)).game; } let t5 = false; for (let a = 0; a < g.bays.length && !t5; a++) for (let b = 0; b < g.bays.length && !t5; b++) { const w2 = whyNot(g, a, b); if (w2 && /partner/.test(w2)) { await tap(p, a); await tap(p, b); await settle(p, 300); check(/partner/.test(await p.locator(".sh-msg").innerText()), `${name}: two lefts in a row are refused: "${(await p.locator(".sh-msg").innerText()).trim()}"`); t5 = true; } } check(t5, `${name}: found a shoe-pair refusal to try`); await p.click("[aria-label='Restart this level']"); await settle(p, 900); }
    if (lv === 61) { const lb = g.bays.findIndex((b) => b.lock); check(lb >= 0 && (await p.locator(".sh-lock").count()) >= 1 && (await p.locator(".sh-bay.locked").count()) >= 1, `${name}: a padlocked shelf shows a padlock and how many shelves to finish`); await tap(p, lb); await settle(p, 250); check(/Padlocked/.test(await p.locator(".sh-msg").innerText()), `${name}: tapping a padlocked shelf says "${(await p.locator(".sh-msg").innerText()).trim()}"`); }
    if (lv === 71) { check((await p.locator(".sh-ticket .ln").count()) === g.order.length && (await p.locator(".sh-tag", { hasText: "BAG" }).count()) === 1, `${name}: the order ticket lists ${g.order.length} items and the bag is signed`); const bagI = g.bays.findIndex((b) => b.bag), notOrdered = g.bays.findIndex((b) => b.items.length && !g.order.some((o) => o.k === b.items.at(-1).k)); if (notOrdered >= 0) { await tap(p, notOrdered); await tap(p, bagI); await settle(p, 300); check(/isn't on the order/.test(await p.locator(".sh-msg").innerText()), `${name}: an item not on the order is refused ("${(await p.locator(".sh-msg").innerText()).trim()}")`); await tap(p, notOrdered); } if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-orders.png` }); }
    if (lv === 81) check(g.rules.includes("size") && g.rules.includes("locks") && g.bays.some((b) => b.lock), `${name}: Mixed Day level 81 combines size order and a padlock`);
    if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-d${scene}.png` });
    await play(p, name, `${title} level ${lv}`); g = (await save(p)).game; check(g.won, `${name}: ${title} level ${lv} won`);
    if (lv === 71) check((await p.locator(".sh-ticket .ln.ok").count()) === g.order.length, `${name}: every line of the order is ticked off`);
    await ctx.close();
  }
  if (name === "iphone-p" || name === "laptop") { for (const lv of [84, 87]) { ctx = await mkCtx(w, h, lv, false); p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/${lv}] pageerror ${e.message}`)); await p.goto(BASE, { waitUntil: "networkidle" }); await enter(p); await p.click("text=START STOCKING").catch(() => {}); await p.waitForTimeout(900); g = (await save(p)).game;
    if (lv === 84) { const tg = await p.locator(".sh-tag span").allInnerTexts(); check(tg.includes("JARS") && tg.includes("TINS") && g.rules.includes("fragile"), `${name}: Mixed Day level 84 has jar and tin shelves with fragile jars (${[...new Set(tg)].join(", ")})`); } else check(g.rules.includes("pairs") && g.rules.includes("locks"), `${name}: Mixed Day level 87 combines shoe pairs and a padlock`);
    await play(p, name, `Mixed Day level ${lv}`); await ctx.close(); } }

  // ---- drag to move, ghost hint, Daily Delivery, decorating, settings (one fresh game at level 1)
  ctx = await mkCtx(w, h, 1, false); p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/features] pageerror ${e.message}`)); p.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}/features] console ${m.text()}`); });
  await p.goto(BASE, { waitUntil: "networkidle" }); await enter(p); await p.click("text=START STOCKING").catch(() => {}); await p.waitForTimeout(1000); g = (await save(p)).game;
  { const first = solveGame(g)[0], badTarget = g.bays.findIndex((b, i) => i !== first[0] && whyNot(g, first[0], i)); const rect = async (b) => (await hit(p, b).boundingBox()), drag = async (a, b, release = true) => { const ra = await rect(a), rb = await rect(b); const ax = ra.x + ra.width / 2, ay = ra.y + ra.height * 0.62; await p.mouse.move(ax, ay); await p.mouse.down(); await p.mouse.move(ax + 8, ay - 8, { steps: 2 }); await p.mouse.move(rb.x + rb.width / 2, rb.y + rb.height * 0.5, { steps: 14 }); if (release) await p.mouse.up(); };
    await drag(first[0], badTarget, false); await p.waitForTimeout(150); check((await p.locator(".sh-item.dragging").count()) >= 1 && (await p.locator(".sh-bay.drop.bad").count()) === 1, `${name}: dragging lifts the items and a wrong shelf glows red`); await p.mouse.up(); await settle(p, 500); check((await save(p)).game.moves === 0 && (await p.locator(".sh-msg").count()) === 1, `${name}: dropping on a wrong shelf is refused and the items spring back`);
    await p.click("[aria-label='Restart this level']"); await settle(p, 900); g = (await save(p)).game; const f2 = solveGame(g)[0]; await drag(f2[0], f2[1], false); await p.waitForTimeout(150); check((await p.locator(".sh-bay.drop:not(.bad)").count()) === 1, `${name}: the right shelf glows green while dragging`); await p.mouse.up(); await settle(p, 900);
    const g2 = (await save(p)).game; check(g2.moves === 1 && g2.bays[f2[1]].items.length > g.bays[f2[1]].items.length, `${name}: dragging items onto a shelf moves them`); await p.waitForTimeout(900); check(!/jar/.test((await p.locator(".sh-msg").count()) ? await p.locator(".sh-msg").innerText() : ""), `${name}: a plain shirt move never talks about cracked jars`); if (name === "iphone-p") await p.screenshot({ path: `${SHOTS}/shelf-${name}-drag.png` });
    await p.click("[aria-label='Undo the last move']"); await settle(p, 700); }
  await p.click("[aria-label^='Hint']"); await p.waitForTimeout(350); check((await p.locator(".sh-ghost").count()) >= 1, `${name}: a hint sends a ghost copy of the items flying along the move`); await settle(p, 3400); check((await p.locator(".sh-ghost").count()) === 0, `${name}: the ghost cleans itself up`);
  await p.click("[aria-label='Settings']"); { const boxes = p.locator(".sh-panel input[type=checkbox]"); check((await boxes.count()) === 4, `${name}: settings has sound, music, seasons and symbols switches`); await boxes.nth(1).check(); await boxes.nth(0).uncheck(); const set = (await save(p)).settings; check(set.music === true && set.sfx === false, `${name}: the music and sound switches are saved`); await boxes.nth(0).check(); await boxes.nth(1).uncheck(); await p.click(".sh-panel .sh-btn:has-text('DONE')"); }
  { const mo = await p.evaluate(() => new Date().getMonth()), want = [11, 0, 1].includes(mo) ? "season-winter" : [8, 9, 10].includes(mo) ? "season-autumn" : [2, 3, 4].includes(mo) ? "season-spring" : ""; check(want === "" ? !(await p.locator(".sh-root.season-winter, .sh-root.season-autumn, .sh-root.season-spring").count()) : (await p.locator(`.sh-root.${want}`).count()) === 1, `${name}: the seasonal scene matches the month (${want || "none this month"})`); }
  await p.click("[aria-label='Back to the home screen']"); await p.waitForSelector(".sh-home");
  // decorate: buy a neon sign and a pink shelf finish
  await p.click(".sh-decorbtn"); await p.waitForSelector(".sh-decor"); await p.click("[aria-label^='Shop sign: Neon']"); await p.click("[aria-label^='Shelf finish: Pink']"); { const sv = await save(p); check(sv.profile.coins === 300 - 60 - 55 && sv.profile.decor.equipped.sign === "neon" && sv.profile.decor.equipped.finish === "pink", `${name}: buying decor spends coins (${sv.profile.coins} left) and equips it`); }
  if (name === "iphone-p") await p.screenshot({ path: `${SHOTS}/shelf-${name}-decor.png` }); await p.click(".sh-decor ~ .sh-btn"); check((await p.locator(".sh-sign.sign-neon").count()) === 1, `${name}: the neon sign shows on the home screen`);
  await p.click(".sh-play"); await p.waitForSelector(".sh-stage .sh-item"); check((await p.locator(".sh-root.fin-pink").count()) === 1, `${name}: the pink shelf finish shows while playing`); await p.click("[aria-label='Back to the home screen']"); await p.waitForSelector(".sh-home");
  // Daily Delivery: start, solve, rewards, streak, home shows it done
  const coins0 = (await save(p)).profile.coins; await p.click(".sh-daily"); await p.waitForSelector(".sh-stage .sh-item", { timeout: 20000 }); await p.waitForTimeout(900); check(/DAILY DELIVERY/.test(await p.locator(".sh-level small").innerText()), `${name}: the Daily Delivery opens ("${(await p.locator(".sh-level small").innerText()).trim()}")`);
  if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/shelf-${name}-daily.png` }); await fit(p, name, "daily"); await play(p, name, "Daily Delivery");
  { const t = await p.locator(".sh-card").innerText(); check(/DAILY DELIVERY DONE/.test(t) && /day streak/.test(t) && /coins/.test(t), `${name}: the daily result shows the streak and coins earned`); const sv = await save(p); check(sv.profile.daily.streak === 1 && sv.profile.coins > coins0 && Object.keys(sv.profile.daily.done).length === 1, `${name}: the daily is saved (coins ${coins0} -> ${sv.profile.coins})`); }
  await p.click(".sh-card .sh-btn.go"); await p.waitForSelector(".sh-home"); check(/Done today/.test(await p.locator(".sh-daily").innerText()) && /1/.test(await p.locator(".sh-streak").innerText()), `${name}: home shows the Daily as done with a 1 day streak`);
  await ctx.close();

  // ---- a heavy board (level 30: 8 kinds of items, 11 shelves, hidden items): fits and stays smooth
  ctx = await mkCtx(w, h, 30, false); p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/30] pageerror ${e.message}`));
  await p.goto(BASE, { waitUntil: "networkidle" }); await enter(p); await p.click("text=START STOCKING").catch(() => {}); await p.waitForTimeout(1000);
  g = (await save(p)).game; check((await p.locator(".sh-item").count()) === g.bays.flatMap((b) => b.items).length && g.bays.length === 13, `${name}: level 30 (a Stock Take boss) draws ${g.bays.flatMap((b) => b.items).length} items on ${g.bays.length} shelves`); await fit(p, name, "level 30");
  check((await p.locator(".sh-item[src]").count()) > 0 && g.bays.flatMap((b) => b.items).some((n) => n.q), `${name}: some items are wrapped mystery items`); if (["iphone-p", "tiny", "laptop"].includes(name)) await p.screenshot({ path: `${SHOTS}/shelf-${name}-l30.png` });
  // a wrapped item never lifts or moves with a run: the number of lifted items is exactly the revealed matching run on top, on every shelf
  { let bad = 0, tested = 0; for (let b = 0; b < g.bays.length; b++) { const items = g.bays[b].items; if (!items.length) continue; let n = 0; const k = items.at(-1).k; while (n < items.length && !items[items.length - 1 - n].q && items[items.length - 1 - n].k === k) n++; await tap(p, b); await p.waitForTimeout(260); const lifted = await p.locator(".sh-item.lifted").count(); if (lifted !== n) bad++; tested++; await tap(p, b); await p.waitForTimeout(160); }
    check(tested > 5 && bad === 0, `${name}: lifting never takes a wrapped item along (${tested} shelves checked)`); }
  const path30 = solveGame(g); check(!!path30, `${name}: level 30 is solvable (${path30?.length} moves)`);
  const s30 = await perf(p, async () => { for (const [a, b] of path30.slice(0, 8)) { await tap(p, a); await tap(p, b); await settle(p, 720); } });
  check((await save(p)).game.moves === 8, `${name}: 8 real moves played on the heavy board`); check(s30.max < 200 && s30.p95 < 70, `${name}: heavy board is smooth (${s30.frames} frames, p95 ${Math.round(s30.p95)}ms, worst ${Math.round(s30.max)}ms, longest task ${Math.round(s30.long)}ms)`);
  await p.click("[aria-label='Settings']"); await p.locator(".sh-panel input").nth(3).check(); await settle(p, 200); check((await save(p)).settings.symbols === true, `${name}: the colour-blind symbols switch works`);
  if (name === "iphone-p") await p.screenshot({ path: `${SHOTS}/shelf-${name}-symbols.png` });
  await ctx.close();
}
await browser.close(); console.log(ok.join("\n")); if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); } console.log("\nSHELF STOCKER E2E PASSED");
