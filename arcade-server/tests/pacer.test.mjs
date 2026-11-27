import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { SENT, CLAUSE, PARA, HEAD, tokenize, orpIndex, splitOrp, factorFor, beatMs, delayMs, buildFactorPrefix, timeLeftMs, chunkEnd, chunkText, sentenceStart, nextSentence, prevSentence, paragraphRange, rampWpm, adaptWpm, sessionStats, paceLabel, findMatches, normWord } from "../../lib/pacer/engine.mjs";
import { textToParas, pagesToParas } from "../../lib/pacer/text.mjs";
import { parseEpub, xhtmlToParas } from "../../lib/pacer/epub.mjs";

const doc = tokenize([{ text: "Chapter One", kind: "h" }, { text: "Mr. Smith went home, tired. He sat down! Then he slept." , kind: "p" }, { text: "The next day was 2024.", kind: "p" }]);

test("tokenize: words, sentence ends (not after Mr. or a list number), clause pauses, paragraph ends and headings", () => {
  assert.deepEqual(doc.words.slice(0, 4), ["Chapter", "One", "Mr.", "Smith"]); const at = (w) => doc.flags[doc.words.indexOf(w)];
  assert.ok(at("One") & HEAD && at("One") & SENT && at("One") & PARA, "a heading ends its own sentence"); assert.equal(at("Mr.") & SENT, 0, "Mr. does not end a sentence"); assert.ok(at("home,") & CLAUSE); assert.ok(at("tired.") & SENT); assert.ok(at("down!") & SENT); assert.ok(at("slept.") & (SENT | PARA)); assert.equal(doc.paraStart.length, 3); assert.equal(doc.paraStart[1], 2);
  assert.equal(tokenize([{ text: "   ", kind: "p" }]).words.length, 0); assert.equal(tokenize([{ text: "Item 3. is fine", kind: "p" }]).flags[1] & SENT, 0);
});
test("pivot letter: about a third in, quotes skipped, always inside the word", () => {
  assert.equal(orpIndex("a"), 0); assert.equal(orpIndex("the"), 1); assert.equal(orpIndex("reading"), 2); assert.equal(orpIndex("understanding"), 3); assert.equal(orpIndex("internationalization"), 4); assert.equal(orpIndex('"hello"'), 2, "the opening quote is skipped");
  assert.deepEqual(splitOrp("reading"), ["re", "a", "ding"]); for (const w of ["a", "I'm", '"x"', "...", "naïve", "é"]) { const [l, p, r] = splitOrp(w); assert.equal(l + p + r, w); }
});
test("timing: the beat is 60000/wpm, long words and punctuation take longer, smart pauses can be switched off, speed is clamped", () => {
  assert.equal(beatMs(300), 200); assert.equal(beatMs(10), beatMs(60)); assert.equal(beatMs(99999), beatMs(1200));
  assert.ok(factorFor("a", 0) < 1 && factorFor("extraordinarily", 0) > 1.3 && factorFor("word.", SENT) > factorFor("word", 0) + 0.8 && factorFor("word,", CLAUSE) > factorFor("word", 0) && factorFor("2024", 0) > factorFor("abcd", 0)); assert.equal(factorFor("extraordinarily", SENT, false), 1);
  assert.equal(delayMs(doc, 0, 300, false), 200); assert.ok(delayMs(doc, 1, 300) > delayMs(doc, 5, 300), "a paragraph end lingers"); const P = buildFactorPrefix(doc), total = timeLeftMs(P, 0, 300); assert.ok(Math.abs(total - doc.words.reduce((s, _, i) => s + delayMs(doc, i, 300), 0)) < 1e-6); assert.equal(timeLeftMs(P, doc.words.length, 300), 0); assert.ok(timeLeftMs(P, 5, 300) < total);
});
test("chunks never cross a sentence; sentence navigation goes back and forward by sentence", () => {
  const i = doc.words.indexOf("He"); assert.equal(chunkEnd(doc, i, 1), i + 1); assert.equal(chunkText(doc, i, chunkEnd(doc, i, 3)), "He sat down!"); const t = doc.words.indexOf("tired."); assert.equal(chunkEnd(doc, t - 1, 3), t + 1, "stops after the sentence end"); assert.equal(chunkEnd(doc, doc.words.length - 1, 3), doc.words.length);
  const s2 = doc.words.indexOf("He"); assert.equal(sentenceStart(doc, s2 + 1), s2); assert.equal(nextSentence(doc, s2), doc.words.indexOf("Then")); assert.equal(prevSentence(doc, doc.words.indexOf("Then")), s2); assert.equal(prevSentence(doc, s2 + 2), s2, "inside a sentence, back goes to its start"); assert.equal(nextSentence(doc, doc.words.length - 1), doc.words.length - 1);
  const r = paragraphRange(doc, doc.words.indexOf("Then")); assert.equal(r.p, 1); assert.equal(r.a, 2); assert.equal(doc.words[r.b], "The");
});
test("training: the ramp climbs on schedule and stops at the ceiling; a missed recall check slows you down, three clean ones speed you up", () => {
  const cfg = { start: 200, max: 260, step: 10, every: 100 }; assert.deepEqual([0, 99, 100, 250, 600, 5000].map((n) => rampWpm(cfg, n)), [200, 200, 210, 220, 260, 260]);
  let a = adaptWpm(300, false, 2); assert.deepEqual(a, { wpm: 264, streak: 0 }); a = adaptWpm(300, true, 0); assert.deepEqual(a, { wpm: 300, streak: 1 }); a = adaptWpm(300, true, 2); assert.deepEqual(a, { wpm: 318, streak: 0 }); assert.equal(adaptWpm(62, false).wpm, 60); assert.equal(adaptWpm(1190, true, 2, 1200).wpm, 1200);
  assert.deepEqual(sessionStats({ words: 500, activeMs: 120000, checks: [true, true, false, true] }), { words: 500, wpm: 250, minutes: 2, recall: 75, checks: 4 }); assert.equal(sessionStats({ words: 5, activeMs: 100 }).wpm, 0); assert.equal(sessionStats({ words: 100, activeMs: 60000 }).recall, null); assert.ok(paceLabel(120).includes("Slow") && paceLabel(700).includes("Skimming"));
});
test("plain text: blank lines split paragraphs, line breaks re-flow, hyphenated line ends rejoin, short unpunctuated lines are headings", () => {
  const p = textToParas("A Title\n\nThis is a paragraph that was\nwrapped by a text editor, and an inter-\nnational word.\n\n\nSecond paragraph here."); assert.deepEqual(p.map((x) => x.kind), ["h", "p", "p"]); assert.equal(p[1].text, "This is a paragraph that was wrapped by a text editor, and an international word."); assert.equal(textToParas("").length, 0);
});
const item = (str, x, y, h = 10, w) => ({ str, x, y, h, w });
const pageOf = (n, lines) => ({ height: 800, items: [item("My Great Book", 200, 780), item(String(n), 300, 20), ...lines] });
test("PDF text: headers, footers and page numbers are dropped, lines become paragraphs, hyphens rejoin, a sentence that runs across pages is one paragraph, big lines are headings", () => {
  const body = (y, t, x = 50, h = 10) => item(t, x, y, h, t.length * 5);
  const pages = [
    pageOf(1, [item("Chapter 1", 50, 700, 18, 90), body(660, "It was a bright cold day in a quiet town and the"), body(646, "clocks were striking thirteen. Winston walked into the"), body(632, "build-"), body(632, "", 0), body(500, "A second paragraph starts after a big gap here."), body(486, "It goes on for another line of ordinary text and then")]),
    pageOf(2, [body(660, "continues onto the next page without a break."), body(646, "A new idea begins with a fresh sentence right here.")]),
    pageOf(3, [body(660, "Third page text is perfectly ordinary prose too.")]),
  ];
  const p = pagesToParas(pages); assert.deepEqual(p.map((x) => x.pg).slice(0, 2), [0, 0], "paragraphs remember their page"); assert.equal(p[p.length - 1].pg, 2); const all = p.map((x) => x.text).join("\n"); assert.ok(!/My Great Book/.test(all) && !/^3$/m.test(all), "running header and page number removed"); assert.equal(p[0].kind, "h"); assert.equal(p[0].text, "Chapter 1");
  assert.ok(p[1].text.startsWith("It was a bright cold day") && p[1].text.includes("clocks were striking thirteen")); assert.ok(p.some((x) => /second paragraph starts/.test(x.text) && !/It was a bright/.test(x.text)), "a big gap splits paragraphs"); assert.ok(p.some((x) => /for another line of ordinary text and then continues onto the next page without a break\./.test(x.text)), "joined across the page break");
});
const container = '<?xml version="1.0"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>';
const xhtml = (title, body) => `<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title}</title><style>p{}</style></head><body>${body}</body></html>`;
const lorem = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
async function makeEpub({ drm = false } = {}) {
  const z = new JSZip(); z.file("mimetype", "application/epub+zip"); z.file("META-INF/container.xml", container); if (drm) z.file("META-INF/encryption.xml", '<encryption><EncryptedData><CipherData/></EncryptedData></encryption>');
  z.file("OEBPS/content.opf", `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>The Test Book</dc:title><dc:creator>A. Writer</dc:creator></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="c2" href="text/ch2.xhtml" media-type="application/xhtml+xml"/><item id="c1" href="text/ch1.xhtml" media-type="application/xhtml+xml"/><item id="cov" href="cover.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="cov"/><itemref idref="c1"/><itemref idref="c2"/></spine></package>`);
  z.file("OEBPS/nav.xhtml", xhtml("Nav", '<nav><ol><li><a href="text/ch1.xhtml">The Beginning</a></li><li><a href="text/ch2.xhtml#top">The Middle</a></li></ol></nav>'));
  z.file("OEBPS/cover.xhtml", xhtml("Cover", "<p>Cover</p>")); z.file("OEBPS/text/ch1.xhtml", xhtml("1", `<h1>Chapter 1</h1><p>${lorem(30)}. <em>Emphasis</em> and a<br/>break.</p><div><p>Second para ${lorem(10)}.</p></div><script>alert(1)</script>`)); z.file("OEBPS/text/ch2.xhtml", xhtml("2", `<h2>Chapter 2</h2><p>${lorem(40)}</p>`));
  return z.generateAsync({ type: "uint8array" });
}
test("EPUB: spine order, titles from the nav, headings and paragraphs, scripts and tiny cover pages skipped, metadata read", async () => {
  const book = await parseEpub(await makeEpub(), { JSZip, DOMParser }); assert.equal(book.title, "The Test Book"); assert.equal(book.author, "A. Writer"); assert.deepEqual(book.chapters.map((c) => c.title), ["The Beginning", "The Middle"], "the cover is skipped and ch1 comes before ch2 (spine order, not manifest order)");
  const c1 = book.chapters[0].paras; assert.equal(c1[0].kind, "h"); assert.equal(c1[0].text, "Chapter 1"); assert.ok(c1[1].text.includes("Emphasis and a break.")); assert.ok(c1[2].text.startsWith("Second para")); assert.ok(!JSON.stringify(book).includes("alert(1)"));
});
test("EPUB: a copy-protected book gives a friendly error, so does a non-EPUB", async () => {
  await assert.rejects(async () => parseEpub(await makeEpub({ drm: true }), { JSZip, DOMParser }), /copy-protected/); const z = new JSZip(); z.file("hello.txt", "hi"); await assert.rejects(async () => parseEpub(await z.generateAsync({ type: "uint8array" }), { JSZip, DOMParser }), /valid EPUB/);
});
test("xhtmlToParas keeps nested inline text together and splits blocks", () => { const d = new DOMParser().parseFromString(xhtml("x", "<p>One <b>bold <i>word</i></b> here.</p><ul><li>Item a</li><li>Item b</li></ul>"), "application/xhtml+xml"); assert.deepEqual(xhtmlToParas(d).map((p) => p.text), ["One bold word here.", "Item a", "Item b"]); });

import { validateBook, sanitizeSettings, sanitizeSessions, mergeLibraries, mergeSessions, LIMITS } from "../../lib/pacer/validate.mjs";
const goodBook = { id: "abc123", title: "A Book", author: "Me", chapters: [{ title: "One", paras: [{ text: "Some real words to read here today.", kind: "p" }, { text: "Heading", kind: "h", pg: 2 }] }], extra: "dropped" };
test("sync validation: a good book is rebuilt clean, bad ids, empty books and malformed parts are refused, unknown fields dropped", () => {
  const v = validateBook(goodBook); assert.ok(v.ok); assert.equal(v.book.words, 8); assert.equal(v.book.extra, undefined); assert.equal(v.book.chapters[0].paras[1].pg, 2);
  for (const bad of [null, {}, { ...goodBook, id: "../etc" }, { ...goodBook, id: "A B" }, { ...goodBook, title: "  " }, { ...goodBook, chapters: [] }, { ...goodBook, chapters: [{ title: "x", paras: [{ text: 5 }] }] }, { ...goodBook, chapters: [{ title: "x", paras: [{ text: "hi", kind: "p" }] }] }]) assert.equal(validateBook(bad).ok, false);
  const w = validateBook({ ...goodBook, chapters: [{ title: "x", paras: [{ text: "<script>alert(1)</script> text words here now", kind: "z" }] }] }); assert.ok(w.ok && w.book.chapters[0].paras[0].kind === "p", "unknown kinds become paragraphs; text stays plain text for React to escape");
  assert.ok(LIMITS.maxBookBytes < LIMITS.maxTotalBytes);
});
test("sync validation: settings and sessions from the wire are forced into allowed values", () => {
  assert.deepEqual(sanitizeSettings({ mode: "evil", wpm: 99999, chunk: 9, font: "comic", theme: "x", checks: 7, size: 1 }), { mode: "pacer", wpm: 1200, chunk: 3, smart: true, font: "serif", size: 16, width: "medium", theme: "paper", dim: false, ramp: false, rampMax: 400, checks: 0 });
  const s = sanitizeSessions([{ t: 5, title: "x".repeat(500), words: 100, wpm: 9999, recall: 150, minutes: 2 }, { t: 0 }, null]); assert.equal(s.length, 1); assert.equal(s[0].title.length, 200); assert.equal(s[0].wpm, 3000); assert.equal(s[0].recall, 100); assert.equal(sanitizeSessions("nope").length, 0);
});
test("two devices agree: the newest reading position wins, cloud-only books appear, sessions merge without duplicates", () => {
  const local = [{ id: "a", title: "A", words: 100, pos: 10, wpm: 250, at: 1000, updated: 1000 }, { id: "b", title: "B", words: 50, pos: 5, wpm: 200, at: 10, updated: 10 }], cloud = [{ id: "a", title: "A", words: 100, pos: 40, wpm: 300, at: 2000 }, { id: "c", title: "C", words: 70, pos: 0, wpm: 250, at: 5 }, { id: "b", title: "B", words: 50, pos: 1, wpm: 100, at: 3 }];
  const m = mergeLibraries(local, cloud), by = Object.fromEntries(m.map((x) => [x.id, x])); assert.equal(by.a.pos, 40, "the phone read further more recently"); assert.equal(by.a.wpm, 300); assert.equal(by.b.pos, 5, "this device's newer position is kept"); assert.equal(by.c.cloud, true); assert.equal(by.a.cloud, true); assert.equal(m.length, 3);
  const onlyLocal = mergeLibraries([{ id: "z", title: "Z", words: 9, pos: 1, wpm: 250, at: 1, updated: 1, cloud: true }], []); assert.equal(onlyLocal[0].cloud, false, "a book the server no longer has is not marked synced");
  assert.deepEqual(mergeSessions([{ t: 1, title: "A" }, { t: 2, title: "A" }], [{ t: 2, title: "A" }, { t: 3, title: "B" }]).map((x) => x.t), [1, 2, 3]);
});

test("find: words, phrases, prefixes, punctuation and curly quotes", () => {
  const doc = tokenize([{ text: "The old bridge was quiet. “Lantern,” she said, and the lantern-light shook." }, { text: "A lanterns festival. Bridge, old." }]);
  assert.equal(normWord("“Lantern,”"), "lantern");
  assert.deepEqual(findMatches(doc, "old bridge").hits, [1]);              // consecutive words only
  assert.equal(findMatches(doc, "bridge old").total, 1);                   // the other order is a different place
  assert.equal(findMatches(doc, "  THE  OLD ").hits[0], 0);                // case/space insensitive, last word may be a prefix
  const l = findMatches(doc, "lant"); assert.equal(l.total, 3);            // lantern, lantern-light, lanterns
  assert.equal(findMatches(doc, "l").total, 0);                            // a single letter is exact only
  assert.equal(findMatches(doc, "").total, 0); assert.equal(findMatches(doc, "zebra").hits.length, 0);
  assert.equal(findMatches(doc, "the", { max: 1 }).capped, true);
});

import { createNarrator, segmentEnd, pickVoices, rateFor, approxWpm } from "../../lib/pacer/voice.mjs";
import { parseYouTubeLink } from "../../lib/pacer/youtube.mjs";

test("voice: rate mapping, voice ranking, segments", () => {
  assert.equal(rateFor(170), 1); assert.equal(rateFor(20), 0.5); assert.equal(rateFor(2000), 3); assert.ok(approxWpm(1.5) > 240);
  const mk = (name, lang = "en-US", extra = {}) => ({ name, lang, ...extra });
  const ranked = pickVoices([mk("Fred"), mk("Microsoft Aria Online (Natural)"), mk("Compact Voice"), mk("Samantha"), mk("Amélie", "fr-FR"), mk("Zarvox")], "en-US").map((r) => r.voice.name);
  assert.equal(ranked[0], "Microsoft Aria Online (Natural)"); assert.ok(!ranked.includes("Amélie")); assert.ok(ranked.indexOf("Samantha") < ranked.indexOf("Fred"));
  const doc = tokenize([{ text: "One two three. " + Array.from({ length: 60 }, (_, i) => "word" + i).join(" ") + "." }]);
  assert.equal(segmentEnd(doc, 0), 3);                       // first sentence
  assert.ok(segmentEnd(doc, 3) < doc.words.length);           // a very long sentence is cut so voices do not stall
});

function fakeEnv() {
  const spoken = [], timers = []; let clock = 0, id = 0;
  class Utt { constructor(t) { this.text = t; } }
  const synth = { speak: (u) => spoken.push(u), cancel: () => { spoken.length = 0; } };
  const T = { now: () => clock, setTimeout: (f) => { f(); return 0; }, setInterval: (f, ms) => { timers.push({ id: ++id, f, ms }); return id; }, clearInterval: (h) => { const k = timers.findIndex((t) => t.id === h); if (k >= 0) timers.splice(k, 1); } };
  const advance = (ms) => { for (let t = 0; t < ms; t += 70) { clock += 70; for (const x of [...timers]) x.f(); } };
  return { spoken, synth, Utt, T, advance, timers, setClock: (c) => (clock = c) };
}

test("voice: boundary events drive the highlight, sentences chain, book end is reported", () => {
  const e = fakeEnv(), doc = tokenize([{ text: "Alpha beta gamma. Delta epsilon." }]), seen = [], ends = []; let finished = false;
  const n = createNarrator({ synth: e.synth, Utt: e.Utt, doc, getRate: () => 1, getVoice: () => null, onWord: (i) => seen.push(i), onSegmentEnd: (j) => { ends.push(j); return true; }, onEnd: () => (finished = true), timers: e.T });
  n.start(0); assert.equal(e.spoken.length, 1); assert.equal(e.spoken[0].text, "Alpha beta gamma.");
  const u = e.spoken[0]; u.onstart(); u.onboundary({ name: "word", charIndex: 6 }); u.onboundary({ name: "word", charIndex: 11 }); u.onboundary({ name: "sentence", charIndex: 0 });
  assert.deepEqual(seen, [0, 1, 2]);
  u.onend({}); assert.deepEqual(ends, [3]); assert.equal(e.spoken.at(-1).text, "Delta epsilon.");
  e.spoken.at(-1).onstart(); e.spoken.at(-1).onend({}); assert.equal(finished, true); assert.equal(n.running, false);
});

test("voice: without boundary events a timer estimates the words, and stop() silences stale callbacks", () => {
  const e = fakeEnv(), doc = tokenize([{ text: "one two three four five six seven eight nine ten." }]), seen = [];
  const n = createNarrator({ synth: e.synth, Utt: e.Utt, doc, getRate: () => 1, getVoice: () => null, onWord: (i) => seen.push(i), onSegmentEnd: () => false, timers: e.T });
  n.start(0); const u = e.spoken[0]; u.onstart(); e.advance(1500); assert.ok(seen.length > 2 && seen.at(-1) > 2, "estimated progress: " + seen.join());
  assert.deepEqual(seen, [...seen].sort((a, b) => a - b));       // never goes backwards
  n.stop(); const c = seen.length; u.onboundary({ name: "word", charIndex: 30 }); u.onend({}); e.advance(500); assert.equal(seen.length, c); assert.equal(e.timers.length, 0);
});

test("youtube: links in the shapes people paste", () => {
  const ok = (s, k, id) => assert.deepEqual(parseYouTubeLink(s), { kind: k, id }, s);
  ok("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "v", "dQw4w9WgXcQ"); ok("youtu.be/dQw4w9WgXcQ?t=42", "v", "dQw4w9WgXcQ"); ok("https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDAMVMdQw4w9WgXcQ", "v", "dQw4w9WgXcQ");
  ok("https://m.youtube.com/shorts/dQw4w9WgXcQ", "v", "dQw4w9WgXcQ"); ok("https://www.youtube.com/embed/dQw4w9WgXcQ", "v", "dQw4w9WgXcQ"); ok("https://www.youtube.com/playlist?list=PLabcdefghijklmnop", "p", "PLabcdefghijklmnop");
  for (const bad of ["", "hello", "https://evil.com/watch?v=dQw4w9WgXcQ", "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://www.youtube.com/watch?v=short", "https://www.youtube.com/"]) assert.equal(parseYouTubeLink(bad), null, bad);
});

import { createNeuralNarrator, hdRate } from "../../lib/pacer/neural.mjs";
function fakeAudio() { const a = { src: "", currentTime: 0, duration: 4, playbackRate: 1, plays: 0, paused: false, onended: null, onerror: null, play() { a.plays++; a.paused = false; return Promise.resolve(); }, pause() { a.paused = true; } }; return a; }
const flush = () => new Promise((r) => setTimeout(r, 0));

test("hd voice: synthesizes ahead, places words across the clip, chains sentences, reports the end", async () => {
  const doc = tokenize([{ text: "Alpha beta gamma delta. Epsilon zeta." }]), audio = fakeAudio(), asked = [], seen = [], revoked = []; let ended = false, clock = [], id = 0;
  const T = { setInterval: (f) => { clock.push({ id: ++id, f }); return id; }, clearInterval: (h) => { clock = clock.filter((c) => c.id !== h); } };
  const n = createNeuralNarrator({ synthesize: async (t) => { asked.push(t); return "blob:" + asked.length; }, audio, doc, getRate: () => 1.5, onWord: (i) => seen.push(i), onSegmentEnd: () => true, onEnd: () => (ended = true), revoke: (u) => revoked.push(u), timers: T });
  n.start(0); await flush(); await flush();
  assert.equal(audio.src, "blob:1"); assert.equal(audio.playbackRate, 1.5); assert.deepEqual(asked, ["Alpha beta gamma delta.", "Epsilon zeta."], "next sentence is prefetched while the first plays");
  audio.currentTime = 2; clock.forEach((c) => c.f()); assert.ok(seen.at(-1) >= 1 && seen.at(-1) <= 3, "midway through the clip: " + seen.join());
  audio.onended(); await flush(); await flush(); assert.equal(audio.src, "blob:2"); assert.ok(revoked.includes("blob:1"));
  audio.onended(); assert.equal(ended, true); assert.equal(n.running, false); assert.equal(hdRate(165), 1); assert.ok(hdRate(2000) <= 2.2);
});

test("hd voice: stop silences stale callbacks; synthesis failure is reported once", async () => {
  const doc = tokenize([{ text: "One two three. Four five six." }]), audio = fakeAudio(), seen = [], errs = [];
  const n = createNeuralNarrator({ synthesize: async () => "blob:x", audio, doc, getRate: () => 1, onWord: (i) => seen.push(i), onError: (e) => errs.push(e), timers: { setInterval: () => 1, clearInterval: () => {} } });
  n.start(0); await flush(); await flush(); const old = audio.onended; n.stop(); assert.equal(audio.paused, true); const c = seen.length; old && old(); await flush(); assert.equal(seen.length, c);
  const bad = createNeuralNarrator({ synthesize: async () => { throw new Error("no model"); }, audio: fakeAudio(), doc, getRate: () => 1, onWord() {}, onError: (e) => errs.push(e), timers: { setInterval: () => 1, clearInterval: () => {} } });
  bad.start(0); await flush(); await flush(); assert.deepEqual(errs, ["synth"]); assert.equal(bad.running, false);
});
