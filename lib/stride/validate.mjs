// Clean and merge Stride data (used for loading from storage and for importing a backup). Never trusts its input.
const num = (x, lo, hi, d = null) => { const n = Number(x); return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const DEFAULT_SETTINGS = { units: "metric", heightCm: 170, stepGoal: 8000, goalKg: null, hideWeight: false };
export const LIMITS = { workouts: 3000, weights: 20000, route: 400 };

export function sanitizeSettings(x) {
  const s = x && typeof x === "object" ? x : {};
  return { units: s.units === "imperial" ? "imperial" : "metric", heightCm: num(s.heightCm, 100, 230, 170), stepGoal: Math.round(num(s.stepGoal, 500, 100000, 8000)), goalKg: num(s.goalKg, 25, 400, null), hideWeight: !!s.hideWeight };
}
export function sanitizeWorkout(w) {
  if (!w || typeof w !== "object") return null; const start = num(w.start, 1e12, 4e12), seconds = num(w.seconds, 1, 7 * 86400), distM = num(w.distM, 0, 1e6);
  if (start == null || seconds == null || distM == null) return null;
  const route = Array.isArray(w.route) ? w.route.filter((p) => Array.isArray(p) && num(p[0], -90, 90) != null && num(p[1], -180, 180) != null).slice(0, LIMITS.route).map((p) => [Number(p[0]), Number(p[1])]) : [];
  return { id: /^[a-z0-9]{4,24}$/.test(String(w.id)) ? String(w.id) : start.toString(36), type: w.type === "jog" ? "jog" : "walk", gps: !!w.gps, start, seconds: Math.round(seconds), distM: Math.round(distM), steps: Math.round(num(w.steps, 0, 1e6, 0)), stepsSource: w.stepsSource === "sensor" ? "sensor" : "estimated", kcal: Math.round(num(w.kcal, 0, 20000, 0)), hiddenSec: Math.round(num(w.hiddenSec, 0, 7 * 86400, 0)), route };
}
export function sanitizeState(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const workouts = (Array.isArray(r.workouts) ? r.workouts : []).map(sanitizeWorkout).filter(Boolean).slice(0, LIMITS.workouts);
  const seen = new Set(), uniq = workouts.filter((w) => (seen.has(w.id) ? false : seen.add(w.id)));
  const wmap = new Map(); for (const e of Array.isArray(r.weights) ? r.weights : []) { if (e && DATE.test(String(e.d)) && num(e.kg, 25, 400) != null) wmap.set(e.d, { d: e.d, kg: Math.round(Number(e.kg) * 100) / 100 }); }
  const steps = {}; if (r.steps && typeof r.steps === "object") for (const [k, v] of Object.entries(r.steps)) if (DATE.test(k) && num(v, 0, 200000) != null) steps[k] = Math.round(Number(v));
  return { v: 1, settings: sanitizeSettings(r.settings), workouts: uniq.sort((a, b) => b.start - a.start), weights: [...wmap.values()].sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-LIMITS.weights), steps };
}
/** Combine a backup into what is on this device. For the same day or the same workout id the backup wins; nothing else is lost. */
export function mergeStates(mine, theirs) {
  const a = sanitizeState(mine), b = sanitizeState(theirs), byId = new Map(a.workouts.map((w) => [w.id, w])); for (const w of b.workouts) byId.set(w.id, w);
  const wmap = new Map(a.weights.map((e) => [e.d, e])); for (const e of b.weights) wmap.set(e.d, e);
  return sanitizeState({ settings: b.settings, workouts: [...byId.values()], weights: [...wmap.values()], steps: { ...a.steps, ...b.steps } });
}
