// Economy simulator for Pack Rush v2: a human who taps ~4 times a second, buys packs, sells duplicates and shops for upgrades.
// Usage: node scripts/packs-econ.mjs [minutes] [seed] [tapsPerSecond]
import { newState, advance, hit, buyPack, unlockTier, sellAll, buyUpgrade, hire, upgradeCost, freeSlot, mods, albumCount, ALBUM_TOTAL, dupeCount, packPrice } from "../arcade-server/packs/engine.mjs";
import { SETS, UPGRADES, STAFF, MAX_SLOTS } from "../arcade-server/packs/config.mjs";

export function human(seed, seconds, { cps = 4 } = {}) {
  const st = newState(seed), log = {}; let cheapest;
  for (let s = 0; s < seconds; s++) {
    advance(st, 1);
    // shopping: unlock the next pack, hire staff, upgrades; whichever is cheapest and costs under 40% of cash
    cheapest = null;
    const nextTier = st.unlocked.indexOf(false);
    const options = [];
    if (nextTier > 0) options.push({ kind: "unlock", id: nextTier, c: SETS[nextTier].unlock });
    for (const u of UPGRADES) { const l = st.up[u.id] || 0; if (l < u.max) options.push({ kind: "up", id: u.id, c: upgradeCost(UPGRADES, u.id, l) }); }
    for (const u of STAFF) { const l = st.staff[u.id] || 0; if (l < u.max) options.push({ kind: "staff", id: u.id, c: upgradeCost(STAFF, u.id, l) }); }
    options.sort((a, b) => a.c - b.c); cheapest = options[0];
    const unl = options.find((o) => o.kind === "unlock");   // a human buys the next pack type the moment they can afford it
    for (const o of unl && unl.c <= st.cash * 0.9 ? [unl] : options.slice(0, 3)) { if (o.c <= st.cash * (o.kind === "unlock" ? 0.9 : 0.4)) { if (o.kind === "unlock") { unlockTier(st, o.id); log["tier" + o.id] ??= s; st.tier = o.id; } else if (o.kind === "up") { buyUpgrade(st, o.id); log["up:" + o.id] ??= s; } else { hire(st, o.id); log["staff:" + o.id] ??= s; } break; } }
    // best affordable unlocked pack (spend at most 70% of cash on it)
    let t = SETS.length - 1; while (t > 0 && (!st.unlocked[t] || packPrice(t) > st.cash * 0.7 || st.stock[t] < 1)) t--;
    st.tier = Math.max(st.tier, 0); st.tier = t;
    for (let k = 0; k < cps; k++) {
      const free = freeSlot(st); if (free >= 0) { try { buyPack(st, t); } catch { /* broke or out of stock */ } }
      let best = -1; for (let i = 0; i < MAX_SLOTS; i++) if (st.table[i] && (best < 0 || st.table[i].hp < st.table[best].hp)) best = i;
      if (best >= 0) hit(st, best);
    }
    if (s % 4 === 0 || dupeCount(st) >= mods(st).cap) sellAll(st);
    if (albumCount(st) >= ALBUM_TOTAL * 0.25) log.album25 ??= s;
  }
  return { st, log };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const mins = +(process.argv[2] || 60), seed = +(process.argv[3] || 1), cps = +(process.argv[4] || 4), { st, log } = human(seed, mins * 60, { cps });
  const m = (k) => (log[k] === undefined ? "-" : (log[k] / 60).toFixed(1) + "m");
  console.log("unlock c/r/s/v/n:", [1, 2, 3, 4, 5].map((i) => m("tier" + i)).join(" "), "| opener", m("staff:opener"), "seller", m("staff:seller"), "buyer", m("staff:buyer"), "| album", albumCount(st) + "/" + ALBUM_TOTAL, "| cash", st.cash.toExponential(2), "earned", st.total.earned.toExponential(2), "packs", st.total.packs, "up", JSON.stringify(st.up), "staff", JSON.stringify(st.staff));
}
