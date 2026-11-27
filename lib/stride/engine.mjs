// Stride: workout tracking and weight trend maths. Pure ESM (time and positions are always passed in), so it is tested in node.
// Everything here is an ESTIMATE from a phone's GPS and motion sensor; it is not a medical device.

// ---------- distance ----------
const R = 6371008.8;
const rad = (d) => (d * Math.PI) / 180;
/** Metres between two { lat, lon } points. */
export function haversine(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon), s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
export const KM_PER_MI = 1.609344, KG_PER_LB = 0.45359237;
export const kgToLb = (kg) => kg / KG_PER_LB, lbToKg = (lb) => lb * KG_PER_LB;
/** Average step length in metres from height (walking is about 0.415 of height; jogging steps are longer). */
export const strideFor = (type, heightCm = 170) => (heightCm / 100) * (type === "jog" ? 0.55 : 0.415);

// ---------- a workout session (plain JSON, so it can be saved while you move and restored if the browser kills the page) ----------
export function newSession(type, gps, now) {
  return { type, gps: !!gps, startedAt: now, running: true, lastT: now, elapsedMs: 0, distM: 0, last: null, drops: 0, fixes: 0, route: [], motionSteps: 0, hiddenMs: 0 };
}
/** Move the clock to `t`; only running time counts. */
export function tick(s, t) { if (s.running && t > s.lastT) s.elapsedMs += t - s.lastT; if (t > s.lastT) s.lastT = t; return s; }
export function pause(s, t) { tick(s, t); s.running = false; s.last = null; return s; }       // after a pause the next fix is a fresh starting point
export function resume(s, t) { s.lastT = t; s.running = true; s.last = null; return s; }
const MAX_ACC = 40, MAX_SPEED = 12, MIN_ROUTE_GAP = 6; // metres, m/s, metres
const Q = 9; // how far (m^2 per second) we expect a walker or jogger to wander from the last position
/** Feed one GPS fix { lat, lon, acc, t }. Positions are smoothed (a Kalman filter weighs each fix by its accuracy) so GPS wobble is not counted as walking. Returns true when it counted as movement. */
export function addFix(s, f) {
  tick(s, f.t); if (!s.running) return false; s.fixes++;
  const acc = Math.max(3, f.acc ?? 10); if (acc > MAX_ACC) return false;                          // too imprecise to trust
  if (!s.last) { s.last = { lat: f.lat, lon: f.lon, t: f.t }; s.kf = { lat: f.lat, lon: f.lon, v: acc * acc, t: f.t }; s.route.push([f.lat, f.lon]); s.drops = 0; return false; }
  const dt = (f.t - s.kf.t) / 1000; if (dt <= 0) return false;
  if (haversine(s.kf, f) / dt > MAX_SPEED + acc / dt) {                                         // a jump no walker or jogger could make
    if (++s.drops >= 3) { s.last = { lat: f.lat, lon: f.lon, t: f.t }; s.kf = { lat: f.lat, lon: f.lon, v: acc * acc, t: f.t }; s.drops = 0; } return false;
  }
  s.drops = 0; const v = s.kf.v + Q * dt, k = v / (v + acc * acc);
  s.kf = { lat: s.kf.lat + k * (f.lat - s.kf.lat), lon: s.kf.lon + k * (f.lon - s.kf.lon), v: (1 - k) * v, t: f.t };
  const d = haversine(s.last, s.kf); if (d < Math.max(2, acc * 0.3)) return false;               // standing still: what is left of the wobble is not walking
  s.distM += d; s.last = { lat: s.kf.lat, lon: s.kf.lon, t: f.t };
  const p = s.route[s.route.length - 1]; if (!p || haversine({ lat: p[0], lon: p[1] }, s.kf) >= MIN_ROUTE_GAP) s.route.push([s.kf.lat, s.kf.lon]);
  return true;
}
export const addMotionSteps = (s, n) => { s.motionSteps += n; return s; };
export const speedMs = (s) => (s.elapsedMs > 0 ? s.distM / (s.elapsedMs / 1000) : 0);
/** Seconds per kilometre (or per mile with miles = true); null when there is no movement yet. */
export const paceSec = (distM, elapsedMs, miles = false) => (distM > 20 && elapsedMs > 0 ? (elapsedMs / 1000) / (distM / (miles ? KM_PER_MI * 1000 : 1000)) : null);
/** Keep at most `max` points of a route (evenly spaced, always the first and last). */
export function thinRoute(route, max = 300) { if (route.length <= max) return route.slice(); const out = []; for (let i = 0; i < max; i++) out.push(route[Math.round((i * (route.length - 1)) / (max - 1))]); return out; }

// ---------- steps from the motion sensor ----------
export function newStepper() { return { n: 0, g: 9.81, s: 0, s1: 0, s2: 0, v: 1, lastStep: -1e9, init: false }; }
/** Feed accelerometer readings that include gravity (m/s^2) with a timestamp in ms. Returns how many steps this reading added (0 or 1). */
export function feedAccel(st, t, x, y, z) {
  const mag = Math.sqrt(x * x + y * y + z * z); if (!st.init) { st.g = mag; st.init = true; }
  st.g += 0.02 * (mag - st.g); const a = mag - st.g;                                            // remove gravity
  st.s2 = st.s1; st.s1 = st.s; st.s += 0.35 * (a - st.s);                                       // smooth out vibration
  st.v = st.v * 0.985 + 0.015 * st.s * st.s; const thr = Math.max(0.8, 0.55 * Math.sqrt(st.v));
  if (st.s1 > st.s2 && st.s1 >= st.s && st.s1 > thr && t - st.lastStep > 280) { st.lastStep = t; st.n++; return 1; } // a peak that is big enough, not too soon after the last
  return 0;
}
/** Decide which step count to trust. Sensor steps are used when they agree roughly with distance / stride length. */
export function pickSteps({ motion, distM, strideM, gps }) {
  const est = strideM > 0 ? Math.round(distM / strideM) : 0;
  if (!gps) return { steps: motion, source: "sensor" };
  if (motion > 0 && (est < 20 || (motion >= est * 0.55 && motion <= est * 1.7))) return { steps: motion, source: "sensor" };
  return { steps: est, source: "estimated" };
}

// ---------- calories (a rough estimate: MET x body weight x hours) ----------
const WALK_MET = [[3.2, 2.8], [4.0, 3.0], [4.8, 3.5], [5.6, 4.3], [6.4, 5.0], [7.2, 6.0]];
export function metFor(type, speed) {
  const kmh = speed * 3.6;
  if (type === "jog" || kmh > 7.2) return Math.max(6, 1.03 * kmh);
  if (kmh <= WALK_MET[0][0]) return WALK_MET[0][1];
  for (let i = 1; i < WALK_MET.length; i++) if (kmh <= WALK_MET[i][0]) { const [x0, y0] = WALK_MET[i - 1], [x1, y1] = WALK_MET[i]; return y0 + ((kmh - x0) / (x1 - x0)) * (y1 - y0); }
  return 6;
}
export const kcalFor = ({ type, kg, seconds, speed }) => Math.max(0, Math.round(metFor(type, speed) * kg * (seconds / 3600)));

// ---------- dates and daily totals ----------
export const dateKey = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const addDays = (key, n) => { const [y, m, d] = key.split("-").map(Number), t = new Date(y, m - 1, d + n); return dateKey(t.getTime()); };
const dayNum = (key) => { const [y, m, d] = key.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
/** Steps for a day: the total you typed in (say, from your phone's health app) wins; otherwise the workouts' steps are added up. */
export function stepsOn(state, key) {
  const typed = state.steps?.[key]; if (typeof typed === "number") return { steps: typed, source: "entered" };
  const sum = (state.workouts || []).filter((w) => dateKey(w.start) === key).reduce((a, w) => a + (w.steps || 0), 0); return { steps: sum, source: "workouts" };
}
export function lastDays(state, key, n = 7) { const out = []; for (let i = n - 1; i >= 0; i--) { const k = addDays(key, -i); out.push({ d: k, ...stepsOn(state, k) }); } return out; }
/** Days in a row (ending today, or yesterday if today is not done yet) that reached the step goal. */
export function streak(state, key, goal) { if (!goal) return 0; let n = 0, k = stepsOn(state, key).steps >= goal ? key : addDays(key, -1); while (stepsOn(state, k).steps >= goal) { n++; k = addDays(k, -1); if (n > 3650) break; } return n; }

// ---------- weight ----------
/** Smooth the day-to-day wobble: an exponential trend that accounts for gaps between weigh-ins. entries: [{ d: "YYYY-MM-DD", kg }]. */
export function trendSeries(entries, alpha = 0.1) {
  const e = [...entries].sort((a, b) => (a.d < b.d ? -1 : 1)), out = []; let tr = null, prev = null;
  for (const x of e) { if (tr === null) tr = x.kg; else { const gap = Math.max(1, dayNum(x.d) - dayNum(prev)); tr += (1 - Math.pow(1 - alpha, gap)) * (x.kg - tr); } prev = x.d; out.push({ d: x.d, kg: x.kg, trend: tr }); }
  return out;
}
/** kg per week from the trend line over the last `days` days (null until there are at least 5 days of data). */
export function ratePerWeek(series, days = 14) {
  if (series.length < 2) return null; const last = series[series.length - 1]; let first = series[0];
  for (const p of series) if (dayNum(last.d) - dayNum(p.d) <= days) { first = p; break; }
  const span = dayNum(last.d) - dayNum(first.d); if (span < 5) return null; return ((last.trend - first.trend) / span) * 7;
}
/** When the trend would reach the goal at the current rate; null if it is moving away or flat. */
export function goalEta(trendKg, goalKg, rateKgWeek, todayKey) {
  if (goalKg == null || rateKgWeek == null) return null; const need = goalKg - trendKg; if (Math.abs(need) < 0.05) return { weeks: 0, date: todayKey };
  if (Math.sign(need) !== Math.sign(rateKgWeek) || Math.abs(rateKgWeek) < 0.02) return null;
  const weeks = need / rateKgWeek; if (weeks > 520) return null; return { weeks, date: addDays(todayKey, Math.round(weeks * 7)) };
}
/** A fast drop deserves a gentle word: more than about 1% of body weight a week is more than most guidance suggests. */
export const dropIsFast = (rateKgWeek, trendKg) => rateKgWeek != null && trendKg > 0 && -rateKgWeek / trendKg > 0.01;

// ---------- formatting ----------
export const fmtDuration = (ms) => { const s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`; };
export const fmtPace = (sec) => (sec == null || !isFinite(sec) || sec > 3600 ? "--:--" : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`);
export const fmtDist = (m, miles = false) => ((miles ? m / (KM_PER_MI * 1000) : m / 1000)).toFixed(2);
