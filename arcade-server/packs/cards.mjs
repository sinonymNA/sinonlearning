// 72 original creatures (6 sets x 12). Deterministic, so the client can draw each one from its seed with no art files.
import { SETS, SET_LAYOUT, SET_SIZE } from "./config.mjs";
import { makeRng } from "../gridiron/rng.mjs";

const PRE = ["Mo", "Fli", "Gru", "Pip", "Zor", "Blo", "Kru", "Tam", "Wob"];
const SUF = ["bble", "kin", "zard", "tuff", "nix", "ling", "moth", "bun"];

function build() {
  const names = []; for (const a of PRE) for (const b of SUF) names.push(a + b);   // 72 unique names
  const rng = makeRng(7771);
  for (let i = names.length - 1; i > 0; i--) { const j = rng.int(i + 1); [names[i], names[j]] = [names[j], names[i]]; }
  const out = [];
  SETS.forEach((s, k) => SET_LAYOUT.forEach((rarity, i) => out.push({ id: `${s.id}-${i}`, set: k, idx: i, rarity, name: names[k * SET_SIZE + i], seed: 1000 + k * 97 + i * 13 })));
  return out;
}
export const CARDS = build();
export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const cardsOfSet = (k) => CARDS.filter((c) => c.set === k);
