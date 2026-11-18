#!/usr/bin/env node
/** Teacher "Give 100 coins" button: signed-in student gets coins + a toast; guest is skipped. Needs ARCADE_DEV_AUTH=1 dev server. */
import { chromium } from "playwright";
const BASE = process.argv.includes("--url") ? process.argv[process.argv.indexOf("--url") + 1] : "http://localhost:3100";
const fails = []; const check = (ok, m) => { console.log(`${ok ? "PASS" : "FAIL"}  ${m}`); if (!ok) fails.push(m); };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const tctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await tctx.addCookies([{ name: "arcade_dev_auth", value: encodeURIComponent("teacher:gift-t:Gift Teacher"), url: BASE }]);
const res = await tctx.request.post(`${BASE}/api/arcade`, { data: { type: "create", playlist: ["hot_potato"] } });
const { code } = await res.json();
const mkPlayer = async (signup, nick) => {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 800 } }); const page = await ctx.newPage();
  if (signup) { await page.goto(`${BASE}/arcade/account`); await page.waitForSelector("form"); await page.fill('input[autocomplete="username"]', `gift_${Date.now().toString(36)}`); await page.fill('input[type="password"]', "hunter22"); await page.getByRole("button", { name: "Create my account" }).click(); await page.waitForSelector("text=coins"); }
  await page.goto(`${BASE}/arcade/join?code=${code}`); await page.fill("#nick", nick); await page.getByRole("button", { name: "Let's play!" }).click(); await page.waitForURL(`**/room/${code}`);
  return page;
};
const student = await mkPlayer(true, "SignedKid"); const guest = await mkPlayer(false, "GuestKid");
const host = await tctx.newPage(); await host.goto(`${BASE}/arcade/room/${code}/host`); await host.waitForSelector("text=2 / 40 players");
host.once("dialog", (d) => d.accept());
await host.getByRole("button", { name: /Give 100 coins/ }).click();
await host.waitForSelector("text=/Gave 100 coins to 1 signed-in student/", { timeout: 8000 });
check(true, "teacher sees 'Gave 100 coins to 1 signed-in student (1 guest skipped)'");
check((await host.locator("text=/1 guest skipped/").count()) > 0, "guests are reported as skipped");
await student.waitForSelector("text=+100 coins from your teacher!", { timeout: 8000 });
check(true, "signed-in student gets a celebratory toast");
check((await guest.locator("text=from your teacher").count()) === 0, "guest gets nothing");
await student.goto(`${BASE}/arcade/shop`); await student.waitForSelector("text=/🪙 100 coins/", { timeout: 8000 });
check(true, "student's wallet in the shop shows 100 coins");
await host.screenshot({ path: "/tmp/arcade-gift-host.png" });
await browser.close(); console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASSED"); process.exit(fails.length ? 1 : 0);
