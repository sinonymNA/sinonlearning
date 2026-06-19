import {
  isGameShowType,
  type FeudPayload,
  type GameShowData,
  type GameShowPayload,
  type GameShowType,
  type GridPayload,
  type MemoryPayload,
  type RacePayload,
  type WheelPayload,
} from "./gameShowTypes";

type ValidationResult =
  | { ok: true; data: GameShowData }
  | { ok: false; error: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateGrid(data: unknown): ValidationResult {
  if (!data || typeof data !== "object" || !Array.isArray((data as GridPayload).categories)) {
    return { ok: false, error: "Expected a `categories` array." };
  }
  const categories = (data as GridPayload).categories;
  if (categories.length === 0) return { ok: false, error: "At least one category is required." };

  for (const category of categories) {
    if (!category || !isNonEmptyString(category.name) || !Array.isArray(category.clues)) {
      return { ok: false, error: "Each category needs a name and a list of clues." };
    }
    for (const clue of category.clues) {
      if (
        !clue ||
        !isFiniteNumber(clue.value) ||
        !isNonEmptyString(clue.question) ||
        !isNonEmptyString(clue.answer)
      ) {
        return { ok: false, error: "Each clue needs a value, question, and answer." };
      }
    }
  }
  return { ok: true, data: { categories } };
}

function validateWheel(data: unknown): ValidationResult {
  if (!data || typeof data !== "object" || !Array.isArray((data as WheelPayload).rounds)) {
    return { ok: false, error: "Expected a `rounds` array." };
  }
  const rounds = (data as WheelPayload).rounds;
  if (rounds.length === 0) return { ok: false, error: "At least one round is required." };

  for (const round of rounds) {
    if (!round || !isNonEmptyString(round.category) || !isNonEmptyString(round.phrase)) {
      return { ok: false, error: "Each round needs a category and a phrase." };
    }
    if (round.hint !== undefined && typeof round.hint !== "string") {
      return { ok: false, error: "Hint must be a string if provided." };
    }
  }
  return { ok: true, data: { rounds } };
}

function validateFeud(data: unknown): ValidationResult {
  if (!data || typeof data !== "object" || !Array.isArray((data as FeudPayload).rounds)) {
    return { ok: false, error: "Expected a `rounds` array." };
  }
  const rounds = (data as FeudPayload).rounds;
  if (rounds.length === 0) return { ok: false, error: "At least one round is required." };

  for (const round of rounds) {
    if (!round || !isNonEmptyString(round.prompt) || !Array.isArray(round.answers)) {
      return { ok: false, error: "Each round needs a prompt and a list of answers." };
    }
    if (round.answers.length === 0) {
      return { ok: false, error: "Each round needs at least one answer." };
    }
    for (const answer of round.answers) {
      if (!answer || !isNonEmptyString(answer.text) || !isFiniteNumber(answer.points)) {
        return { ok: false, error: "Each answer needs text and a point value." };
      }
    }
  }
  return { ok: true, data: { rounds } };
}

function validateRace(data: unknown): ValidationResult {
  if (!data || typeof data !== "object" || !Array.isArray((data as RacePayload).questions)) {
    return { ok: false, error: "Expected a `questions` array." };
  }
  const questions = (data as RacePayload).questions;
  if (questions.length === 0) return { ok: false, error: "At least one question is required." };

  for (const q of questions) {
    if (
      !q ||
      !isNonEmptyString(q.question) ||
      !Array.isArray(q.choices) ||
      q.choices.length < 2 ||
      !q.choices.every((c: unknown) => isNonEmptyString(c)) ||
      !isFiniteNumber(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.choices.length
    ) {
      return {
        ok: false,
        error: "Each question needs text, at least 2 choices, and a valid correct answer index.",
      };
    }
    if (q.points !== undefined && !isFiniteNumber(q.points)) {
      return { ok: false, error: "Points must be a number if provided." };
    }
  }
  return { ok: true, data: { questions } };
}

function validateMemory(data: unknown): ValidationResult {
  if (!data || typeof data !== "object" || !Array.isArray((data as MemoryPayload).pairs)) {
    return { ok: false, error: "Expected a `pairs` array." };
  }
  const pairs = (data as MemoryPayload).pairs;
  if (pairs.length < 2) return { ok: false, error: "At least 2 pairs are required." };

  for (const pair of pairs) {
    if (!pair || !isNonEmptyString(pair.term) || !isNonEmptyString(pair.definition)) {
      return { ok: false, error: "Each pair needs a term and a definition." };
    }
  }
  return { ok: true, data: { pairs } };
}

const validators: Record<GameShowType, (data: unknown) => ValidationResult> = {
  grid: validateGrid,
  wheel: validateWheel,
  feud: validateFeud,
  race: validateRace,
  memory: validateMemory,
};

export function validateGameShowData(type: unknown, data: unknown): ValidationResult {
  if (!isGameShowType(type)) {
    return { ok: false, error: "Unknown game type." };
  }
  return validators[type](data);
}

export function buildGameShowPayload(type: unknown, data: unknown): { ok: true; payload: GameShowPayload } | { ok: false; error: string } {
  const result = validateGameShowData(type, data);
  if (!result.ok) return result;
  return { ok: true, payload: { schemaVersion: 1, type: type as GameShowType, data: result.data } };
}
