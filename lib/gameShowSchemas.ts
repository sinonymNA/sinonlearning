import { z } from "zod";
import type { GameShowType } from "./gameShowTypes";

// Zod mirrors of the five game payload shapes in gameShowTypes.ts, used for
// structured output from the game-shows generator. The old hand-rolled
// validators in gameShowValidation.ts remain the runtime gate for teacher-
// edited content; these schemas cover the AI-generation path.

export const GridSchema = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().min(1),
        clues: z.array(z.object({ value: z.number(), question: z.string().min(1), answer: z.string().min(1) })),
      })
    )
    .min(1),
});

export const WheelSchema = z.object({
  rounds: z
    .array(z.object({ category: z.string().min(1), phrase: z.string().min(1), hint: z.string().optional() }))
    .min(1),
});

export const FeudSchema = z.object({
  rounds: z
    .array(
      z.object({
        prompt: z.string().min(1),
        answers: z.array(z.object({ text: z.string().min(1), points: z.number() })).min(1),
      })
    )
    .min(1),
});

export const RaceSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        choices: z.array(z.string().min(1)).min(2),
        correctIndex: z.number().int().min(0),
        points: z.number().optional(),
      })
    )
    .min(1),
});

export const MemorySchema = z.object({
  pairs: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })).min(2),
});

export const GAME_SHOW_SCHEMAS: Record<GameShowType, z.ZodType> = {
  grid: GridSchema,
  wheel: WheelSchema,
  feud: FeudSchema,
  race: RaceSchema,
  memory: MemorySchema,
};
