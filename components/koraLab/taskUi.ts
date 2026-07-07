import type { ComponentType } from "react";
import MarginsRubricInputForm, {
  defaultMarginsRubricInput,
  type MarginsRubricInput,
} from "./inputForms/MarginsRubricInputForm";
import NotesheetInputForm, { defaultNotesheetInput, type NotesheetInput } from "./inputForms/NotesheetInputForm";
import GameShowInputForm, { defaultGameShowInput, type GameShowInput } from "./inputForms/GameShowInputForm";
import SliderBuildInputForm, {
  defaultSliderBuildInput,
  type SliderBuildInput,
} from "./inputForms/SliderBuildInputForm";
import ReelBuildInputForm, { defaultReelBuildInput, type ReelBuildInput } from "./inputForms/ReelBuildInputForm";
import MarginsGradeInputForm, {
  defaultMarginsGradeInput,
  type MarginsGradeInput,
} from "./inputForms/MarginsGradeInputForm";
import MarginsRevisionCoachInputForm, {
  defaultMarginsRevisionCoachInput,
  type MarginsRevisionCoachInput,
} from "./inputForms/MarginsRevisionCoachInputForm";

// The client-safe parallel to lib/koraLab/registry.ts. Deliberately separate:
// the registry's generate() closes over server-only code (the Anthropic SDK,
// Postgres), so it can never be imported from a "use client" file. This file
// only ever talks to that logic through the /api/kora-lab/* routes.

export interface KoraLabTaskUiEntry<TInput = any> {
  label: string;
  description: string;
  InputForm: ComponentType<{ value: TInput; onChange: (v: TInput) => void }>;
  defaultInput: () => TInput;
}

export const KORA_LAB_TASK_UI: Record<string, KoraLabTaskUiEntry> = {
  margins_rubric: {
    label: "Margins — Rubric generation",
    description: "Adapts the AP World History rubric categories to a specific topic.",
    InputForm: MarginsRubricInputForm,
    defaultInput: defaultMarginsRubricInput,
  },
  notesheet_generate: {
    label: "Scaffold — Notesheet generation",
    description: "Generates a printable student notesheet from slide/lesson content.",
    InputForm: NotesheetInputForm,
    defaultInput: defaultNotesheetInput,
  },
  game_show_generate: {
    label: "Game Shows — content generation",
    description: "Converts pasted teacher content into one of 5 game-show formats.",
    InputForm: GameShowInputForm,
    defaultInput: defaultGameShowInput,
  },
  margins_assignment: {
    label: "Margins — Assignment (essay prompt) generation",
    description: "Drafts an AP World History essay prompt (DBQ/LEQ/SAQ).",
    InputForm: MarginsRubricInputForm,
    defaultInput: defaultMarginsRubricInput,
  },
  slider_build: {
    label: "Slider — Slideshow generation",
    description: "Builds a classroom slideshow from topic/audience/key points.",
    InputForm: SliderBuildInputForm,
    defaultInput: defaultSliderBuildInput,
  },
  reel_build: {
    label: "Reel — Explainer video script generation",
    description: "Scripts a short explainer video as a sequence of animated beats.",
    InputForm: ReelBuildInputForm,
    defaultInput: defaultReelBuildInput,
  },
  margins_grade: {
    label: "Margins — Essay grading (text-only)",
    description: "Grades an essay against a rubric with inline annotations. Text-only in the Lab (no uploaded source images).",
    InputForm: MarginsGradeInputForm,
    defaultInput: defaultMarginsGradeInput,
  },
  margins_revision_coach: {
    label: "Margins — Revision coaching",
    description: "Generates a guided Socratic revision plan from grading feedback.",
    InputForm: MarginsRevisionCoachInputForm,
    defaultInput: defaultMarginsRevisionCoachInput,
  },
};

export type {
  MarginsRubricInput,
  NotesheetInput,
  GameShowInput,
  SliderBuildInput,
  ReelBuildInput,
  MarginsGradeInput,
  MarginsRevisionCoachInput,
};
