// Interval walking (the "Japanese walking" method: alternate easy and brisk walking in equal blocks, 3 + 3 minutes, five rounds, 30 minutes).
// Pure ESM: plan and phases, the audio cue track (tones that tell you when to switch, rendered as one WAV so they keep sounding with the screen off),
// calorie estimates from your height, weight and the steps Apple Health recorded before and after, and cleaning of stored data.
import { metFor, strideFor, dateKey, addDays } from "../stride/engine.mjs";

export const DEFAULT_PLAN = { intervalMin: 3, sets: 5, first: "slow" };
export const MAX_TOTAL_SEC = 60 * 60, LEAD_SEC = 5, TAIL_SEC = 3;
const clampInt = (x, lo, hi, d) => { if (x == null || x === "") return d; const n = Math.round(Number(x)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

/** A safe plan: 1 to 5 minute blocks, 1 to 8 rounds, at most an hour in total. `intervalSec` is a test-only override. */
export function sanitizePlan(p) {
  const x = p && typeof p === "object" ? p : {}; const intervalMin = clampInt(x.intervalMin, 1, 5, 3); let sets = clampInt(x.sets, 1, 8, 5);
  const intervalSec = x.intervalSec != null ? clampInt(x.intervalSec, 2, 300, intervalMin * 60) : intervalMin * 60; sets = Math.max(1, Math.min(sets, Math.floor(MAX_TOTAL_SEC / (2 * intervalSec))));
  return { intervalMin, intervalSec, sets, first: x.first === "fast" ? "fast" : "slow" };
}
export function buildPhases(plan) {
  const p = sanitizePlan(plan), out = [], second = p.first === "slow" ? "fast" : "slow";
  for (let i = 1; i <= p.sets; i++) { out.push({ kind: p.first, sec: p.intervalSec, set: i }); out.push({ kind: second, sec: p.intervalSec, set: i }); }
  return out;
}
export const totalSec = (phases) => phases.reduce((a, p) => a + p.sec, 0);
/** Where you are `t` seconds after the lead-in ended (negative while the lead-in counts down). */
export function phaseAt(phases, t) {
  const total = totalSec(phases), sets = phases.length ? phases[phases.length - 1].set : 0;
  if (t < 0) return { lead: true, leadLeft: Math.ceil(-t), index: -1, kind: phases[0]?.kind ?? "slow", set: 1, sets, into: 0, left: phases[0]?.sec ?? 0, total, remaining: total, done: false };
  if (t >= total) return { lead: false, leadLeft: 0, index: phases.length, kind: "done", set: sets, sets, into: 0, left: 0, total, remaining: 0, done: true };
  let acc = 0; for (let i = 0; i < phases.length; i++) { const ph = phases[i]; if (t < acc + ph.sec) return { lead: false, leadLeft: 0, index: i, kind: ph.kind, set: ph.set, sets, into: t - acc, left: Math.ceil(acc + ph.sec - t), total, remaining: Math.ceil(total - t), done: false }; acc += ph.sec; }
  return { lead: false, leadLeft: 0, index: phases.length, kind: "done", set: sets, sets, into: 0, left: 0, total, remaining: 0, done: true };
}
export const phaseStart = (phases, index) => phases.slice(0, index).reduce((a, p) => a + p.sec, 0);
/** Seconds spent in each kind of walking up to `t` seconds after the lead-in. */
export function splitUpTo(phases, t) {
  let slow = 0, fast = 0, acc = 0; for (const p of phases) { const used = Math.max(0, Math.min(p.sec, t - acc)); if (p.kind === "fast") fast += used; else slow += used; acc += p.sec; if (acc >= t) break; }
  return { slowSec: Math.round(slow), fastSec: Math.round(fast) };
}

// ---------- the cue track: 8-bit mono WAV, silent except for the tones ----------
export const SAMPLE_RATE = 8000;
function addTone(buf, sr, startSec, freq, durSec, gain, rich) {
  const start = Math.round(startSec * sr), n = Math.round(durSec * sr);
  for (let i = 0; i < n; i++) {
    const j = start + i; if (j < 0 || j >= buf.length) continue; const t = i / sr, env = Math.min(1, t / 0.012, (durSec - t) / 0.04);
    const ph = 2 * Math.PI * freq * t; let v = Math.sin(ph); if (rich) v = 0.7 * v + 0.2 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph); // brighter for the "fast" cue
    const s = buf[j] - 128 + Math.round(127 * gain * env * v); buf[j] = 128 + Math.max(-127, Math.min(127, s));
  }
}
/** The whole session as sound: a short lead-in, then at each switch a distinct cue (rising = go FAST, falling = go SLOW), ticks for the last three seconds, a chime at the end. */
export function buildCueTrack(phases, { sr = SAMPLE_RATE, amp = 0.6, lead = LEAD_SEC } = {}) {
  const total = totalSec(phases), buf = new Uint8Array(Math.round((lead + total + TAIL_SEC) * sr)).fill(128);
  const boundary = (at, kind) => {
    for (let k = 3; k >= 1; k--) if (at - k >= 0) addTone(buf, sr, at - k, 1000, 0.07, amp * 0.45, false);          // 3, 2, 1
    if (kind === "fast") [660, 880, 1100].forEach((f, i) => addTone(buf, sr, at + i * 0.26, f, 0.2, amp, true));      // rising, bright: speed up
    else [880, 550].forEach((f, i) => addTone(buf, sr, at + i * 0.36, f, 0.3, amp, false));                           // falling, soft: ease off
  };
  let at = lead; for (const p of phases) { boundary(at, p.kind); at += p.sec; }
  for (let k = 3; k >= 1; k--) addTone(buf, sr, at - k, 1000, 0.07, amp * 0.45, false);
  [523, 659, 784, 1047].forEach((f, i) => addTone(buf, sr, at + i * 0.3, f, 0.45, amp, false));                         // done
  return buf;
}
/** Wrap 8-bit mono PCM in a WAV header. */
export function wav8(pcm, sr = SAMPLE_RATE) {
  const out = new Uint8Array(44 + pcm.length), v = new DataView(out.buffer), W = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  W(0, "RIFF"); v.setUint32(4, 36 + pcm.length, true); W(8, "WAVE"); W(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); W(36, "data"); v.setUint32(40, pcm.length, true); out.set(pcm, 44);
  return out;
}

// ---------- calories ----------
export const FAST_CADENCE_RATIO = 1.3; // brisk steps come about 30% faster than easy steps
const SPEED_LIMITS = [0.5, 2.0];        // m/s: slower than this is standing about; faster is race walking
/**
 * Estimate calories for a walk. With the steps Health recorded during the workout, the average cadence gives your speed, and speed gives the effort (MET) of each kind of walking.
 * Without steps it assumes a typical easy (3.6 km/h) and brisk (5.8 km/h) pace. Always a rough estimate.
 */
export function walkCalories({ slowSec, fastSec, kg, heightCm = 170, steps = /** @type {number | null} */ (null) }) {
  const stride = strideFor("walk", heightCm), mins = (slowSec + fastSec) / 60; let vSlow = 1.0, vFast = 1.6, basis = "time", cadence = null;
  if (steps != null && steps >= 0 && mins > 0.1) {
    const cs = steps / (slowSec / 60 + FAST_CADENCE_RATIO * (fastSec / 60) || 1); cadence = steps / mins; // cs: easy steps per minute
    vSlow = Math.min(SPEED_LIMITS[1], Math.max(SPEED_LIMITS[0], (cs * stride) / 60)); vFast = Math.min(SPEED_LIMITS[1], Math.max(SPEED_LIMITS[0], (FAST_CADENCE_RATIO * cs * stride) / 60)); basis = "steps";
  }
  const kS = metFor("walk", vSlow) * kg * (slowSec / 3600), kF = metFor("walk", vFast) * kg * (fastSec / 3600);
  const distM = basis === "steps" ? Math.round(steps * stride) : Math.round(vSlow * slowSec + vFast * fastSec), estSteps = basis === "steps" ? Math.round(steps) : Math.round(distM / stride);
  return { kcal: Math.max(0, Math.round(kS + kF)), kcalSlow: Math.round(kS), kcalFast: Math.round(kF), steps: estSteps, distM, basis, cadence: cadence == null ? null : Math.round(cadence), speedSlow: vSlow, speedFast: vFast };
}
/** Is the step count Health gave us believable for this walk? Returns null if fine, otherwise a plain sentence. */
export function checkSteps({ before, after, minutes }) {
  if (!Number.isFinite(before) || !Number.isFinite(after)) return "Enter both step counts, or leave them blank to use an estimate.";
  if (after < before) return "The second number is lower than the first. Check the steps in Health (use the total for today) and try again.";
  const d = after - before, perMin = minutes > 0 ? d / minutes : 0;
  if (minutes >= 3 && perMin < 40) return `That is only ${d.toLocaleString()} steps in ${Math.round(minutes)} minutes. If you took more steps, wait a moment and check Health again (it can take a minute to update).`;
  if (perMin > 200) return `${d.toLocaleString()} steps in ${Math.round(minutes)} minutes is more than a person can walk. Check the numbers.`;
  return null;
}
/** A gentle word about effort from the average steps a minute. */
export function cadenceNote(cadence) { if (cadence == null) return null; return cadence >= 115 ? "Strong pace: your average cadence was brisk." : cadence >= 95 ? "Steady pace. In the fast blocks push until talking takes effort." : "Easy pace overall. The fast blocks should feel like real work, not a stroll."; }

// ---------- history ----------
export function weekProgress(sessions, todayKey, goal = 4) {
  const keys = new Set(Array.from({ length: 7 }, (_, i) => addDays(todayKey, -i))); const days = new Set(sessions.filter((s) => s.totalSec >= 600 && keys.has(dateKey(s.start))).map((s) => dateKey(s.start)));
  return { days: days.size, goal, done: days.size >= goal };
}
export function sanitizeSession(x) {
  if (!x || typeof x !== "object") return null; const n = (v, lo, hi) => { const q = Number(v); return Number.isFinite(q) && q >= lo && q <= hi ? q : null; };
  const start = n(x.start, 1e12, 4e12), slowSec = n(x.slowSec, 0, 86400), fastSec = n(x.fastSec, 0, 86400); if (start == null || slowSec == null || fastSec == null || slowSec + fastSec < 1) return null;
  return { id: /^[a-z0-9]{4,24}$/.test(String(x.id)) ? String(x.id) : start.toString(36), start, slowSec: Math.round(slowSec), fastSec: Math.round(fastSec), totalSec: Math.round(slowSec + fastSec), completed: !!x.completed, kcal: Math.round(n(x.kcal, 0, 20000) ?? 0), steps: Math.round(n(x.steps, 0, 500000) ?? 0), distM: Math.round(n(x.distM, 0, 500000) ?? 0), basis: x.basis === "steps" ? "steps" : "time", book: typeof x.book === "string" ? x.book.slice(0, 120) : "" };
}

// ---------- everything Pacer Walk keeps on this device ----------
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export function sanitizeWalkData(raw) {
  const r = raw && typeof raw === "object" ? raw : {}, num = (v, lo, hi, d) => { const q = Number(v); return v != null && v !== "" && Number.isFinite(q) && q >= lo && q <= hi ? q : d; };
  const p = sanitizePlan(r.plan), seen = new Set(), sessions = (Array.isArray(r.sessions) ? r.sessions : []).map(sanitizeSession).filter(Boolean).filter((s) => (seen.has(s.id) ? false : seen.add(s.id))).sort((a, b) => b.start - a.start).slice(0, 2000);
  const wmap = new Map(); for (const e of Array.isArray(r.weights) ? r.weights : []) if (e && DATE.test(String(e.d)) && num(e.kg, 25, 400, null) != null) wmap.set(e.d, { d: e.d, kg: Math.round(Number(e.kg) * 100) / 100 });
  const m = r.meta && typeof r.meta === "object" ? r.meta : null;
  return { v: 1, units: r.units === "imperial" ? "imperial" : "metric", heightCm: num(r.heightCm, 100, 230, 170), goalKg: num(r.goalKg, 25, 400, null), plan: { intervalMin: p.intervalMin, sets: p.sets, first: p.first }, loud: !!r.loud, buzz: r.buzz !== false, keepAwake: r.keepAwake !== false,
    bookId: typeof r.bookId === "string" ? r.bookId.slice(0, 40) : "", sessions, weights: [...wmap.values()].sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-5000),
    meta: m ? { stepsBefore: num(m.stepsBefore, 0, 500000, null), book: typeof m.book === "string" ? m.book.slice(0, 120) : "" } : null };
}
