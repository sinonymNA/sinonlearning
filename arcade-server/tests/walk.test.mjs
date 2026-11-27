import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PLAN, sanitizePlan, buildPhases, totalSec, phaseAt, phaseStart, splitUpTo, buildCueTrack, wav8, SAMPLE_RATE, LEAD_SEC, TAIL_SEC, walkCalories, checkSteps, cadenceNote, weekProgress, sanitizeSession } from "../../lib/pacer/walk.mjs";

test("walk: the plan is the Japanese 3 + 3 x 5 by default and cannot be made unsafe", () => {
  const ph = buildPhases(DEFAULT_PLAN); assert.equal(ph.length, 10); assert.equal(totalSec(ph), 30 * 60); assert.deepEqual(ph.slice(0, 2).map((p) => p.kind), ["slow", "fast"]); assert.equal(ph.filter((p) => p.kind === "fast").length, 5);
  assert.equal(buildPhases({ first: "fast" })[0].kind, "fast"); const big = sanitizePlan({ intervalMin: 99, sets: 99 }); assert.equal(big.intervalMin, 5); assert.ok(big.sets * 2 * big.intervalSec <= 3600);
  assert.deepEqual(sanitizePlan({ intervalMin: "x", sets: null }), { intervalMin: 3, intervalSec: 180, sets: 5, first: "slow" }); assert.equal(sanitizePlan({ intervalSec: 4, sets: 1 }).intervalSec, 4);
});

test("walk: where you are in the session", () => {
  const ph = buildPhases({ intervalSec: 10, sets: 2 }); assert.equal(totalSec(ph), 40);
  let p = phaseAt(ph, -3); assert.ok(p.lead && p.leadLeft === 3); p = phaseAt(ph, 0); assert.deepEqual([p.index, p.kind, p.left, p.set], [0, "slow", 10, 1]); p = phaseAt(ph, 10); assert.deepEqual([p.index, p.kind, p.left], [1, "fast", 10]);
  p = phaseAt(ph, 25.5); assert.deepEqual([p.index, p.kind, p.set, p.left, p.remaining], [2, "slow", 2, 5, 15]); assert.ok(phaseAt(ph, 40).done); assert.equal(phaseStart(ph, 3), 30);
  assert.deepEqual(splitUpTo(ph, 25), { slowSec: 15, fastSec: 10 }); assert.deepEqual(splitUpTo(ph, 999), { slowSec: 20, fastSec: 20 });
});

// zero crossings per second in a window of an 8-bit track (a cheap pitch measure)
const zcr = (pcm, a, b) => { let z = 0, prev = pcm[Math.round(a * SAMPLE_RATE)] - 128; for (let i = Math.round(a * SAMPLE_RATE) + 1; i < Math.round(b * SAMPLE_RATE); i++) { const v = pcm[i] - 128; if ((prev < 0 && v >= 0) || (prev >= 0 && v < 0)) z++; prev = v; } return z / (2 * (b - a)); };
const energy = (pcm, a, b) => { let e = 0; for (let i = Math.round(a * SAMPLE_RATE); i < Math.round(b * SAMPLE_RATE); i++) e += Math.abs(pcm[i] - 128); return e / ((b - a) * SAMPLE_RATE); };

test("walk: the cue track is silent mid-block, sounds at each switch, rises for FAST and falls for SLOW", () => {
  const ph = buildPhases({ intervalSec: 20, sets: 1 }), pcm = buildCueTrack(ph), L = LEAD_SEC;
  assert.equal(pcm.length, (L + 40 + TAIL_SEC) * SAMPLE_RATE); assert.ok(energy(pcm, L + 6, L + 15) < 0.01, "quiet in the middle of a block");
  assert.ok(energy(pcm, L - 3.2, L - 2.8) > 1, "a tick 3 seconds before the first switch"); assert.ok(energy(pcm, L, L + 0.7) > 10, "a cue when the first block starts"); assert.ok(energy(pcm, L + 20, L + 20.7) > 10, "a cue at the switch");
  const slowCue = [zcr(pcm, L + 0.0, L + 0.25), zcr(pcm, L + 0.36, L + 0.6)], fastCue = [zcr(pcm, L + 20 + 0.02, L + 20 + 0.2), zcr(pcm, L + 20.52, L + 20.7)];
  assert.ok(slowCue[0] > slowCue[1] * 1.3, "SLOW falls in pitch: " + slowCue); assert.ok(fastCue[1] > fastCue[0] * 1.3, "FAST rises in pitch: " + fastCue); assert.ok(energy(pcm, L + 40, L + 41) > 10, "a chime at the end");
  const w = wav8(pcm); assert.equal(String.fromCharCode(...w.slice(0, 4)), "RIFF"); assert.equal(w.length, 44 + pcm.length); assert.equal(new DataView(w.buffer).getUint32(24, true), SAMPLE_RATE);
  assert.ok(buildCueTrack(buildPhases(DEFAULT_PLAN)).length < 16e6, "a full 30 minute session is under 16 MB");
});

test("walk: calories from steps, and from time alone", () => {
  const a = walkCalories({ slowSec: 900, fastSec: 900, kg: 80, heightCm: 175, steps: 3600 }); assert.equal(a.basis, "steps"); assert.ok(a.kcal > 110 && a.kcal < 230, "80 kg, 30 min: " + a.kcal); assert.ok(a.kcalFast > a.kcalSlow); assert.equal(a.steps, 3600); assert.equal(a.cadence, 120); assert.ok(Math.abs(a.distM - 3600 * 0.726) < 5);
  const t = walkCalories({ slowSec: 900, fastSec: 900, kg: 80, heightCm: 175 }); assert.equal(t.basis, "time"); assert.ok(t.kcal > 110 && t.kcal < 230); const heavy = walkCalories({ slowSec: 900, fastSec: 900, kg: 100, heightCm: 175, steps: 3600 }); assert.ok(heavy.kcal > a.kcal * 1.2, "more body weight burns more");
  const more = walkCalories({ slowSec: 900, fastSec: 900, kg: 80, heightCm: 175, steps: 4500 }); assert.ok(more.kcal > a.kcal, "more steps in the same time means faster walking and more calories"); assert.equal(walkCalories({ slowSec: 0, fastSec: 0, kg: 80 }).kcal, 0);
});

test("walk: step entries are sanity checked with plain messages", () => {
  assert.equal(checkSteps({ before: 5000, after: 8500, minutes: 30 }), null); assert.match(checkSteps({ before: 5000, after: 4000, minutes: 30 }), /lower/); assert.match(checkSteps({ before: 5000, after: 5100, minutes: 30 }), /only 100 steps/);
  assert.match(checkSteps({ before: 0, after: 90000, minutes: 30 }), /more than a person/); assert.match(checkSteps({ before: NaN, after: 5 }), /Enter both/);
  assert.match(cadenceNote(125), /Strong/); assert.match(cadenceNote(100), /Steady/); assert.match(cadenceNote(70), /Easy/); assert.equal(cadenceNote(null), null);
});

test("walk: weekly progress counts days with a real session; stored sessions are cleaned", () => {
  const day = (d, m = 0) => new Date(2026, 10, d, 8, m).getTime(), mk = (start, totalSec) => ({ start, totalSec }), today = "2026-11-27";
  assert.deepEqual(weekProgress([mk(day(27), 1800), mk(day(27, 30), 1800), mk(day(26), 1800), mk(day(25), 300), mk(day(20), 1800)], today), { days: 2, goal: 4, done: false }); assert.equal(weekProgress([27, 26, 25, 24].map((d) => mk(day(d), 1800)), today).done, true);
  const s = sanitizeSession({ start: 1.7e12, slowSec: 900, fastSec: 900, kcal: 150, steps: 3500, completed: 1, book: "x".repeat(500) }); assert.equal(s.totalSec, 1800); assert.equal(s.book.length, 120); assert.equal(sanitizeSession({ start: "x" }), null); assert.equal(sanitizeSession({ start: 1.7e12, slowSec: 0, fastSec: 0 }), null);
});

import { sanitizeWalkData } from "../../lib/pacer/walk.mjs";
test("walk: stored data is cleaned and defaults are sensible", () => {
  const d = sanitizeWalkData(null); assert.equal(d.units, "metric"); assert.equal(d.heightCm, 170); assert.equal(d.goalKg, null); assert.deepEqual(d.plan, { intervalMin: 3, sets: 5, first: "slow" }); assert.deepEqual(d.sessions, []); assert.equal(d.meta, null); assert.equal(d.buzz, true);
  const x = sanitizeWalkData({ units: "imperial", heightCm: 5, goalKg: 70, plan: { intervalMin: 4, sets: 6, first: "fast" }, sessions: [{ start: 1.7e12, slowSec: 600, fastSec: 600 }, { start: 1.7e12, slowSec: 600, fastSec: 600 }, { nope: 1 }], weights: [{ d: "2026-01-02", kg: 82.456 }, { d: "x", kg: 80 }, { d: "2026-01-03", kg: 3 }], meta: { stepsBefore: "7000", book: "Moby" } });
  assert.equal(x.units, "imperial"); assert.equal(x.heightCm, 170, "out of range falls back"); assert.equal(x.goalKg, 70); assert.equal(x.plan.first, "fast"); assert.equal(x.sessions.length, 1, "duplicates and junk dropped"); assert.deepEqual(x.weights, [{ d: "2026-01-02", kg: 82.46 }]); assert.deepEqual(x.meta, { stepsBefore: 7000, book: "Moby" });
});
