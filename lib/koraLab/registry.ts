import type { z } from "zod";
import {
  generateRubric,
  RubricGenerateInputSchema,
  generateAssignment,
  AssignmentGenerateInputSchema,
  generateGrade,
  GradeInputSchema,
  generateRevisionPlan,
  RevisionCoachInputSchema,
} from "../marginsKoraGenerate";
import { generateNotesheetPlan, NotesheetGenerateInputSchema } from "../notesheetKoraGenerate";
import { generateGameShow, GameShowGenerateInputSchema } from "../gameShowKoraGenerate";
import {
  generateSliderDeck,
  SliderBuildInputSchema,
  generateSliderDeckFromContent,
  SliderContentFillInputSchema,
} from "../sliderKoraGenerate";
import { generateReelScript, ReelBuildInputSchema } from "../reelKoraGenerate";

// KORA Lab task registry — the single place that maps a task id to the exact
// generation logic its production route uses. Both the production route AND
// the lab call the same `generate()` function, so there is never a chance of
// prompt drift between what teachers get and what gets rated here.

export interface KoraLabGenerateOverrides {
  model?: string;
  thinking?: boolean;
  systemPromptOverride?: string;
  label?: string;
}

export interface KoraLabConfigUsed {
  model: string;
  thinking: boolean;
  maxTokens: number;
  label?: string;
  systemPromptOverride?: string;
}

export interface KoraLabGenerateResult<TOutput = unknown> {
  system: string;
  output: TOutput;
  configUsed: KoraLabConfigUsed;
}

export interface KoraLabTaskDef<TInput = any, TOutput = any> {
  label: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  defaultModel: string;
  defaultMaxTokens: number;
  defaultThinking: boolean;
  generate(input: TInput, overrides?: KoraLabGenerateOverrides): Promise<KoraLabGenerateResult<TOutput>>;
}

export const KORA_LAB_TASKS: Record<string, KoraLabTaskDef> = {
  margins_rubric: {
    label: "Margins — Rubric generation",
    description: "Adapts the AP World History rubric categories to a specific topic.",
    inputSchema: RubricGenerateInputSchema,
    defaultModel: "claude-sonnet-4-6",
    defaultMaxTokens: 1536,
    defaultThinking: false,
    generate: generateRubric,
  },
  notesheet_generate: {
    label: "Scaffold — Notesheet generation",
    description: "Generates a printable student notesheet from slide/lesson content.",
    inputSchema: NotesheetGenerateInputSchema,
    defaultModel: "claude-sonnet-4-6",
    defaultMaxTokens: 2048,
    defaultThinking: false,
    generate: generateNotesheetPlan,
  },
  game_show_generate: {
    label: "Game Shows — content generation",
    description: "Converts pasted teacher content into one of 5 game-show formats.",
    inputSchema: GameShowGenerateInputSchema,
    defaultModel: "claude-sonnet-4-6",
    defaultMaxTokens: 4096,
    defaultThinking: false,
    generate: generateGameShow,
  },
  margins_assignment: {
    label: "Margins — Assignment (essay prompt) generation",
    description: "Drafts an AP World History essay prompt (DBQ/LEQ/SAQ).",
    inputSchema: AssignmentGenerateInputSchema,
    defaultModel: "claude-sonnet-4-6",
    defaultMaxTokens: 1024,
    defaultThinking: false,
    generate: generateAssignment,
  },
  slider_build: {
    label: "Slider — Slideshow generation",
    description:
      "Builds a classroom slideshow via a 3-phase pipeline (Design Brief → Build → Red Team, " +
      "conditional Revise) instead of one call. defaultModel/defaultThinking below describe the Build " +
      "phase only, which is the one phase systemPromptOverride can currently target; an explicit " +
      "model/thinking override in the Lab applies uniformly to all phases.",
    inputSchema: SliderBuildInputSchema,
    defaultModel: "claude-sonnet-5",
    defaultMaxTokens: 8192,
    defaultThinking: false,
    generate: generateSliderDeck,
  },
  slider_fill: {
    label: "Slider — Content-fill generation",
    description:
      "Formats a teacher's own pasted lesson content into Slider's slide templates using a single " +
      "fixed master prompt, rather than inventing content from a topic — one call, no Design Brief " +
      "or Red Team pass.",
    inputSchema: SliderContentFillInputSchema,
    defaultModel: "claude-sonnet-5",
    defaultMaxTokens: 8192,
    defaultThinking: false,
    generate: generateSliderDeckFromContent,
  },
  reel_build: {
    label: "Reel — Explainer video script generation",
    description: "Scripts a short explainer video as a sequence of animated beats.",
    inputSchema: ReelBuildInputSchema,
    defaultModel: "claude-opus-4-8",
    defaultMaxTokens: 8192,
    defaultThinking: true,
    generate: generateReelScript,
  },
  margins_grade: {
    label: "Margins — Essay grading (text-only)",
    description: "Grades an essay against a rubric with inline annotations. Text-only in the Lab (no uploaded source images).",
    inputSchema: GradeInputSchema,
    defaultModel: "claude-opus-4-8",
    defaultMaxTokens: 8192,
    defaultThinking: true,
    generate: generateGrade,
  },
  margins_revision_coach: {
    label: "Margins — Revision coaching",
    description: "Generates a guided Socratic revision plan from grading feedback.",
    inputSchema: RevisionCoachInputSchema,
    defaultModel: "claude-opus-4-8",
    defaultMaxTokens: 8192,
    defaultThinking: true,
    generate: generateRevisionPlan,
  },
};

export type KoraLabTaskId = keyof typeof KORA_LAB_TASKS;

export function getKoraLabTask(taskType: string): KoraLabTaskDef | undefined {
  return KORA_LAB_TASKS[taskType];
}

export function listKoraLabTaskIds(): string[] {
  return Object.keys(KORA_LAB_TASKS);
}
