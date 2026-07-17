export type SoundKey =
  | "coin" | "grand-cap" | "correct" | "wrong" | "move"
  | "warp" | "raid" | "item-use" | "countdown" | "minigame-win"
  | "shop" | "trap" | "banner";

export class AudioManager {
  private ctx: AudioContext;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
  }

  play(key: SoundKey): void {
    try {
      switch (key) {
        case "coin":         this.tone(880, 1320, 0.12, "sine", 0.22); break;
        case "grand-cap":    this.fanfare(); break;
        case "correct":      this.tone(660, 880, 0.18, "sine", 0.26); break;
        case "wrong":        this.tone(200, 150, 0.30, "sawtooth", 0.20); break;
        case "move":         this.tone(440, 440, 0.04, "sine", 0.13); break;
        case "warp":         this.warp(); break;
        case "raid":         this.raid(); break;
        case "item-use":     this.tone(600, 900, 0.20, "sine", 0.20); break;
        case "countdown":    this.tone(440, 440, 0.10, "sine", 0.28); break;
        case "minigame-win": this.minigameWin(); break;
        case "shop":         this.shop(); break;
        case "trap":         this.tone(80, 60, 0.35, "sawtooth", 0.25); break;
        case "banner":       this.tone(880, 700, 0.30, "sine", 0.16); break;
      }
    } catch {
      // Silently ignore — AudioContext may not be available or unlocked yet
    }
  }

  private tone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    volume = 0.3,
    startDelay = 0,
  ) {
    const t = this.ctx.currentTime + startDelay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + duration);
    }
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  // C5 → E5 → G5 → C6 ascending fanfare
  private fanfare() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => this.tone(freq, freq, 0.13, "sine", 0.30, i * 0.13));
  }

  // Up-sweep then down-sweep
  private warp() {
    this.tone(800, 1600, 0.25, "sine", 0.20, 0);
    this.tone(1600, 600, 0.25, "sine", 0.16, 0.25);
  }

  // Low thud + descending hit
  private raid() {
    this.tone(150, 100, 0.20, "sawtooth", 0.30, 0);
    this.tone(400, 200, 0.20, "sine", 0.20, 0.10);
  }

  // C5 D5 E5 G5 A5 rapid arpeggio
  private minigameWin() {
    const notes = [523, 587, 659, 784, 880];
    notes.forEach((freq, i) => this.tone(freq, freq, 0.10, "sine", 0.26, i * 0.08));
  }

  // Ascending 3-note chime
  private shop() {
    [600, 750, 900].forEach((freq, i) =>
      this.tone(freq, freq * 1.04, 0.15, "sine", 0.20, i * 0.10),
    );
  }
}
