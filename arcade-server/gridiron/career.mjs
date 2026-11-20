// Coaching Career: a whole season (7 regular-season games, then a 4-team playoff), a roster you build with
// free-agent pickups and training, and seasons that carry over. Pure ESM, JSON-serialisable state (the client
// keeps it in localStorage). All randomness comes from a seed + salt so every operation is reproducible.
import { makeRng } from "./rng.mjs";

export const CAREER = {
  TEAMS: 8, REG_WEEKS: 7, PLAYOFF_TEAMS: 4, START_CREDITS: 3,
  WIN_CREDITS: 3, TIE_CREDITS: 2, LOSS_CREDITS: 1, PLAYOFF_WIN_CREDITS: 3, TITLE_CREDITS: 6, OFFSEASON_CREDITS: 3,
  TRAIN_COST: 2, TRAIN_GAIN: 2, OVR_CAP: 95, FA_POOL: 8,
  WEIGHTS: { qb: 0.28, wr: 0.2, rb: 0.1, ol: 0.17, def: 0.25 },
};
export const SLOTS = [
  { key: "qb", pos: "QB", label: "Quarterback" }, { key: "wr", idx: 0, pos: "WR", label: "Receiver A" }, { key: "wr", idx: 1, pos: "WR", label: "Receiver B" },
  { key: "wr", idx: 2, pos: "WR", label: "Receiver C" }, { key: "wr", idx: 3, pos: "WR", label: "Receiver D" }, { key: "rb", pos: "RB", label: "Running back" },
  { key: "ol", pos: "OL", label: "Offensive line" }, { key: "def", pos: "DEF", label: "Defence" },
];

const FIRST = ["Jax", "Milo", "Dre", "Tank", "Rico", "Zane", "Kobe", "Tre", "Beau", "Nash", "Otis", "Ty", "Cruz", "Bo", "Remy", "Jett", "Moose", "Deke", "Cal", "Hank", "Ace", "Rex", "Lou", "Duke", "Finn", "Gus", "Sly", "Wes", "Knox", "Boone"];
const LAST = ["Blaze", "Stone", "Rocket", "Bishop", "Hawk", "Slade", "Cannon", "Fox", "Maddox", "Flash", "Brick", "Archer", "Lightning", "Ridge", "Thunder", "Vance", "Marsh", "Storm", "Pike", "Gunner", "Dash", "Frost", "Quill", "Rowe", "Tatum", "Bolt", "Sparks", "Kincaid", "Ortega", "Lund"];
const UNITS = ["Wall", "Crew", "Squad", "Brigade", "Posse"];
const CITY = ["Harbor", "Summit", "Canyon", "Prairie", "Delta", "Ridge", "Lakeside", "Metro"];
const MASCOT = ["Wolves", "Comets", "Titans", "Gators", "Falcons", "Rhinos", "Vipers", "Mustangs"];
const COLORS = ["#e5484d", "#f59e0b", "#22c55e", "#a855f7", "#06b6d4", "#ec4899", "#84cc16", "#f97316"];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rngFor = (st, salt) => makeRng(((st.seed >>> 0) + st.season * 7919 + salt * 104729) >>> 0);
const uid = (st) => `p${st.nextId++}`;

function mkPlayer(st, rng, pos, lo, hi, age) {
  const ovr = Math.round(rng.range(lo, hi));
  const name = pos === "OL" ? `${rng.pick(LAST)} ${rng.pick(UNITS)}` : pos === "DEF" ? `${rng.pick(LAST)} ${rng.pick(["D", "Defense", "Dogs", "Wall"])}` : `${rng.pick(FIRST)} ${rng.pick(LAST)}`;
  return { id: uid(st), name, pos, ovr, age: age ?? 20 + rng.int(13), trained: 0 };
}
export const faCost = (ovr) => (ovr >= 85 ? 8 : ovr >= 80 ? 5 : ovr >= 75 ? 3 : ovr >= 70 ? 2 : 1);

export function slotPlayer(st, s) { return s.idx != null ? st.roster[s.key][s.idx] : st.roster[s.key]; }
function setSlot(st, s, p) { if (s.idx != null) st.roster[s.key][s.idx] = p; else st.roster[s.key] = p; }
export const slotOf = (key, idx) => SLOTS.find((s) => s.key === key && (s.idx ?? undefined) === (idx ?? undefined));

/** Overall team rating from a roster of players. */
export function rosterOvr(r) {
  const W = CAREER.WEIGHTS, wr = r.wr.reduce((a, p) => a + p.ovr, 0) / r.wr.length;
  return Math.round(r.qb.ovr * W.qb + wr * W.wr + r.rb.ovr * W.rb + r.ol.ovr * W.ol + r.def.ovr * W.def);
}
/** Ratings handed to the live engine (Game/PlaySim). */
export function rosterRatings(r) { return { qb: r.qb.ovr, wr: r.wr.map((p) => p.ovr), rb: r.rb.ovr, ol: r.ol.ovr, def: r.def.ovr }; }

/** Round-robin by the circle method: 8 teams -> 7 rounds, every team plays every other once. */
export function roundRobin(n) {
  const ids = [...Array(n).keys()], rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) pairs.push([ids[i], ids[n - 1 - i]]);
    rounds.push(pairs); ids.splice(1, 0, ids.pop());
  }
  return rounds;
}

export function newCareer({ seed = 1, teamName = "Your Team" } = {}) {
  const st = { v: 1, seed: seed >>> 0, season: 1, nextId: 1, phase: "regular", week: 1, credits: CAREER.START_CREDITS, teamName: String(teamName).slice(0, 18) || "Your Team", history: [], log: [] };
  const rng = rngFor(st, 1);
  st.roster = { qb: mkPlayer(st, rng, "QB", 64, 72, 23), wr: [0, 1, 2, 3].map(() => mkPlayer(st, rng, "WR", 62, 72, 21 + rng.int(5))), rb: mkPlayer(st, rng, "RB", 64, 72, 22), ol: mkPlayer(st, rng, "OL", 62, 70, 24), def: mkPlayer(st, rng, "DEF", 62, 70, 24) };
  st.teams = []; const order = [...Array(CAREER.TEAMS - 1).keys()]; for (let i = order.length - 1; i > 0; i--) { const j = rng.int(i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  st.teams.push({ id: 0, name: st.teamName, short: st.teamName.slice(0, 3).toUpperCase(), color: "#3b82f6", ovr: rosterOvr(st.roster), user: true });
  for (let i = 1; i < CAREER.TEAMS; i++) { const k = order[i - 1]; st.teams.push({ id: i, name: `${CITY[k]} ${MASCOT[k]}`, short: CITY[k].slice(0, 3).toUpperCase(), color: COLORS[k], ovr: Math.round(rng.range(62, 84)), user: false }); }
  startSeason(st); return st;
}

function startSeason(st) {
  st.phase = "regular"; st.week = 1; st.results = []; st.bracket = null;
  st.table = st.teams.map((t) => ({ id: t.id, w: 0, l: 0, t: 0, pf: 0, pa: 0 }));
  const rng = rngFor(st, 2);
  const rounds = roundRobin(CAREER.TEAMS);
  st.schedule = rounds.map((pairs) => pairs.map(([a, b]) => (rng() < 0.5 ? [a, b] : [b, a])));
  refreshFreeAgents(st, true);
  st.teams[0].ovr = rosterOvr(st.roster);
}

export function refreshFreeAgents(st, full) {
  const rng = rngFor(st, 100 + st.week + (full ? 50 : 0));
  const keep = full ? [] : st.freeAgents.filter(() => rng() < 0.5);
  const poses = ["QB", "WR", "WR", "WR", "RB", "OL", "DEF", "WR"];
  const fresh = [];
  while (keep.length + fresh.length < CAREER.FA_POOL) {
    const pos = poses[(keep.length + fresh.length + st.week) % poses.length];
    const star = rng() < 0.18;
    fresh.push(mkPlayer(st, rng, pos, star ? 82 : 60, star ? 91 : 80));
  }
  st.freeAgents = [...keep, ...fresh].sort((a, b) => b.ovr - a.ovr);
}

export const myTeam = (st) => st.teams[0];
export const teamById = (st, id) => st.teams[id];
export function standings(st) {
  return st.table.map((r) => ({ ...r, team: st.teams[r.id], diff: r.pf - r.pa })).sort((a, b) => (b.w - a.w) || (a.l - b.l) || (b.diff - a.diff) || (b.pf - a.pf) || a.id - b.id);
}

function applyResult(st, a, b, sa, sb, playoff) {
  const ra = st.table[a], rb = st.table[b];
  if (!playoff) {
    ra.pf += sa; ra.pa += sb; rb.pf += sb; rb.pa += sa;
    if (sa > sb) { ra.w++; rb.l++; } else if (sb > sa) { rb.w++; ra.l++; } else { ra.t++; rb.t++; }
  }
}

/** Simulated game between two rated teams: touchdowns + field goals, close to what the live engine produces. */
export function simScore(rng, ovrA, ovrB, noTie) {
  const gap = (ovrA - ovrB) / 11;
  const side = (g) => { const td = clamp(Math.round(2 + g + rng.normal() * 1.15), 0, 7), fg = rng.int(3); return { td, fg, pts: td * 7 + fg * 3 }; };
  let a = side(gap), b = side(-gap);
  if (noTie && a.pts === b.pts) { if (rng() < 0.5 + gap * 0.06) a.pts += 3; else b.pts += 3; }
  return [a.pts, b.pts];
}

export function userFixture(st) {
  if (st.phase === "regular") { const g = st.schedule[st.week - 1].find((p) => p.includes(0)); return g ? { a: g[0], b: g[1], opp: g[0] === 0 ? g[1] : g[0], label: `Week ${st.week} of ${CAREER.REG_WEEKS}`, playoff: false } : null; }
  if (st.phase === "playoffs") {
    const rd = st.bracket.rounds[st.bracket.round]; const g = rd.find((p) => p[0] === 0 || p[1] === 0);
    return g ? { a: g[0], b: g[1], opp: g[0] === 0 ? g[1] : g[0], label: st.bracket.round === 0 ? "Playoff semifinal" : "CHAMPIONSHIP", playoff: true } : null;
  }
  return null;
}

/** Options for a live Game vs the next opponent. */
export function gameOptions(st) {
  const f = userFixture(st); if (!f) return null;
  const opp = st.teams[f.opp];
  return { seed: (st.seed + st.season * 131 + (st.phase === "regular" ? st.week : 20 + (st.bracket?.round ?? 0)) * 17) >>> 0, roster: rosterRatings(st.roster), opp: { off: opp.ovr, def: opp.ovr, name: opp.name, short: opp.short }, fixture: f };
}

/**
 * Finish the user's game for this week with a score (live result or a sim), play the rest of the round, and advance.
 * @returns {{summary:object, others:object[]}}
 */
export function recordUserGame(st, sa, sb) {
  const f = userFixture(st); if (!f) throw new Error("no game to record");
  const you = f.a === 0 ? sa : sb, them = f.a === 0 ? sb : sa;
  const rng = rngFor(st, 200 + st.week + (st.bracket ? 40 + st.bracket.round * 7 : 0));
  const others = [];
  const user = { week: st.week, round: st.bracket?.round ?? null, opp: f.opp, you, them, label: f.label, playoff: f.playoff };
  let win = you > them; const tie = you === them && !f.playoff;
  if (f.playoff && you === them) win = rng() < 0.5;           // overtime coin flip (the live engine has no OT)
  user.result = win ? "W" : tie ? "T" : "L";
  const pairs = f.playoff ? st.bracket.rounds[st.bracket.round] : st.schedule[st.week - 1];
  const winners = [];
  for (const [a, b] of pairs) {
    if (a === 0 || b === 0) {
      if (!f.playoff) applyResult(st, a, b, f.a === a ? sa : sb, f.a === a ? sb : sa, false);
      winners.push(win ? 0 : f.opp); continue;
    }
    const [x, y] = simScore(rng, st.teams[a].ovr, st.teams[b].ovr, f.playoff);
    if (!f.playoff) applyResult(st, a, b, x, y, false);
    others.push({ a, b, sa: x, sb: y }); winners.push(x > y ? a : b);
  }
  st.results.push(user);
  // credits
  st.credits += f.playoff ? (win ? CAREER.PLAYOFF_WIN_CREDITS : CAREER.LOSS_CREDITS) : win ? CAREER.WIN_CREDITS : tie ? CAREER.TIE_CREDITS : CAREER.LOSS_CREDITS;
  let notes = [];
  if (f.playoff) notes = advancePlayoffs(st, winners, win);
  else {
    st.week++; refreshFreeAgents(st, false);
    if (st.week > CAREER.REG_WEEKS) notes = beginPlayoffs(st);
  }
  st.teams[0].ovr = rosterOvr(st.roster);
  return { summary: user, others, notes };
}

/** SIM WEEK: let the sim play the user's game too. */
export function simUserGame(st) {
  const f = userFixture(st); if (!f) throw new Error("no game to sim");
  const rng = rngFor(st, 300 + st.week + (st.bracket?.round ?? 0));
  const [x, y] = simScore(rng, st.teams[f.a].ovr, st.teams[f.b].ovr, f.playoff);
  return recordUserGame(st, x, y);
}

function beginPlayoffs(st) {
  const top = standings(st).slice(0, CAREER.PLAYOFF_TEAMS).map((r) => r.id);
  st.phase = "playoffs"; st.seeds = top;
  st.bracket = { round: 0, rounds: [[[top[0], top[3]], [top[1], top[2]]]], champion: null };
  const notes = [top.includes(0) ? `You made the playoffs as the #${top.indexOf(0) + 1} seed!` : "You missed the playoffs. The league plays on without you."];
  if (!top.includes(0)) notes.push(...autoFinish(st));
  return notes;
}
function advancePlayoffs(st, winners, userWon) {
  const b = st.bracket;
  if (b.round === 0) { b.round = 1; b.rounds.push([[winners[0], winners[1]]]); return userWon ? ["Into the championship game!"] : [...lose(st, "Lost in the semifinal"), ...autoFinish(st)]; }
  b.champion = winners[0]; return finishSeason(st, userWon ? "Champions" : "Lost the final");
}
function lose(st, label) { st.userOut = label; return [label + "."]; }
/** The user is out: sim whatever playoff games are left. */
function autoFinish(st) {
  const rng = rngFor(st, 400); const b = st.bracket;
  if (b.round === 0) { const w = b.rounds[0].map(([x, y]) => { const [p, q] = simScore(rng, st.teams[x].ovr, st.teams[y].ovr, true); return p > q ? x : y; }); b.round = 1; b.rounds.push([[w[0], w[1]]]); }
  const [x, y] = b.rounds[1][0]; const [p, q] = simScore(rng, st.teams[x].ovr, st.teams[y].ovr, true);
  b.champion = p > q ? x : y;
  return finishSeason(st, st.seeds.includes(0) ? (st.userOut || "Lost in the semifinal") : "Missed the playoffs");
}
function finishSeason(st, outcome) {
  const me = st.table[0], champ = st.bracket.champion;
  if (champ === 0) st.credits += CAREER.TITLE_CREDITS;
  st.phase = "offseason";
  st.history.push({ season: st.season, w: me.w, l: me.l, t: me.t, pf: me.pf, pa: me.pa, outcome, champion: st.teams[champ].name, ovr: rosterOvr(st.roster) });
  return [champ === 0 ? "YOU WON THE CHAMPIONSHIP!" : `${st.teams[champ].name} win the championship.`];
}

/** Move on to next season: age, progression, retirement/draft, fresh league. */
export function nextSeason(st) {
  if (st.phase !== "offseason") throw new Error("season still running");
  st.season++; const rng = rngFor(st, 500);
  const grow = (p) => {
    p.age++; p.trained = 0;
    const d = p.age <= 24 ? rng.range(0.5, 4.5) : p.age <= 29 ? rng.range(-1, 2) : -rng.range(0.5, 4);
    p.ovr = clamp(Math.round(p.ovr + d), 45, CAREER.OVR_CAP);
  };
  const all = [st.roster.qb, ...st.roster.wr, st.roster.rb, st.roster.ol, st.roster.def];
  all.forEach(grow);
  // veterans past 34 retire; a rookie from the draft takes the job
  const retired = [];
  for (const s of SLOTS) { const p = slotPlayer(st, s); if (p.age >= 35) { retired.push(p.name); setSlot(st, s, mkPlayer(st, rng, p.pos, 58, 70, 21)); } }
  st.freeAgents.forEach(grow); st.freeAgents = st.freeAgents.filter((p) => p.age < 35);
  for (const t of st.teams) if (!t.user) t.ovr = clamp(Math.round(t.ovr + (74 - t.ovr) * 0.25 + rng.normal() * 3.5), 58, 90);
  st.teams[0].ovr = rosterOvr(st.roster);
  st.credits += CAREER.OFFSEASON_CREDITS; st.userOut = null;
  startSeason(st);
  return { retired };
}

// ---- roster moves
export function canTrain(st, key, idx) {
  const s = slotOf(key, idx); if (!s) return "No such slot"; const p = slotPlayer(st, s);
  if (st.credits < CAREER.TRAIN_COST) return `Needs ${CAREER.TRAIN_COST} credits`;
  if (p.ovr >= CAREER.OVR_CAP) return "Maxed out"; if (p.trained >= 2) return "Trained twice already this season";
  return null;
}
export function train(st, key, idx) {
  const why = canTrain(st, key, idx); if (why) throw new Error(why);
  const p = slotPlayer(st, slotOf(key, idx)); p.ovr = Math.min(CAREER.OVR_CAP, p.ovr + CAREER.TRAIN_GAIN); p.trained++; st.credits -= CAREER.TRAIN_COST; st.teams[0].ovr = rosterOvr(st.roster); return p;
}
/** Sign a free agent into a starting slot; the player he replaces goes back to the pool. */
export function sign(st, faId, key, idx) {
  const fa = st.freeAgents.find((p) => p.id === faId); if (!fa) throw new Error("player no longer available");
  const s = slotOf(key, idx); if (!s || s.pos !== fa.pos) throw new Error(`${fa.name} plays ${fa.pos}`);
  const cost = faCost(fa.ovr); if (st.credits < cost) throw new Error(`Costs ${cost} credits`);
  const old = slotPlayer(st, s); setSlot(st, s, fa); st.freeAgents = st.freeAgents.filter((p) => p !== fa); st.freeAgents.push(old); st.freeAgents.sort((a, b) => b.ovr - a.ovr);
  st.credits -= cost; st.teams[0].ovr = rosterOvr(st.roster); return old;
}
export function careerRecord(st) {
  const h = st.history; return { seasons: h.length, titles: h.filter((x) => x.outcome === "Champions").length, w: h.reduce((a, x) => a + x.w, 0), l: h.reduce((a, x) => a + x.l, 0) };
}
