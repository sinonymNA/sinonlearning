#!/usr/bin/env node
/**
 * Browser end-to-end test (Playwright). Requires a running dev server started with ARCADE_DEV_AUTH=1:
 *   ARCADE_DEV_AUTH=1 npx next dev -p 3100
 *   node scripts/arcade-e2e.mjs --url http://localhost:3100 --bots 24 --games all --scale 0.25 --out /tmp/shots
 * A real browser (mobile viewport) plays every game through the actual UI while bots fill the room; the
 * teacher dashboard and projector are open in other browser contexts.
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith("--") ? [...a, [x.slice(2), arr[i + 1]]] : a), []));
const BASE = args.url ?? "http://localhost:3100";
const BOTS = Number(args.bots ?? 24);
const SCALE = Number(args.scale ?? 0.25);
const OUT = args.out ?? "/tmp/arcade-shots";
const GAMES = !args.games || args.games === "all" ? ["hot_potato", "last_one_standing", "quick_draw", "telephone", "imposter"] : args.games.split(",");
mkdirSync(OUT, { recursive: true });
const cookie = encodeURIComponent("teacher:e2e-dev:E2E Teacher");
const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "../arcade-server/data/words.mjs"), "utf8");
const WORDS = src.slice(src.indexOf('"') + 1, src.lastIndexOf('"')).split(" ");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = []; const seen = new Set();

async function dev(body) {
  const res = await fetch(`${BASE}/api/arcade/dev`, { method: "POST", headers: { "content-type": "application/json", cookie: `arcade_dev_auth=${cookie}` }, body: JSON.stringify(body) });
  const j = await res.json(); if (!res.ok) throw new Error(j.error); return j;
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const teacherCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await teacherCtx.addCookies([{ name: "arcade_dev_auth", value: cookie, url: BASE }]);
const phoneCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const watch = (page, label) => { page.on("pageerror", (e) => problems.push(`${label} pageerror: ${e}`)); page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) problems.push(`${label} console: ${m.text()}`); }); };

const { code } = await dev({ type: "create", playlist: GAMES, bots: BOTS, behavior: "mixed", timeScale: SCALE });
console.log("test room", code);
const me = await dev({ type: "join_self", code });
const player = await phoneCtx.newPage(); watch(player, "player");
await player.addInitScript(([c, v]) => localStorage.setItem(`arcade:room:${c}`, JSON.stringify(v)), [code, { playerId: me.playerId, token: me.token, nickname: "Dev" }]);
await player.goto(`${BASE}/arcade/room/${code}`);
const hostPage = await teacherCtx.newPage(); watch(hostPage, "host"); await hostPage.goto(`${BASE}/arcade/room/${code}/host`);
const proj = await teacherCtx.newPage(); watch(proj, "projector"); await proj.setViewportSize({ width: 1600, height: 900 }); await proj.goto(`${BASE}/arcade/room/${code}/projector`);
await player.waitForSelector("text=Waiting for", { timeout: 15000 });
await player.screenshot({ path: join(OUT, "01-lobby-phone.png") });
await hostPage.waitForSelector("text=Choose games"); await hostPage.screenshot({ path: join(OUT, "02-host-lobby.png") });
await hostPage.getByRole("button", { name: /^▶ Start/ }).click();
console.log("started via dashboard button");

let shot = 3;
const snap = async (label, page = player) => { const n = `${String(shot++).padStart(2, "0")}-${label}.png`; await page.screenshot({ path: join(OUT, n) }); };

async function act() {
  const p = player;
  const vis = (sel) => p.locator(sel).first().isVisible().catch(() => false);
  // Hot Potato
  if (await vis('input[aria-label="Your word"]')) {
    const label = await p.locator('[aria-label^="Letters:"]').first().getAttribute("aria-label").catch(() => null);
    const seq = label?.replace("Letters: ", "").toLowerCase();
    if (seq) { const w = WORDS.filter((x) => x.includes(seq) && x.length > seq.length && x.length < 9); const word = w[Math.floor(Math.random() * w.length)]; await p.fill('input[aria-label="Your word"]', word); await p.keyboard.press("Enter"); seen.add("hot_potato:pass"); }
    return;
  }
  // Last One Standing
  const choice = p.locator("button.choice:not([disabled])").first();
  if (await choice.isVisible().catch(() => false)) { await sleep(300 + Math.random() * 1500); await choice.click({ timeout: 2000 }).catch(() => undefined); seen.add("choice"); return; }
  // Piggy Bank chests
  const chest = p.locator("button.chest:not([disabled])").first();
  if (await chest.isVisible().catch(() => false)) { await sleep(300 + Math.random() * 1200); await chest.click({ timeout: 2000 }).catch(() => undefined); seen.add("chest"); return; }
  // Quick Draw / Telephone drawing
  const canvas = p.locator('canvas[aria-label="Drawing canvas"]');
  if (await canvas.isVisible().catch(() => false)) {
    const b = await canvas.boundingBox();
    if (b) { for (let k = 0; k < 3; k++) { await p.mouse.move(b.x + 40 + k * 50, b.y + 40); await p.mouse.down(); for (let i = 1; i <= 12; i++) await p.mouse.move(b.x + 40 + k * 50 + i * 12, b.y + 40 + Math.sin(i) * 60 + i * 10, { steps: 2 }); await p.mouse.up(); } seen.add("drew"); }
    const done = p.getByRole("button", { name: "I'm done!" });
    if (await done.isVisible().catch(() => false)) { await sleep(500); await done.click().catch(() => undefined); }
    await sleep(2500); return;
  }
  if (await vis('input[aria-label="Your guess"]')) { await p.fill('input[aria-label="Your guess"]', ["cat", "house", "sun", "tree"][Math.floor(Math.random() * 4)]); await p.keyboard.press("Enter"); seen.add("guess"); await sleep(1500); return; }
  if (await vis('input[aria-label="Description"]')) { await p.fill('input[aria-label="Description"]', "a very confused blob"); await p.keyboard.press("Enter"); seen.add("describe"); return; }
  if (await vis("#imp-input")) { await p.fill("#imp-input", ["probably snacks", "something fun", "what is it"][Math.floor(Math.random() * 3)]); await p.keyboard.press("Enter"); seen.add("imposter-input"); await sleep(800); return; }
  // votes (telephone chain cards, imposter players): any enabled .choice already handled above
}

const start = Date.now(); let lastPhase = ""; let shotsAt = 0;
while (Date.now() - start < 22 * 60_000) {
  const text = await player.locator("main").innerText().catch(() => "");
  const phase = /Final standings|takes the crown/.test(text) ? "final" : /results/i.test(text) && /Arcade total/.test(text) ? "results" : text.slice(0, 60);
  if (phase !== lastPhase && (phase === "final" || phase === "results")) { await sleep(1500); await snap(`phone-${phase}`); await snap(`projector-${phase}`, proj); }
  lastPhase = phase;
  if (Date.now() - shotsAt > 14_000) { shotsAt = Date.now(); await snap("phone-live"); if (shot % 3 === 0) { await snap("projector-live", proj); await snap("host-live", hostPage); } }
  if (phase === "final") break;
  await act().catch((e) => { if (!/Timeout|Target closed/.test(String(e))) problems.push(`act: ${e}`); });
  await sleep(400);
}
const state = await dev({ type: "state", code });
console.log("final phase:", state.view.phase, " history:", state.view.history?.map((h) => h.name).join(", "));
console.log("player interactions seen:", [...seen].join(", "));
console.log("server metrics:", JSON.stringify(state.metrics));
console.log("problems:", problems.length ? problems.slice(0, 15) : "none");
await browser.close();
process.exit(state.view.phase === "final" && !problems.length ? 0 : 1);
