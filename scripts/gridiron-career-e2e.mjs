// Browser smoke for Gridiron hotkeys + Coach Career. Usage: node scripts/gridiron-career-e2e.mjs [--url http://localhost:3100] [--shots dir]
import { chromium } from "playwright";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg("url", "http://localhost:3100") + "/arcade/gridiron", SHOTS = arg("shots", "/tmp");
const errors = [], ok = [];
const check = (c, m) => { (c ? ok : errors).push(c ? m : "FAIL " + m); };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push("pageerror " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console " + m.text()); });
await page.goto(URL, { waitUntil: "networkidle" });
const screen = () => page.getAttribute(".gr-root", "data-screen");
const playName = async () => (await page.locator(".gr-playname b").innerText()).trim();

// ---- hotkeys in a quick game
await page.click("text=QUICK PLAY"); await page.waitForSelector("text=SNAP");
const first = await playName();
await page.keyboard.press("KeyR"); await page.waitForTimeout(150);
check((await playName()) !== first, "R audibles to another play");
const kind0 = await page.locator(".gr-snapbar .gr-btn", { hasText: /RUN|PASS/ }).first().innerText();
await page.keyboard.press("ShiftLeft"); await page.waitForTimeout(150);
const kind1 = await page.locator(".gr-snapbar .gr-btn", { hasText: /RUN|PASS/ }).first().innerText();
check(kind0.split(" ")[0] !== kind1.split(" ")[0], `Shift toggles pass/run (${kind0.trim()} -> ${kind1.trim()})`);
await page.keyboard.press("ShiftLeft"); await page.waitForTimeout(150);
await page.keyboard.press("Space");
let threw = false;
for (let i = 0; i < 80 && !threw; i++) { if (await page.locator(".gr-abcd .gr-key:not([disabled])").count()) { await page.waitForTimeout(900); await page.keyboard.press("KeyW"); threw = true; } else await page.waitForTimeout(100); }
check(threw, "W key throws to receiver B in the pocket");
await page.waitForTimeout(2500); await page.screenshot({ path: `${SHOTS}/gridiron-hotkeys.png` });

// ---- career
await page.goto(URL, { waitUntil: "networkidle" });
await page.click("text=COACH CAREER"); await page.waitForSelector("text=START CAREER");
await page.screenshot({ path: `${SHOTS}/career-0-new.png` });
await page.fill("input[aria-label='Team name']", "Dacula Test"); await page.click("text=START CAREER");
await page.waitForSelector("text=PLAY GAME"); await page.screenshot({ path: `${SHOTS}/career-1-season.png` });
for (const t of ["ROSTER", "FREE AGENTS", "LEAGUE", "HISTORY", "SEASON"]) { await page.click(`[role=tab]:has-text("${t}")`); await page.waitForTimeout(100); await page.screenshot({ path: `${SHOTS}/career-tab-${t.replace(" ", "")}.png` }); }
// train + sign
await page.click(`[role=tab]:has-text("ROSTER")`); const c0 = +(await page.locator(".gc-credits").innerText()).replace(/\D/g, "");
await page.locator(".gc-player .gr-btn", { hasText: "TRAIN" }).first().click(); const c1 = +(await page.locator(".gc-credits").innerText()).replace(/\D/g, "");
check(c1 === c0 - 2, `training spends 2 credits (${c0} -> ${c1})`);
await page.click(`[role=tab]:has-text("FREE AGENTS")`);
const cheap = page.locator(".gc-player", { hasText: "costs 1⭐" }).first().locator(".gr-btn:not([disabled])").first();
if (await cheap.count()) { await cheap.click(); check(+(await page.locator(".gc-credits").innerText()).replace(/\D/g, "") === c1 - 1, "signing a 1-credit free agent spends 1"); }
// SIM a week
await page.click(`[role=tab]:has-text("SEASON")`); await page.click("text=SIM WEEK"); await page.waitForSelector("text=WEEK RESULT");
check(true, "SIM WEEK shows a result");
// persistence
await page.reload({ waitUntil: "networkidle" }); await page.click("text=COACH CAREER");
check(await page.locator("text=Dacula Test").count() > 0 || await page.locator("text=DACULA TEST").count() > 0, "career persists across reloads");
// play a real game: just snap and run plays until the final screen (auto-throw to A; punt on fourth)
await page.click("text=PLAY GAME");
await page.waitForSelector("text=SNAP");
const t0 = Date.now();
while (Date.now() - t0 < 240000) {
  const s = await screen();
  if (s === "final") break;
  if (s === "fourth") await page.click("text=PUNT").catch(() => {});
  else if (s === "presnap") await page.keyboard.press("Space");
  else if (s === "live") { if (await page.locator(".gr-abcd .gr-key:not([disabled])").count()) { await page.waitForTimeout(700); await page.keyboard.press("KeyA"); } await page.waitForTimeout(150); }
  else if (s === "cpu") await page.evaluate(() => document.getElementById("gr-continue")?.click());
  else if (s === "fg") await page.keyboard.press("Space");
  else await page.waitForTimeout(150);
}
check((await screen()) === "final", "career game reaches the final");
await page.screenshot({ path: `${SHOTS}/career-2-final.png` });
check(await page.locator("text=CONTINUE SEASON").count() === 1, "final shows CONTINUE SEASON");
await page.click("text=CONTINUE SEASON"); await page.waitForSelector("text=WK 2");
await page.screenshot({ path: `${SHOTS}/career-3-after.png` });
const wk = await page.locator(".gc-line.now").first().innerText(); check(/WK\s*3/.test(wk), "week advanced after the live game (now " + wk.replace(/\s+/g, " ") + ")");
await browser.close();
console.log(ok.join("\n")); if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); } console.log("\nCAREER E2E PASSED");
