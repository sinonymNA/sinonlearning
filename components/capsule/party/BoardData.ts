// Graph board tuned to the 800x450 museum-board artwork.

export type SpaceType =
  | "coin"
  | "raid"
  | "capsule"
  | "shop"
  | "trap"
  | "challenge"
  | "warp"
  | "grand_cap"
  | "start";

export interface BoardSpace {
  id: string;
  type: SpaceType;
  x: number;
  y: number;
  connections: string[];
  warpTargetId?: string;
  grandCapEligible?: boolean;
  label?: string;
}

export const BOARD_SPACES: BoardSpace[] = [
  { id: "s0", type: "start", x: 139, y: 310, connections: ["s1"], label: "START" },
  { id: "s1", type: "coin", x: 208, y: 338, connections: ["s2"] },
  { id: "s2", type: "coin", x: 291, y: 357, connections: ["s3"] },
  { id: "s3", type: "capsule", x: 382, y: 365, connections: ["s4", "b0"], grandCapEligible: true },
  { id: "s4", type: "coin", x: 474, y: 361, connections: ["s5"] },
  { id: "s5", type: "challenge", x: 561, y: 346, connections: ["s6"] },
  { id: "s6", type: "coin", x: 636, y: 322, connections: ["s7"] },
  { id: "s7", type: "raid", x: 693, y: 289, connections: ["s8"] },
  { id: "s8", type: "warp", x: 729, y: 250, connections: ["s9"], warpTargetId: "s18", label: "WARP-R" },
  { id: "s9", type: "coin", x: 740, y: 208, connections: ["s10"] },
  { id: "s10", type: "grand_cap", x: 726, y: 166, connections: ["s11"], grandCapEligible: true },
  { id: "s11", type: "coin", x: 687, y: 127, connections: ["s12"] },
  { id: "s12", type: "shop", x: 628, y: 95, connections: ["s13"] },
  { id: "s13", type: "coin", x: 552, y: 71, connections: ["s14"] },
  { id: "s14", type: "trap", x: 464, y: 58, connections: ["s15"] },
  { id: "s15", type: "coin", x: 371, y: 56, connections: ["s16"] },
  { id: "s16", type: "challenge", x: 281, y: 64, connections: ["s17"] },
  { id: "s17", type: "coin", x: 200, y: 85, connections: ["s18"] },
  { id: "s18", type: "warp", x: 134, y: 114, connections: ["s19"], warpTargetId: "s8", label: "WARP-L" },
  { id: "s19", type: "coin", x: 86, y: 150, connections: ["s20"] },
  { id: "s20", type: "raid", x: 63, y: 191, connections: ["s21"] },
  { id: "s21", type: "coin", x: 64, y: 233, connections: ["s22"] },
  { id: "s22", type: "shop", x: 91, y: 274, connections: ["s0"] },

  // Optional inner route through the W-shaped lower track.
  { id: "b0", type: "coin", x: 352, y: 326, connections: ["b1"] },
  { id: "b1", type: "capsule", x: 330, y: 295, connections: ["b2"], grandCapEligible: true },
  { id: "b2", type: "trap", x: 388, y: 322, connections: ["b3"] },
  { id: "b3", type: "coin", x: 442, y: 295, connections: ["b4"] },
  { id: "b4", type: "grand_cap", x: 492, y: 322, connections: ["b5"], grandCapEligible: true },
  { id: "b5", type: "coin", x: 520, y: 350, connections: ["s5"] },
];

export const BOARD_SPACE_MAP = new Map(BOARD_SPACES.map((space) => [space.id, space]));
export const GRAND_CAP_ELIGIBLE = BOARD_SPACES.filter((space) => space.grandCapEligible).map((space) => space.id);
export const START_SPACE_ID = "s0";
export const GRAND_CAPS_TO_WIN = 3;
export const SPIN_CORRECT_RANGE: [number, number] = [1, 6];
export const SPIN_INCORRECT_RANGE: [number, number] = [1, 3];

