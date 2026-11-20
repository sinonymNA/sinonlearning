// Browser smoke test for Dacula Dash (solo practice vs bots). Usage: node scripts/dacula-e2e.mjs [--url http://localhost:3100] [--shots dir] [--secs 150] [--size 1366x768]
import { chromium } from "playwright";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100"), SHOTS = arg("shots", "/tmp"), SECS = +arg("secs", 150), [VW, VH] = arg("size", "1366x768").split("x").map(Number), TAG = arg("tag", "desk");
const errors = [], seen = new Set(); let rolls = 0, moves = 0, answers = 0;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, hasTouch: VW < 700, isMobile: VW < 700 });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push("pageerror " + e.message)); page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push("console " + m.text()); });
const shot = async (n) => page.screenshot({ path: `${SHOTS}/dd-${TAG}-${n}.png` });
await page.goto(`${BASE}/arcade/solo/practice`); await page.waitForSelector("text=playing as");
await page.getByRole("button", { name: /Dacula Dash/ }).first().click();
await page.getByRole("button", { name: /Medium/ }).click();
await page.fill('input[placeholder="Player"]', "Tester");
await page.getByRole("button", { name: /^Start Dacula Dash/ }).click();
await page.waitForURL("**/arcade/room/**"); await page.waitForSelector(".dd-root", { timeout: 30000 });
console.log("in the game");
await page.waitForSelector(".dd-overlay.intro", { timeout: 20000 }).then(() => seen.add("intro")).catch(() => undefined);
await page.waitForTimeout(800); if (seen.has("intro")) await shot("1-intro");
const end = Date.now() + SECS * 1000;
while (Date.now() < end) {
  const roll = page.locator(".dd-roll"), dest = page.locator(".dd-dest"), choice = page.locator(".dd-choice:not([disabled])");
  if (await roll.isVisible().catch(() => false)) { seen.add("roll"); if (!seen.has("shot-roll")) { seen.add("shot-roll"); await shot("2-roll"); } await roll.click().catch(() => undefined); rolls++; await page.waitForTimeout(500); continue; }
  if (await dest.count()) {
    seen.add("choose"); if (!seen.has("shot-choose")) { seen.add("shot-choose"); await page.waitForTimeout(400); await dest.first().hover().catch(() => undefined); await shot("3-choose"); }
    // prefer a landmark destination, otherwise the farthest-looking option (last)
    const lm = page.locator(".dd-dest.lm"); const t = (await lm.count()) ? lm.first() : dest.last(); await t.click().catch(() => undefined); moves++; await page.waitForTimeout(600); continue;
  }
  if (await choice.count()) { seen.add("question"); if (!seen.has("shot-q")) { seen.add("shot-q"); await shot("4-question"); } await page.waitForTimeout(700 + Math.random() * 2500); const n = await choice.count(); await choice.nth(Math.floor(Math.random() * n)).click({ timeout: 2000 }).catch(() => undefined); answers++; await page.waitForTimeout(900); if (!seen.has("shot-res")) { seen.add("shot-res"); await shot("5-result"); } continue; }
  if (await page.locator(".dd-overlay.over").count()) { seen.add("over"); await shot("9-over"); break; }
  await page.waitForTimeout(400);
}
if (!seen.has("over")) await shot("8-latest");
const text = await page.locator(".dd-root").innerText().catch(() => "");
console.log(JSON.stringify({ seen: [...seen], rolls, moves, answers }));
console.log("HUD excerpt:", text.replace(/\n+/g, " | ").slice(0, 220));
const ov = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight }));
if (ov.sw > ov.w + 1) errors.push("horizontal overflow " + JSON.stringify(ov));
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console/page errors"); await browser.close(); process.exit(errors.length ? 1 : 0);
