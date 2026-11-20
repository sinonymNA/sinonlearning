// Football rules + game flow for Retro Gridiron. The player only ever runs OFFENSE; CPU possessions are simulated.
// A Game owns score/clock/down/distance and turns a finished PlaySim result into the next game state.
import { FIELD, RULES, OPPONENT, yardlineToY } from "./config.mjs";
import { PlaySim } from "./sim.mjs";
import { makeRng } from "./rng.mjs";
import { simulateDrive, fgMakeChance, xpMakeChance } from "./opponent.mjs";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Game {
  /** @param {{mode?:"quick"|"twoMinute", difficulty?:"easy"|"normal"|"hard", seed?:number}} o */
  constructor(o = {}) {
    this.mode = o.mode === "twoMinute" ? "twoMinute" : "quick";
    this.difficulty = OPPONENT[o.difficulty] ? o.difficulty : "normal";
    this.seed = o.seed ?? 1; this.rng = makeRng(this.seed);
    this.qLen = RULES.QUARTER_SECONDS[this.mode];
    this.totalQuarters = this.mode === "twoMinute" ? 1 : 4;
    this.quarter = this.mode === "twoMinute" ? 4 : 1;       // two-minute drill is "the 4th quarter"
    this.clock = this.qLen;
    this.score = { you: 0, cpu: this.mode === "twoMinute" ? 7 : 0 };
    this.possession = "you"; this.yardline = RULES.START_YARDLINE;
    this.down = 1; this.toGo = 10; this.line = this.yardline + 10;
    this.phase = "playcall"; this.log = []; this.drives = []; this.lastPlay = null; this.plays = 0; this.final = null;
    this.stats = { passes: 0, comps: 0, yards: 0, ints: 0, sacks: 0, tds: 0 };
    this.note(this.mode === "twoMinute" ? "Two-Minute Drill: you trail 0-7. Drive for the tie." : "Kickoff: touchback. Your ball at your own 25.");
  }

  note(text) { this.log.push({ text, q: this.quarter, clock: Math.ceil(this.clock) }); if (this.log.length > 60) this.log.shift(); }
  get qLabel() { return this.mode === "twoMinute" ? "2-MIN" : "Q" + this.quarter; }

  // ---- queries --------------------------------------------------------------------------------
  get losY() { return yardlineToY(this.yardline); }
  get firstY() { return yardlineToY(Math.min(100, this.line)); }
  get goalToGo() { return this.line >= 100; }
  get fgDistance() { return Math.round(100 - this.yardline + 17); }
  get canFG() { return this.fgDistance <= RULES.FG_RANGE; }
  state() {
    return {
      mode: this.mode, difficulty: this.difficulty, quarter: this.quarter, qLabel: this.qLabel, clock: this.clock, score: { ...this.score }, possession: this.possession,
      yardline: this.yardline, down: this.down, toGo: this.toGo, goalToGo: this.goalToGo, losY: this.losY, firstY: this.firstY, phase: this.phase,
      fourthDown: this.phase === "playcall" && this.down === 4, canFG: this.canFG, fgDistance: this.fgDistance, fgChance: fgMakeChance(this.fgDistance),
      final: this.final, log: this.log.slice(-8), stats: { ...this.stats }, lastPlay: this.lastPlay,
    };
  }
  downText() { const d = ["", "1st", "2nd", "3rd", "4th"][this.down]; return `${d} & ${this.goalToGo ? "Goal" : Math.max(1, Math.ceil(this.toGo - 0.05))}`; }

  // ---- the player's offence --------------------------------------------------------------------
  /** Create the PlaySim for the chosen play. The client runs it and hands `result` back to finishPlay. */
  beginPlay(playId, opts = {}) {
    if (this.phase !== "playcall") throw new Error("not a play-call phase");
    const dd = OPPONENT[this.difficulty].def - 70;
    this.plays++;
    return new PlaySim({ play: playId, los: this.losY, rng: this.rng, defDelta: dd, coverage: opts.coverage });
  }

  /** Apply a finished play. Returns {text, ...} describing what happened. */
  finishPlay(result) {
    if (this.phase !== "playcall") throw new Error("no play in progress");
    const r = result, st = this.stats;
    if (r.kind === "td" || r.kind === "tackle" || r.kind === "oob") { st.passes++; st.comps++; } else if (r.kind !== "sack") st.passes++;
    const mode = this.mode;
    let text, yl = this.yardline, turnover = false, td = false, safety = false;
    const newYl = r.kind === "incomplete" || r.kind === "drop" || r.kind === "deflection" ? yl : clamp(r.endY - FIELD.END, -5, 100);
    const gained = Math.round(newYl - yl);
    switch (r.kind) {
      case "sack": st.sacks++; text = `Sacked for a loss of ${-gained}`; break;
      case "interception": st.ints++; turnover = true; text = "INTERCEPTED!"; break;
      case "incomplete": case "deflection": case "drop": text = r.kind === "drop" ? "Pass dropped" : r.kind === "deflection" ? "Pass broken up" : "Incomplete"; break;
      case "td": td = true; st.tds++; st.yards += gained; text = "TOUCHDOWN!"; break;
      case "oob": st.yards += gained; text = `Complete for ${gained}, out of bounds`; break;
      default: st.yards += gained; text = gained >= 0 ? `Complete for ${gained}` : `Complete for a loss of ${-gained}`;
    }
    // clock: the play itself plus time between snaps unless the clock stops
    const stops = !!r.clockStop || r.kind === "td" || turnover;
    const burn = r.elapsed + (stops ? 0 : RULES.SNAP_BURN[mode]);
    this.lastPlay = { text, kind: r.kind, yards: gained, td, turnover };
    const prev = { down: this.down, toGo: this.toGo, yl };
    this.note(`${["", "1st", "2nd", "3rd", "4th"][prev.down]} & ${prev.toGo}: ${text}`);

    if (td) { this.yardline = 100; this._tickClock(burn); return this._afterScore("td"); }
    if (turnover) { this._tickClock(burn); return this._changePossession(clamp(100 - Math.round(newYl), 1, 99) , "interception"); }
    if (newYl <= 0) { safety = true; }
    if (safety) { this.score.cpu += RULES.SAFETY; this.note("SAFETY! Opponent scores 2."); this._tickClock(burn); return this._changePossession(35, "safety"); }
    this.yardline = Math.min(99.99, newYl);
    if (this.yardline >= this.line) { this.down = 1; this.line = Math.min(100, this.yardline + 10); this.toGo = this.line - this.yardline; this.note("First down!"); }
    else { this.down++; this.toGo = this.line - this.yardline; if (this.down > 4) { this._tickClock(burn); this.note("Turnover on downs."); return this._changePossession(clamp(Math.round(100 - this.yardline), 1, 99), "downs"); } }
    this._tickClock(burn);
    return this._advanceIfNeeded() || this.lastPlay;
  }

  /** 4th-down punt. */
  punt() {
    if (this.phase !== "playcall") throw new Error("not a play-call phase");
    const d = Math.round(clamp(RULES.PUNT_MEAN + this.rng.normal() * RULES.PUNT_SD, 22, 62)), land = this.yardline + d;
    const cpuStart = land >= 100 ? 20 : clamp(Math.round(100 - land), 1, 99);
    this.note(`Punt ${d} yards${land >= 100 ? ", touchback" : ""}`); this.lastPlay = { text: `Punt ${d} yards`, kind: "punt", yards: 0 };
    this._tickClock(RULES.SNAP_BURN[this.mode] * 0.6);
    return this._changePossession(cpuStart, "punt");
  }

  /** 4th-down field goal. quality 0..1 is how well the player hit the timing meter (1 = dead centre). */
  kickFieldGoal(quality = 0.5) {
    if (this.phase !== "playcall") throw new Error("not a play-call phase");
    if (!this.canFG) throw new Error("out of range");
    const base = fgMakeChance(this.fgDistance), q = clamp(quality, 0, 1);
    const p = clamp(base * (0.15 + 0.95 * q) , 0, 0.99);
    const good = this.rng() < p;
    this._tickClock(RULES.SNAP_BURN[this.mode] * 0.5);
    this.lastPlay = { text: good ? `${this.fgDistance}-yard field goal is GOOD` : `${this.fgDistance}-yard field goal MISSED`, kind: good ? "fg" : "fgmiss", yards: 0, chance: p };
    this.note(this.lastPlay.text);
    if (good) { this.score.you += RULES.FG; return this._changePossession(RULES.START_YARDLINE, "fg"); }
    return this._changePossession(clamp(Math.round(100 - this.yardline), 1, 99), "fgmiss");
  }

  // ---- internals -------------------------------------------------------------------------------
  _afterScore() {
    this.score.you += RULES.TD;
    this.note("Touchdown! 6 points.");
    const xp = this.rng() < xpMakeChance();
    if (xp) { this.score.you += RULES.XP; this.note("Extra point is good."); } else this.note("Extra point missed.");
    this.lastPlay.xp = xp;
    return this._changePossession(RULES.START_YARDLINE, "td");
  }

  /** Tick the game clock; quarter ends are processed when the clock reaches zero. */
  _tickClock(sec) { this.clock = Math.max(0, this.clock - sec); }

  /** After the possession ends the CPU drives; this is also where quarter/half/game ends are processed. */
  _changePossession(cpuStart, why) {
    this.possession = "cpu"; this.cpuStart = cpuStart; this.endedBecause = why;
    this.down = 1; this.toGo = 10;
    this.phase = "cpu";
    const done = this._maybeEndPeriod();
    return done || this.lastPlay;
  }

  _advanceIfNeeded() {
    if (this.clock > 0) return null;
    return this._maybeEndPeriod();
  }

  /** If the clock is out: Q1/Q3 simply roll to the next quarter; Q2 is halftime; the last quarter ends the game. */
  _maybeEndPeriod() {
    if (this.clock > 0) return null;
    if (this.quarter >= this.totalQuarters) { this._finish(); return this.lastPlay; }
    if (this.quarter === 2) {
      // halftime: the CPU receives the second-half kickoff (we received the opening one)
      this.quarter = 3; this.clock = this.qLen; this.note("Halftime."); this.possession = "cpu"; this.cpuStart = RULES.START_YARDLINE; this.phase = "cpu";
      return this.lastPlay;
    }
    this.quarter++; this.clock = this.qLen; this.note(`Start of Q${this.quarter}.`);
    return null;
  }

  /** Time left until the next hard break (halftime or game end), used to bound a simulated CPU drive. */
  _availUntilBreak() {
    if (this.mode === "twoMinute") return this.clock;
    return this.quarter <= 2 ? this.clock + (2 - this.quarter) * this.qLen : this.clock + (4 - this.quarter) * this.qLen;
  }

  /** Run the CPU's possession. Returns the drive (plays + result) and moves the state back to the player. */
  runOpponent() {
    if (this.phase === "final") return null;
    if (this.phase !== "cpu") throw new Error("not the CPU's turn");
    const avail = this._availUntilBreak();
    const drive = simulateDrive({ yardline: this.cpuStart ?? RULES.START_YARDLINE, clockAvail: avail, mode: this.mode, rng: this.rng, difficulty: this.difficulty });
    this.score.cpu += drive.points;
    if (drive.result === "safety") { this.score.you += RULES.SAFETY; }
    this._tickClockAcross(drive.secs);
    for (const p of drive.plays) this.note("CPU " + p.text);
    this.drives.push({ who: "cpu", result: drive.result, points: drive.points });
    if (this.phase === "final") return { ...drive };
    if (this.halftimePending) {          // halftime hit mid-drive: the CPU gets the second-half kickoff
      this.halftimePending = false; this.possession = "cpu"; this.cpuStart = RULES.START_YARDLINE; this.phase = "cpu";
      return drive;
    }
    this.possession = "you";
    this.yardline = clamp(Math.round(drive.youStart ?? RULES.START_YARDLINE), 1, 99);
    this.down = 1; this.line = this.yardline + 10; this.toGo = 10; this.phase = "playcall";
    // the drive may have used up the final seconds
    if (this.mode === "twoMinute" && this.clock <= 0) this._finish();
    else if (this.quarter >= this.totalQuarters && this.clock <= 0) this._finish();
    return drive;
  }

  /** Spend `sec` seconds, rolling quarter boundaries (Q1->Q2, Q3->Q4 allowed mid-drive; halftime/final stop here). */
  _tickClockAcross(sec) {
    let left = sec;
    while (left > 0 && this.phase !== "final") {
      if (left < this.clock) { this.clock -= left; return; }
      left -= this.clock; this.clock = 0;
      if (this.quarter >= this.totalQuarters) { this._finish(); return; }
      if (this.quarter === 2) { this.quarter = 3; this.clock = this.qLen; this.note("Halftime."); this.halftimePending = true; return; }
      this.quarter++; this.clock = this.qLen;
    }
  }

  _finish() {
    this.phase = "final"; this.possession = "none";
    const d = this.score.you - this.score.cpu;
    this.final = { result: d > 0 ? "win" : d < 0 ? "loss" : "tie", score: { ...this.score }, margin: d, stats: { ...this.stats }, mode: this.mode, difficulty: this.difficulty };
    this.note(`FINAL: ${this.score.you}-${this.score.cpu}`);
  }
}
