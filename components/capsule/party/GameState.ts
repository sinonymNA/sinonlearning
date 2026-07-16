// Shared game state — passed between scenes and serialized for checkpoint saves.

import { BOARD_SPACES, GRAND_CAP_ELIGIBLE, START_SPACE_ID } from "./BoardData";
import Phaser from "phaser";

export type ItemType = "magnet" | "golden-spinner" | "warp-ticket" | "shield" | "raid-block";

export interface Item {
  type: ItemType;
  name: string;
  description: string;
}

export const ITEM_DEFS: Record<ItemType, Item> = {
  magnet:          { type: "magnet",          name: "Magnet",         description: "Move toward the active Grand Cap location." },
  "golden-spinner":{ type: "golden-spinner",  name: "Golden Spinner", description: "Spin a 5–6 on your next turn." },
  "warp-ticket":   { type: "warp-ticket",     name: "Warp Ticket",    description: "Teleport to a linked warp point." },
  shield:          { type: "shield",          name: "Shield",         description: "Block the next Raid against you." },
  "raid-block":    { type: "raid-block",      name: "Raid Block",     description: "Cancel a Raid space effect this turn." },
};

export interface PlayerState {
  id: string;
  displayName: string;
  capId: string;
  isBot: boolean;
  colorIndex: number;
  spaceId: string;
  grandCaps: number;
  coins: number;
  items: ItemType[];       // Max 2 items
  correctAnswers: number;
  totalAnswers: number;
  hasShield: boolean;
}

export interface GameState {
  players: PlayerState[];
  turnIndex: number;       // Whose turn it is (index into players)
  turnNumber: number;      // Increments after every player has gone once
  activeGrandCapId: string; // Current space ID where Grand Cap sits
  phase: "lobby" | "board" | "minigame" | "results";
  minigameType: "coin-vacuum" | "factory-floor" | "crate-break" | null;
  turnOrder: number[];     // Player indices in play order for this round
}

export function createInitialState(
  players: { id: string; displayName: string; capId: string; isBot: boolean; colorIndex: number }[]
): GameState {
  const playerStates: PlayerState[] = players.map(p => ({
    ...p,
    spaceId: START_SPACE_ID,
    grandCaps: 0,
    coins: 0,
    items: [],
    correctAnswers: 0,
    totalAnswers: 0,
    hasShield: false,
  }));

  // Random initial Grand Cap placement from eligible spaces
  const eligibleIds = GRAND_CAP_ELIGIBLE.filter(id => BOARD_SPACES.find(s => s.id === id));
  const activeGrandCapId = Phaser.Utils.Array.GetRandom(eligibleIds) as string;

  return {
    players: playerStates,
    turnIndex: 0,
    turnNumber: 1,
    activeGrandCapId,
    phase: "board",
    minigameType: null,
    turnOrder: players.map((_, i) => i),
  };
}

export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeState(json: string): GameState {
  return JSON.parse(json) as GameState;
}

// Movement helpers

export function getPathSteps(fromId: string, count: number, boardMap: Map<string, import("./BoardData").BoardSpace>): string[] {
  // Follow connections forward for `count` steps.
  // At branch points (multiple connections), bots go random; humans choose (handled by BoardScene).
  const path: string[] = [];
  let current = fromId;
  for (let i = 0; i < count; i++) {
    const space = boardMap.get(current);
    if (!space || space.connections.length === 0) break;
    // Default: follow first connection
    current = space.connections[0];
    path.push(current);
  }
  return path;
}

// Victory ranking: 1. Grand Caps, 2. Coins, 3. Quiz accuracy, 4. join order (deterministic)
export function rankPlayers(players: PlayerState[]): PlayerState[] {
  return [...players].sort((a, b) => {
    if (b.grandCaps !== a.grandCaps) return b.grandCaps - a.grandCaps;
    if (b.coins !== a.coins) return b.coins - a.coins;
    const accA = a.totalAnswers > 0 ? a.correctAnswers / a.totalAnswers : 0;
    const accB = b.totalAnswers > 0 ? b.correctAnswers / b.totalAnswers : 0;
    if (accB !== accA) return accB - accA;
    return a.colorIndex - b.colorIndex;
  });
}
