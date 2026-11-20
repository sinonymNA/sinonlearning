import test from "node:test";
import assert from "node:assert/strict";
import { newCareer, roundRobin, userFixture, simUserGame, recordUserGame, standings, nextSeason, sign, train, canTrain, rosterOvr, gameOptions, faCost, CAREER, careerRecord } from "../gridiron/career.mjs";
import { Game } from "../gridiron/rules.mjs";
import { PlaySim } from "../gridiron/sim.mjs";

test("round robin: 7 rounds, everyone plays everyone exactly once", () => {
  const r = roundRobin(8); assert.equal(r.length, 7);
  const seen = new Set();
  for (const round of r) { assert.equal(new Set(round.flat()).size, 8); for (const [a, b] of round) seen.add([a, b].sort().join("-")); }
  assert.equal(seen.size, 28);
});

test("a full season sims to the offseason, with standings that add up", () => {
  const st = newCareer({ seed: 7, teamName: "Test" });
  let guard = 0;
  while (st.phase !== "offseason" && guard++ < 20) { if (userFixture(st)) simUserGame(st); else break; }
  assert.equal(st.phase, "offseason");
  assert.equal(st.history.length, 1);
  const tab = standings(st);
  for (const r of tab) assert.equal(r.w + r.l + r.t, 7);
  assert.equal(tab.reduce((a, r) => a + r.w, 0), tab.reduce((a, r) => a + r.l, 0), "league wins = league losses (no ties assumed lopsided)" );
  assert.ok(st.bracket.champion != null);
});

test("seasons carry over: players age, credits grow, new schedule", () => {
  const st = newCareer({ seed: 11 });
  while (st.phase !== "offseason") simUserGame(st);
  const age = st.roster.qb.age, cr = st.credits; const done = st.history.length;
  nextSeason(st);
  assert.equal(st.season, 2); assert.equal(st.phase, "regular"); assert.equal(st.week, 1);
  assert.ok(st.credits >= cr + CAREER.OFFSEASON_CREDITS - 1e-9);
  assert.ok(st.roster.qb.age === age + 1 || st.roster.qb.age < 25);
  assert.equal(st.history.length, done);
  assert.equal(st.table.every((r) => r.w + r.l + r.t === 0), true);
  assert.throws(() => nextSeason(st), /still running/);
});

test("free agents: signing costs credits, checks the position, and returns the old starter to the pool", () => {
  const st = newCareer({ seed: 3 }); st.credits = 20;
  const fa = st.freeAgents.find((p) => p.pos === "WR"); const before = st.roster.wr[2];
  assert.throws(() => sign(st, fa.id, "qb"), /plays WR/);
  const c = faCost(fa.ovr); sign(st, fa.id, "wr", 2);
  assert.equal(st.roster.wr[2].id, fa.id); assert.equal(st.credits, 20 - c);
  assert.ok(st.freeAgents.some((p) => p.id === before.id));
  st.credits = 0; const fb = st.freeAgents[0];
  assert.throws(() => sign(st, fb.id, fb.pos === "WR" ? "wr" : fb.pos.toLowerCase(), 0), /Costs|plays/);
});

test("training costs credits, adds rating, and is capped at twice per season", () => {
  const st = newCareer({ seed: 5 }); st.credits = 10; const o = st.roster.qb.ovr;
  train(st, "qb"); train(st, "qb");
  assert.equal(st.roster.qb.ovr, Math.min(CAREER.OVR_CAP, o + 4)); assert.equal(st.credits, 6);
  assert.match(canTrain(st, "qb"), /twice/);
  st.credits = 1; assert.match(canTrain(st, "rb"), /credits/);
});

test("better rosters win more: a stacked team wins the title far more often than a stock one", () => {
  let strong = 0, stock = 0;
  for (let s = 1; s <= 60; s++) {
    for (const boost of [0, 22]) {
      const st = newCareer({ seed: s * 13 });
      if (boost) { for (const p of [st.roster.qb, ...st.roster.wr, st.roster.rb, st.roster.ol, st.roster.def]) p.ovr += boost; st.teams[0].ovr = rosterOvr(st.roster); }
      while (st.phase !== "offseason") simUserGame(st);
      if (st.history[0].outcome === "Champions") (boost ? strong++ : stock++);
    }
  }
  assert.ok(strong > stock * 2 && strong >= 15, `strong ${strong} vs stock ${stock}`);
});

test("live engine honours roster + opponent: a great QB completes more, a great defence concedes less", () => {
  const comp = (qb) => { let ok = 0, n = 0; for (let i = 0; i < 160; i++) { const s = new PlaySim({ play: "curls", seed: 900 + i, coverage: "zone", roster: { qb, wr: [75, 75, 75, 75], rb: 75, ol: 75 } }); s.snap(); for (let k = 0; k < 40 && s.phase === "pocket"; k++) s.step(1 / 30); if (s.phase === "pocket") { s.throwTo(1); n++; for (let k = 0; k < 400 && s.phase !== "dead" && s.phase !== "carry"; k++) s.step(1 / 30); if (s.phase === "carry" || (s.result && s.result.kind !== "incomplete" && s.result.kind !== "int")) ok++; } } return ok / Math.max(1, n); };
  assert.ok(comp(95) > comp(45), `qb95 ${comp(95)} vs qb45 ${comp(45)}`);
  const drive = (def) => { let pts = 0; for (let i = 0; i < 300; i++) { const g = new Game({ seed: i, roster: { qb: 75, wr: [75, 75, 75, 75], rb: 75, ol: 75, def }, opp: { off: 80, def: 70 } }); g.cpuStart = 25; g.phase = "cpu"; g.runOpponent(); pts += g.score.cpu; } return pts; };
  assert.ok(drive(95) < drive(50), "defence rating lowers opponent scoring");
});

test("gameOptions gives the opponent's strength and a stable seed; live results feed the standings", () => {
  const st = newCareer({ seed: 21 }); const o = gameOptions(st); assert.ok(o.opp.off >= 58 && o.opp.off <= 90); assert.equal(o.roster.wr.length, 4);
  const f = userFixture(st); const res = recordUserGame(st, f.a === 0 ? 24 : 10, f.a === 0 ? 10 : 24);
  assert.equal(res.summary.result, "W"); assert.equal(standings(st).find((r) => r.id === 0).w, 1); assert.equal(st.week, 2);
  assert.equal(res.others.length, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(st)), st, "state is plain JSON");
  assert.equal(careerRecord(st).seasons, 0);
});
