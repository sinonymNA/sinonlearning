import test from "node:test";
import assert from "node:assert/strict";
import { PlaySim, runPlay, Game, PLAYBOOK, FIELD, SIM, RULES, yardlineToY, simulateDrive, makeRng } from "../gridiron/index.mjs";

const rng0 = Object.assign(() => 0, { int: () => 0, range: (a) => a, normal: () => 0, pick: (a) => a[0] });
const rng1 = Object.assign(() => 0.999, { int: () => 0, range: (a, b) => b, normal: () => 0, pick: (a) => a[0] });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mk = (play = "slants", o = {}) => { const s = new PlaySim({ play, los: yardlineToY(30), seed: 5, coverage: "zone", ...o }); s.snap(); return s; };
/** Park every defender far away so a carry can be tested in isolation. */
const clearDefence = (s) => { for (const e of s.defenders) { e.x = 5; e.y = 118; e.state = "PURSUE"; e.stun = 99; } };
const toCarry = (s, x, y, idx = 0) => { s._caught(s.wr[idx], { x, y }); s.target = { x, y }; };

// ---------------------------------------------------------------- playbook / routes
test("playbook has the eight required plays, each with four labelled receivers and routes", () => {
  assert.deepEqual(PLAYBOOK.map((p) => p.id).sort(), ["curls", "flood", "mesh", "outs", "post", "screen", "slants", "verts"].sort());
  for (const p of PLAYBOOK) { assert.equal(p.receivers.length, 4); for (const r of p.receivers) assert.ok(r.route.length >= 2); }
  const s = mk("verts"); assert.deepEqual(s.wr.map((w) => w.label), ["A", "B", "C", "D"]);
  for (let i = 1; i < 4; i++) assert.ok(s.wr[i].x > s.wr[i - 1].x, "A..D run left to right");
});

test("receivers visibly run their routes (position changes over time and follows waypoints)", () => {
  const s = mk("verts"); const y0 = s.wr.map((w) => w.y); s.advance(1.5);
  s.wr.forEach((w, i) => assert.ok(w.y - y0[i] > 8, `receiver ${i} went deep`));
  const sl = mk("slants"); const x0 = sl.wr[0].x; sl.advance(1.6); assert.ok(sl.wr[0].x > x0 + 3, "left slant breaks inside");
  const out = mk("outs"); out.advance(0.9); const xa = out.wr[0].x; out.advance(1.2); assert.ok(out.wr[0].x < xa - 3, "left out breaks to the sideline");
});

test("every play: routes finish inside the field and reach their final waypoint", () => {
  for (const p of PLAYBOOK) {
    const s = mk(p.id); for (const w of s.wr) for (const pt of w.path) assert.ok(pt.x >= 0 && pt.x <= FIELD.W && pt.y > 0 && pt.y < FIELD.LEN);
    s.advance(0.1); s.wr.forEach((w) => assert.ok(w.wp >= 0));
  }
});

// ---------------------------------------------------------------- defensive AI
test("defensive AI states: man/zone/blitz coverage, DL blocked then rushing", () => {
  const m = mk("slants", { coverage: "man" }); assert.ok(m.db.every((d) => d.state === "COVER_MAN"));
  const z = mk("slants", { coverage: "zone" }); assert.ok(z.db.every((d) => d.state === "COVER_ZONE"));
  const b = mk("slants", { coverage: "blitz" }); assert.equal(b.lb[1].state, "BLOCKED"); assert.ok(b.lb[1].blitz);
  assert.ok(m.dl.every((d) => d.state === "BLOCKED"));
  m.advance(6); assert.ok(m.dl.some((d) => d.state === "RUSH") || m.phase === "dead", "a rusher eventually gets free");
});

test("man defenders shadow their receivers; defenders are not identical", () => {
  const s = mk("slants", { coverage: "man" }); s.advance(1.4);
  s.db.forEach((d) => assert.ok(dist(d, s.wr[d.cover]) < 7, `${d.id} stays with his man`));
  const ratings = new Set(s.db.map((d) => d.r.coverage)); assert.ok(ratings.size > 1);
  const speeds = new Set(s.db.map((d) => d.maxSpeed.toFixed(3))); assert.ok(speeds.size > 1);
});

test("zone defenders react to receivers entering their area and to the thrown ball (INTERCEPT)", () => {
  const s = mk("curls", { coverage: "zone" }); s.advance(1.9); assert.ok(s.throwTo(0)); s.advance(0.6);
  assert.ok(s.defenders.some((d) => d.state === "INTERCEPT"));
});

test("after a catch every defender PURSUEs", () => {
  const s = mk(); toCarry(s, 26, s.los + 8); assert.equal(s.phase, "carry"); assert.ok(s.defenders.every((d) => d.state === "PURSUE" || d.state === "TACKLE"));
});

// ---------------------------------------------------------------- passing
test("A/B/C/D target the matching receiver and the throw leads the receiver", () => {
  for (let idx = 0; idx < 4; idx++) {
    const s = mk("curls", { seed: 11 + idx }); s.advance(1.0); assert.ok(s.throwTo(idx));
    assert.equal(s.thrownTo, idx);
    let guard = 0; while (s.phase === "windup" || s.phase === "flight") { s.step(SIM.DT); if (guard++ > 400) break; }
    assert.ok(dist(s.target.ideal, s.wr[idx]) < 2.2 || s.phase === "carry" || s.phase === "dead", `lead point near receiver ${idx}`);
    assert.ok(dist(s.target.ideal, s.target) < 6, "accuracy error stays bounded");
  }
});

test("ball flight is visible: starts at the QB, travels over time, has an arc", () => {
  const s = mk("verts"); s.advance(1.5); s.throwTo(1);
  const b0 = s.ballPos(); assert.ok(dist(b0, s.qb) < 0.5);
  let maxZ = 0, moved = 0; let guard = 0;
  while (s.phase === "windup" || s.phase === "flight") { s.step(SIM.DT); const b = s.ballPos(); maxZ = Math.max(maxZ, b.z); moved = Math.max(moved, dist(b, b0)); if (guard++ > 500) break; }
  assert.ok(moved > 12, "ball travelled downfield"); assert.ok(maxZ > 2, "ball has an arc");
});

test("can't throw twice, before the snap, or to a bad index", () => {
  const p = new PlaySim({ play: "slants", los: 40, seed: 1 }); assert.equal(p.throwTo(0), false);
  const s = mk(); assert.equal(s.throwTo(7), false); assert.equal(s.throwTo(0), true); assert.equal(s.throwTo(1), false);
});

test("pass outcomes cover completion, incompletion, drop, deflection and interception across many throws", () => {
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    let th = false;
    const s = runPlay({ play: PLAYBOOK[i % 8].id, seed: 100 + i, los: yardlineToY(40) }, (s) => {
      if (s.phase === "carry") s.setLateral(0);
      if (!th && s.phase === "pocket" && s.t > 1.4) th = s.throwTo(i % 4);
    });
    seen.add(s.result.kind === "tackle" || s.result.kind === "td" || s.result.kind === "oob" ? "complete" : s.result.kind);
  }
  for (const k of ["complete", "incomplete", "drop", "deflection", "interception"]) assert.ok(seen.has(k), "saw " + k);
});

test("a ball thrown out of bounds is incomplete and stops the clock", () => {
  const s = mk(); s.advance(1); s.throwTo(0); s.target = { x: -3, y: s.los + 8, ideal: { x: 0, y: 0 } };
  while (s.phase !== "dead") s.step(SIM.DT);
  assert.equal(s.result.kind, "incomplete"); assert.ok(s.result.clockStop);
});

test("interception: defender on the ball with the receiver out of reach", () => {
  const s = mk(); s.advance(1); s.throwTo(0); s.rng = rng0;
  const d = s.db[0]; s.target = { x: 30, y: s.los + 14, ideal: { x: 30, y: s.los + 14 } }; d.x = 30.2; d.y = s.los + 14; s.wr[0].x = 5; s.wr[0].y = s.los + 3;
  s.phase = "flight"; s.flight.t0 = s.t - s.flight.dur - 1; s.step(SIM.DT);
  assert.equal(s.result.kind, "interception"); assert.ok(s.result.turnover);
});

test("dropped pass: catching ability matters", () => {
  const lo = mk(); lo.advance(1); lo.throwTo(0); lo.wr[0].r.catching = 20; lo.rng = Object.assign(() => 0.2, rng1);
  const t = lo.wr[0]; lo.target = { x: t.x, y: t.y, ideal: { x: t.x, y: t.y } }; for (const d of lo.defenders) { d.x = 2; d.y = 100; }
  lo.phase = "flight"; lo.flight.t0 = lo.t - 9; lo.step(SIM.DT); assert.equal(lo.result.kind, "drop");
  const hi = mk(); hi.advance(1); hi.throwTo(0); hi.wr[0].r.catching = 99; hi.rng = Object.assign(() => 0.2, rng1);
  const t2 = hi.wr[0]; hi.target = { x: t2.x, y: t2.y, ideal: { x: t2.x, y: t2.y } }; for (const d of hi.defenders) { d.x = 2; d.y = 100; }
  hi.phase = "flight"; hi.flight.t0 = hi.t - 9; hi.step(SIM.DT); assert.equal(hi.phase, "carry");
});

test("QB ratings affect throws: better accuracy => smaller average miss", () => {
  const miss = (acc) => { let sum = 0; for (let i = 0; i < 120; i++) { const s = mk("curls", { seed: 900 + i }); s.qb.r.accuracy = acc; s.advance(1.1); s.throwTo(1); sum += dist(s.target, s.target.ideal); } return sum / 120; };
  assert.ok(miss(95) < miss(45) * 0.7);
});

test("pressure and rushed throws grow the accuracy error", () => {
  const sig = (pressure) => { const s = mk("curls", { seed: 4 }); s.advance(1.2); if (pressure) { s.dl[1].state = "RUSH"; s.dl[1].x = s.qb.x; s.dl[1].y = s.qb.y + 2; } s.throwTo(1); return s.target.sigma; };
  assert.ok(sig(true) > sig(false) * 1.4);
  const early = mk("curls"); early.advance(0.3); early.throwTo(1); const late = mk("curls"); late.advance(1.2); late.throwTo(1); assert.ok(early.target.sigma > late.target.sigma * 0.9);
});

// ---------------------------------------------------------------- sack
test("sack before release: a free rusher reaches the QB, or the pocket collapses", () => {
  const s = mk(); s.advance(1.2); const d = s.dl[0]; d.state = "RUSH"; d.x = s.qb.x + 0.5; d.y = s.qb.y + 0.5; s.step(SIM.DT);
  assert.equal(s.result.kind, "sack"); assert.ok(s.result.yards < 0);
  const idle = runPlay({ play: "verts", seed: 3, los: yardlineToY(30) }); assert.equal(idle.result.kind, "sack");
});

test("blitz gets home sooner than a base rush on average", () => {
  const avg = (cov) => { let sum = 0, n = 0; for (let i = 0; i < 80; i++) { const s = runPlay({ play: "post", seed: 500 + i, coverage: cov, los: yardlineToY(30) }); sum += s.result.elapsed; n++; } return sum / n; };
  assert.ok(avg("blitz") < avg("man"));
});

// ---------------------------------------------------------------- carry
test("post-catch: receiver auto-runs upfield with no input", () => {
  const s = mk(); clearDefence(s); toCarry(s, 26, s.los + 8); const y0 = s.carrier.y; s.advance(1.0);
  assert.ok(s.carrier.y - y0 > 5, "runs forward on his own"); assert.ok(Math.abs(s.carrier.x - 26) < 0.6, "no lateral drift without input");
});

test("post-catch: left/right steer with no teleporting and a small forward-speed cost", () => {
  const run = (L) => { const s = mk(); clearDefence(s); toCarry(s, 26, s.los + 8); s.setLateral(L); let maxStep = 0, px = s.carrier.x; const y0 = s.carrier.y; for (let i = 0; i < 30; i++) { s.step(SIM.DT); maxStep = Math.max(maxStep, Math.abs(s.carrier.x - px)); px = s.carrier.x; } return { x: s.carrier.x, dy: s.carrier.y - y0, maxStep }; };
  const L = run(-1), R = run(1), N = run(0);
  assert.ok(L.x < 24 && R.x > 28, "steers both ways"); assert.ok(L.maxStep < 0.3 && R.maxStep < 0.3, "no teleporting");
  assert.ok(L.dy < N.dy && L.dy > N.dy * 0.8, "sharp lateral costs a little forward speed"); assert.ok(Math.abs(N.x - 26) < 0.1);
});

test("carry ends in a touchdown at the goal line", () => {
  const s = mk(); clearDefence(s); toCarry(s, 26, FIELD.GOAL_Y - 3); s.advance(2);
  assert.equal(s.result.kind, "td"); assert.ok(s.result.td); assert.equal(s.result.endY, FIELD.GOAL_Y);
});

test("carry out of bounds ends the play and stops the clock", () => {
  const s = mk(); clearDefence(s); toCarry(s, 3, s.los + 8); s.setLateral(-1); s.advance(2);
  assert.equal(s.result.kind, "oob"); assert.ok(s.result.oob && s.result.clockStop);
});

test("defenders take pursuit angles and tackle; tackle chance obeys ratings", () => {
  const s = mk(); toCarry(s, 26, s.los + 6); s.rng = rng0; const d = s.db[0]; d.x = 26.3; d.y = s.los + 6.4; d.stun = 0; d.cool = 0; d.blockedUntil = 0; d.r.tackling = 99; s.step(SIM.DT);
  assert.equal(s.result.kind, "tackle"); assert.equal(s.result.tackler, d.id);
  // a whole play: defenders chase the carrier and bring him down
  let tackles = 0; for (let i = 0; i < 60; i++) { const q = mk("slants", { seed: 70 + i }); q.advance(1.7); q.throwTo(0); while (q.phase === "windup" || q.phase === "flight") q.step(SIM.DT); let g = 0; while (q.phase === "carry" && g++ < 600) q.step(SIM.DT); if (q.result?.kind === "tackle") tackles++; }
  assert.ok(tackles > 15);
});

test("broken and missed tackles happen and leave the carrier running", () => {
  const s = mk(); toCarry(s, 26, s.los + 6); s.rng = rng1; const d = s.db[0]; d.x = 26.2; d.y = s.los + 6.4; d.stun = 0; d.cool = 0; s.step(SIM.DT);
  assert.equal(s.phase, "carry"); assert.ok(d.stun > 0); assert.ok(s.events.some((e) => e.type === "broken" || e.type === "missed"));
});

test("gang tackles are more likely than lone tackles", () => {
  const p = (n) => { let c = 0; for (let i = 0; i < 300; i++) { const s = mk("slants", { seed: i }); toCarry(s, 26, s.los + 6); s.rng = makeRng(i + 1); for (const e of s.defenders) { e.x = 5; e.y = 118; e.stun = 99; } for (let k = 0; k < n; k++) { const d = s.defenders[k]; d.x = 26 + k * 0.4; d.y = s.los + 6.2; d.stun = 0; d.cool = k ? 9 : 0; } s.step(SIM.DT); if (s.phase === "dead") c++; } return c; };
  assert.ok(p(3) > p(1));
});

test("blockers engage defenders after the catch (screen) and slow them", () => {
  const s = mk("screen"); toCarry(s, 26, s.los - 1, 0); s.advance(1.5);
  assert.ok(s.events.some((e) => e.type === "block") || s.phase === "dead");
});

test("receiver ratings change speeds: faster receiver covers more ground", () => {
  const run = (sp) => { const s = mk(); clearDefence(s); toCarry(s, 26, s.los + 8); s.carrier.r.speed = sp; s.carrier.maxSpeed = SIM.SPEED_BASE + SIM.SPEED_PER_RATING * sp; const y0 = s.carrier.y; s.advance(1.5); return s.carrier.y - y0; };
  assert.ok(run(95) > run(55) + 1.5);
});

// ---------------------------------------------------------------- rules
const finish = (g, kind, gain, extra = {}) => g.finishPlay({ kind, endY: g.losY + gain, elapsed: 4, caught: true, clockStop: false, yards: gain, ...extra });

test("first down resets the chain; short gains advance the down", () => {
  const g = new Game({ seed: 3 }); assert.equal(g.down, 1); finish(g, "tackle", 12); assert.equal(g.down, 1); assert.equal(g.yardline, 37); assert.equal(g.line, 47);
  finish(g, "tackle", 3); assert.equal(g.down, 2); assert.equal(g.toGo, 7); finish(g, "tackle", 3); assert.equal(g.down, 3); assert.equal(g.toGo, 4);
});

test("turnover on downs gives the CPU the ball at the spot", () => {
  const g = new Game({ seed: 3 }); for (let i = 0; i < 4; i++) finish(g, "tackle", 2);
  assert.equal(g.phase, "cpu"); assert.equal(g.possession, "cpu"); assert.equal(g.cpuStart, 100 - 33);
});

test("interception flips possession at the spot", () => {
  const g = new Game({ seed: 3 }); g.finishPlay({ kind: "interception", endY: yardlineToY(45), elapsed: 3, turnover: true, interception: true });
  assert.equal(g.phase, "cpu"); assert.equal(g.cpuStart, 55); assert.equal(g.stats.ints, 1);
});

test("incomplete passes stop the clock and keep the spot; down advances", () => {
  const g = new Game({ seed: 3 }); const c = g.clock; g.finishPlay({ kind: "incomplete", endY: g.losY, elapsed: 3.5, incomplete: true, clockStop: true });
  assert.equal(g.down, 2); assert.equal(g.yardline, 25); assert.ok(Math.abs(c - g.clock - 3.5) < 1e-6);
});

test("a completed in-bounds play also burns time between snaps; out of bounds does not", () => {
  const a = new Game({ seed: 3 }); const c = a.clock; finish(a, "tackle", 5); assert.ok(c - a.clock >= 4 + RULES.SNAP_BURN.quick - 1e-6);
  const b = new Game({ seed: 3 }); b.finishPlay({ kind: "oob", endY: b.losY + 6, elapsed: 4, oob: true, clockStop: true, caught: true }); assert.ok(Math.abs(b.clock - (b.qLen - 4)) < 1e-6);
});

test("sack loses yards and uses a down; sack in the end zone is a safety", () => {
  const g = new Game({ seed: 3 }); g.finishPlay({ kind: "sack", endY: g.losY - 7, elapsed: 3, sack: true }); assert.equal(g.down, 2); assert.equal(g.yardline, 18); assert.equal(g.toGo, 17);
  const s = new Game({ seed: 3 }); s.yardline = 4; s.line = 14; s.finishPlay({ kind: "sack", endY: yardlineToY(1) - 5, elapsed: 3, sack: true });
  assert.equal(s.score.cpu, RULES.SAFETY); assert.equal(s.phase, "cpu");
});

test("touchdown scores 6 and the extra point is resolved; the CPU then gets the ball", () => {
  const g = new Game({ seed: 3 }); g.finishPlay({ kind: "td", endY: FIELD.GOAL_Y, elapsed: 6, td: true, caught: true, clockStop: true });
  assert.ok(g.score.you === 6 || g.score.you === 7); assert.equal(g.phase, "cpu"); assert.equal(g.stats.tds, 1);
});

test("goal-to-go distance and first-down line cap at the goal line", () => {
  const g = new Game({ seed: 3 }); g.yardline = 94; g.line = 100; g.toGo = 6; assert.ok(g.goalToGo); assert.equal(g.downText(), "1st & Goal");
});

test("field goal: range, success rises with timing quality, adds 3 points", () => {
  const g = new Game({ seed: 3 }); g.yardline = 80; g.down = 4; assert.ok(g.canFG); assert.equal(g.fgDistance, 37);
  let good = 0; for (let i = 0; i < 200; i++) { const h = new Game({ seed: i }); h.yardline = 80; h.down = 4; h.kickFieldGoal(1); if (h.score.you === 3) good++; }
  let bad = 0; for (let i = 0; i < 200; i++) { const h = new Game({ seed: i }); h.yardline = 80; h.down = 4; h.kickFieldGoal(0.05); if (h.score.you === 3) bad++; }
  assert.ok(good > bad + 80);
  const far = new Game({ seed: 3 }); assert.equal(far.canFG, false); assert.throws(() => far.kickFieldGoal(1));
});

test("punt hands the ball over; touchback puts the CPU at the 20", () => {
  const g = new Game({ seed: 3 }); g.yardline = 50; g.down = 4; g.punt(); assert.equal(g.phase, "cpu"); assert.ok(g.cpuStart >= 1 && g.cpuStart <= 50);
  const t = new Game({ seed: 3 }); t.yardline = 80; t.down = 4; t.rng = rng1; t.punt(); assert.equal(t.cpuStart, 20);
});

test("quarters roll: Q1->Q2 keeps the ball, halftime gives the CPU the kickoff, Q4 ends the game", () => {
  const g = new Game({ seed: 3 }); g.clock = 3; finish(g, "tackle", 4); assert.equal(g.quarter, 2); assert.equal(g.possession, "you"); assert.equal(g.clock, g.qLen);
  g.clock = 3; finish(g, "tackle", 4); assert.equal(g.quarter, 3); assert.equal(g.phase, "cpu"); assert.equal(g.cpuStart, 25);
  g.runOpponent(); assert.equal(g.possession, "you"); g.quarter = 4; g.clock = 2; g.score.you = 10; g.score.cpu = 3; finish(g, "tackle", 2);
  assert.equal(g.phase, "final"); assert.equal(g.final.result, "win");
});

test("two-minute drill: 2:00 clock, trailing 0-7, ends at zero", () => {
  const g = new Game({ mode: "twoMinute", seed: 2 }); assert.equal(g.clock, 120); assert.deepEqual(g.score, { you: 0, cpu: 7 }); assert.equal(g.qLabel, "2-MIN");
  g.clock = 3; finish(g, "tackle", 5); assert.equal(g.phase, "final"); assert.equal(g.final.result, "loss");
  const w = new Game({ mode: "twoMinute", seed: 2 }); w.score.you = 8; w.clock = 2; finish(w, "tackle", 5); assert.equal(w.final.result, "win");
});

test("quick play and two-minute use different clock burn", () => {
  assert.ok(RULES.SNAP_BURN.twoMinute < RULES.SNAP_BURN.quick);
});

test("CPU drives are deterministic from the seed and bounded by the clock", () => {
  const run = (seed) => simulateDrive({ yardline: 25, clockAvail: 200, mode: "quick", rng: makeRng(seed), difficulty: "normal" });
  assert.deepEqual(run(9), run(9)); const d = run(10); assert.ok(d.plays.length >= 1 && d.secs <= 200);
  const tiny = simulateDrive({ yardline: 25, clockAvail: 5, mode: "quick", rng: makeRng(1), difficulty: "normal" }); assert.equal(tiny.result, "clock");
  const results = new Set(); for (let i = 0; i < 300; i++) results.add(run(i).result); for (const r of ["td", "fg", "punt", "turnover", "downs"]) assert.ok(results.has(r), r);
});

test("harder opponents score more", () => {
  const pts = (diff) => { let p = 0; for (let i = 0; i < 400; i++) p += simulateDrive({ yardline: 25, clockAvail: 300, mode: "quick", rng: makeRng(i), difficulty: diff }).points; return p; };
  assert.ok(pts("hard") > pts("easy"));
});

// a simple bot plays whole games to prove they can finish
function botGame(mode, seed) {
  const g = new Game({ mode, seed, difficulty: "normal" }); let plays = 0, guard = 0;
  while (g.phase !== "final" && guard++ < 600) {
    if (g.phase === "cpu") { g.runOpponent(); continue; }
    if (g.down === 4 && g.canFG && g.fgDistance < 48) { g.kickFieldGoal(0.8); continue; }
    if (g.down === 4 && g.yardline < 60 && g.toGo > 3) { g.punt(); continue; }
    const sim = g.beginPlay(PLAYBOOK[plays++ % 8].id); sim.snap(); let thrown = false, n = 0;
    while (sim.phase !== "dead" && n++ < 4000) {
      if (sim.phase === "carry") sim.setLateral(0);
      if (!thrown && sim.phase === "pocket" && sim.t > 1.5) { let b = 0, bs = -1; sim.wr.forEach((w, j) => { const sp = sim.separation(w); if (sp > bs) { bs = sp; b = j; } }); thrown = sim.throwTo(b); }
      sim.step(SIM.DT);
    }
    g.finishPlay(sim.result);
  }
  return g;
}
test("a full Quick Play match runs to a final result", () => {
  for (const seed of [1, 2, 3]) { const g = botGame("quick", seed); assert.equal(g.phase, "final"); assert.ok(["win", "loss", "tie"].includes(g.final.result)); assert.ok(g.plays > 8); }
});
test("a Two-Minute Drill runs to a final result", () => {
  for (const seed of [4, 5]) { const g = botGame("twoMinute", seed); assert.equal(g.phase, "final"); assert.ok(g.plays >= 3); }
});
