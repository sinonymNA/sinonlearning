// Balance simulation for Dacula Dash. Usage: node scripts/dacula-sim.mjs [--games 30] [--minutes 20]
import { simulate, summarise } from "../arcade-server/dacula/sim.mjs";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? Number(process.argv[i + 1]) : d; };
const games = arg("games", 20), minutes = arg("minutes", 20);
console.log(`Dacula Dash simulation: ${games} games per row, ${minutes}-minute cap (think-time model: roll ~1.5s, route ~4s, question ~7s)\n`);
for (const players of [2, 4, 6]) for (const accuracy of [0.5, 0.7, 0.9]) {
  const runs = Array.from({ length: games }, (_, i) => simulate({ players, accuracy, seed: i + 1, minutes }));
  const s = summarise(runs);
  console.log(`${players} players, ${Math.round(accuracy * 100)}% correct: median ${s.medianMinutes} min (p90 ${s.p90Minutes}, max ${s.maxMinutes}), finished-by-win ${(s.finishedNaturally * 100).toFixed(0)}%, timeouts ${(s.timeouts * 100).toFixed(0)}%, turns/board ${s.meanTurnsPerBoard}, wedges/player ${s.meanWedgesPerPlayer}, leader ${s.meanLeaderWedges}`);
}
