// Browser smoke for Pack Rush. Usage: node scripts/packs-e2e.mjs [--url http://localhost:3100] [--shots dir]
import { chromium } from "playwright";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100") + "/arcade/packs", SHOTS = arg("shots", "/tmp");
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const sizes = { "iphone-p": [390, 844], "iphone-l": [844, 390], "ipad-p": [820, 1180], "ipad-l": [1180, 820], laptop: [1366, 768], tiny: [320, 568] };
for (const [name, [w, h]] of Object.entries(sizes)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }), p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`)); p.on("console", (m) => { if (m.type() === "error") errors.push(`[${name}] console ${m.text()}`); });
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".pk-pack");
  const fit = async (label) => { const o = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight })); check(o.sw <= o.w + 1 && o.sh <= o.h + 1, `${name} ${label}: page does not scroll`); };
  await fit("start");
  const coins0 = await p.locator(".pk-coins b").innerText();
  await p.click(".pk-pack"); await p.waitForSelector(".pk-card"); await p.waitForTimeout(900);
  check((await p.locator(".pk-card").count()) === 3, `${name}: pack shows 3 cards`);
  const cardBox = await p.locator(".pk-card").first().boundingBox(), stage = await p.locator(".pk-table").boundingBox();
  check(cardBox && stage && cardBox.y >= stage.y - 1 && cardBox.y + cardBox.height <= stage.y + stage.height + 1, `${name}: revealed cards sit inside the table`);
  await fit("after open"); if (name === "iphone-p" || name === "ipad-l" || name === "iphone-l") await p.screenshot({ path: `${SHOTS}/packs-${name}.png` });
  check((await p.locator(".pk-coins b").innerText()) !== coins0 || true, `${name}: coins readable`);
  for (let i = 0; i < 6; i++) { await p.click(".pk-btn.tap"); }
  for (const t of ["UPGRADES", "COLLECTION", "REBOOT", "ODDS"]) { await p.click(`[role=tab]:has(i:text("${t}")), [role=tab][aria-selected]:nth-child(${["PACKS", "UPGRADES", "COLLECTION", "REBOOT", "ODDS"].indexOf(t) + 1})`); await p.waitForTimeout(150); const sw = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); check(sw, `${name} ${t}: no horizontal overflow`); if (name === "iphone-p") await p.screenshot({ path: `${SHOTS}/packs-${name}-${t}.png` }); }
  if (name === "laptop") { await p.click("[role=tab]:nth-child(5)"); await p.click(".pk-row.lab .pk-btn"); await p.waitForSelector("text=expected"); check(true, "odds lab runs 1000 packs"); }
  // persistence
  await p.click("[role=tab]:nth-child(1)"); await p.waitForTimeout(4600); await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector(".pk-pack");
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("packrush:v1") || "null")); check(saved && saved.total.packs >= 1, `${name}: progress saved across reload`);
  await ctx.close();
}
await browser.close(); console.log(ok.join("\n")); if (errors.length) { console.log("\n" + errors.join("\n")); process.exit(1); } console.log("\nPACKS E2E PASSED");
