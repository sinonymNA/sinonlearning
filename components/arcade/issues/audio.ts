// Back Issues sound: a tiny WebAudio synth (typewriter ticks, a rubber stamp, a press bell). Honours the arcade mute switch; no audio files.
let ctx: AudioContext | null = null, master: GainNode | null = null;
const muted = () => { try { return !!JSON.parse(localStorage.getItem("arcade:prefs") || "{}").muted; } catch { return false; } };
function ac() {
  if (typeof window === "undefined") return null;
  try { ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); if (ctx.state === "suspended") void ctx.resume(); if (!master) { master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); } return ctx; } catch { return null; }
}
function note(c: AudioContext, d: AudioNode, f: number, t: number, dur: number, vol: number, type: OscillatorType = "triangle", slide?: number, lp?: number) {
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.01, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n: AudioNode = o; if (lp) { const q = c.createBiquadFilter(); q.type = "lowpass"; q.frequency.value = lp; o.connect(q); n = q; } n.connect(g).connect(d); o.start(t); o.stop(t + dur + 0.03);
}
function click(c: AudioContext, d: AudioNode, t: number, vol: number, hp = 2500) {
  const len = Math.floor(c.sampleRate * 0.03), buf = c.createBuffer(1, len, c.sampleRate), a = buf.getChannelData(0); for (let i = 0; i < len; i++) a[i] = (((i * 7919) % 200) / 100 - 1) * (1 - i / len);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; f.type = "highpass"; f.frequency.value = hp; g.gain.value = vol; s.connect(f).connect(g).connect(d); s.start(t);
}
export type Sfx = "key" | "erase" | "good" | "bad" | "stamp" | "found" | "bell" | "win" | "lose" | "hint" | "warn" | "tab";
export function play(name: Sfx) {
  if (muted()) return; const c = ac(); if (!c || !master) return; const t = c.currentTime + 0.003, d = master;
  switch (name) {
    case "key": click(c, d, t, 0.22); note(c, d, 900, t, 0.03, 0.04, "square", 600, 2500); break;
    case "erase": click(c, d, t, 0.14, 1500); note(c, d, 420, t, 0.05, 0.04, "triangle", 300); break;
    case "tab": note(c, d, 520, t, 0.05, 0.05, "triangle", 640); break;
    case "good": note(c, d, 660, t, 0.1, 0.07); note(c, d, 880, t + 0.08, 0.16, 0.07); break;
    case "bad": note(c, d, 190, t, 0.14, 0.08, "square", 140, 900); break;
    case "found": [0, 4, 7].forEach((s, i) => note(c, d, 523 * Math.pow(2, s / 12), t + i * 0.06, 0.2, 0.07)); break;
    case "hint": [0, 5, 9].forEach((s, i) => note(c, d, 660 * Math.pow(2, s / 12), t + i * 0.06, 0.16, 0.06, "sine")); break;
    case "stamp": note(c, d, 120, t, 0.18, 0.3, "sine", 55); click(c, d, t, 0.3, 800); note(c, d, 300, t, 0.06, 0.08, "triangle", 180, 1500); break;
    case "bell": note(c, d, 1568, t, 0.9, 0.08, "sine"); note(c, d, 2349, t, 0.7, 0.04, "sine"); break;
    case "win": [0, 4, 7, 12, 16].forEach((s, i) => note(c, d, 392 * Math.pow(2, s / 12), t + i * 0.09, 0.4, 0.09)); note(c, d, 1568, t + 0.5, 0.9, 0.05, "sine"); break;
    case "lose": [0, -3, -7].forEach((s, i) => note(c, d, 330 * Math.pow(2, s / 12), t + i * 0.14, 0.3, 0.08, "triangle", undefined, 1500)); break;
    case "warn": note(c, d, 880, t, 0.06, 0.06, "square", undefined, 2000); break;
  }
}
