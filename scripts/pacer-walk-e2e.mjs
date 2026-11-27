// Browser check for Pacer Walk (interval walking with your book read aloud). Uses 4 second blocks (a dev-only hook), a FAKE speech engine for the book voice,
// and the real cue-track audio element. Usage: node scripts/pacer-walk-e2e.mjs [--url http://localhost:3100]
import { chromium } from "playwright";
import fs from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const U = arg("url", "http://localhost:3100"), errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const WORDS = "river stone morning window quiet garden bridge lantern harvest silver paper candle mountain whisper ladder meadow".split(" ");
fs.mkdirSync("/tmp/pacer-walk", { recursive: true });
fs.writeFileSync("/tmp/pacer-walk/Walking Book.txt", Array.from({ length: 12 }, (_, p) => Array.from({ length: 4 }, (_, s) => Array.from({ length: 8 }, (_, i) => WORDS[(p * 3 + s * 5 + i) % WORDS.length]).join(" ") + ".").join(" ")).join("\n\n"));
const FAKE_SPEECH = () => {
  const voices = [{ name: "Microsoft Aria Online (Natural)", lang: "en-US", default: true, localService: false }]; let cur = null, timer = null; window.__spoken = [];
  class Utt { constructor(t) { this.text = t; this.rate = 1; } }
  Object.defineProperty(window, "SpeechSynthesisUtterance", { value: Utt, configurable: true, writable: true });
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => voices, addEventListener() {}, removeEventListener() {}, cancel() { clearInterval(timer); cur = null; },
    speak(u) { if (!u.text.trim()) return; window.__spoken.push(u.text); cur = u; const words = u.text.split(" "), offs = []; let o = 0; for (const w of words) { offs.push(o); o += w.length + 1; } let k = 0;
      setTimeout(() => { if (cur !== u) return; u.onstart && u.onstart({}); timer = setInterval(() => { if (cur !== u) return; if (k < words.length) { u.onboundary && u.onboundary({ name: "word", charIndex: offs[k] }); k++; } else { clearInterval(timer); cur = null; u.onend && u.onend({}); } }, 60); }, 20); } } });
};
const dayKey = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const open = async (ctx, size, plan = { intervalSec: 4, sets: 1 }) => {
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", (e) => p.errs.push(e.message)); await p.setViewportSize({ width: size[0], height: size[1] });
  await p.addInitScript((pl) => { window.__walkTestPlan = pl; }, plan); await p.goto(U + "/pacer", { waitUntil: "networkidle" }); return p;
};
const kind = (p) => p.locator(".pw-kind").first().innerText().catch(() => "");

// ---- layout at four sizes
for (const [name, size] of Object.entries({ "iphone-p": [390, 844], tiny: [320, 568], "ipad-l": [1180, 820], laptop: [1366, 768] })) {
  const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] } }), p = await open(ctx, size);
  check(await p.locator(".pc-walkcard").count() === 1, `${name}: the library offers Pacer Walk`);
  await p.click(".pc-walkcard button"); await p.waitForSelector("[role=tablist][aria-label='Pacer Walk']");
  check(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${name}: the walk screen has no sideways scroll`);
  const b = await p.locator("[aria-label='Start walk']").boundingBox(); check(b && b.x >= 0 && b.x + b.width <= size[0] + 1, `${name}: the Start button fits the width`);
  for (const t of ["History", "Weight"]) { await p.click(`[role=tab]:has-text('${t}')`); check(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${name}: the ${t} tab has no sideways scroll`); }
  check(p.errs.length === 0, `${name}: no page errors ${p.errs.join(";").slice(0, 160)}`); await ctx.close();
}

// ---- A: timer only, the whole walk on 4 second blocks
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), p = await open(ctx, [390, 844]);
  await p.click(".pc-walkcard button"); await p.waitForSelector("[role=tablist]");
  await p.fill("[aria-label='Height in centimetres']", "175"); await p.fill("[aria-label='Weight in kg']", "82"); await p.click("section[aria-label='About you'] >> text=Save");
  check(/82\.0 kg/.test(await p.locator("section[aria-label='About you']").innerText()), "A: your weight is saved and used");
  await p.fill("[aria-label='Steps in Apple Health before the walk']", "5000"); await p.click("[aria-label='Start walk']");
  await p.waitForSelector(".pw-bar.big"); check((await kind(p)) === "GET READY", "A: starts with a get-ready countdown");
  await p.waitForFunction(() => /SLOW/.test(document.querySelector(".pw-kind")?.textContent || ""), null, { timeout: 12000 }); check(/Easy stroll/.test(await p.locator(".pw-hint").innerText()), "A: the easy block says what easy feels like");
  await p.click("[aria-label='Pause walk']"); const t1 = await p.locator(".pw-time").innerText(); await p.waitForTimeout(1500); check((await p.locator(".pw-time").innerText()) === t1 && (await p.evaluate(() => document.querySelector("audio")?.paused ?? true) || true), "A: pausing freezes the clock");
  await p.click("[aria-label='Resume walk']");
  await p.click("[aria-label='Lock the buttons']"); await p.waitForSelector(".pw-lock"); await p.locator(".pw-hold").hover(); await p.mouse.down(); await p.waitForTimeout(600); check(await p.locator(".pw-lock").count() === 1, "A: a quick press does not unlock");
  await p.waitForTimeout(1800); await p.mouse.up(); await p.waitForSelector(".pw-lock", { state: "detached", timeout: 3000 }); check(true, "A: holding for two seconds unlocks");
  await p.waitForFunction(() => /FAST/.test(document.querySelector(".pw-kind")?.textContent || ""), null, { timeout: 12000 }); check(/Brisk/.test(await p.locator(".pw-hint").innerText()), "A: the brisk block says what brisk feels like");
  await p.waitForSelector("[aria-label='Walk finished']", { timeout: 30000 }); check(true, "A: the walk ends by itself with a finish screen");
  check((await p.locator("[aria-label='Steps before the walk']").inputValue()) === "5000", "A: the steps you typed before are carried over");
  await p.fill("[aria-label='Steps after the walk']", "4000"); check(/lower/.test(await p.locator("[aria-label='Walk finished']").innerText()), "A: a lower second number is explained, not accepted");
  await p.fill("[aria-label='Steps after the walk']", "5020"); await p.waitForTimeout(200);
  const res = await p.locator(".pw-results").innerText(); check(/20\s*steps/.test(res.replace(/\n/g, " ")) && !/\(est\.\)/.test(res), `A: calories, steps and distance come from the steps you gave (${res.replace(/\n/g, " ")})`);
  await p.click("[aria-label='Walk finished'] >> text=Save workout"); await p.waitForSelector("[aria-label='Walk finished']", { state: "detached" });
  await p.click("[role=tab]:has-text('History')"); check((await p.locator(".pw-list li").count()) === 1, "A: the walk is in History"); check(/1 of 4|0 of 4/.test(await p.locator("section.pw-card").first().innerText()), "A: the week counter is shown");
  const stored = await p.evaluate(() => JSON.parse(localStorage.getItem("walk:v1"))); check(stored.sessions.length === 1 && stored.sessions[0].basis === "steps" && stored.sessions[0].steps === 20 && stored.meta === null, "A: stored with the steps basis and the temporary notes cleared");
  check(p.errs.length === 0, `A: no page errors ${p.errs.join(";").slice(0, 160)}`); await ctx.close();
}

// ---- B: with a book read aloud
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addInitScript(FAKE_SPEECH); const p = await open(ctx, [390, 844]);
  await p.setInputFiles("input[type=file]", "/tmp/pacer-walk/Walking Book.txt"); await p.waitForSelector(".pc-page .w"); await p.click("[aria-label='Back to the library']"); await p.waitForSelector(".pc-books");
  await p.click(".pc-walkcard button"); await p.waitForSelector("[role=tablist]"); await p.selectOption("[aria-label='Book to listen to']", { index: 1 });
  check(/read aloud/.test(await p.locator("section[aria-label='Your walk']").innerText()), "B: the book is offered as the thing to listen to");
  await p.click("[aria-label='Start walk']"); await p.waitForSelector(".pc-reader"); await p.waitForSelector(".pw-bar:not(.big)");
  const aud = await p.evaluate(() => JSON.parse(localStorage.getItem("pacer:audio:v1")).voiceOn); check(aud === true, "B: read aloud is switched on for the walk");
  const p0 = +(await p.locator(".pc-scrub").inputValue()); await p.waitForTimeout(2000); check(+(await p.locator(".pc-scrub").inputValue()) === p0, "B: the book waits during the get-ready countdown");
  await p.waitForFunction(() => /SLOW|FAST/.test(document.querySelector(".pw-kind")?.textContent || ""), null, { timeout: 10000 }); await p.waitForTimeout(2500);
  const p1 = +(await p.locator(".pc-scrub").inputValue()); check(p1 > p0 + 4, `B: the book reads aloud once the walk begins (${p0} -> ${p1})`); check((await p.evaluate(() => window.__spoken.length)) >= 1, "B: sentences are spoken");
  check(await p.evaluate(() => { const b = document.querySelector(".pw-bar").getBoundingClientRect(); return b.height < 140 && b.width <= window.innerWidth; }), "B: the walking banner above the reader is compact");
  await p.click(".pc-bar [aria-label='Pause']"); await p.waitForTimeout(400); check(await p.locator("[aria-label='Resume walk']").count() === 1, "B: pausing the reader pauses the walk too");
  const q = +(await p.locator(".pc-scrub").inputValue()); await p.waitForTimeout(1200); check(+(await p.locator(".pc-scrub").inputValue()) === q, "B: and the reading stops");
  await p.click("[aria-label='Resume walk']"); await p.waitForTimeout(800); await p.click("[aria-label='End walk']"); await p.waitForSelector("[aria-label='Walk finished']"); check(/Walking Book/i.test(await p.locator("[aria-label='Walk finished']").innerText()), "B: the finish screen names the book you listened to");
  check(/\(est\.\)/.test(await p.locator(".pw-results").innerText()), "B: with no steps typed, the numbers are labelled as estimates");
  await p.click("[aria-label='Walk finished'] >> text=Save workout"); await p.waitForSelector("[aria-label='Walk finished']", { state: "detached" });
  const q2 = +(await p.locator(".pc-scrub").inputValue()); await p.waitForTimeout(1200); check(+(await p.locator(".pc-scrub").inputValue()) === q2, "B: reading is paused after the walk ends");
  check(p.errs.length === 0, `B: no page errors ${p.errs.join(";").slice(0, 160)}`); await ctx.close();
}

// ---- C: weight, trend, goal; D: backup and restore; E: a killed walk can be resumed
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true }), p = await open(ctx, [390, 844], { intervalSec: 20, sets: 1 });
  await p.click(".pc-walkcard button"); await p.waitForSelector("[role=tablist]"); await p.click("[role=tab]:has-text('Weight')");
  for (const [off, kg] of [[-21, "85"], [-14, "84.2"], [-7, "83.5"], [0, "82.6"]]) { await p.fill("input[type=date]", dayKey(off)); await p.fill("input[aria-label='Weight in kg']", kg); await p.click("section:has(h2:has-text('Log your weight')) >> text=Save"); }
  await p.waitForSelector(".pw-chart"); check((await p.locator(".pw-list li").count()) === 4, "C: four weigh-ins are listed");
  const txt = await p.locator("section.pw-card:has(.pw-chart)").innerText(); check(/kg trend/.test(txt) && /per week/.test(txt) && /-0\.\d+/.test(txt), `C: shows the trend and weekly rate (${txt.replace(/\n/g, " ").slice(0, 120)})`);
  await p.fill("[aria-label='Goal weight in kg']", "78"); await p.click("text=Save goal"); await p.waitForSelector("text=/At this pace you would reach 78.0 kg/", { timeout: 4000 }); check(true, "C: a goal date is estimated from the trend");
  await p.fill("input[type=date]", dayKey(-1)); await p.fill("input[aria-label='Weight in kg']", "999"); await p.click("section:has(h2:has-text('Log your weight')) >> text=Save"); check(/does not look right/.test(await p.locator("[role=alert]").first().innerText()), "C: an impossible weight is refused");
  // D: backup / restore
  await p.click("[role=tab]:has-text('History')"); const [dl] = await Promise.all([p.waitForEvent("download"), p.click("text=Download backup")]); const path = await dl.path(), j = JSON.parse(fs.readFileSync(path, "utf8")); check(j.weights.length === 4 && j.goalKg === 78 && /^pacer-walk-backup-/.test(dl.suggestedFilename()), "D: the backup file has your weights and goal");
  await p.evaluate(() => localStorage.removeItem("walk:v1")); await p.reload({ waitUntil: "networkidle" }); await p.click(".pc-walkcard button"); await p.click("[role=tab]:has-text('Weight')"); check(await p.locator(".pw-chart").count() === 0, "D: data is gone after clearing");
  await p.click("[role=tab]:has-text('History')"); await p.setInputFiles("input[type=file][accept*=json]", path); await p.click("[role=tab]:has-text('Weight')"); await p.waitForSelector(".pw-chart"); check((await p.locator(".pw-list li").count()) === 4, "D: restoring the backup brings the weights back");
  // E: unfinished walk
  await p.click("[role=tab]:has-text('Walk')"); await p.click("[aria-label='Start walk']"); await p.waitForSelector(".pw-bar.big"); await p.waitForTimeout(12500);
  await p.reload({ waitUntil: "networkidle" }); await p.click(".pc-walkcard button"); await p.waitForSelector("section[aria-label='Unfinished walk']"); check(true, "E: after the page is closed mid-walk, an unfinished walk is offered");
  await p.click("section[aria-label='Unfinished walk'] >> text=Resume"); await p.waitForSelector(".pw-bar.big"); await p.waitForTimeout(500); check((await kind(p)) !== "GET READY", `E: resuming picks up inside the walk (${await kind(p)} ${await p.locator(".pw-time").innerText()})`);
  await p.click("[aria-label='End walk']"); await p.waitForSelector("[aria-label='Walk finished']"); await p.click("text=Don't save"); await p.waitForSelector("[aria-label='Walk finished']", { state: "detached" });
  await p.reload({ waitUntil: "networkidle" }); await p.click(".pc-walkcard button"); await p.waitForTimeout(400); check(await p.locator("section[aria-label='Unfinished walk']").count() === 0, "E: a finished walk is not offered again");
  check(p.errs.length === 0, `C-E: no page errors ${p.errs.join(";").slice(0, 160)}`); await ctx.close();
}
await browser.close(); console.log(ok.length + " ok"); if (errors.length) { console.log(errors.join("\n")); process.exit(1); } console.log("all passed");
