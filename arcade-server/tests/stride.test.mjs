import test from "node:test";
import assert from "node:assert/strict";
import { haversine, newSession, tick, pause, resume, addFix, addMotionSteps, speedMs, paceSec, thinRoute, newStepper, feedAccel, pickSteps, metFor, kcalFor, dateKey, addDays, stepsOn, lastDays, streak, trendSeries, ratePerWeek, goalEta, dropIsFast, fmtDuration, fmtPace, fmtDist, strideFor, kgToLb, lbToKg } from "../../lib/stride/engine.mjs";

const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

test("stride: distance maths and units", () => {
  assert.ok(Math.abs(haversine({ lat: 0, lon: 0 }, { lat: 1, lon: 0 }) - 111195) < 200);
  assert.ok(Math.abs(haversine({ lat: 33.9, lon: -83.9 }, { lat: 33.9, lon: -83.9 })) < 1e-9);
  assert.ok(Math.abs(lbToKg(kgToLb(70)) - 70) < 1e-9); assert.ok(strideFor("jog", 170) > strideFor("walk", 170));
  assert.equal(fmtDuration(3725000), "1:02:05"); assert.equal(fmtDuration(65000), "1:05"); assert.equal(fmtPace(305), "5:05"); assert.equal(fmtPace(null), "--:--"); assert.equal(fmtDist(5000), "5.00"); assert.equal(fmtDist(1609.344, true), "1.00");
});

test("stride: a noisy walk measures close to the real distance, standing still adds none, jumps are dropped, pause is not counted", () => {
  const r = rng(5), s = newSession("walk", true, 0), M = 111195; let t = 0;
  // walk north at 1.4 m/s for 10 minutes with GPS noise of about 4 m, one fix a second
  for (let i = 0; i <= 600; i++) { t = i * 1000; const north = i * 1.4, noise = () => (r() - 0.5) * 8; addFix(s, { lat: (north + noise()) / M, lon: noise() / M, acc: 8, t }); }
  const truth = 600 * 1.4; assert.ok(s.distM > truth * 0.95 && s.distM < truth * 1.25, `walked ${s.distM} vs ${truth}`);
  const d0 = s.distM; for (let i = 1; i <= 120; i++) { t += 1000; addFix(s, { lat: (truth + (r() - 0.5) * 6) / M, lon: (r() - 0.5) * 6 / M, acc: 8, t }); }
  assert.ok(s.distM - d0 < 25, "standing still adds almost nothing: " + (s.distM - d0));
  const d1 = s.distM; t += 1000; addFix(s, { lat: 0.5, lon: 0.5, acc: 5, t }); assert.equal(s.distM, d1, "a 50 km teleport is dropped");
  const e0 = s.elapsedMs; pause(s, t); const el = s.elapsedMs; tick(s, t + 60000); assert.equal(s.elapsedMs, el, "paused time is not counted"); resume(s, t + 60000); tick(s, t + 70000); assert.equal(s.elapsedMs, el + 10000); assert.ok(e0 > 0);
  addFix(s, { lat: 40, lon: 40, acc: 5, t: t + 71000 }); assert.equal(s.distM, d1, "the first fix after a pause is only a new starting point");
  assert.ok(s.route.length > 10 && thinRoute(s.route, 50).length === 50);
});

test("stride: poor accuracy fixes are ignored; a recovered signal re-baselines", () => {
  const s = newSession("jog", true, 0); addFix(s, { lat: 0, lon: 0, acc: 5, t: 0 }); addFix(s, { lat: 0.0001, lon: 0, acc: 90, t: 5000 }); assert.equal(s.distM, 0);
  for (let i = 1; i <= 3; i++) addFix(s, { lat: 1, lon: 1, acc: 5, t: 5000 + i * 1000 }); // three impossible jumps in a row: GPS is now somewhere else
  addFix(s, { lat: 1 + 0.0001, lon: 1, acc: 5, t: 10000 }); assert.ok(s.distM > 5 && s.distM < 14, "counting again from the new place: " + s.distM);
});

test("stride: steps from the motion sensor", () => {
  const walk = (hz, secs, amp) => { const st = newStepper(); for (let i = 0; i < secs * 50; i++) { const t = i * 20; const a = 9.81 + amp * Math.sin(2 * Math.PI * hz * (t / 1000)); feedAccel(st, t, 0.3, 0.2, a); } return st.n; };
  const w = walk(1.8, 60, 3), j = walk(2.8, 60, 8); assert.ok(w >= 100 && w <= 116, "walking 60 s at 1.8 steps/s: " + w); assert.ok(j >= 155 && j <= 176, "jogging at 2.8 steps/s: " + j);
  const still = newStepper(), r = rng(9); for (let i = 0; i < 3000; i++) feedAccel(still, i * 20, 0.1 * (r() - 0.5), 0.1 * (r() - 0.5), 9.81 + 0.2 * (r() - 0.5)); assert.ok(still.n <= 1, "sitting still counts nothing: " + still.n);
});

test("stride: which step count to trust", () => {
  assert.deepEqual(pickSteps({ motion: 1000, distM: 700, strideM: 0.7, gps: true }), { steps: 1000, source: "sensor" });
  assert.deepEqual(pickSteps({ motion: 30, distM: 2100, strideM: 0.7, gps: true }), { steps: 3000, source: "estimated" }); // phone in a bag: sensor missed most steps
  assert.deepEqual(pickSteps({ motion: 0, distM: 1400, strideM: 0.7, gps: true }), { steps: 2000, source: "estimated" });
  assert.deepEqual(pickSteps({ motion: 500, distM: 0, strideM: 0.7, gps: false }), { steps: 500, source: "sensor" }); // treadmill
});

test("stride: calories are a sane rough estimate", () => {
  assert.ok(Math.abs(metFor("walk", 5 / 3.6) - 3.6) < 0.4); assert.ok(metFor("jog", 10 / 3.6) > 9 && metFor("jog", 10 / 3.6) < 11);
  const k = kcalFor({ type: "walk", kg: 70, seconds: 3600, speed: 5 / 3.6 }); assert.ok(k > 220 && k < 270, "70 kg walking an hour: " + k);
  assert.ok(kcalFor({ type: "jog", kg: 70, seconds: 1800, speed: 10 / 3.6 }) > 330); assert.equal(kcalFor({ type: "walk", kg: 70, seconds: 0, speed: 1 }), 0);
  assert.equal(Math.round(paceSec(5000, 1500000)), 300); assert.equal(paceSec(5, 1000), null);
});

test("stride: daily steps, the week, the streak", () => {
  const day = dateKey(new Date(2026, 10, 27, 12).getTime()), prev = addDays(day, -1); assert.equal(day, "2026-11-27"); assert.equal(addDays("2026-12-31", 1), "2027-01-01"); assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  const st = { workouts: [{ start: new Date(2026, 10, 27, 7).getTime(), steps: 3000 }, { start: new Date(2026, 10, 27, 18).getTime(), steps: 2500 }, { start: new Date(2026, 10, 26, 9).getTime(), steps: 9000 }], steps: { [prev]: 11000 } };
  assert.deepEqual(stepsOn(st, day), { steps: 5500, source: "workouts" }); assert.deepEqual(stepsOn(st, prev), { steps: 11000, source: "entered" }, "what you typed wins");
  assert.equal(lastDays(st, day, 7).length, 7); assert.equal(streak(st, day, 5000), 2); assert.equal(streak(st, day, 6000), 1, "today is not done yet, so the streak counts from yesterday");
});

test("stride: weight trend smooths wobble, gives a weekly rate, a goal date, and a gentle flag for fast drops", () => {
  const r = rng(3), start = "2026-01-01"; const entries = []; for (let i = 0; i < 28; i++) entries.push({ d: addDays(start, i), kg: 90 - i * (0.5 / 7) + (r() - 0.5) * 1.6 });
  const s = trendSeries(entries), last = s[s.length - 1]; const rate = ratePerWeek(s); assert.ok(rate < -0.3 && rate > -0.75, "about -0.5 kg a week, got " + rate);
  const noise = (a) => Math.sqrt(a.reduce((m, p) => m + (p.kg - p.trend) ** 2, 0) / a.length); assert.ok(noise(s) > 0.3, "the trend is smoother than the scale");
  assert.equal(ratePerWeek(s.slice(0, 3)), null, "not enough days yet");
  const eta = goalEta(last.trend, 80, rate, "2026-01-29"); assert.ok(eta.weeks > 10 && eta.weeks < 40 && /^\d{4}-/.test(eta.date)); assert.equal(goalEta(last.trend, 95, rate, "2026-01-29"), null, "moving away from the goal");
  assert.equal(dropIsFast(-0.5, 90), false); assert.equal(dropIsFast(-1.2, 90), true); assert.equal(dropIsFast(0.3, 90), false);
  const gap = trendSeries([{ d: "2026-01-01", kg: 80 }, { d: "2026-02-01", kg: 78 }]); assert.ok(gap[1].trend < 79, "after a long gap the new weigh-in counts for more: " + gap[1].trend);
});

import { sanitizeState, mergeStates, sanitizeSettings } from "../../lib/stride/validate.mjs";
test("stride: stored and imported data is cleaned, and backups merge without losing anything", () => {
  const dirty = { settings: { units: "x", heightCm: 9999, stepGoal: -4, goalKg: "abc", hideWeight: 1 }, workouts: [{ start: 1.7e12, seconds: 600, distM: 800, steps: 1000, type: "jog", route: [[1, 2], ["a", 3], [95, 0]] }, { start: "no" }, null], weights: [{ d: "2026-01-02", kg: 80 }, { d: "bad", kg: 80 }, { d: "2026-01-03", kg: 5 }], steps: { "2026-01-02": 9000, nope: 1, "2026-01-03": -5 } };
  const c = sanitizeState(dirty); assert.equal(c.settings.units, "metric"); assert.equal(c.settings.heightCm, 170); assert.equal(c.settings.stepGoal, 8000); assert.equal(c.settings.goalKg, null); assert.equal(c.settings.hideWeight, true);
  assert.equal(c.workouts.length, 1); assert.deepEqual(c.workouts[0].route, [[1, 2]]); assert.equal(c.workouts[0].type, "jog"); assert.equal(c.weights.length, 1); assert.deepEqual(c.steps, { "2026-01-02": 9000 });
  assert.deepEqual(sanitizeState(null).workouts, []); assert.equal(sanitizeSettings({ goalKg: 70 }).goalKg, 70);
  const a = { workouts: [{ id: "aaaa1", start: 1.7e12, seconds: 60, distM: 100 }], weights: [{ d: "2026-01-02", kg: 80 }], steps: { "2026-01-01": 100 } }, b = { workouts: [{ id: "bbbb2", start: 1.71e12, seconds: 60, distM: 100 }, { id: "aaaa1", start: 1.7e12, seconds: 99, distM: 100 }], weights: [{ d: "2026-01-02", kg: 79.5 }, { d: "2026-01-03", kg: 79 }], steps: { "2026-01-02": 5 } };
  const m = mergeStates(a, b); assert.equal(m.workouts.length, 2); assert.equal(m.workouts.find((w) => w.id === "aaaa1").seconds, 99); assert.deepEqual(m.weights.map((e) => e.kg), [79.5, 79]); assert.deepEqual(m.steps, { "2026-01-01": 100, "2026-01-02": 5 });
});
