// Shelf Stocker sound: a small WebAudio synth with proper envelopes (no audio files). Sound effects and an optional soft music loop; both honour the arcade mute switch.
let ctx: AudioContext | null = null, master: GainNode | null = null, musicGain: GainNode | null = null, timer: number | null = null, step = 0, nextTime = 0;
const opts = { sfx: true, music: false };
export function setAudioOptions(o: Partial<typeof opts>) { Object.assign(opts, o); if (opts.music) startMusic(); else stopMusic(); }
const muted = () => { try { return !!JSON.parse(localStorage.getItem("arcade:prefs") || "{}").muted; } catch { return false; } };
function ac() {
  if (typeof window === "undefined") return null;
  try { ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); if (ctx.state === "suspended") void ctx.resume(); if (!master) { master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); musicGain = ctx.createGain(); musicGain.gain.value = 0.5; musicGain.connect(master); } return ctx; } catch { return null; }
}
/** One note with an attack/decay envelope, an optional pitch slide and an optional lowpass. */
function note(c: AudioContext, dest: AudioNode, freq: number, t: number, dur: number, vol: number, type: OscillatorType = "triangle", slideTo?: number, lp?: number) {
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.012, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n: AudioNode = o; if (lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; o.connect(f); n = f; } n.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.03);
}
function noise(c: AudioContext, dest: AudioNode, t: number, dur: number, vol: number, hp = 4000) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = buf; f.type = "highpass"; f.frequency.value = hp; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f).connect(g).connect(dest); s.start(t);
}
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];                           // a major pentatonic ladder in semitones
const hz = (base: number, semis: number) => base * Math.pow(2, semis / 12);
export type Sfx = "pick" | "drop" | "put" | "refuse" | "unwrap" | "stamp" | "unlock" | "crack" | "win" | "coin" | "tap" | "undo" | "hint" | "cart";
/** Play a sound effect. `n` raises the pitch (a rising combo of finished shelves, or a heavier thud for bigger runs). */
export function play(name: Sfx, n = 0) {
  if (!opts.sfx || muted()) return; const c = ac(); if (!c || !master) return; const t = c.currentTime + 0.005, d = master;
  switch (name) {
    case "pick": note(c, d, 520, t, 0.09, 0.11, "triangle", 700, 3000); note(c, d, 1040, t + 0.02, 0.05, 0.04, "sine"); break;
    case "drop": note(c, d, 460, t, 0.08, 0.08, "triangle", 330, 2500); break;
    case "put": { const k = Math.min(1, 0.45 + n * 0.2); note(c, d, 140, t, 0.16, 0.28 * k, "sine", 60); note(c, d, 330, t, 0.05, 0.07 * k, "triangle", 200, 1800); noise(c, d, t, 0.05, 0.05 * k, 2500); break; }
    case "refuse": note(c, d, 190, t, 0.13, 0.1, "square", 150, 900); note(c, d, 160, t + 0.11, 0.16, 0.09, "square", 120, 800); break;
    case "unwrap": note(c, d, 700, t, 0.07, 0.09, "square", 1000, 3500); noise(c, d, t, 0.09, 0.07, 3000); [0, 2, 4].forEach((i) => note(c, d, hz(880, SCALE[i + 2]), t + 0.07 + i * 0.05, 0.12, 0.05, "sine")); break;
    case "stamp": { const base = 523 * Math.pow(2, Math.min(n, 7) / 12 * 2); [0, 4, 7].forEach((s, i) => note(c, d, hz(base, s), t + i * 0.07, 0.3, 0.09, "triangle")); note(c, d, hz(base, 12), t + 0.22, 0.45, 0.07, "sine"); break; }
    case "unlock": note(c, d, 300, t, 0.08, 0.1, "square", 450, 2500); note(c, d, 600, t + 0.09, 0.07, 0.08, "square"); [0, 4, 7, 12].forEach((s, i) => note(c, d, hz(660, s), t + 0.18 + i * 0.06, 0.2, 0.06, "triangle")); break;
    case "crack": noise(c, d, t, 0.22, 0.16, 5500); note(c, d, 1800, t, 0.1, 0.06, "square", 400, 4000); note(c, d, 2400, t + 0.03, 0.12, 0.04, "triangle", 900); break;
    case "win": [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => note(c, d, hz(392, s), t + i * 0.085, 0.38, 0.1, "triangle")); note(c, d, hz(392, 12), t + 0.6, 0.9, 0.06, "sine"); noise(c, d, t + 0.55, 0.3, 0.04, 6000); break;
    case "coin": note(c, d, 988, t, 0.06, 0.09, "square"); note(c, d, 1319, t + 0.06, 0.22, 0.09, "square"); break;
    case "tap": note(c, d, 620, t, 0.04, 0.07, "triangle", 500); break;
    case "undo": note(c, d, 520, t, 0.1, 0.08, "triangle", 300, 2000); break;
    case "hint": [0, 4, 7].forEach((s, i) => note(c, d, hz(660, s), t + i * 0.07, 0.18, 0.07, "sine")); break;
    case "cart": note(c, d, 220, t, 0.12, 0.1, "triangle", 330); note(c, d, 330, t + 0.1, 0.14, 0.1, "triangle"); break;
  }
}
// ---- an optional, very quiet music loop: a slow pentatonic arpeggio over a soft pad, scheduled just ahead of the clock
const PROG = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];       // C, Am, F, G (as offsets from C)
function schedule() {
  const c = ctx; if (!c || !musicGain || !opts.music) return; const beat = 60 / 84;
  while (nextTime < c.currentTime + 0.4) {
    const bar = Math.floor(step / 8) % PROG.length, i = step % 8, chord = PROG[bar];
    if (i === 0) { chord.forEach((s) => note(c, musicGain!, hz(130.8, s), nextTime, beat * 4, 0.035, "sine", undefined, 900)); }
    const arp = [0, 1, 2, 1, 2, 1, 2, 1][i]; note(c, musicGain, hz(261.6, chord[arp] + (i % 4 === 3 ? 12 : 0)), nextTime, beat * 0.9, 0.05, "triangle", undefined, 2200);
    nextTime += beat / 2; step++;
  }
}
export function startMusic() { if (timer !== null || muted()) return; const c = ac(); if (!c) return; nextTime = c.currentTime + 0.1; step = 0; timer = window.setInterval(() => { if (muted() || !opts.music) { stopMusic(); return; } schedule(); }, 200); }
export function stopMusic() { if (timer !== null) { clearInterval(timer); timer = null; } }
