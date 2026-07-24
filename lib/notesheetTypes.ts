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
