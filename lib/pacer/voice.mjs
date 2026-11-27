// Read-aloud for Pacer. The browser's speech voices are the clock: one short utterance at a time, the highlight follows the voice.
// Pure ESM (the speech engine and timers are injected) so it can be tested in node with a fake synth.
import { SENT, CLAUSE } from "./engine.mjs";

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const BASE_WPM = 170; // roughly what rate 1.0 sounds like for most voices
export const rateFor = (wpm) => clamp(Math.round((wpm / BASE_WPM) * 20) / 20, 0.5, 3);
export const approxWpm = (rate) => Math.round(rate * BASE_WPM);
export const MAX_VOICE_WPM = approxWpm(3);

/** End (exclusive) of the next thing to say: a sentence, or a clause / hard cut when it runs long (long utterances make some voices stall). */
export function segmentEnd(doc, i, { soft = 130, hard = 230 } = {}) {
  const N = doc.words.length; let j = i, chars = 0;
  while (j < N) { chars += doc.words[j].length + 1; const f = doc.flags[j]; j++; if (f & SENT) break; if (f & CLAUSE && chars >= soft) break; if (chars >= hard) break; }
  return Math.max(j, Math.min(N, i + 1));
}

const BEST = /natural|neural|premium|enhanced|siri|online|wavenet|studio|multilingual/i, GOOD = /google|samantha|ava\b|allison|susan|zoe|daniel|serena|karen|moira|tessa|aria|jenny|guy|libby|ryan|sonia|alex/i;
const BAD = /compact|espeak|\bfred\b|albert|zarvox|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|junior|kathy|organ|pipe|ralph|trinoids|whisper|wobble|superstar|jester/i;
/** Sort the device's voices best-first for reading a book in `lang` (e.g. "en-US"). Returns [{ voice, score, label }]. */
export function pickVoices(voices, lang = "en") {
  const base = String(lang || "en").slice(0, 2).toLowerCase(), out = [];
  for (const v of voices || []) {
    const vl = String(v.lang || "").toLowerCase(); if (!vl.startsWith(base)) continue;
    let s = 0; const n = String(v.name || "");
    if (BEST.test(n)) s += 50; if (GOOD.test(n)) s += 20; if (BAD.test(n)) s -= 80; if (vl.replace("_", "-") === String(lang).toLowerCase()) s += 6; if (v.default) s += 2; if (v.localService === false) s += 3;
    out.push({ voice: v, score: s, label: BEST.test(n) ? "Natural" : s < -20 ? "Robotic" : "" });
  }
  return out.sort((a, b) => b.score - a.score || String(a.voice.name).localeCompare(String(b.voice.name)));
}

/**
 * Speaks doc words from a position, calling onWord(i) as each word is said.
 * Boundary events move the highlight when the voice sends them; otherwise a timer estimates progress inside each segment and the end of the segment re-syncs it.
 */
export function createNarrator({ synth, Utt, doc, getRate, getVoice, onWord, onSegmentEnd, onEnd, onError, timers = /** @type {any} */ (null) }) {
  const T = timers || { setInterval: (f, ms) => setInterval(f, ms), clearInterval: (h) => clearInterval(h), setTimeout: (f, ms) => setTimeout(f, ms), now: () => performance.now() };
  const N = doc.words.length; let gen = 0, running = false, tick = null, cps = 14.5, lastWord = -1;
  const say = (i) => { if (i > lastWord || i < 0) { lastWord = i; onWord(i); } };
  const clear = () => { if (tick) { T.clearInterval(tick); tick = null; } };

  function speak(i, g) {
    const j = segmentEnd(doc, i), words = doc.words.slice(i, j), text = words.join(" "), offs = []; let o = 0; for (const w of words) { offs.push(o); o += w.length + 1; }
    const at = (ci) => { let lo = 0, hi = offs.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (offs[m] <= ci) lo = m; else hi = m - 1; } return lo; };
    const u = new Utt(text), rate = getRate(); u.rate = rate; const v = getVoice(); if (v) { u.voice = v; u.lang = v.lang; } let t0 = 0, sawBoundary = false;
    const est = () => text.length / (cps * rate) * 1000;
    u.onstart = () => {
      if (g !== gen) return; t0 = T.now(); say(i); clear();
      tick = T.setInterval(() => {
        if (g !== gen) return clear(); const el = T.now() - t0;
        if (el > est() * 2.5 + 4000) { clear(); u.onend && u.onend({ watchdog: true }); return; } // the voice never said it was done
        if (!sawBoundary && el > 450) say(i + at(Math.min(text.length - 1, Math.floor((el / est()) * text.length))));
      }, 70);
    };
    u.onboundary = (e) => { if (g !== gen || (e && e.name && e.name !== "word")) return; sawBoundary = true; say(i + at(e.charIndex || 0)); };
    u.onend = (e) => {
      if (g !== gen) return; clear(); if (t0 && !(e && e.watchdog)) { const sec = (T.now() - t0) / 1000; if (sec > 0.3) cps = clamp(cps * 0.5 + (text.length / sec / rate) * 0.5, 6, 40); }
      lastWord = -1; say(j - 1); if (j >= N) { running = false; onEnd && onEnd(); return; }
      if (onSegmentEnd && onSegmentEnd(j) === false) { running = false; return; }
      speak(j, g);
    };
    u.onerror = (e) => { if (g !== gen) return; if (e && (e.error === "canceled" || e.error === "interrupted")) return; clear(); running = false; onError && onError(e && e.error); };
    try { synth.speak(u); } catch (err) { running = false; onError && onError(String(err)); }
  }
  return {
    start(i) { gen++; clear(); lastWord = -1; running = true; const g = gen; try { synth.cancel(); } catch { /* ignore */ } T.setTimeout(() => { if (g === gen && running) speak(clamp(i, 0, N - 1), g); }, 60); },
    stop() { gen++; running = false; clear(); try { synth.cancel(); } catch { /* ignore */ } },
    prime() { try { const u = new Utt(" "); u.volume = 0; synth.speak(u); } catch { /* ignore */ } },
    get running() { return running; },
  };
}
