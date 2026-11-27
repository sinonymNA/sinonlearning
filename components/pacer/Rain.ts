/* eslint-disable @typescript-eslint/no-explicit-any */
// Rain sound: two layers of filtered pink noise (a high "hiss" and a low "body") plus random little drops, all made with the Web Audio API.
import { RAIN_LEVELS, clampLevel, fillPink, nextDropGap, rng } from "../../lib/pacer/rain.mjs";

export class Rain {
  private ctx: AudioContext | null = null; private master!: GainNode; private hiss!: GainNode; private body!: GainNode; private lp!: BiquadFilterNode; private noise!: AudioBuffer;
  private drops: ReturnType<typeof setInterval> | null = null; private nextDrop = 0; private on = false; private level = 1; private vol = 0.5; private off: ReturnType<typeof setTimeout> | null = null; private rand = rng(7);
  /** Call inside a tap/click: browsers (iOS especially) only let audio start from a gesture. */
  prime() { try { this.build(); void this.ctx?.resume(); } catch { /* audio not available */ } }
  private build() {
    if (this.ctx) return; const AC = (window as any).AudioContext || (window as any).webkitAudioContext; if (!AC) return; const ctx: AudioContext = new AC(); this.ctx = ctx;
    const len = ctx.sampleRate * 6; this.noise = ctx.createBuffer(2, len, ctx.sampleRate); for (let c = 0; c < 2; c++) fillPink(this.noise.getChannelData(c), rng(11 + c * 5));
    this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
    const loop = (): AudioBufferSourceNode => { const s = ctx.createBufferSource(); s.buffer = this.noise; s.loop = true; s.loopStart = 0; s.loopEnd = this.noise.duration; return s; };
    const a = loop(), hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 600; this.lp = ctx.createBiquadFilter(); this.lp.type = "lowpass"; this.hiss = ctx.createGain(); a.connect(hp); hp.connect(this.lp); this.lp.connect(this.hiss); this.hiss.connect(this.master);
    const b = loop(), lb = ctx.createBiquadFilter(); lb.type = "lowpass"; lb.frequency.value = 750; this.body = ctx.createGain(); b.connect(lb); lb.connect(this.body); this.body.connect(this.master);
    a.start(0, 0.0); b.start(0, 2.3); this.apply(0);
  }
  private apply(ramp: number) {
    if (!this.ctx) return; const L = RAIN_LEVELS[clampLevel(this.level)], t = this.ctx.currentTime;
    this.hiss.gain.setTargetAtTime(L.hiss, t, 0.2); this.body.gain.setTargetAtTime(L.body, t, 0.2); this.lp.frequency.setTargetAtTime(L.top, t, 0.2);
    this.master.gain.cancelScheduledValues(t); this.master.gain.setTargetAtTime(this.on ? Math.pow(this.vol, 1.6) * 0.9 : 0, t, ramp || 0.05);
  }
  private tickDrops = () => {
    const ctx = this.ctx; if (!ctx || !this.on) return; const now = ctx.currentTime;
    while (this.nextDrop < now + 0.25) { // schedule the next few drops a little ahead
      const at = Math.max(now, this.nextDrop), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = this.noise; f.type = "bandpass"; f.frequency.value = 1800 + this.rand() * 4200; f.Q.value = 2 + this.rand() * 4;
      const amp = (0.12 + this.rand() * 0.3) * Math.pow(this.vol, 1.2); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(amp, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0008, at + 0.03 + this.rand() * 0.05);
      s.connect(f); f.connect(g); g.connect(this.master); s.start(at, this.rand() * 4); s.stop(at + 0.12); this.nextDrop = at + nextDropGap(this.level, this.rand);
    }
  };
  /** Turn rain on/off, or change its volume (0 to 1) and strength (0 light, 1 steady, 2 heavy). */
  set({ on, vol, level }: { on: boolean; vol: number; level: number }) {
    const was = this.on; this.on = on; this.vol = Math.max(0, Math.min(1, vol)); this.level = clampLevel(level);
    if (on) { this.build(); if (!this.ctx) return; if (this.off) { clearTimeout(this.off); this.off = null; } void this.ctx.resume(); if (!was) this.nextDrop = this.ctx.currentTime; this.apply(was ? 0.1 : 0.6); if (!this.drops) this.drops = setInterval(this.tickDrops, 120); }
    else if (this.ctx) { this.apply(0.25); if (this.drops) { clearInterval(this.drops); this.drops = null; } if (!this.off) this.off = setTimeout(() => { this.off = null; if (!this.on) void this.ctx?.suspend(); }, 1500); } // fade out, then stop using the CPU
  }
  dispose() { if (this.drops) clearInterval(this.drops); if (this.off) clearTimeout(this.off); this.drops = null; this.on = false; try { void this.ctx?.close(); } catch { /* */ } this.ctx = null; }
}
