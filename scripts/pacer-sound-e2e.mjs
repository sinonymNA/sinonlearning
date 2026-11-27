// Browser check for Pacer's read-aloud voice and background music. Headless Chromium has no speech voices and the sandbox may not reach YouTube,
// so this installs a FAKE speechSynthesis (it fires real boundary/end events on a timer) and a FAKE YouTube iframe API, and checks that Pacer drives them correctly.
// Usage: node scripts/pacer-sound-e2e.mjs [--url http://localhost:3100]
import { chromium } from "playwright";
import fs from "node:fs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("url", "http://localhost:3100") + "/pacer", errors = [], ok = [], check = (c, m) => (c ? ok : errors).push((c ? "" : "FAIL ") + m);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const WORDS = "river stone morning window quiet garden bridge lantern harvest silver paper candle mountain whisper ladder meadow".split(" ");
fs.mkdirSync("/tmp/pacer-sound", { recursive: true });
fs.writeFileSync("/tmp/pacer-sound/b.txt", Array.from({ length: 12 }, (_, p) => Array.from({ length: 4 }, (_, s) => Array.from({ length: 8 }, (_, i) => WORDS[(p * 3 + s * 5 + i) % WORDS.length]).join(" ") + ".").join(" ")).join("\n\n"));

const FAKE_SPEECH = () => {
  const voices = [{ name: "Fred", lang: "en-US", default: true, localService: true }, { name: "Microsoft Aria Online (Natural)", lang: "en-US", default: false, localService: false }, { name: "Amélie", lang: "fr-FR", localService: true }];
  window.__spoken = []; let cur = null, timer = null;
  class Utt { constructor(t) { this.text = t; this.rate = 1; } }
  const finish = () => { clearInterval(timer); timer = null; const u = cur; cur = null; u && u.onend && u.onend({}); };
  Object.defineProperty(window, "SpeechSynthesisUtterance", { value: Utt, configurable: true, writable: true });
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
    getVoices: () => voices, addEventListener() {}, removeEventListener() {}, speaking: false,
    cancel() { clearInterval(timer); timer = null; cur = null; },
    speak(u) { if (!u.text.trim()) return; window.__spoken.push({ text: u.text, rate: u.rate, voice: u.voice && u.voice.name }); cur = u; const words = u.text.split(" "), offs = []; let o = 0; for (const w of words) { offs.push(o); o += w.length + 1; } let k = 0;
      setTimeout(() => { if (cur !== u) return; u.onstart && u.onstart({}); timer = setInterval(() => { if (cur !== u) return; if (k < words.length) { u.onboundary && u.onboundary({ name: "word", charIndex: offs[k] }); k++; } else finish(); }, 60); }, 20); },
  } });
};
const FAKE_YT = `window.__yt = { calls: [] }; window.YT = { Player: function (el, opts) { const me = this; window.__yt.opts = opts; const log = (n, a) => window.__yt.calls.push([n].concat(a || []));
  const f = document.createElement("iframe"); f.title = "fake youtube"; el.replaceWith(f); this.f = f;
  const m = { playVideo() { log("play"); opts.events.onStateChange({ data: 1 }); }, pauseVideo() { log("pause"); opts.events.onStateChange({ data: 2 }); }, setVolume(v) { log("vol", [v]); }, loadVideoById(id) { log("load", [id]); opts.events.onStateChange({ data: 1 }); }, cueVideoById(id) { log("cue", [id]); }, loadPlaylist(o) { log("loadPlaylist", [o.list]); opts.events.onStateChange({ data: 1 }); }, cuePlaylist(o) { log("cuePlaylist", [o.list]); }, setLoop() {}, seekTo() {}, destroy() { log("destroy"); }, getVideoData() { return { title: "Fake Lo-fi Beats" }; } };
  Object.assign(this, m); setTimeout(() => opts.events.onReady({}), 30); }, PlayerState: {} }; window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady();`;

for (const [name, [w, h]] of Object.entries({ "iphone-p": [390, 844], "ipad-l": [1180, 820], tiny: [320, 568] })) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true }), p = await ctx.newPage(), errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await ctx.addInitScript(FAKE_SPEECH); await ctx.route("https://www.youtube.com/iframe_api", (r) => r.fulfill({ contentType: "application/javascript", body: FAKE_YT }));
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".pc-drop"); await p.setInputFiles("input[type=file]", "/tmp/pacer-sound/b.txt"); await p.waitForSelector(".pc-page .w");
  // ---- voice
  await p.click("[aria-label='Sound: read aloud and music']"); await p.waitForSelector(".pc-sound");
  const opts = await p.locator("select[aria-label=Voice] option").allInnerTexts(); check(opts[1].startsWith("Microsoft Aria") && /natural/i.test(opts[1]) && !opts.some((o) => /Amélie/.test(o)), `${name}: voices are ranked best first, other languages hidden (${opts.join("|")})`);
  const box = await p.locator(".pc-sound .pc-card").boundingBox(); check(box.x >= 0 && box.x + box.width <= w + 1 && box.y >= 0 && box.y + box.height <= h + 1, `${name}: the sound panel fits the screen`);
  await p.click(".pc-sound .pc-toggle input >> nth=0"); check(await p.locator(".pc-sound .pc-toggle input").first().isChecked(), `${name}: read aloud switches on`);
  await p.click(".pc-sound >> text=Done"); const p0 = +(await p.locator(".pc-scrub").inputValue());
  await p.click("[aria-label='Play']"); await p.waitForTimeout(2500);
  const sp = await p.evaluate(() => window.__spoken); check(sp.length >= 1 && /^[A-Za-z ]+\.$/.test(sp[0].text) && sp[0].voice === "Microsoft Aria Online (Natural)", `${name}: it speaks sentence by sentence with the best voice (${JSON.stringify(sp[0])})`);
  const p1 = +(await p.locator(".pc-scrub").inputValue()); check(p1 > p0 + 6, `${name}: the highlight follows the voice (${p0} -> ${p1})`);
  const cur = await p.evaluate(() => document.querySelector(".pc-page .cur")?.textContent); const spoken = sp.map((x) => x.text).join(" ").toLowerCase(); check(cur && spoken.includes(cur.toLowerCase().replace(/[^a-z]/g, "")), `${name}: the highlighted word is one that was just spoken (${cur})`);
  await p.click("[aria-label='Pause']"); const nSp = (await p.evaluate(() => window.__spoken)).length; await p.waitForTimeout(700); const p2 = +(await p.locator(".pc-scrub").inputValue()); await p.waitForTimeout(500);
  check((await p.evaluate(() => window.__spoken)).length === nSp && +(await p.locator(".pc-scrub").inputValue()) === p2, `${name}: pausing silences the voice and stops the highlight`);
  await p.keyboard.press("ArrowRight"); const afterSkip = +(await p.locator(".pc-scrub").inputValue()); check(afterSkip > p2, `${name}: sentence skip still works`);
  const rate0 = sp.at(-1).rate; await p.click("[aria-label='Play']"); for (let i = 0; i < 4; i++) await p.keyboard.press("ArrowUp"); await p.waitForTimeout(1600);
  const rate1 = (await p.evaluate(() => window.__spoken)).at(-1).rate; check(rate1 > rate0, `${name}: raising the speed raises the voice rate (${rate0} -> ${rate1})`);
  await p.click("[aria-label='Pause']");
  // ---- music
  await p.click("[aria-label='Sound: read aloud and music']"); await p.fill("input[aria-label='YouTube link']", "not a link"); await p.click(".pc-sound >> text=Add"); check(/does not look like a YouTube link/.test(await p.locator(".pc-sound .pc-err").innerText()), `${name}: a bad link is refused with a plain message`);
  await p.fill("input[aria-label='YouTube link']", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5"); await p.click(".pc-sound >> text=Add"); await p.fill("input[aria-label='YouTube link']", "https://youtu.be/dQw4w9WgXcQ"); await p.click(".pc-sound >> text=Add");
  check((await p.locator(".pc-tracks li").count()) === 1 && /already in your list/.test(await p.locator(".pc-sound .pc-err").innerText()), `${name}: one track added, duplicate refused`);
  await p.fill("input[aria-label='YouTube link']", "https://www.youtube.com/playlist?list=PLabcdefghijklmnop"); await p.click(".pc-sound >> text=Add"); check((await p.locator(".pc-tracks li").count()) === 2, `${name}: a playlist link can be added too`);
  await p.click(".pc-sound >> text=Play music"); await p.waitForSelector(".pc-dock iframe"); await p.waitForTimeout(300);
  const calls = await p.evaluate(() => window.__yt.calls.map((c) => c[0])); check(calls.includes("load") && calls.includes("vol"), `${name}: music starts through the YouTube player (${calls.join(",")})`);
  check((await p.evaluate(() => window.__yt.opts.host)) === "https://www.youtube-nocookie.com", `${name}: uses the privacy-enhanced YouTube host`);
  const dock = await p.locator(".pc-dock").boundingBox(); check(dock.width >= 199 && dock.height >= 200 && dock.x >= 0 && dock.x + dock.width <= w && dock.y >= 0 && dock.y + dock.height <= h, `${name}: the player stays visible at 200px or more and on screen`);
  await p.click(".pc-sound >> text=Pause music"); await p.waitForTimeout(150); check((await p.evaluate(() => window.__yt.calls.map((c) => c[0]))).at(-1) === "pause", `${name}: pause music works`);
  await p.click(".pc-sound >> text=Done"); await p.click("[aria-label='Play']"); await p.waitForTimeout(400);
  check((await p.evaluate(() => window.__yt.calls.map((c) => c[0]))).slice(-2).includes("play"), `${name}: pressing play on the reader also starts the music (follow is on)`);
  await p.click("[aria-label='Pause']"); await p.waitForTimeout(300); check((await p.evaluate(() => window.__yt.calls.map((c) => c[0]))).at(-1) === "pause", `${name}: pausing the reader pauses the music`);
  await p.click("[aria-label='Move the player to another corner']"); check((await p.locator(".pc-dock").getAttribute("data-corner")) === "1", `${name}: the player can move to another corner`);
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("pacer:audio:v1"))); check(saved.voiceOn === true && saved.tracks.length === 2 && saved.tracks[0].title === "Fake Lo-fi Beats", `${name}: choices and the track title are remembered on this device`);
  await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector(".pc-book"); await p.click(".pc-book"); await p.waitForSelector(".pc-page .w"); await p.click("[aria-label='Sound: read aloud and music']"); check((await p.locator(".pc-tracks li").count()) === 2 && (await p.locator(".pc-sound .pc-toggle input").first().isChecked()), `${name}: after a reload the voice and the links are still set`);
  check(errs.length === 0, `${name}: no page errors ${errs.join(";").slice(0, 200)}`);
  await ctx.close();
}
await browser.close(); console.log(ok.length + " ok"); if (errors.length) { console.log(errors.join("\n")); process.exit(1); } console.log("all passed");
