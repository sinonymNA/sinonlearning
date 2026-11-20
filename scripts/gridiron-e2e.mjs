// Browser smoke test for Retro Gridiron. Usage: node scripts/gridiron-e2e.mjs [--url http://localhost:3100] [--shots dir] [--plays N]
import { chromium } from "playwright";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const URL = arg("url", "http://localhost:3100") + "/arcade/gridiron", SHOTS = arg("shots", "/tmp"), PLAYS = +arg("plays", 6);
const errors = [];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
async function session(name, viewport, opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: !!opts.touch, isMobile: !!opts.touch });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}] console ${m.text()}`); });
  await page.goto(URL, { waitUntil: "networkidle" });
  return page;
}
const screen = (p) => p.getAttribute(".gr-root", "data-screen");
async function shot(p, n) { await p.screenshot({ path: `${SHOTS}/gridiron-${n}.png` }); }
async function overflow(p, name) {
  const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight }));
  if (o.sw > o.w + 1 || o.sh > o.h + 1) errors.push(`[${name}] page overflows ${JSON.stringify(o)}`);
}

// ---- full flow on desktop ----
const p = await session("desktop", { width: 1366, height: 768 });
await shot(p, "1-menu"); await overflow(p, "menu");
await p.click("text=QUICK PLAY");
await p.waitForSelector(".gr-playgrid"); await shot(p, "2-plays"); await overflow(p, "plays");
const seen = new Set(); let plays = 0, snaps = 0, catches = 0;
for (let guard = 0; guard < 400 && plays < PLAYS; guard++) {
  const s = await screen(p); seen.add(s);
  if (s === "plays") { await p.locator(".gr-play").nth(plays % 8).click(); }
  else if (s === "fourth") { await p.click("text=PUNT"); }
  else if (s === "presnap") { if (plays === 0) await shot(p, "3-presnap"); await p.click("text=SNAP"); snaps++; }
  else if (s === "live") {
    const t0 = Date.now(); let thrown = false;
    while (Date.now() - t0 < 25000 && (await screen(p)) === "live") {
      const can = await p.locator(".gr-abcd .gr-key:not([disabled])").count();
      if (!thrown && can) { await p.waitForTimeout(1400); await p.keyboard.press(["KeyA", "KeyB", "KeyC", "KeyD"][plays % 4]); thrown = true; await p.waitForTimeout(500); if (plays === 0) await shot(p, "4-flight"); }
      else if (await p.locator(".gr-key.arrow.hot").count()) { catches++; if (catches === 1) await shot(p, "5-carry"); await p.keyboard.down("ArrowLeft"); await p.waitForTimeout(250); await p.keyboard.up("ArrowLeft"); await p.keyboard.down("ArrowRight"); await p.waitForTimeout(250); await p.keyboard.up("ArrowRight"); }
      else await p.waitForTimeout(150);
    }
    plays++;
  } else if (s === "cpu") { await p.waitForSelector("#gr-continue", { timeout: 15000 }); await p.click("#gr-continue"); }
  else if (s === "fg") { await p.click("text=KICK!"); await p.waitForTimeout(2000); }
  else if (s === "final") break;
  await p.waitForTimeout(250);
}
console.log("screens seen", [...seen].join(","), "plays", plays, "snaps", snaps, "carry frames", catches);
// pause / resume
if ((await screen(p)) === "plays") { await p.locator(".gr-play").first().click(); await p.click("text=SNAP"); }
if ((await screen(p)) === "live") { await p.keyboard.press("Escape"); await p.waitForSelector("text=PAUSED"); await shot(p, "6-pause"); await p.click("text=RESUME"); }
await shot(p, "7-after");
const hudText = await p.locator(".gr-top").innerText().catch(() => ""); console.log("HUD:", hudText.replace(/\n/g, " | "));
await p.close();

// ---- phone landscape + portrait ----
for (const [name, vp] of [["phone-landscape", { width: 844, height: 390 }], ["phone-portrait", { width: 390, height: 844 }], ["tablet", { width: 1024, height: 768 }]]) {
  const q = await session(name, vp, { touch: true });
  await shot(q, `${name}-menu`); await overflow(q, name + " menu");
  await q.tap("text=TWO-MINUTE DRILL"); await q.waitForSelector(".gr-playgrid"); await shot(q, `${name}-plays`); await overflow(q, name + " plays");
  await q.locator(".gr-play").nth(1).tap(); await q.waitForSelector("text=SNAP"); await overflow(q, name + " presnap"); await shot(q, `${name}-presnap`);
  await q.tap("text=SNAP"); await q.waitForTimeout(1500); await shot(q, `${name}-live`); await overflow(q, name + " live");
  const can = await q.locator(".gr-abcd .gr-key:not([disabled])").count();
  if (can) { await q.locator(".gr-abcd .gr-key").nth(1).tap(); await q.waitForTimeout(2500); await shot(q, `${name}-after-throw`); }
  await q.close();
}
await browser.close();
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no console/page errors");
process.exit(errors.length ? 1 : 0);
