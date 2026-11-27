// HD (neural) read-aloud for Pacer. Same interface as voice.mjs createNarrator (start/stop/prime/running) but the audio comes from a synthesizer
// that returns a playable URL per segment (Kokoro running in the browser). The segment after the current one is synthesized while the current plays.
// Highlight timing: the browser gives no word events for a clip, so words are placed across the clip by their length (plus a little for punctuation); each clip's end re-syncs.
// Pure ESM: the synthesizer, the audio element and timers are injected, so it is tested in node.
import { SENT, CLAUSE } from "./engine.mjs";
import { segmentEnd } from "./voice.mjs";

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const HD_BASE_WPM = 165; // about how fast a Kokoro voice speaks at 1.0x
export const hdRate = (wpm) => clamp(Math.round((wpm / HD_BASE_WPM) * 20) / 20, 0.6, 2.2);
export const HD_MAX_WPM = Math.round(2.2 * HD_BASE_WPM);
/** A 0.1 second silent WAV, played inside a tap so iOS lets the same audio element play later without another tap. */
export const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

export function createNeuralNarrator({ synthesize, audio, doc, getRate, onWord, onSegmentEnd, onEnd, onError, onStatus, revoke, timers = /** @type {any} */ (null) }) {
  const T = timers || { setInterval: (f, ms) => setInterval(f, ms), clearInterval: (h) => clearInterval(h) };
  const N = doc.words.length; let gen = 0, running = false, tick = null, lastWord = -1, queue = Promise.resolve(), cache = new Map();
  const say = (i) => { if (i > lastWord || i < 0) { lastWord = i; onWord(i); } };
  const clear = () => { if (tick) { T.clearInterval(tick); tick = null; } };
  const drop = (k) => { const p = cache.get(k); cache.delete(k); p && p.then((u) => revoke && revoke(u), () => {}); };
  const textOf = (i) => doc.words.slice(i, segmentEnd(doc, i)).join(" ");
  const fetchSeg = (i) => { // synthesis is one at a time (the model is single threaded)
    if (!cache.has(i)) { const p = queue.then(() => synthesize(textOf(i))); queue = p.then(() => {}, () => {}); cache.set(i, p); } return cache.get(i);
  };

  async function play(i, g) {
    const j = segmentEnd(doc, i); let url;
    const slow = onStatus ? setTimeout(() => g === gen && onStatus("wait"), 400) : null;
    try { url = await fetchSeg(i); } catch (e) { clearTimeout(slow); if (g === gen) { running = false; onStatus && onStatus("idle"); onError && onError("synth"); } return; }
    clearTimeout(slow); if (g !== gen) { drop(i); return; } onStatus && onStatus("idle");
    const words = doc.words.slice(i, j), cum = []; let acc = 0;
    for (let k = 0; k < words.length; k++) { const f = doc.flags[i + k]; acc += words[k].length + 1 + (f & SENT ? 4 : f & CLAUSE ? 2 : 0); cum.push(acc); }
    const at = (frac) => { const target = frac * acc; let k = 0; while (k < cum.length - 1 && cum[k] <= target) k++; return k; };
    audio.onended = () => {
      if (g !== gen) return; clear(); drop(i); lastWord = -1; say(j - 1); if (j >= N) { running = false; onEnd && onEnd(); return; }
      if (onSegmentEnd && onSegmentEnd(j) === false) { running = false; return; } play(j, g);
    };
    audio.onerror = () => { if (g !== gen) return; clear(); running = false; onError && onError("audio"); };
    audio.src = url; audio.playbackRate = getRate(); try { audio.preservesPitch = true; } catch { /* older browsers */ }
    try { await audio.play(); } catch (e) { if (g === gen) { running = false; onError && onError("not-allowed"); } return; }
    if (g !== gen) return; say(i); if (j < N) fetchSeg(j).catch(() => {});
    clear(); tick = T.setInterval(() => { if (g !== gen) return clear(); const d = audio.duration; audio.playbackRate = getRate(); if (d && isFinite(d)) say(i + at(audio.currentTime / d)); }, 70);
  }
  const reset = () => { gen++; running = false; clear(); try { audio.pause(); } catch { /* */ } audio.onended = null; audio.onerror = null; for (const k of [...cache.keys()]) drop(k); onStatus && onStatus("idle"); };
  return {
    start(i) { reset(); lastWord = -1; running = true; play(clamp(i, 0, N - 1), gen); },
    stop() { reset(); },
    prime() { try { audio.src = SILENT_WAV; const r = audio.play(); r && r.catch && r.catch(() => {}); } catch { /* */ } },
    get running() { return running; },
  };
}
