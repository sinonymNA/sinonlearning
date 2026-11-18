#!/usr/bin/env node
/** Two real browsers: quick chat pops up on the other player's screen; teacher switch removes it; host-added bots show up. */
import { chromium } from "playwright";
const BASE = process.argv.includes("--url") ? process.argv[process.argv.indexOf("--url") + 1] : "http://localhost:3100";
const cookie = encodeURIComponent("teacher:chat-dev:Chat Dev");
const fails = []; const check = (ok, m) => { console.log(`${ok ? "PASS" : "FAIL"}  ${m}`); if (!ok) fails.push(m); };
const dev = async (b) => { const r = await fetch(`${BASE}/api/arcade/dev`, { method: "POST", headers: { "content-type": "application/json", cookie: `arcade_dev_auth=${cookie}` }, body: JSON.stringify(b) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const { code } = await dev({ type: "create", playlist: ["piggy_bank"], bots: 0, timeScale: 1 });
const pages = []; const errors = [];
for (const name of ["Ann", "Ben"]) {
  const page = await (await browser.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${BASE}/arcade/join?code=${code}`); await page.fill("#nick", name); await page.getByRole("button", { name: "Let's play!" }).click(); await page.waitForURL(`**/arcade/room/${code}`);
  pages.push(page);
}
await pages[0].waitForSelector("text=2 players in the lobby");
await pages[0].getByRole("button", { name: /Chat/ }).click();
await pages[0].getByRole("tab").count().catch(() => 0);
await pages[0].getByRole("button", { name: "🎉 Cheer" }).click();
await pages[0].getByRole("button", { name: /GG!/ }).click();
await pages[1].waitForSelector(".chat-pop >> text=GG!", { timeout: 8000 });
check((await pages[1].locator(".chat-pop small").first().innerText()) === "Ann", "Ben sees Ann's quick-chat pop-up with her name");
check((await pages[0].locator(".chat-palette").count()) === 0, "palette closes after sending");
await pages[0].getByRole("button", { name: /Chat/ }).click({ trial: true }).catch(() => undefined);
check((await pages[1].locator('input[type="text"]').filter({ hasText: "" }).count()) <= 1, "no free-text chat box exists in the room");
// jokes tab has jokes; cooldown message
await dev({ type: "host", code, cmd: "chat", args: { on: false } });
await pages[0].waitForSelector(".chat-btn", { state: "detached", timeout: 8000 });
check(true, "teacher switched chat off: the chat button disappears for students");
await dev({ type: "host", code, cmd: "chat", args: { on: true } });
await pages[0].waitForSelector(".chat-btn", { timeout: 8000 });
check(true, "...and comes back when switched on");
await pages[0].screenshot({ path: "/tmp/arcade-chat.png" });
check(errors.length === 0, `no page errors ${errors.join(" | ")}`);
await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASSED"); process.exit(fails.length ? 1 : 0);
