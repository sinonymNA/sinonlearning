// Browser smoke for Pack Rush v2. Usage: node scripts/packs-e2e.mjs [--url http://localhost:3100] [--shots dir]
import { chromium } from "playwright";
import { newState, CARDS } from "../arcade-server/packs/index.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100") + "/arcade/packs", SHOTS = arg("shots", "/tmp");
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
// a save with every card found in some finishes, to see the album and the finish effects
const show = newState(7); show.cash = 5e6; show.unlocked = [true, true, true, false, false, false]; show.up = { dmg: 6, cap: 3, slots: 2 }; show.staff = {};
CARDS.forEach((c, i) => { show.dex[c.id] = { n: 3, vars: [1, i % 2 ? 1 : 0, i % 3 === 0 ? 1 : 0, i % 4 === 0 ? 1 : 0, i % 5 === 0 ? 1 : 0, i % 7 === 0 ? 1 : 0] }; });
show.table[0] = { tier: 0, hp: 3, max: 6 }; show.table[1] = { tier: 1, hp: 10, max: 16 }; show.table[2] = { tier: 2, hp: 38, max: 40 }; show.dupes = { "meadow-0|0": 3, "cave-4|1": 2, "reef-8|1": 4 };
const sizes = { "iphone-p": [390, 844], "iphone-l": [844, 390], "ipad-p": [820, 1180], "ipad-l": [1180, 820], laptop: [1366, 768], tiny: [320, 568] };
for (const [name, [w, h]] of Object.entries(sizes)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }), p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`)); p.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}] console ${m.text()}`); });
  const fit = async (label) => { const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight })); check(o.sw <= o.w + 1 && o.sh <= o.h + 1, `${name} ${label}: page does not scroll`); };
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".pk-slots"); await fit("start");
  check((await p.locator(".tp").count()) === 0, `${name}: table starts empty`);
  await p.click(".pk-btn.big"); await p.waitForSelector(".tp"); check((await p.locator(".tp").count()) === 1, `${name}: buying puts a pack on the table`);
  const hp0 = await p.locator(".tp-hp u").first().evaluate((e) => e.style.width);
  await p.locator(".tp").first().click(); const hp1 = await p.locator(".tp-hp u").first().evaluate((e) => e.style.width); check(hp0 !== hp1, `${name}: a tap damages the pack (${hp0} -> ${hp1})`);
  for (let i = 0; i < 12 && (await p.locator(".rv").count()) === 0; i++) await p.locator(".tp").first().click({ force: true }).catch(() => {});
  await p.waitForSelector(".rv.flip", { timeout: 4000 }); await p.waitForTimeout(700);
  check((await p.locator(".cf").count()) >= 1, `${name}: the pack burst into a card`);
  const b = await p.locator(".rv .cf").first().boundingBox(), vw = await p.evaluate(() => innerWidth); check(b && b.x >= 0 && b.x + b.width <= vw && b.height > 80, `${name}: revealed card fully on screen (${b && Math.round(b.width)}x${b && Math.round(b.height)})`);
  await fit("after reveal"); if (["iphone-p", "ipad-l", "iphone-l"].includes(name)) await p.screenshot({ path: `${SHOTS}/packs-${name}-reveal.png` });
  await p.waitForTimeout(4600); await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector(".pk-slots");
  check((await p.evaluate(() => JSON.parse(localStorage.getItem("packrush:v2") || "null")?.st?.total?.packs)) >= 1, `${name}: progress saved across reload`);
  await ctx.close();
  // showcase save: every tab, no overflow, and screenshots
  const c2 = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }); await c2.addInitScript((s) => { localStorage.setItem("packrush:v2", JSON.stringify({ st: s, at: Date.now() })); }, show);
  const q = await c2.newPage(); q.on("pageerror", (e) => errors.push(`[${name}/show] pageerror ${e.message}`)); await q.goto(BASE, { waitUntil: "networkidle" }); await q.waitForSelector(".pk-slots");
  if (["iphone-p", "ipad-l", "laptop", "iphone-l"].includes(name)) await q.screenshot({ path: `${SHOTS}/packs-${name}-table.png` });
  const tabs = ["SHOP", "UPGRADES", "LAB", "ALBUM", "ODDS"];
  for (let i = 0; i < tabs.length; i++) { await q.click(`[role=tab]:nth-child(${i + 2})`); await q.waitForTimeout(200); check(await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} ${tabs[i]}: no horizontal overflow`); if (["iphone-p", "laptop"].includes(name) && ["ALBUM", "SHOP", "LAB"].includes(tabs[i])) await q.screenshot({ path: `${SHOTS}/packs-${name}-${tabs[i]}.png` }); }
  await q.click(`[role=tab]:nth-child(2)`); check((await q.locator(".pk-row.order").count()) === 3, `${name}: shop shows 3 orders`);
  await q.click(`[role=tab]:nth-child(4)`); check((await q.locator(".pk-row.lab").count()) >= 3, `${name}: lab lists stored duplicates`);
  await q.locator(".pk-row.lab .pk-btn.go").first().click(); await q.waitForSelector(".pk-viewer h2:text('FUSED')"); check(true, `${name}: fusing shows the result card`); if (name === "iphone-p") await q.screenshot({ path: `${SHOTS}/packs-${name}-fused.png` }); await q.click(".pk-viewer .pk-btn.go");
  await q.click(`[role=tab]:nth-child(1)`); for (let i = 0; i < 4; i++) { await q.locator(".tp").first().click({ force: true }); await q.waitForTimeout(120); }
  check((await q.locator(".pk-combo.on").count()) === 1, `${name}: fast taps light the combo meter`); check((await q.locator(".num").count()) >= 1, `${name}: damage numbers appear`);
  if (["iphone-p", "ipad-l"].includes(name)) await q.screenshot({ path: `${SHOTS}/packs-${name}-combo.png` });
  await q.click(`[role=tab]:nth-child(5)`); await q.locator(".pk-grid .cf:not(.locked)").nth(11).click(); await q.waitForSelector(".pk-viewer .cf"); if (name === "iphone-p") await q.screenshot({ path: `${SHOTS}/packs-${name}-viewer.png` });
  await q.click(".pk-viewer .pk-btn >> text=CLOSE"); await q.click(`[role=tab]:nth-child(6)`); await q.click(".pk-row .pk-btn"); await q.waitForSelector("text=expected"); check(true, `${name}: odds lab runs`);
  await c2.close();
}
await browser.close(); console.log(ok.join("\n")); if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); } console.log("\nPACKS E2E PASSED");
