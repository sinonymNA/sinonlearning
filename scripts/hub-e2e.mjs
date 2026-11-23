// Browser check for the shelf hub. Usage: node scripts/hub-e2e.mjs [--url http://localhost:3100] [--shots dir]
import { chromium } from "playwright";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100"), SHOTS = arg("shots", "/tmp");
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const sizes = { "iphone-p": [390, 844], "iphone-l": [844, 390], "ipad-p": [820, 1180], "ipad-l": [1180, 820], laptop: [1366, 768], tiny: [320, 568] };
for (const [name, [w, h]] of Object.entries(sizes)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }), p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`));
  for (const path of ["/arcade/solo", "/arcade"]) {
    await p.goto(BASE + path, { waitUntil: "networkidle" }); await p.waitForSelector(".hb-shelf");
    const shelves = await p.locator(".hb-shelf:not(.hb-cont)").count(); check(shelves >= 3 && shelves <= 4 && (path === "/arcade/solo" || (await p.locator(".hb-shelf:not(.hb-cont) .hb-card-body b", { hasText: "Daily Puzzle" }).count()) === 0), `${name} ${path}: ${shelves} mood shelves`);
    const over = await p.evaluate(() => [...document.querySelectorAll(".hb-shelf:not(.hb-cont)")].filter((s) => s.querySelectorAll(".hb-card").length > 3).length); check(over === 0, `${name} ${path}: no shelf shows more than 3 cards`);
    check((await p.locator(".hb-cont").count()) === 0, `${name} ${path}: no Continue row for a new visitor`);
    check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} ${path}: no horizontal overflow`);
    await p.waitForTimeout(400);
    const loops = await p.evaluate(() => document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations === Infinity && a.effect.target?.closest?.(".hb")).length); check(loops === 0, `${name} ${path}: hub has no looping animations (${loops})`);
    if (path === "/arcade/solo" && ["iphone-p", "laptop", "ipad-l"].includes(name)) await p.screenshot({ path: `${SHOTS}/hub-${name}.png`, fullPage: true });
  }
  check((await p.evaluate(() => localStorage.getItem("arcade:booted"))) === "1", `${name}: the intro is remembered per device (shows once)`);
  // playing a game adds it to Continue, newest first
  await p.goto(BASE + "/arcade/packs", { waitUntil: "networkidle" }); await p.waitForTimeout(300);
  await p.goto(BASE + "/arcade/gridiron", { waitUntil: "networkidle" }); await p.waitForTimeout(300);
  await p.goto(BASE + "/arcade/solo", { waitUntil: "networkidle" }); await p.waitForSelector(".hb-cont");
  const names = await p.locator(".hb-cont .hb-pill b").allInnerTexts(); check(names.length === 2 && /GRIDIRON/i.test(names[0]) && /PACK/i.test(names[1]), `${name}: Continue shows the last games, newest first (${names.join(", ")})`);
  if (["iphone-p", "laptop"].includes(name)) await p.screenshot({ path: `${SHOTS}/hub-${name}-continue.png`, fullPage: true });
  await p.locator(".hb-cont a").first().click(); await p.waitForURL("**/arcade/gridiron"); check(true, `${name}: a Continue card opens the game`);
  await ctx.close();
}
await browser.close(); console.log(ok.join("\n")); if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); } console.log("\nHUB E2E PASSED");
