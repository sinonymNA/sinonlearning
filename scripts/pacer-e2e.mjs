// Browser check for Pacer (/pacer). Usage: node scripts/pacer-e2e.mjs [--url http://localhost:3100] [--shots dir] [--only iphone-p,laptop]
// Builds REAL files (a PDF printed by Chromium with a running header, footer and page numbers; an EPUB; a copy-protected EPUB; an image-only PDF), opens them through the file input, and checks
// extraction, the three modes, speed control and real-time pacing, recall check-ins, resume, and fit at six screen sizes.
import { chromium } from "playwright";
import JSZip from "jszip";
import fs from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100") + "/pacer", SHOTS = arg("shots", "/tmp"), only = arg("only", "");
const errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const sizes = { "iphone-p": [390, 844], "iphone-l": [844, 390], "ipad-p": [820, 1180], "ipad-l": [1180, 820], laptop: [1366, 768], tiny: [320, 568] };
const DIR = "/tmp/pacer-e2e"; fs.mkdirSync(DIR, { recursive: true });

// ---- real files
const WORDS = "river stone morning window quiet garden bridge lantern harvest silver paper candle mountain whisper ladder meadow copper thunder button orchard".split(" ");
const sentence = (n, seed) => { const w = []; for (let i = 0; i < n; i++) w.push(WORDS[(seed * 7 + i * 3) % WORDS.length]); return w.join(" ").replace(/^./, (c) => c.toUpperCase()) + "."; };
const para = (s) => Array.from({ length: 5 }, (_, i) => sentence(11 + ((s + i) % 5), s + i)).join(" ");
{
  const ctx = await browser.newContext(), p = await ctx.newPage();
  const body = [`<h1>Part One: The Orchard</h1>`, `<p>Alphaword begins the very first paragraph. ${para(1)}</p>`, ...Array.from({ length: 24 }, (_, i) => `<p>${para(i + 2)}</p>`), `<p>${para(40)} Omegaword ends the book.</p>`].join("");
  await p.setContent(`<html><head><style>@page{size:A4;margin:28mm 20mm} body{font:12pt/1.5 Georgia,serif} h1{font-size:22pt} p{margin:0 0 10pt;text-align:justify}</style></head><body>${body}</body></html>`);
  await p.pdf({ path: `${DIR}/book.pdf`, format: "A4", displayHeaderFooter: true, headerTemplate: `<div style="font-size:9px;width:100%;text-align:center">RUNNING HEADER TITLE</div>`, footerTemplate: `<div style="font-size:9px;width:100%;text-align:center">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`, margin: { top: "28mm", bottom: "28mm", left: "20mm", right: "20mm" } });
  await p.setContent(`<html><body style="margin:0"><img src="data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="white"/><circle cx="300" cy="400" r="150" fill="black"/></svg>')}" width="600" height="800"/></body></html>`); await p.pdf({ path: `${DIR}/scan.pdf`, width: "600px", height: "800px" });
  await ctx.close();
}
const xhtml = (t, b) => `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${t}</title></head><body>${b}</body></html>`;
async function epub(drm) {
  const z = new JSZip(); z.file("mimetype", "application/epub+zip"); z.file("META-INF/container.xml", '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'); if (drm) z.file("META-INF/encryption.xml", "<encryption><EncryptedData><CipherData/></EncryptedData></encryption>");
  z.file("OEBPS/content.opf", `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>The Lantern Book</dc:title><dc:creator>I. Tester</dc:creator></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${[1, 2, 3].map((n) => `<item id="c${n}" href="c${n}.xhtml" media-type="application/xhtml+xml"/>`).join("")}</manifest><spine>${[1, 2, 3].map((n) => `<itemref idref="c${n}"/>`).join("")}</spine></package>`);
  z.file("OEBPS/nav.xhtml", xhtml("Nav", `<nav><ol>${[1, 2, 3].map((n) => `<li><a href="c${n}.xhtml">${["The Lamp", "The Road", "The Door"][n - 1]}</a></li>`).join("")}</ol></nav>`));
  [1, 2, 3].forEach((n) => z.file(`OEBPS/c${n}.xhtml`, xhtml(String(n), `<h1>Chapter ${n}</h1>${Array.from({ length: 8 }, (_, i) => `<p>${n === 2 && i === 0 ? "Middlemark starts chapter two. " : ""}${para(n * 10 + i)}</p>`).join("")}`)));
  fs.writeFileSync(`${DIR}/${drm ? "drm" : "book"}.epub`, await z.generateAsync({ type: "uint8array" }));
}
await epub(false); await epub(true);

const seed = (settings = {}) => (ctx) => ctx.addInitScript(([s]) => { if (!localStorage.getItem("pacer:v1")) localStorage.setItem("pacer:v1", JSON.stringify({ settings: s, library: [], sessions: [] })); }, [settings]);
const scrubVal = async (p) => +(await p.locator(".pc-scrub").inputValue());
const fitOf = (p) => p.evaluate(() => ({ sw: document.documentElement.scrollWidth <= innerWidth + 1, sh: document.documentElement.scrollHeight <= innerHeight + 1, bar: document.querySelector(".pc-bar")?.getBoundingClientRect().bottom <= innerHeight + 1, top: document.querySelector(".pc-top")?.getBoundingClientRect().top >= -1 }));

for (const [name, [w, h]] of Object.entries(sizes)) {
  if (only && !only.split(",").includes(name)) continue;
  const mobile = w < 900; const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile }); await seed({ mode: "pacer", wpm: 250 })(ctx);
  const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}] pageerror ${e.message}`)); p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`[${name}] console ${m.text()}`); });
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".pc-drop");
  check((await p.locator("h1").innerText()) === "Pacer" && /never leaves this device/.test(await p.locator(".pc-priv").innerText()), `${name}: the library explains Pacer and says files never leave the device`);
  check((await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)), `${name}: the library has no sideways scroll`); if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/pacer-${name}-library.png` });

  // ---- the sample, in Pacer mode: real-time pacing and speed control
  await p.click("text=Try a sample"); await p.waitForSelector(".pc-page .w"); await p.waitForTimeout(300);
  let f = await fitOf(p); check(f.sw && f.sh && f.bar && f.top, `${name}: the reading room fits the screen with the controls visible`);
  check((await p.locator(".pc-wpm b").innerText()) === "250", `${name}: starts at the saved speed (250 wpm)`); const s0 = await scrubVal(p); await p.keyboard.press("Space"); await p.waitForTimeout(4000); await p.keyboard.press("Space"); const s1 = await scrubVal(p), moved = s1 - s0;
  check(moved >= 10 && moved <= 28, `${name}: 4 seconds at 250 wpm read about 17 words (${moved})`); check((await p.locator(".pc-page .w.cur").count()) === 1, `${name}: exactly one word is highlighted`);
  const s2 = await scrubVal(p); await p.waitForTimeout(700); check((await scrubVal(p)) === s2, `${name}: pausing stops the reading`);
  await p.keyboard.press("ArrowUp"); await p.keyboard.press("ArrowUp"); await p.waitForTimeout(120); check((await p.locator(".pc-wpm b").innerText()) === "270", `${name}: the arrow keys change the speed (270)`); await p.click("[aria-label='Faster']"); await p.click("button:has-text('500')"); await p.waitForTimeout(120); check((await p.locator(".pc-wpm b").innerText()) === "500", `${name}: the presets change the speed (500)`);
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(120); const sA = await scrubVal(p); await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(120); check((await scrubVal(p)) < sA, `${name}: the arrow keys jump by sentence`);
  const wi = await p.locator(".pc-page .w").nth(60).getAttribute("data-i"); await p.locator(".pc-page .w").nth(60).click(); await p.waitForTimeout(120); check((await scrubVal(p)) === +wi, `${name}: clicking a word jumps there`);
  if (name === "iphone-p" || name === "laptop") { await p.keyboard.press("Space"); await p.waitForTimeout(1500); await p.screenshot({ path: `${SHOTS}/pacer-${name}-pacer.png` }); await p.keyboard.press("Space"); }
  // ---- Focus mode: the pivot letter stays put
  await p.click("[role=tab]:has-text('Focus')"); await p.waitForTimeout(200); await p.click("[aria-label='Play']"); await p.waitForTimeout(500);
  { const xs = []; for (let i = 0; i < 6; i++) { await p.waitForTimeout(260); const b = await p.locator(".pc-word .p").boundingBox(); if (b) xs.push(b.x + b.width / 2); } const mid = w / 2; check(xs.length >= 4 && xs.every((x) => Math.abs(x - mid) < 6), `${name}: Focus keeps the red pivot letter at the centre as words change (${xs.map((x) => Math.round(x)).join(",")})`); }
  if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/pacer-${name}-focus.png` }); await p.keyboard.press("Space");
  // ---- Scroll mode: the page glides
  await p.click("[role=tab]:has-text('Scroll')"); await p.waitForTimeout(300); const t0 = await p.evaluate(() => document.querySelector(".pc-scroll").scrollTop); await p.click("[aria-label='Play']"); await p.waitForTimeout(3500); const t1 = await p.evaluate(() => document.querySelector(".pc-scroll").scrollTop); await p.keyboard.press("Space"); check(t1 > t0 + 15, `${name}: Scroll mode glides the page (${Math.round(t0)} -> ${Math.round(t1)})`);
  // ---- settings
  await p.click("[aria-label='Settings']"); await p.waitForSelector(".pc-drawer"); await p.click(".pc-drawer button:has-text('Night')"); check((await p.locator(".pc-root").getAttribute("data-theme")) === "night", `${name}: the Night theme applies`); f = await fitOf(p); check(f.sw && f.sh, `${name}: the settings drawer does not break the layout`); if (name === "iphone-p" || name === "laptop") await p.screenshot({ path: `${SHOTS}/pacer-${name}-settings.png` }); await p.click(".pc-drawer button:has-text('Done')");
  // ---- leave, the session is remembered, resume works
  await p.click("[aria-label='Back to the library']"); await p.waitForSelector(".pc-books"); const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("pacer:v1"))); check(saved.library.length === 1 && saved.library[0].pos > 0 && saved.sessions.length >= 1, `${name}: the book, the place and the session are saved (pos ${saved.library[0]?.pos})`);
  await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector(".pc-book"); await p.click(".pc-book"); await p.waitForSelector(".pc-page .w"); check(Math.abs((await scrubVal(p)) - saved.library[0].pos) <= 1, `${name}: after a reload the book is still there and resumes where you were`); await p.click("[aria-label='Back to the library']"); await p.click(".pc-x"); await p.waitForTimeout(300); check((await p.locator(".pc-book").count()) === 0, `${name}: a book can be removed from the device`);
  await ctx.close();
}
// ---- real files (laptop and phone)
for (const [name, [w, h]] of Object.entries({ "iphone-p": sizes["iphone-p"], laptop: sizes.laptop })) {
  if (only && !only.split(",").includes(name)) continue;
  const mobile = w < 900; const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile }); await seed({ mode: "pacer", wpm: 250 })(ctx); const p = await ctx.newPage(); p.on("pageerror", (e) => errors.push(`[${name}/files] pageerror ${e.message}`));
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".pc-drop"); const text = () => p.evaluate(() => document.querySelector(".pc-page").innerText);
  // PDF: header, footer and page numbers gone, headings and body kept
  await p.setInputFiles("input[type=file]", `${DIR}/book.pdf`); await p.waitForSelector(".pc-page .w", { timeout: 30000 }); const pdf = await text();
  check(/Alphaword begins/.test(pdf) && !/RUNNING HEADER/.test(pdf) && !/Page \d+ of \d+/.test(pdf), `${name}: a real PDF opens, and its running header and page numbers are removed`); check(/Part One: The Orchard/.test(pdf), `${name}: the PDF heading is kept`);
  const nWords = await p.locator(".pc-scrub").getAttribute("max"); check(+nWords > 1200 && +nWords < 2400, `${name}: the PDF's whole text is there (${nWords} words)`); check(!/\w-\s\w/.test(pdf.slice(0, 2000).replace(/ - /g, " ")), `${name}: no stray line-break hyphens`);
  await p.click("[aria-label='Back to the library']"); await p.waitForSelector(".pc-books");
  // EPUB: chapters with titles from the book's own table of contents
  await p.setInputFiles("input[type=file]", `${DIR}/book.epub`); await p.waitForSelector(".pc-select"); const opts = await p.locator(".pc-select option").allInnerTexts(); check(JSON.stringify(opts) === JSON.stringify(["The Lamp", "The Road", "The Door"]), `${name}: an EPUB opens with its chapter list (${opts.join(" | ")})`); check(/The Lantern Book/.test(await p.locator(".pc-title").innerText()), `${name}: the EPUB title is read`);
  await p.selectOption(".pc-select", "1"); await p.waitForTimeout(300); check(/Middlemark starts chapter two/.test(await text()), `${name}: choosing a chapter jumps to it`); await p.keyboard.press("]"); await p.waitForTimeout(200); check(/Chapter 3/.test(await text()), `${name}: the ] key goes to the next chapter`);
  await p.click("[aria-label='Back to the library']"); await p.waitForSelector(".pc-books"); check((await p.locator(".pc-book").count()) === 2, `${name}: both books are in the library`);
  // friendly errors
  await p.setInputFiles("input[type=file]", `${DIR}/drm.epub`); await p.waitForSelector(".pc-err"); check(/copy-protected/.test(await p.locator(".pc-err").innerText()), `${name}: a copy-protected EPUB says so plainly`);
  await p.setInputFiles("input[type=file]", `${DIR}/scan.pdf`); await p.waitForFunction(() => /almost no selectable text/.test(document.querySelector(".pc-err")?.textContent || ""), null, { timeout: 20000 }); check(true, `${name}: an image-only PDF says it has no selectable text`);
  await p.click("text=Paste text"); await p.fill("textarea", "One short line."); check(await p.locator(".pc-paste .pc-btn").isDisabled(), `${name}: tiny pasted text is not accepted`); await p.fill("textarea", "Pasted words are fine. ".repeat(20)); await p.click(".pc-paste .pc-btn"); await p.waitForSelector(".pc-page .w"); check(/Pasted words/.test(await text()), `${name}: pasted text opens`);
  await ctx.close();
}
// ---- recall check-ins slow you down when you miss
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } }); await seed({ mode: "pacer", wpm: 1000, smart: false, checks: 40 })(ctx); const p = await ctx.newPage(); await p.goto(BASE, { waitUntil: "networkidle" }); await p.click("text=Try a sample"); await p.waitForSelector(".pc-page .w"); await p.click("[aria-label='Play']");
  await p.waitForSelector(".pc-modal[aria-label='Quick check']", { timeout: 15000 }); check(true, "a recall check-in appears after the set number of words and pauses the reading"); const at = await scrubVal(p); await p.waitForTimeout(500); check((await scrubVal(p)) === at, "reading stays paused while the check-in is open");
  await p.click("button:has-text('Show me the text')"); check((await p.locator(".pc-modal .mut").first().innerText()).length > 20, "the text of the last part can be revealed to check yourself"); await p.click("button:has-text('Missed it')"); await p.waitForTimeout(600); check((await p.locator(".pc-wpm b").innerText()) === "880", "missing a check-in takes 12% off the speed (1000 -> 880)"); check((await scrubVal(p)) < at, "...and goes back a little to reread");
  await p.click("[aria-label='Pause']").catch(() => {}); await ctx.close();
}
await browser.close();
console.log(ok.length + " checks passed"); if (errors.length) { console.log(errors.join("\n")); process.exit(1); } console.log("ALL GOOD");
