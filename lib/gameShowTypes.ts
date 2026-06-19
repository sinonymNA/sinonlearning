export type GameShowType = "grid" | "wheel" | "feud" | "race" | "memory";

export interface GridClue {
  value: number;
  question: string;
  answer: string;
}

export interface GridCategory {
  name: string;
  clues: GridClue[];
}

export interface GridPayload {
  categories: GridCategory[];
}

export interface WheelRound {
  category: string;
  phrase: string;
  hint?: string;
}

export interface WheelPayload {
  rounds: WheelRound[];
}

export interface FeudAnswer {
  text: string;
  points: number;
}

export interface FeudRound {
  prompt: string;
  answers: FeudAnswer[];
}

export interface FeudPayload {
  rounds: FeudRound[];
}

export interface RaceQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  points?: number;
}

export interface RacePayload {
  questions: RaceQuestion[];
}

export interface MemoryPair {
  term: string;
  definition: string;
}

export interface MemoryPayload {
  pairs: MemoryPair[];
}

export type GameShowData =
  | GridPayload
  | WheelPayload
  | FeudPayload
  | RacePayload
  | MemoryPayload;

export interface GameShowPayload {
  schemaVersion: 1;
  type: GameShowType;
  data: GameShowData;
}

export const GAME_SHOW_TYPES: GameShowType[] = ["grid", "wheel", "feud", "race", "memory"];

export function isGameShowType(value: unknown): value is GameShowType {
  return typeof value === "string" && (GAME_SHOW_TYPES as string[]).includes(value);
}
