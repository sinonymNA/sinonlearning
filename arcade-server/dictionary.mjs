import RAW from "./data/words.mjs";
import { pick, randInt, normalizeWord } from "./util.mjs";

let WORDS = null;
let BANK = null;

export function dictionary() {
  if (!WORDS) WORDS = new Set(RAW.split(" "));
  return WORDS;
}
export const isWord = (w) => dictionary().has(String(w).toLowerCase());

const CANDIDATES = {
  easy: ["ER", "ING", "ED", "EN", "AL", "AR", "OR", "ST", "TH", "CH", "SH", "ON", "AT", "IN", "ES", "LE", "RE", "AN", "OU", "EA"],
  medium: ["TION", "OUS", "IGHT", "ABLE", "ENT", "ANT", "ARY", "ISH", "MENT", "NESS", "LESS", "FUL", "ALLY", "ATE", "IVE", "OWN", "OUGH", "ARD", "ULL", "ACK", "ILL", "ASH", "ORT", "INK"],
  hard: ["CTION", "TCH", "NGTH", "GHT", "SCR", "STR", "SPL", "THR", "PHR", "OUGHT", "AUGH", "EIGH", "ERN", "YPE", "QU", "ZZ", "WH", "KN", "MB", "GN"],
};
const MIN_MATCHES = { easy: 600, medium: 120, hard: 60 };

/** Sequences verified against the dictionary so every prompt has many valid answers. */
export function sequenceBank() {
  if (BANK) return BANK;
  const words = [...dictionary()];
  BANK = { easy: [], medium: [], hard: [] };
  for (const level of Object.keys(CANDIDATES)) {
    for (const seq of CANDIDATES[level]) {
      const lower = seq.toLowerCase();
      let n = 0;
      for (const w of words) if (w.length > seq.length && w.includes(lower) && ++n >= MIN_MATCHES[level]) break;
      if (n >= MIN_MATCHES[level]) BANK[level].push(seq);
    }
  }
  return BANK;
}

export function countMatches(seq) {
  const lower = seq.toLowerCase();
  let n = 0;
  for (const w of dictionary()) if (w.length > seq.length && w.includes(lower)) n++;
  return n;
}

/** Choose a sequence by difficulty ramp (round 1 easy -> later harder). */
export function chooseSequence(round, avoid) {
  const bank = sequenceBank();
  const roll = randInt(100);
  const level = round <= 1 ? (roll < 80 ? "easy" : "medium") : round <= 3 ? (roll < 35 ? "easy" : roll < 90 ? "medium" : "hard") : roll < 20 ? "easy" : roll < 65 ? "medium" : "hard";
  let list = bank[level].filter((s) => s !== avoid);
  if (!list.length) list = bank.easy.filter((s) => s !== avoid);
  return pick(list);
}

/** Pick a 3 letter chunk from a teacher vocabulary word (so class vocab shows up as prompts). */
export function vocabSequence(word, avoid) {
  const w = normalizeWord(word).toUpperCase().replace(/[0-9]/g, "");
  if (w.length < 3) return null;
  const len = w.length >= 6 ? 3 : 2;
  const starts = [];
  for (let i = 0; i + len <= w.length; i++) starts.push(i);
  const i = pick(starts);
  const seq = w.slice(i, i + len);
  return seq === avoid ? null : seq;
}

const MATCH_CACHE = new Map();
/** All dictionary words (<=10 letters) containing the sequence; cached. Used by bots and quality checks. */
export function wordsContaining(seq) {
  const key = seq.toLowerCase();
  if (!MATCH_CACHE.has(key)) {
    const out = [];
    for (const w of dictionary()) if (w.length > key.length && w.length <= 10 && w.includes(key)) out.push(w);
    MATCH_CACHE.set(key, out);
  }
  return MATCH_CACHE.get(key);
}
