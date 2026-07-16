// Graph-based board definition.
// Spaces are nodes; connections list adjacent space IDs.
// Tokens tween between the (x, y) coordinates of their current and destination spaces.
// Coordinates tuned to sit on the track path of board-bg.png (800×450 canvas).

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
  x: number;           // Phaser world x (0–800)
  y: number;           // Phaser world y (0–450)
  connections: string[]; // IDs of spaces reachable from here (forward only)
  warpTargetId?: string; // Only set for "warp" spaces — paired warp destination
  grandCapEligible?: boolean; // Can the Grand Cap pedestal appear here?
  label?: string;       // Short display label for debug
}

// ─── Main loop (clockwise: bottom-left → right side → top → left side → back) ───
// Bottom row → right arc → top row → left arc → close
// Branch exits from s4 (bottom-center-right), dips through lower-center, rejoins at s5
export const BOARD_SPACES: BoardSpace[] = [

  // START area — bottom-left
  { id: "s0",  type: "start",     x: 100, y: 338, connections: ["s1"],  label: "START" },
  { id: "s1",  type: "coin",      x: 162, y: 290, connections: ["s2"] },
  { id: "s2",  type: "coin",      x: 232, y: 256, connections: ["s3"] },
  { id: "s3",  type: "capsule",   x: 308, y: 248, connections: ["s4"],  grandCapEligible: true },
  { id: "s4",  type: "coin",      x: 388, y: 250, connections: ["s5", "b0"] }, // branch split

  // Right side of bottom arc → right side of oval
  { id: "s5",  type: "challenge", x: 464, y: 255, connections: ["s6"] },
  { id: "s6",  type: "coin",      x: 538, y: 236, connections: ["s7"] },
  { id: "s7",  type: "raid",      x: 602, y: 198, connections: ["s8"] },
  { id: "s8",  type: "warp",      x: 648, y: 158, connections: ["s9"],  warpTargetId: "w1", label: "WARP-R" },
  { id: "s9",  type: "coin",      x: 714, y: 118, connections: ["s10"] },

  // Top-right → top arc
  { id: "s10", type: "grand_cap", x: 718, y:  70, connections: ["s11"], grandCapEligible: true },
  { id: "s11", type: "coin",      x: 664, y:  58, connections: ["s12"] },
  { id: "s12", type: "shop",      x: 596, y:  54, connections: ["s13"] },
  { id: "s13", type: "coin",      x: 522, y:  54, connections: ["s14"] },
  { id: "s14", type: "trap",      x: 448, y:  54, connections: ["s15"] },
  { id: "s15", type: "coin",      x: 374, y:  56, connections: ["s16"] },
  { id: "s16", type: "challenge", x: 298, y:  65, connections: ["s17"] },
  { id: "s17", type: "coin",      x: 222, y:  82, connections: ["s18"] },

  // Top-left → left arc
  { id: "s18", type: "warp",      x: 150, y: 110, connections: ["s19"], warpTargetId: "w2", label: "WARP-L" },
  { id: "s19", type: "coin",      x:  78, y: 145, connections: ["s20"] },
  { id: "s20", type: "raid",      x:  62, y: 206, connections: ["s21"] },
  { id: "s21", type: "coin",      x:  70, y: 266, connections: ["s22"] },
  { id: "s22", type: "shop",      x:  86, y: 316, connections: ["s0"] }, // closes loop

  // ─── Branch (splits from s4, dips through lower-center, rejoins at s5) ───
  // Artwork shows a lower detour through three star/pedestal markers
  { id: "b0",  type: "coin",      x: 420, y: 304, connections: ["b1"] },
  { id: "b1",  type: "capsule",   x: 456, y: 356, connections: ["b2"], grandCapEligible: true },
  { id: "b2",  type: "trap",      x: 500, y: 388, connections: ["b3"] },
  { id: "b3",  type: "coin",      x: 546, y: 396, connections: ["b4"] },
  { id: "b4",  type: "grand_cap", x: 592, y: 372, connections: ["b5"], grandCapEligible: true },
  { id: "b5",  type: "coin",      x: 562, y: 302, connections: ["s5"] }, // rejoins main loop

  // ─── Warp landing pads (center-lower area, accessed via warp spaces s8 and s18) ───
  { id: "w1",  type: "warp",      x: 374, y: 388, connections: ["w1a"], warpTargetId: "s8",  label: "PAD-1" },
  { id: "w1a", type: "coin",      x: 314, y: 378, connections: ["s0"] },
  { id: "w2",  type: "warp",      x: 206, y: 368, connections: ["w2a"], warpTargetId: "s18", label: "PAD-2" },
  { id: "w2a", type: "coin",      x: 154, y: 376, connections: ["s0"] },
];

export const BOARD_SPACE_MAP: Map<string, BoardSpace> = new Map(
  BOARD_SPACES.map(s => [s.id, s])
);

export const GRAND_CAP_ELIGIBLE = BOARD_SPACES.filter(s => s.grandCapEligible).map(s => s.id);
export const START_SPACE_ID = "s0";
export const GRAND_CAPS_TO_WIN = 3;
export const SPIN_CORRECT_RANGE: [number, number] = [1, 6];
export const SPIN_INCORRECT_RANGE: [number, number] = [1, 3];
