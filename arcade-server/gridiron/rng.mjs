/** Small seeded RNG so plays and tests are reproducible. */
export function makeRng(seed = 1) {
  let a = seed >>> 0 || 1;
  const next = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  next.int = (n) => Math.floor(next() * n);
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.normal = () => { let u = 0, v = 0; while (!u) u = next(); while (!v) v = next(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  return next;
}
