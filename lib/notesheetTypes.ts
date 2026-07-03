import { z } from "zod";

export type NotesheetSectionType =
  | "warmup_box"
  | "fill_blank"
  | "numbered_response"
  | "content_box"
  | "two_column_box"
  | "drawing_box"
  | "three_column_box";

export const NotesheetColumnSchema = z.object({
  header: z.string(),
  width_pct: z.number().min(1).max(100),
  prefilled: z.boolean(),
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
  ]),
  heading: z.string().optional(),
  content: z.string(),
  student_prompt: z.string(),
  answer_key_notes: z.string(),
  num_lines: z.number().int().min(1).max(20).optional(),
  columns: z.array(NotesheetColumnSchema).optional(),
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
