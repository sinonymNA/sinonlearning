// Economy simulator for Pack Rush: a human-speed player (1 action/second) so we can tune pacing. Usage: node scripts/packs-econ.mjs [minutes] [seed]
import { tap, newState, openPack, buyUpgrade, upgradeCost, unlocked, packCost, mods, claimFree, tick, rebootGain, reboot } from "../arcade-server/packs/engine.mjs";
import { UPGRADES, SETS } from "../arcade-server/packs/config.mjs";
export function human(seed, seconds, { rebootAt = 3, stopAtReboot = true } = {}) {
  const st = newState(seed, 0), log = {};
  for (let s = 0; s < seconds; s++) {
    const now = s * 1000; tick(st, now); if (st.freeAt <= now) claimFree(st, now); tap(st);
    // one action per second: buy the cheapest upgrade when it is affordable with 40% of coins, else open packs of the best affordable tier
    let best = null; for (const u of UPGRADES) { const l = st.up[u.id] || 0; if (l < u.max) { const c = upgradeCost(u.id, l); if (!best || c < best.c) best = { id: u.id, c }; } }
    if (best && best.c <= st.coins * 0.4) { buyUpgrade(st, best.id); log["up:" + best.id + ":" + st.up[best.id]] ??= s; continue; }
    let t = SETS.length - 1; while (t > 0 && (!unlocked(st, t) || packCost(st, t) > st.coins * 0.4)) t--;
    st.tier = t; const per = mods(st).multi.filter((x) => x * packCost(st, t) <= st.coins * 0.6).at(-1) || 1;
    for (let i = 0; i < per && st.coins >= packCost(st, t); i++) openPack(st, t);
    log["tier" + t] ??= s; if (st.up.auto) log.auto ??= s;
    if (rebootGain(st) >= rebootAt) { log.reboot ??= s; if (stopAtReboot) break; }
  }
  return { st, log };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const mins = +(process.argv[2] || 60), seed = +(process.argv[3] || 1), { st, log } = human(seed, mins * 60);
  const m = (k) => (log[k] === undefined ? "-" : (log[k] / 60).toFixed(1) + "m");
  console.log("tier1", m("tier1"), "tier2", m("tier2"), "tier3", m("tier3"), "tier4", m("tier4"), "tier5", m("tier5"), "| auto", m("auto"), "| reboot(3*)", m("reboot"), "| earned", st.run.earned.toExponential(2), "owned", Object.keys(st.dex).length, "up", JSON.stringify(st.up));
}
