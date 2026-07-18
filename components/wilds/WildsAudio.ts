export type WildsSoundKey =
  | "correct"
  | "wrong"
  | "hit"
  | "player-hit"
  | "victory"
  | "defeat"
  | "capture-success"
  | "capture-fail"
  | "map-move"
  | "item-use"
  | "streak"
  | "boss-appear";

export class WildsAudioManager {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  play(key: WildsSoundKey): void {
    if (this.ctx.state === "suspended") {
      this.ctx.resume().then(() => this.dispatch(key)).catch(() => {});
      return;
    }
    this.dispatch(key);
  }

  private dispatch(key: WildsSoundKey): void {
    try {
      switch (key) {
        case "correct":       this.tone(660, 880, 0.18, "sine", 0.28); break;
        case "wrong":         this.tone(200, 150, 0.30, "sawtooth", 0.22); break;
        case "hit":           this.tone(440, 600, 0.12, "square", 0.20); break;
        case "player-hit":    this.tone(180, 120, 0.22, "sawtooth", 0.20); break;
        case "item-use":      this.tone(600, 900, 0.20, "sine", 0.24); break;
        case "map-move":      this.tone(520, 660, 0.14, "sine", 0.18); break;
        case "capture-fail":  this.tone(260, 130, 0.35, "sawtooth", 0.22); break;
        case "victory":       this.playVictory(); break;
        case "defeat":        this.playDefeat(); break;
        case "capture-success": this.playCaptureSuccess(); break;
        case "streak":        this.playStreak(); break;
        case "boss-appear":   this.playBossAppear(); break;
      }
    } catch { /* ignore audio errors */ }
  }

  private tone(freq: number, endFreq: number, duration: number, type: OscillatorType, volume = 0.3): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private toneAt(freq: number, endFreq: number, startAt: number, duration: number, type: OscillatorType, volume = 0.28): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startAt + duration);
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.01);
  }

  private playVictory(): void {
    const now = this.ctx.currentTime;
    const notes = [523, 587, 659, 784, 880];
    notes.forEach((freq, i) => {
      this.toneAt(freq, freq * 1.01, now + i * 0.11, 0.18, "sine", 0.26);
    });
  }

  private playDefeat(): void {
    const now = this.ctx.currentTime;
    const notes = [330, 280, 220, 165];
    notes.forEach((freq, i) => {
      this.toneAt(freq, freq * 0.9, now + i * 0.14, 0.20, "sawtooth", 0.22);
    });
  }

  private playCaptureSuccess(): void {
    const now = this.ctx.currentTime;
    this.toneAt(440, 880, now, 0.25, "sine", 0.24);
    this.toneAt(880, 1320, now + 0.18, 0.20, "sine", 0.22);
    this.toneAt(1320, 1320, now + 0.34, 0.12, "sine", 0.20);
  }

  private playStreak(): void {
    const now = this.ctx.currentTime;
    this.toneAt(523, 523, now, 0.10, "sine", 0.22);
    this.toneAt(659, 659, now + 0.07, 0.10, "sine", 0.22);
    this.toneAt(784, 784, now + 0.14, 0.14, "sine", 0.24);
  }

  private playBossAppear(): void {
    const now = this.ctx.currentTime;
    this.toneAt(110, 80, now, 0.40, "sawtooth", 0.30);
    this.toneAt(400, 150, now + 0.30, 0.60, "sawtooth", 0.24);
  }
}
