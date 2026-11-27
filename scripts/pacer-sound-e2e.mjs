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

// ---- HD voice (fake Piper: returns real silent WAV clips whose length follows the text, so the real audio element, ended events and timing all run)
for (const [name, [w, h]] of Object.entries({ "iphone-p": [390, 844], laptop: [1366, 768] })) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } }), p = await ctx.newPage(), errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await ctx.addInitScript(() => {
    window.__synth = []; window.__plays = [];
    window.__pacerHdFake = { get stored() { return localStorage.getItem("fakeHdStored") === "1"; }, set stored(v) { localStorage.setItem("fakeHdStored", v ? "1" : "0"); }, synth: async (text) => { window.__synth.push(text); const sr = 8000, n = Math.round(sr * Math.max(0.5, text.length * 0.045)), b = new ArrayBuffer(44 + n * 2), v = new DataView(b), W = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
      W(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); W(8, "WAVE"); W(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); W(36, "data"); v.setUint32(40, n * 2, true); return new Blob([b], { type: "audio/wav" }); } };
    const play = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__plays.push({ rate: this.playbackRate, silent: this.src.startsWith("data:") }); return play.call(this); };
  });
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".pc-drop"); await p.setInputFiles("input[type=file]", "/tmp/pacer-sound/b.txt"); await p.waitForSelector(".pc-page .w");
  await p.click("[aria-label='Sound: read aloud and music']"); await p.waitForSelector(".pc-sound");
  await p.click(".pc-sound .pc-toggle input >> nth=0"); await p.click("input[name=vt] >> nth=1");
  check(/63 MB/.test(await p.locator(".pc-sound").innerText()) && (await p.locator("select[aria-label='HD voice'] option").count()) >= 4, `${name}: HD voice option states the download size and offers voices`);
  await p.click(".pc-sound >> text=/Download \\(63 MB\\)/"); await p.waitForSelector(".pc-sound >> text=Hear it"); check(true, `${name}: HD voice downloads and becomes ready`);
  const box = await p.locator(".pc-sound .pc-card").boundingBox(); check(box.x >= 0 && box.x + box.width <= w + 1 && box.y >= 0 && box.y + box.height <= h + 1, `${name}: the sound panel with the HD section fits the screen`);
  await p.click(".pc-sound >> text=Done"); const p0 = +(await p.locator(".pc-scrub").inputValue());
  await p.click("[aria-label='Play']"); await p.waitForTimeout(4500);
  const synth = await p.evaluate(() => window.__synth), plays = await p.evaluate(() => window.__plays);
  check(synth.length >= 2 && /^[A-Za-z ]+\.$/.test(synth[0]), `${name}: sentences are synthesized one at a time, the next while one plays (${synth.length} asked)`);
  check(plays.some((x) => x.silent) && plays.some((x) => !x.silent), `${name}: the audio element is unlocked by the tap, then plays real clips`);
  const p1 = +(await p.locator(".pc-scrub").inputValue()); check(p1 > p0 + 6, `${name}: the highlight follows the HD voice (${p0} -> ${p1})`);
  await p.click("[aria-label='Pause']"); await p.waitForTimeout(300); const p2 = +(await p.locator(".pc-scrub").inputValue()); await p.waitForTimeout(900); check(+(await p.locator(".pc-scrub").inputValue()) === p2, `${name}: pausing stops the HD voice and the highlight`);
  for (let i = 0; i < 4; i++) await p.keyboard.press("ArrowUp"); await p.click("[aria-label='Play']"); await p.waitForTimeout(1500); const r = (await p.evaluate(() => window.__plays)).at(-1).rate; check(r > 1.3, `${name}: a higher wpm plays the clips faster (rate ${r})`);
  await p.click("[aria-label='Pause']");
  await p.reload({ waitUntil: "networkidle" }); await p.waitForSelector(".pc-book"); await p.click(".pc-book"); await p.waitForSelector(".pc-page .w"); await p.click("[aria-label='Sound: read aloud and music']"); await p.waitForSelector(".pc-sound >> text=Hear it", { timeout: 8000 });
  check(true, `${name}: after a reload an already-downloaded HD voice loads by itself`); check(errs.length === 0, `${name}: no page errors ${errs.join(";").slice(0, 200)}`);
  await p.click(".pc-sound >> text=Remove voice"); await p.waitForSelector(".pc-sound >> text=/Download/"); check(true, `${name}: the voice can be removed`);
  await ctx.close();
}

// ---- rain, the self-hosted HD runtime, and the cache writer
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage(), errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await ctx.addInitScript(() => { window.__ac = []; const AC = window.AudioContext; window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__ac.push(this); } }; });
  await p.goto(BASE, { waitUntil: "networkidle" }); await p.waitForSelector(".pc-drop"); await p.setInputFiles("input[type=file]", "/tmp/pacer-sound/b.txt"); await p.waitForSelector(".pc-page .w");
  const state = () => p.evaluate(() => (window.__ac[0] ? window.__ac[0].state : "none"));
  await p.click("[aria-label='Sound: read aloud and music']"); await p.click("section[aria-label=Rain] input[type=checkbox]");
  check((await p.locator("section[aria-label=Rain] .pc-chips button").allInnerTexts()).join() === "Light,Steady,Heavy", "rain: strength choices are shown");
  const box = await p.locator(".pc-sound .pc-card").boundingBox(); check(box.y >= 0 && box.y + box.height <= 844 + 1, "rain: the sound panel still fits a phone");
  check((await state()) === "none", "rain: nothing starts until you read (it follows your reading)");
  await p.click("section[aria-label=Rain] .pc-chips button >> text=Heavy"); await p.click(".pc-sound >> text=Done"); await p.click("[aria-label='Play']"); await p.waitForTimeout(1200);
  check((await state()) === "running", "rain: starts when you press play"); await p.click("[aria-label='Pause']"); await p.waitForTimeout(2300); check((await state()) === "suspended", "rain: fades and stops using the CPU when you pause");
  await p.click("[aria-label='Sound: read aloud and music']"); await p.click("section[aria-label=Rain] >> text=Play only while I read"); await p.waitForTimeout(1000); check((await state()) === "running", "rain: with follow off it plays straight away");
  await p.click("section[aria-label=Rain] input[type=checkbox]"); await p.waitForTimeout(2300); check((await state()) === "suspended", "rain: turning it off stops it");
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("pacer:audio:v1"))); check(saved.rainLevel === 2 && saved.follow === false, "rain: strength and settings are remembered");
  // self-hosted runtime (no cdnjs / jsdelivr)
  for (const [path, min] of [["/pacer-hd/piper_phonemize.wasm", 500000], ["/pacer-hd/piper_phonemize.data", 17000000], ["/pacer-hd/ort/ort-wasm-simd.wasm", 9000000], ["/pacer-hd/ort/ort-wasm-simd-threaded.wasm", 9000000]]) { const r = await ctx.request.get(new URL(path, BASE).href); check(r.ok() && (await r.body()).length > min, `hd runtime: ${path} is served by this site`); }
  // cache writer: write 3 chunks through a worker sync access handle, read back through the same API the voice library uses, then remove
  const res = await p.evaluate(async () => {
    const t = window.__pacerHdTools; if (!t) return { err: "no hook" }; const w = await t.openWriter("e2e-test.onnx"), parts = [1, 2, 3].map((n) => Uint8Array.from({ length: 700000 + n }, (_, i) => (i * n + 7) & 255)); for (const u of parts) await w.write(u);
    const size = await w.close(), root = await navigator.storage.getDirectory(), dir = await root.getDirectoryHandle("piper"), file = await (await dir.getFileHandle("e2e-test.onnx")).getFile(), got = new Uint8Array(await file.arrayBuffer());
    let same = got.length === parts.reduce((a, u) => a + u.length, 0), off = 0; for (const u of parts) { for (let i = 0; i < u.length && same; i += 997) if (got[off + i] !== u[i]) same = false; off += u.length; }
    await dir.removeEntry("e2e-test.onnx"); let gone = false; try { await dir.getFileHandle("e2e-test.onnx"); } catch { gone = true; }
    return { size, len: got.length, same, gone, path: t.voicePath("en_US-hfc_female-medium") };
  });
  check(res.same && res.size === res.len && res.gone, `cache writer: chunks written through a worker read back byte for byte, then removed (${JSON.stringify(res)})`);
  check(res.path === "en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx", "cache writer: voice ids map to the right file path");
  check(errs.length === 0, `rain/hd: no page errors ${errs.join(";").slice(0, 200)}`); await ctx.close();
}
await browser.close(); console.log(ok.length + " ok"); if (errors.length) { console.log(errors.join("\n")); process.exit(1); } console.log("all passed");
