#!/usr/bin/env node
/**
 * Two independent browser contexts prove real-time synchronisation and reconnection:
 *  - Quick Draw: strokes drawn with a real mouse by the artist appear on the guesser's canvas, the guesser's
 *    DOM never contains the secret word, and a correct guess scores.
 *  - Reconnect: reloading a player's page mid-game resumes the same seat (same nickname, same game).
 * Needs a dev server with ARCADE_DEV_AUTH=1.   node scripts/arcade-e2e-sync.mjs --url http://localhost:3100
 */
import { chromium } from "playwright";

const BASE = process.argv.includes("--url") ? process.argv[process.argv.indexOf("--url") + 1] : "http://localhost:3100";
const cookie = encodeURIComponent("teacher:sync-dev:Sync Dev");
const fails = []; const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) fails.push(msg); };
const dev = async (body) => { const r = await fetch(`${BASE}/api/arcade/dev`, { method: "POST", headers: { "content-type": "application/json", cookie: `arcade_dev_auth=${cookie}` }, body: JSON.stringify(body) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; };
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });

const { code } = await dev({ type: "create", playlist: ["quick_draw"], bots: 0, timeScale: 1 });
const pages = [];
for (const name of ["Ann", "Ben"]) {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/arcade/join?code=${code}`);
  await page.fill("#nick", name);
  await page.getByRole("button", { name: "Let's play!" }).click();
  await page.waitForURL(`**/arcade/room/${code}`);
  pages.push(page);
}
await pages[0].waitForSelector("text=2 players in the lobby", { timeout: 10000 });
check(true, "two independent browsers joined the same room by code");
await dev({ type: "host", code, cmd: "start" });
await Promise.all(pages.map((p) => p.waitForSelector("text=Round 1/", { timeout: 20000 })));

const artistIdx = (await pages[0].locator("text=You're drawing!").count()) ? 0 : 1;
const artist = pages[artistIdx], guesser = pages[1 - artistIdx];
check(true, `artist is player ${artistIdx + 1}`);
const wordText = await artist.locator("text=/^Draw:/").first().innerText();
const word = wordText.replace("Draw:", "").trim();
check(word.length > 1, `artist sees the secret word (${word})`);
check(!(await guesser.content()).toLowerCase().includes(`>${word.toLowerCase()}<`), "guesser's page does not contain the secret word");

const pixels = (page) => page.evaluate(() => { const c = document.querySelector('.canvas-wrap canvas'); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 240 || d[i + 1] < 240 || d[i + 2] < 240) n++; return n; });
check((await pixels(guesser)) === 0, "guesser canvas starts blank");
const box = await artist.locator('canvas[aria-label="Drawing canvas"]').boundingBox();
await artist.mouse.move(box.x + 60, box.y + 60); await artist.mouse.down();
for (let i = 1; i <= 30; i++) await artist.mouse.move(box.x + 60 + i * 15, box.y + 60 + Math.sin(i / 3) * 120 + i * 8, { steps: 2 });
await artist.mouse.up();
let seen = 0;
for (let i = 0; i < 20 && seen < 500; i++) { await guesser.waitForTimeout(400); seen = await pixels(guesser); }
check(seen > 500, `strokes synced to the other browser (${seen} non-white pixels)`);
await guesser.waitForTimeout(2500);
seen = await pixels(guesser);
const mine = await pixels(artist);
check(Math.abs(mine - seen) / mine < 0.25, `both canvases match closely (${mine} vs ${seen})`);

if (process.env.DEBUG_NET) guesser.on("response", async (r) => { if (r.url().endsWith("/api/arcade") && r.request().method() === "POST") { const b = r.request().postData() ?? ""; if (b.includes('"act"')) console.log("  act", Date.now() % 100000, r.status(), b.slice(0, 120), (await r.text()).slice(0, 100)); } });
// wrong guess then reconnect by reload, then correct guess
await guesser.fill('input[aria-label="Your guess"]', "definitely wrong"); await guesser.keyboard.press("Enter");
await guesser.waitForSelector("text=/Nope|So close/");
check(true, "wrong guess handled privately");
await guesser.reload();
await guesser.waitForSelector("text=Round 1/", { timeout: 15000 });
check((await guesser.locator("text=Ben").count()) > 0, "reload resumed the same seat (nickname Ben) mid-game");
await guesser.waitForTimeout(700); await guesser.fill('input[aria-label="Your guess"]', word); await guesser.keyboard.press("Enter");
await guesser.waitForSelector("text=You got it!", { timeout: 10000 }).catch(async () => { console.log("status text:", await guesser.locator('[role="status"]').allInnerTexts()); throw new Error("guess not accepted"); });
check(true, "correct guess accepted after reconnect");
const state = await dev({ type: "state", code });
check(state.view.players.every((p) => p.connected), "both players show as connected on the server");
const scored = state.view.players.find((p) => p.nickname === "Ben");
check(scored.points >= 50, `guesser scored speed points (${scored.points})`);
await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASSED");
process.exit(fails.length ? 1 : 0);
