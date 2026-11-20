// Computer possessions are simulated from team ratings (the player only ever controls the offence).
// Each drive returns a short play-by-play so the UI can show what happened.
import { RULES, OPPONENT } from "./config.mjs";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ord = (n) => ["", "1st", "2nd", "3rd", "4th"][n];
const spotText = (yl) => (yl <= 50 ? `own ${Math.round(yl)}` : `opp ${Math.round(100 - yl)}`);

export function fgMakeChance(dist) { return clamp(1.04 - Math.max(0, dist - 28) * 0.0155, 0.04, 0.99); }
export function xpMakeChance() { return 0.94; }

/**
 * Simulate one CPU possession.
 * @param {{yardline:number, clockAvail:number, mode:string, rng:Function, difficulty:string}} o   yardline = yards from the CPU's own goal line
 * @returns {{plays:{text:string}[], result:"td"|"fg"|"punt"|"turnover"|"downs"|"clock"|"safety", points:number, secs:number, youStart:number, xp?:boolean}}
 */
export function simulateDrive(o) {
  const rng = o.rng, opp = OPPONENT[o.difficulty || "normal"];
  const delta = (opp.off - 70) / 100;                      // stronger opponents gain more
  const burn = RULES.SNAP_BURN[o.mode] ?? 12;
  let yl = o.yardline, down = 1, toGo = 10, line = Math.min(100, yl + 10), secs = 0;
  const plays = [], out = (r, extra) => ({ plays, result: r, secs, points: 0, youStart: RULES.START_YARDLINE, ...extra });
  for (let n = 0; n < 40; n++) {
    if (secs >= o.clockAvail) return out("clock");
    const head = `${ord(down)} & ${line >= 100 ? "Goal" : toGo} at ${spotText(yl)}`;
    if (down === 4) {
      const fgDist = 100 - yl + 17;
      const wantFG = fgDist <= RULES.FG_RANGE - 8;
      const goFor = !wantFG && yl >= 45 && toGo <= 2 && rng() < 0.5;
      if (wantFG) {
        const s = burn * 0.5; if (secs + s > o.clockAvail) return out("clock");
        secs += s;
        if (rng() < fgMakeChance(fgDist)) { plays.push({ text: `${head}: ${fgDist}-yard field goal is GOOD` }); return out("fg", { points: RULES.FG, youStart: RULES.START_YARDLINE }); }
        plays.push({ text: `${head}: ${fgDist}-yard field goal MISSED` }); return out("downs", { youStart: clamp(100 - yl, 1, 99) });
      }
      if (!goFor) {
        const s = burn * 0.6; if (secs + s > o.clockAvail) return out("clock");
        secs += s;
        const d = Math.round(clamp(RULES.PUNT_MEAN + rng.normal() * RULES.PUNT_SD, 22, 62)), land = yl + d;
        const you = land >= 100 ? 20 : clamp(100 - land, 1, 99);
        plays.push({ text: `${head}: punt ${d} yards${land >= 100 ? ", touchback" : ""}` }); return out("punt", { youStart: you });
      }
    }
    // ---- a real play
    const pass = rng() < 0.52;
    let yards = 0, s = 4 + rng.range(1, 3), kind = pass ? "pass" : "run", text, stops = false, turnover = false;
    if (pass) {
      const r = rng();
      const pSack = 0.06 - delta * 0.04, pInt = clamp(0.032 - delta * 0.03, 0.005, 0.08), pComp = clamp(0.6 + delta * 0.5, 0.35, 0.85);
      if (r < pSack) { yards = -Math.round(clamp(Math.abs(rng.normal() * 2 + 6), 3, 11)); text = `sacked for ${-yards}`; }
      else if (r < pSack + pInt) { turnover = true; text = "pass intercepted!"; }
      else if (rng() < pComp) { yards = Math.round(clamp(10 + delta * 6 + rng.normal() * 7, 0, 60)); text = `pass complete for ${yards}`; }
      else { stops = true; text = "pass incomplete"; s = 4; }
    } else {
      yards = Math.round(clamp(4 + delta * 3 + rng.normal() * 3.2, -4, 30)); text = `run for ${yards}`;
    }
    s += stops ? 0 : burn; if (secs + s > o.clockAvail) { plays.push({ text: `${head}: time expires` }); return out("clock"); }
    secs += s;
    if (turnover) { plays.push({ text: `${head}: ${text}` }); return out("turnover", { youStart: clamp(100 - yl - rng.int(8), 1, 99) }); }
    yl += yards;
    if (yl >= 100) { plays.push({ text: `${head}: ${text}, TOUCHDOWN` }); const xp = rng() < xpMakeChance(); plays.push({ text: xp ? "Extra point is good" : "Extra point missed" }); return out("td", { points: RULES.TD + (xp ? RULES.XP : 0), xp }); }
    if (yl <= 0) { plays.push({ text: `${head}: ${text}, SAFETY` }); return out("safety", { points: 0, safetyFor: "you" }); }
    plays.push({ text: `${head}: ${text}` });
    if (yl >= line) { down = 1; line = Math.min(100, yl + 10); toGo = line - yl; } else { down++; toGo = line - yl; if (down > 4) { return out("downs", { youStart: clamp(100 - yl, 1, 99) }); } }
  }
  return out("clock");
}
