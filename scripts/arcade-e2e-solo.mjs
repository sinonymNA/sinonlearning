#!/usr/bin/env node
/**
 * Browser test of username/password accounts + solo practice + coins:
 *   npx next dev -p 3100 ; node scripts/arcade-e2e-solo.mjs --url http://localhost:3100
 */
import { chromium } from "playwright";
const BASE = process.argv.includes("--url") ? process.argv[process.argv.indexOf("--url") + 1] : "http://localhost:3100";
const fails = []; const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fails.push(msg); };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 420, height: 900 }, hasTouch: true })).newPage();
const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });

const username = `kid_${Date.now().toString(36)}`;
await page.goto(`${BASE}/arcade/account`);
await page.waitForSelector("form");
check((await page.locator('input[type="email"], input[name*="email" i]').count()) === 0, "signup form has no email field");
check((await page.locator("input").count()) === 2, "signup form asks for exactly two things (username, password)");
await page.fill('input[autocomplete="username"]', username);
await page.fill('input[type="password"]', "hunter22");
await page.getByRole("button", { name: "Create my account" }).click();
await page.waitForSelector(`text=${username}`);
check(true, `account created (${username}) and signed in`);
await page.screenshot({ path: "/tmp/arcade-solo-account.png" });

await page.goto(`${BASE}/arcade/solo/practice`);
await page.waitForSelector("text=playing as");
await page.getByRole("button", { name: /Last One Standing/ }).first().click();
await page.getByRole("button", { name: /Medium/ }).click();
await page.fill('input[placeholder="Player"]', "AnyNameILike");
await page.getByRole("button", { name: /^Start Last One Standing/ }).click();
await page.waitForURL("**/arcade/room/**");
check(true, "solo run started (private room with bot opponents)");
await page.waitForSelector("text=AnyNameILike");
check(true, "free-form nickname is used in the game, not the username");

const end = Date.now() + 6 * 60_000; let shot = 0;
while (Date.now() < end) {
  const text = await page.locator("main").innerText().catch(() => "");
  if (/Play again/.test(text)) break;
  const c = page.locator("button.choice:not([disabled])").first();
  if (await c.isVisible().catch(() => false)) { await page.waitForTimeout(400 + Math.random() * 1500); await c.click({ timeout: 2000 }).catch(() => undefined); }
  if (shot++ % 40 === 5) await page.screenshot({ path: `/tmp/arcade-solo-live-${shot}.png` });
  await page.waitForTimeout(500);
}
await page.waitForSelector("text=Play again", { timeout: 10000 });
await page.waitForTimeout(1500);
const final = await page.locator("main").innerText();
await page.screenshot({ path: "/tmp/arcade-solo-final.png" });
const m = final.match(/\+(\d+)\s*🪙/);
check(!!m, `coins awarded after the run (${m ? "+" + m[1] : "none shown"})`);
await page.goto(`${BASE}/arcade/shop`);
await page.waitForSelector(`text=/🪙 ${m ? m[1] : "\\d+"} coins/`, { timeout: 8000 }).catch(() => undefined);
check(m ? (await page.locator(`text=🪙 ${m[1]} coins`).count()) > 0 : false, "wallet in the shop shows the earned coins");
await page.goto(`${BASE}/arcade/account`);
page.once("dialog", (d) => d.accept());
await page.getByRole("button", { name: "Log out" }).click();
await page.waitForSelector("text=Make a free account");
await page.getByRole("tab", { name: "I have an account" }).click();
await page.fill('input[autocomplete="username"]', username);
await page.fill('input[type="password"]', "hunter22");
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForSelector(`text=${username}`);
check((await page.locator(`text=🪙 ${m?.[1] ?? 0} coins`).count()) > 0, "log out then log in restores the same coins");
check(errors.length === 0, `no page/console errors ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ""}`);
await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASSED");
process.exit(fails.length ? 1 : 0);
