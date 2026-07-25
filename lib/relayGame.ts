// Relay — shared game constants and pure rotation math.
// No DB, no React: imported by the schema layer, the API routes, and both
// client screens so the four surfaces can never disagree about what round 3 is
// or who is holding which essay.

import type { EssayType } from "./marginsRubrics";

// ─── The four moves ───────────────────────────────────────────────────────────
// Named for the AP rubric categories rather than invented game words, so what a
// student practices here transfers to the exam verbatim. The subtitle is the
// playful label; the sprite is the emblem they'll see on their role card.

export interface RelayMove {
  id: RelayMoveId;
  /** Matches the `category` field in RUBRIC_TEMPLATES exactly — used to join scores back to the rubric. */
  rubricCategory: string;
  label: string;
  subtitle: string;
  sprite: string;
  /** One-line brief shown to the writer while the clock runs. */
  brief: string;
  /** Accent hue, aligned to the tokens already used across Margins. */
  accent: string;
}

export type RelayMoveId = "thesis" | "contextualization" | "evidence" | "analysis";

export const RELAY_MOVES: RelayMove[] = [
  {
    id: "thesis",
    rubricCategory: "Thesis/Claim",
    label: "Thesis",
    subtitle: "Plant the flag",
    sprite: "/assets/margins/relay/role-thesis.png",
    brief:
      "Make one historically defensible claim that answers the prompt and sets up a line of reasoning. One or two sentences — no summary, no throat-clearing.",
    accent: "#7c5cd6",
  },
  {
    id: "contextualization",
    rubricCategory: "Contextualization",
    label: "Contextualization",
    subtitle: "Frame the world",
    sprite: "/assets/margins/relay/role-contextualization.png",
    brief:
      "Describe the broader historical situation surrounding this thesis — before, during, or after. More than a passing reference: give the reader the world this argument lives in.",
    accent: "#2f7fc4",
  },
  {
    id: "evidence",
    rubricCategory: "Evidence",
    label: "Evidence",
    subtitle: "Bring the receipts",
    sprite: "/assets/margins/relay/role-evidence.png",
    brief:
      "Supply specific, relevant historical evidence that supports the thesis above. Name names, dates, places. Vague gestures score nothing.",
    accent: "#1c8a6a",
  },
  {
    id: "analysis",
    rubricCategory: "Analysis and Reasoning",
    label: "Analysis & Reasoning",
    subtitle: "Link it together",
    sprite: "/assets/margins/relay/role-analysis.png",
    brief:
      "Explain how the evidence proves the thesis — the reasoning that connects them. Then complicate it: a qualification, a counter-example, a nuance.",
    accent: "#d19b1e",
  },
];

export const RELAY_ROUNDS = RELAY_MOVES.length;

export function moveForRound(round: number): RelayMove {
  return RELAY_MOVES[Math.max(0, Math.min(RELAY_ROUNDS - 1, round - 1))];
}

// ─── Team crests ──────────────────────────────────────────────────────────────
// Eight crests caps a session at eight teams — roughly 32 students at four per
// team, which is a normal class. Teams beyond this reuse crests with a numeric
// suffix rather than failing the join.

export interface RelayCrest {
  id: string;
  name: string;
  sprite: string;
  color: string;
}

export const RELAY_CRESTS: RelayCrest[] = [
  { id: "anchor",  name: "Anchor",  sprite: "/assets/margins/relay/crest-anchor.png",  color: "#2c3160" },
  { id: "laurel",  name: "Laurel",  sprite: "/assets/margins/relay/crest-laurel.png",  color: "#1f7a4d" },
  { id: "compass", name: "Compass", sprite: "/assets/margins/relay/crest-compass.png", color: "#2f6fc0" },
  { id: "torch",   name: "Torch",   sprite: "/assets/margins/relay/crest-torch.png",   color: "#d84a52" },
  { id: "globe",   name: "Globe",   sprite: "/assets/margins/relay/crest-globe.png",   color: "#3aa886" },
  { id: "quill",   name: "Quill",   sprite: "/assets/margins/relay/crest-quill.png",   color: "#7c5cd6" },
  { id: "column",  name: "Column",  sprite: "/assets/margins/relay/crest-column.png",  color: "#dda01f" },
  { id: "book",    name: "Book",    sprite: "/assets/margins/relay/crest-book.png",    color: "#2f86c4" },
];

export function crestById(id: string): RelayCrest {
  return RELAY_CRESTS.find((c) => c.id === id) ?? RELAY_CRESTS[0];
}

export const RELAY_SPRITES = {
  logo: "/assets/margins/relay/relay-logo.png",
  baton: "/assets/margins/relay/baton.png",
  timer: "/assets/margins/relay/timer-hourglass.png",
  pencil: "/assets/margins/relay/pencil.png",
  earned: "/assets/margins/relay/stamp-earned.png",
  missed: "/assets/margins/relay/stamp-missed.png",
  perfect: "/assets/margins/relay/stamp-perfect.png",
  topMark: "/assets/margins/relay/seal-top-mark.png",
} as const;

// ─── Team formation ───────────────────────────────────────────────────────────

export const TEAM_SIZE = 4;

/**
 * Split a shuffled roster into teams of at most TEAM_SIZE.
 *
 * A trailing team of one can't relay — there's nobody to hand off to — so a
 * remainder of 1 is folded back into the previous team (making it 5) rather
 * than left stranded. Everything else divides cleanly.
 */
export function planTeams(playerCount: number): number[] {
  if (playerCount <= 0) return [];
  if (playerCount <= TEAM_SIZE) return [playerCount];
  const sizes: number[] = [];
  let left = playerCount;
  while (left > 0) {
    sizes.push(Math.min(TEAM_SIZE, left));
    left -= Math.min(TEAM_SIZE, left);
  }
  if (sizes.length > 1 && sizes[sizes.length - 1] === 1) {
    sizes.pop();
    sizes[sizes.length - 1] += 1;
  }
  return sizes;
}

/**
 * Which essay a given seat is holding in a given round.
 *
 * Every player owns one essay (their own seat index). Each round the stack
 * rotates by one seat, so in round 1 you write on your own essay and in later
 * rounds you inherit a teammate's. Returns the *owner seat* of the essay this
 * seat is writing on.
 *
 * With teamSize 1 the same essay comes back every round — degenerate but
 * playable, and planTeams already avoids creating solo teams where it can.
 */
export function essaySeatForRound(seat: number, round: number, teamSize: number): number {
  if (teamSize <= 0) return 0;
  return ((seat - (round - 1)) % teamSize + teamSize) % teamSize;
}

/** Inverse of essaySeatForRound — who is writing on this essay this round. */
export function writerSeatForRound(essaySeat: number, round: number, teamSize: number): number {
  if (teamSize <= 0) return 0;
  return ((essaySeat + (round - 1)) % teamSize + teamSize) % teamSize;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export interface RelayCategoryScore {
  category: string;
  earned: number;
  possible: number;
  reason: string;
}

export interface RelayEssayScore {
  categories: RelayCategoryScore[];
  total: number;
  possible: number;
  /** The single strongest sentence, quoted back for the reveal. */
  standout: string;
  perfect: boolean;
}

export const DEFAULT_ESSAY_TYPE: EssayType = "LEQ";
export const DEFAULT_ROUND_SECONDS = 150;
export const ROUND_SECONDS_OPTIONS = [90, 120, 150, 180, 240];
