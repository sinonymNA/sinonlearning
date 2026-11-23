// 72 original creatures (6 sets x 12). Deterministic, so the client can draw each one from its seed with no art files.
import { SETS, SET_LAYOUT, SET_SIZE } from "./config.mjs";
import { makeRng } from "../gridiron/rng.mjs";

const PRE = ["Mo", "Fli", "Gru", "Pip", "Zor", "Blo", "Kru", "Tam", "Wob"];
const SUF = ["bble", "kin", "zard", "tuff", "nix", "ling", "moth", "bun"];

// Flavour text for the card's text box, built from the name's pieces (the same meanings the art prompts use).
const PRE_WORD = { Mo: "mossy", Fli: "flighty", Gru: "grumpy", Pip: "tiny", Zor: "zappy", Blo: "puffy", Kru: "crunchy", Tam: "cuddly", Wob: "wobbly" };
const SUF_WORD = { bble: "bubbly blob", kin: "little gremlin", zard: "lizard", tuff: "fluffy ball", nix: "mischievous sprite", ling: "baby critter", moth: "moth", bun: "bunny" };
const TAIL = { common: "", uncommon: "", rare: " Quite rare.", epic: " Very rarely seen.", legendary: " A true legend." };
export function flavorFor(name, setName, rarity) {
  const pre = Object.keys(PRE_WORD).find((p) => name.startsWith(p)), suf = Object.keys(SUF_WORD).find((x) => name.endsWith(x));
  return `A ${PRE_WORD[pre]} ${SUF_WORD[suf]} from ${setName === "Neon" ? "Neon City" : "the " + setName}.${TAIL[rarity]}`;
}

function build() {
  const names = []; for (const a of PRE) for (const b of SUF) names.push(a + b);   // 72 unique names
  const rng = makeRng(7771);
  for (let i = names.length - 1; i > 0; i--) { const j = rng.int(i + 1); [names[i], names[j]] = [names[j], names[i]]; }
  const out = [];
  SETS.forEach((s, k) => SET_LAYOUT.forEach((rarity, i) => out.push({ id: `${s.id}-${i}`, set: k, idx: i, rarity, name: names[k * SET_SIZE + i], seed: 1000 + k * 97 + i * 13, flavor: flavorFor(names[k * SET_SIZE + i], s.name, rarity) })));
  return out;
}
export const CARDS = build();
export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const cardsOfSet = (k) => CARDS.filter((c) => c.set === k);
