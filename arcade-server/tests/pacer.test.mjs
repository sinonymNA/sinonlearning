import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { SENT, CLAUSE, PARA, HEAD, tokenize, orpIndex, splitOrp, factorFor, beatMs, delayMs, buildFactorPrefix, timeLeftMs, chunkEnd, chunkText, sentenceStart, nextSentence, prevSentence, paragraphRange, rampWpm, adaptWpm, sessionStats, paceLabel } from "../../lib/pacer/engine.mjs";
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
