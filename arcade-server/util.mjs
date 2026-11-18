import crypto from "node:crypto";

export const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function roomCode() {
  let out = "";
  for (let i = 0; i < 6; i++) out += ROOM_ALPHABET[crypto.randomInt(ROOM_ALPHABET.length)];
  return out;
}
export const uid = () => crypto.randomUUID();
export const secretToken = (bytes = 18) => crypto.randomBytes(bytes).toString("hex");
export const randInt = (n) => (n <= 1 ? 0 : crypto.randomInt(n));
export const pick = (arr) => arr[randInt(arr.length)];
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export function shuffle(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Split ids into groups of at most `max`, as even as possible. Groups are never
 * smaller than `floor` unless the whole room is smaller than that.
 * 35 players with max 5 => seven groups of five. 35 with max 7 => five groups of seven.
 */
export function partition(ids, { max = 7, floor = 2 } = {}) {
  const shuffled = shuffle(ids);
  const n = shuffled.length;
  if (n <= max) return n ? [shuffled] : [];
  let groups = Math.ceil(n / max);
  while (groups > 1 && Math.floor(n / groups) < floor) groups--;
  const base = Math.floor(n / groups);
  const extra = n % groups;
  const out = [];
  let at = 0;
  for (let g = 0; g < groups; g++) {
    const size = base + (g < extra ? 1 : 0);
    out.push(shuffled.slice(at, at + size));
    at += size;
  }
  return out;
}

export function normalizeWord(text) {
  return String(text ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function editDistance(a, b) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** Sliding-window rate limiter keyed by string. */
export class RateLimiter {
  constructor() { this.hits = new Map(); }
  limited(key, windowMs, max, now = Date.now()) {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < windowMs);
    list.push(now);
    this.hits.set(key, list);
    return list.length > max;
  }
  sweep(now = Date.now(), maxAge = 120000) {
    for (const [k, list] of this.hits) if (!list.length || now - list[list.length - 1] > maxAge) this.hits.delete(k);
  }
}

export class GameError extends Error {
  constructor(message, code = "invalid") { super(message); this.code = code; }
}
export const fail = (message, code) => { throw new GameError(message, code); };
