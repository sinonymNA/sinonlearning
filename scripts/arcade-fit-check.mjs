#!/usr/bin/env node
/**
 * Desktop fit check: plays a full 5-game party with a real browser at several desktop viewport sizes and
 * records any moment the PAGE needs vertical scrolling (document taller than the window).
 *   ARCADE_DEV_AUTH=1 npx next dev -p 3100 ; node scripts/arcade-fit-check.mjs --url http://localhost:3100 --size 1366x768
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const a = process.argv; const get = (k, d) => (a.includes(`--${k}`) ? a[a.indexOf(`--${k}`) + 1] : d);
const BASE = get("url", "http://localhost:3100"); const [W, H] = get("size", "1366x768").split("x").map(Number);
const SCALE = Number(get("scale", "0.2")); const view = get("page", "player"); const OUT = get("out", "");
const cookie = encodeURIComponent("teacher:fit-dev:Fit Dev");
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../arcade-server/data/words.mjs"), "utf8");
const WORDS = src.slice(src.indexOf('"') + 1, src.lastIndexOf('"')).split(" ");
const dev = async (b) => { const r = await fetch(`${BASE}/api/arcade/dev`, { method: "POST", headers: { "content-type": "application/json", cookie: `arcade_dev_auth=${cookie}` }, body: JSON.stringify(b) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j; };
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, ...(W < 700 ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}) });
await ctx.addCookies([{ name: "arcade_dev_auth", value: cookie, url: BASE }]);
const { code } = await dev({ type: "create", playlist: (process.env.GAMES ?? "hot_potato,piggy_bank,last_one_standing,quick_draw,telephone,imposter").split(","), bots: 24, behavior: "mixed", timeScale: SCALE });
const me = await dev({ type: "join_self", code });
const page = await ctx.newPage();
await page.addInitScript(([c, v]) => localStorage.setItem(`arcade:room:${c}`, JSON.stringify(v)), [code, { playerId: me.playerId, token: me.token, nickname: "Dev" }]);
await page.goto(view === "projector" ? `${BASE}/arcade/room/${code}/projector` : view === "host" ? `${BASE}/arcade/room/${code}/host` : `${BASE}/arcade/room/${code}`);
await page.waitForTimeout(1500);
const worst = new Map(); let shots = 0;
const probe = async () => {
  const r = await page.evaluate(() => ({ side: document.documentElement.scrollWidth - window.innerWidth, over: Math.max(document.documentElement.scrollHeight - window.innerHeight, ...[...document.querySelectorAll('.fit-main, .fit-side')].map((e) => e.scrollHeight - e.clientHeight)), key: document.querySelector(".stage")?.className.match(/theme-\w+/)?.[0] ?? document.body.innerText.slice(0, 30).replace(/\s+/g, " ") }));
  const k = r.key; if (r.over > (worst.get(k)?.over ?? -1) || r.side > (worst.get(k)?.side ?? -1)) { worst.set(k, { ...r, over: Math.max(r.over, worst.get(k)?.over ?? -1), side: Math.max(r.side, worst.get(k)?.side ?? -1) }); if (OUT && r.over > 4 && shots++ < 12) await page.screenshot({ path: `${OUT}/${W}x${H}-${k.replace(/\W/g, "")}-${r.over}.png` }); }
};
await dev({ type: "host", code, cmd: "start" });
const end = Date.now() + 8 * 60_000;
while (Date.now() < end) {
  await probe();
  const st = (await dev({ type: "state", code })).view.phase; if (st === "final") { await page.waitForTimeout(2500); await probe(); break; }
  if (view === "player") {
    const w = page.locator('input[aria-label="Your word"]');
    if (await w.isVisible().catch(() => false)) { const seq = (await page.locator('[aria-label^="Letters:"]').first().getAttribute("aria-label").catch(() => ""))?.replace("Letters: ", "").toLowerCase(); const c = WORDS.filter((x) => seq && x.includes(seq) && x.length > seq.length && x.length < 9); if (c.length) { await w.fill(c[Math.floor(Math.random() * c.length)]); await page.keyboard.press("Enter"); } }
    const ch = page.locator("button.choice:not([disabled])").first(); if (await ch.isVisible().catch(() => false)) await ch.click({ timeout: 1500 }).catch(() => undefined);
    const cv = page.locator('canvas[aria-label="Drawing canvas"]'); if (await cv.isVisible().catch(() => false)) { const b = await cv.boundingBox(); if (b) { await page.mouse.move(b.x + 30, b.y + 30); await page.mouse.down(); await page.mouse.move(b.x + 150, b.y + 120, { steps: 6 }); await page.mouse.up(); } const d = page.getByRole("button", { name: "I'm done!" }); if (await d.isVisible().catch(() => false)) await d.click().catch(() => undefined); }
    const cz = page.locator("button.chest:not([disabled])").first(); if (await cz.isVisible().catch(() => false)) await cz.click({ timeout: 1500 }).catch(() => undefined);
    const gi = page.locator('input[aria-label="Your guess"]'); if (await gi.isVisible().catch(() => false)) { await gi.fill("cat"); await page.keyboard.press("Enter"); }
    const di = page.locator('input[aria-label="Description"]'); if (await di.isVisible().catch(() => false)) { await di.fill("a blob"); await page.keyboard.press("Enter"); }
    const ii = page.locator("#imp-input"); if (await ii.isVisible().catch(() => false)) { await ii.fill("snacks"); await page.keyboard.press("Enter"); }
  }
  await page.waitForTimeout(350);
}
console.log(`viewport ${W}x${H} page=${view}: worst vertical overflow per screen (px, 0 = fits)`);
for (const [k, v] of [...worst.entries()].sort((x, y) => y[1].over - x[1].over)) console.log(String(Math.max(0, v.over)).padStart(5), "side", String(Math.max(0, v.side)).padStart(3), k);
await browser.close();
