// Graph-based board definition.
// Spaces are nodes; connections list adjacent space IDs.
// Tokens tween between the (x, y) coordinates of their current and destination spaces.

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
  x: number;           // Phaser world x (scaled to 800×450)
  y: number;           // Phaser world y
  connections: string[]; // IDs of spaces reachable from here
  shortcut?: boolean;   // True if this edge cuts across the main loop
  warpTargetId?: string; // Only set for "warp" spaces — paired warp destination
  grandCapEligible?: boolean; // Can the Grand Cap pedestal appear here?
  label?: string;       // Short display label for debug
}

// Board layout: one main loop (~22 spaces), one branch (6 spaces), 2 shortcuts, 2 warp pairs
// Coordinates are in the 800×450 internal resolution
export const BOARD_SPACES: BoardSpace[] = [
  // Main loop (clockwise)
  { id: "s0",  type: "start",     x: 110, y: 340, connections: ["s1"],               label: "START" },
  { id: "s1",  type: "coin",      x: 180, y: 290, connections: ["s2"] },
  { id: "s2",  type: "coin",      x: 260, y: 260, connections: ["s3"] },
  { id: "s3",  type: "capsule",   x: 340, y: 250, connections: ["s4"],               grandCapEligible: true },
  { id: "s4",  type: "coin",      x: 420, y: 260, connections: ["s5", "b0"] },       // branch split
  { id: "s5",  type: "challenge", x: 500, y: 265, connections: ["s6"] },
  { id: "s6",  type: "coin",      x: 570, y: 240, connections: ["s7"] },
  { id: "s7",  type: "raid",      x: 630, y: 200, connections: ["s8"] },
  { id: "s8",  type: "warp",      x: 690, y: 160, connections: ["s9"],               warpTargetId: "w1" },
  { id: "s9",  type: "coin",      x: 720, y: 120, connections: ["s10"] },
  { id: "s10", type: "grand_cap", x: 700, y: 80,  connections: ["s11"],              grandCapEligible: true },
  { id: "s11", type: "coin",      x: 650, y: 60,  connections: ["s12"] },
  { id: "s12", type: "shop",      x: 580, y: 55,  connections: ["s13"] },
  { id: "s13", type: "coin",      x: 500, y: 55,  connections: ["s14"] },
  { id: "s14", type: "trap",      x: 420, y: 55,  connections: ["s15"] },
  { id: "s15", type: "coin",      x: 340, y: 60,  connections: ["s16"] },
  { id: "s16", type: "challenge", x: 260, y: 70,  connections: ["s17"] },
  { id: "s17", type: "coin",      x: 190, y: 90,  connections: ["s18"] },
  { id: "s18", type: "warp",      x: 130, y: 110, connections: ["s19"],              warpTargetId: "w2" },
  { id: "s19", type: "coin",      x: 80,  y: 140, connections: ["s20"] },
  { id: "s20", type: "raid",      x: 65,  y: 200, connections: ["s21"] },
  { id: "s21", type: "coin",      x: 75,  y: 260, connections: ["s22"] },
  { id: "s22", type: "shop",      x: 90,  y: 310, connections: ["s0"] },             // closes loop

  // Branch (splits from s4, rejoins at s5)
  { id: "b0",  type: "coin",      x: 440, y: 310, connections: ["b1"] },
  { id: "b1",  type: "capsule",   x: 470, y: 360, connections: ["b2"],              grandCapEligible: true },
  { id: "b2",  type: "trap",      x: 520, y: 380, connections: ["b3"] },
  { id: "b3",  type: "coin",      x: 570, y: 360, connections: ["b4"] },
  { id: "b4",  type: "grand_cap", x: 610, y: 330, connections: ["b5"],              grandCapEligible: true },
  { id: "b5",  type: "coin",      x: 580, y: 295, connections: ["s5"] },            // rejoins main loop

  // Shortcut edges (s3 → s13 and s20 → s5 — stored as extra connections)
  // Applied by adding these to the relevant spaces' connections above (see s3→ extended below)
  // shortcut from top-left to top-mid: s17 ↔ s13
  // Not adding backwards shortcuts to keep movement forward-only for now

  // Warp destination markers (warp pairs: s8 ↔ w1, s18 ↔ w2)
  { id: "w1",  type: "warp",      x: 380, y: 390, connections: ["w1a"],             warpTargetId: "s8" },
  { id: "w1a", type: "coin",      x: 320, y: 380, connections: ["s0"] },
  { id: "w2",  type: "warp",      x: 200, y: 360, connections: ["w2a"],             warpTargetId: "s18" },
  { id: "w2a", type: "coin",      x: 150, y: 370, connections: ["s0"] },
];

export const BOARD_SPACE_MAP: Map<string, BoardSpace> = new Map(
  BOARD_SPACES.map(s => [s.id, s])
);

// Grand Cap eligible spaces
export const GRAND_CAP_ELIGIBLE = BOARD_SPACES.filter(s => s.grandCapEligible).map(s => s.id);

// Starting space id
export const START_SPACE_ID = "s0";

// Number of Grand Caps needed to end the game
export const GRAND_CAPS_TO_WIN = 3;

// Dice ranges
export const SPIN_CORRECT_RANGE: [number, number] = [1, 6];
export const SPIN_INCORRECT_RANGE: [number, number] = [1, 3];
