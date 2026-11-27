// Rain, synthesized in the browser (no files to download). Pure parts live here so they can be tested in node; the audio graph is components/pacer/Rain.ts.
export const RAIN_LEVELS = [
  { name: "Light", hiss: 0.2, body: 0.1, drops: 3, top: 6500 },
  { name: "Steady", hiss: 0.34, body: 0.24, drops: 8, top: 8000 },
  { name: "Heavy", hiss: 0.46, body: 0.42, drops: 18, top: 9500 },
];
export const clampLevel = (n) => Math.min(RAIN_LEVELS.length - 1, Math.max(0, Math.round(Number(n)) || 0));

/** Seeded random in [0,1) (mulberry32) so tests are repeatable. */
export function rng(seed = 1) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Fill `out` with pink-ish noise (Paul Kellet's filter on white noise), scaled to stay inside [-1, 1]. */
export function fillPink(out, rand) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < out.length; i++) {
    const w = rand() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
  }
  return out;
}
/** Seconds until the next raindrop for a level (exponential gaps, so it never sounds like a metronome). */
export const nextDropGap = (level, rand) => -Math.log(1 - rand() * 0.999) / RAIN_LEVELS[clampLevel(level)].drops;
