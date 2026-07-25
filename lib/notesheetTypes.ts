import { z } from "zod";

export type NotesheetSectionType =
  | "warmup_box"
  | "fill_blank"
  | "numbered_response"
  | "content_box"
  | "two_column_box"
  | "drawing_box"
  | "three_column_box"
  | "structured_concept_box"
  | "graph_box"
  | "acronym_scaffold"
  | "labeled_comparison_table"
  | "frayer_model"
  | "t_chart"
  | "sequence_box"
  | "cause_effect_box"
  | "timeline_box"
  | "exit_ticket"
  | "spectrum_bar"
  | "mind_map_box";

const booleanFromAny = z.preprocess(
  (val) => (typeof val === "string" ? val === "true" : val),
  z.boolean()
);

export const NotesheetColumnSchema = z.object({
  header: z.string(),
  width_pct: z.coerce.number().min(1).max(100),
  prefilled: booleanFromAny,
});

export const NotesheetSectionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "warmup_box",
    "fill_blank",
    "numbered_response",
    "content_box",
    "two_column_box",
    "drawing_box",
    "three_column_box",
    "structured_concept_box",
    "graph_box",
    "acronym_scaffold",
    "labeled_comparison_table",
    "frayer_model",
    "t_chart",
    "sequence_box",
    "cause_effect_box",
    "timeline_box",
    "exit_ticket",
    "spectrum_bar",
    "mind_map_box",
  ]),
  heading: z.string().optional(),
  content: z.string(),
  student_prompt: z.string(),
  answer_key_notes: z.string(),
  num_lines: z.coerce.number().int().min(0).max(20).optional(),
  columns: z.array(NotesheetColumnSchema).optional(),
  fields: z.array(z.string()).optional(),
  acronym: z.string().optional(),
  row_labels: z.array(z.string()).optional(),
  col_labels: z.array(z.string()).optional(),
  direction: z.string().optional(),
});

export const NotesheetPlanSchema = z.object({
  concept: z.string(),
  title: z.string(),
  grade_band: z.string(),
  subject: z.string(),
  learning_objective: z.string(),
  essential_question: z.string(),
  sections: z.array(NotesheetSectionSchema).min(3).max(20),
});

export type NotesheetColumn = z.infer<typeof NotesheetColumnSchema>;
export type NotesheetSection = z.infer<typeof NotesheetSectionSchema>;
export type NotesheetPlan = z.infer<typeof NotesheetPlanSchema>;

// ── Worksheet design brief ────────────────────────────────────────────────────
// Emitted by the reasoning pass of the description-driven generator. The teacher
// describes what they want in prose; KORA first decides WHAT KIND of worksheet
// that is and WHY each section earns its place, then a second pass builds the
// actual sections from this brief. Surfaced to the teacher so the design
// decisions are visible and arguable, not hidden inside one opaque call.

export const WorksheetSectionPlanSchema = z.object({
  /** Section type id from the supported list (warmup_box, t_chart, …). */
  type: z.string(),
  /** Short label for what this section is (2-5 words). */
  heading: z.string(),
  /** Why this section type — the design decision, in one sentence. */
  rationale: z.string(),
});

export const WorksheetDesignBriefSchema = z.object({
  /** What kind of worksheet this is: guided notes, practice set, lab, station activity, review, etc. */
  worksheet_type: z.string(),
  /** What students will be able to do when finished. */
  learning_goal: z.string(),
  /** Inferred or stated subject. */
  subject: z.string(),
  /** Inferred or stated grade band. */
  grade_band: z.string(),
  /** The single question the worksheet drives at. */
  essential_question: z.string(),
  /** The overall design reasoning: why this shape of worksheet fits this request. */
  design_rationale: z.string(),
  /** What a student physically does, start to finish, in 1-3 sentences. */
  student_experience: z.string(),
  /** Planned sections in order, each with its justification. */
  section_plan: z.array(WorksheetSectionPlanSchema).min(3).max(14),
});

export type WorksheetSectionPlan = z.infer<typeof WorksheetSectionPlanSchema>;
export type WorksheetDesignBrief = z.infer<typeof WorksheetDesignBriefSchema>;
