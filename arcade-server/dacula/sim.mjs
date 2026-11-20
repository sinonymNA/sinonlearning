// Headless full-match simulator for Dacula Dash: real ArcadeService + room + engine, scripted "humans" with think-time and accuracy.
// Used by tests and by `node scripts/dacula-sim.mjs` to estimate duration, turns, wedges and who wins.
import { ArcadeService } from "../service.mjs";
import { GRAPH, DD } from "../games/daculaDash.mjs";

/** Think-time model in ms (a mid-skill student): roll, choose a route, answer a question. */
export const THINK = { roll: [800, 2200], choose: [2000, 6000], question: [3000, 11000] };
const rngOf = (seed) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/**
 * @param {{players?:number, accuracy?:number, seed?:number, minutes?:number, questionSeconds?:number, think?:object, maxMs?:number}} o
 */
export function simulate(o = {}) {
  const { players = 4, accuracy = 0.7, seed = 1, minutes = 20, questionSeconds = 15, think = THINK } = o;
  const clock = { now: 1_000_000 }, rnd = rngOf(seed * 31 + 7);
  const svc = new ArcadeService({ clock: () => clock.now });
  const room = svc.create({ playlist: ["dacula_dash"], settings: { seed, dacula: { minutes, questionSeconds } }, hostUserId: "teacher-1" });
  const ps = Array.from({ length: players }, (_, i) => room.addPlayer({ nickname: `Student ${i}` }));
  room.start();
  const wait = (lo, hi) => lo + rnd() * (hi - lo);
  const ready = new Map();   // player id -> time they are ready to act on their current phase key
  let game = null, t0 = null, steps = 0;
  const maxMs = o.maxMs ?? (minutes + 3) * 60000;
  while (steps++ < 600000) {
    clock.now += 100;
    for (const p of ps) room.touch(p.id);
    room.tick();
    if (room.phase === "playing" && !game) { game = room.game; t0 = room.t(); }
    if (room.phase === "playing" && game) {
      for (const b of game.boards) {
        if (b.over || !b.cur || b.phase === "intro") continue;
        const pid = b.cur, key = `${b.id}:${b.turnNo}:${b.phase}`, now = room.t();
        if (!["roll", "choose", "question"].includes(b.phase)) continue;
        if (!ready.has(pid) || ready.get(pid).key !== key) { const [lo, hi] = think[b.phase]; ready.set(pid, { key, at: now + wait(lo, hi) }); }
        if (now < ready.get(pid).at) continue;
        try {
          if (b.phase === "roll") room.act(pid, { type: "roll", turn: b.turnNo, boost: b.p.get(pid).tokens > 1 ? 1 : 0 });
          else if (b.phase === "choose") { const best = b.bestMove(pid); room.act(pid, { type: "move", to: best.dest, turn: b.turnNo }); }
          else if (b.phase === "question") { const q = b.q; const right = rnd() < accuracy; room.act(pid, { type: "answer", index: right ? q.correct : (q.correct + 1 + Math.floor(rnd() * 3)) % 4, turn: b.turnNo }); }
        } catch { /* an auto-act may have raced us */ }
      }
    }
    if (room.phase === "results" || room.phase === "final") break;
    if (game && room.t() - t0 > maxMs) break;
  }
  const g = game ?? room.game; const out = { players, accuracy, seed, finished: room.phase === "results" || room.phase === "final", elapsedMs: room.t() - (t0 ?? room.t()), boards: [] };
  for (const b of g?.boards ?? []) {
    const table = b.table ?? b.rankings();
    out.boards.push({ turns: b.turnNo, reason: b.final?.reason ?? "unfinished", winner: !!b.winner, wedges: b.members.map((m) => b.p.get(m).wedges.length), correct: b.members.map((m) => b.p.get(m).correct), top: table[0]?.wedges ?? 0 });
  }
  return out;
}

/** Run many games and summarise. */
export function summarise(runs) {
  const n = runs.length, boards = runs.flatMap((r) => r.boards);
  const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const mins = runs.map((r) => r.elapsedMs / 60000).sort((a, b) => a - b);
  return {
    games: n, finishedNaturally: boards.filter((b) => b.winner).length / Math.max(1, boards.length),
    medianMinutes: +mins[Math.floor(n / 2)].toFixed(1), p90Minutes: +mins[Math.floor(n * 0.9)].toFixed(1), maxMinutes: +mins.at(-1).toFixed(1),
    meanTurnsPerBoard: +mean(boards.map((b) => b.turns)).toFixed(1), meanWedgesPerPlayer: +mean(boards.flatMap((b) => b.wedges)).toFixed(2), meanLeaderWedges: +mean(boards.map((b) => b.top)).toFixed(2),
    timeouts: boards.filter((b) => b.reason === "time").length / Math.max(1, boards.length),
  };
}
void GRAPH; void DD;
