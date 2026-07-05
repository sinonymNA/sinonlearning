import { z } from "zod";

export const EssayTypeSchema = z.enum(["DBQ", "LEQ", "SAQ"]);

// Distinguishes confidence-building highlights from growth-area highlights —
// lets the highlighter visually foreground praise, not just rubric category.
export const AnnotationTypeSchema = z.enum(["praise", "growth"]);

export const EssayAnnotationSchema = z.object({
  quote: z.string().min(1),
  category: z.string().min(1),
  type: AnnotationTypeSchema,
  comment: z.string().min(1),
});

export const RubricBreakdownRowSchema = z.object({
  category: z.string().min(1),
  points_earned: z.number().min(0),
  points_possible: z.number().min(0),
  justification: z.string().min(1),
});

// Structured critique: a plain-language issue, why it matters for this essay,
// one immediately actionable move, and the broader AP skill it connects to.
// `skill` is a free string (prompt-constrained to a fixed list) rather than a
// strict enum — grading has no retry logic, so a cosmetic mismatch on a strict
// enum would hard-fail the whole response instead of just reading oddly.
export const NextStepSchema = z.object({
  issue: z.string().min(1),
  why_it_matters: z.string().min(1),
  how_to_fix: z.string().min(1),
  skill: z.string().min(1),
});

export const EssayEvalSchema = z.object({
  essay_type: EssayTypeSchema,
  overall_score: z.number().min(0),
  max_score: z.number().min(0),
  rubric_breakdown: z.array(RubricBreakdownRowSchema).min(1),
  annotations: z.array(EssayAnnotationSchema),
  overall_feedback: z.string().min(1),
  strengths: z.array(z.string()),
  next_steps: z.array(NextStepSchema).min(1),
});
export type EssayEvalOutput = z.infer<typeof EssayEvalSchema>;

export const RubricCriterionSchema = z.object({
  category: z.string().min(1),
  points_possible: z.number().min(0),
  description: z.string().min(1),
});

export const RubricGenerateSchema = z.object({
  essay_type: EssayTypeSchema,
  criteria: z.array(RubricCriterionSchema).min(1),
});
export type RubricGenerateOutput = z.infer<typeof RubricGenerateSchema>;

export const AssignmentGenerateSchema = z.object({
  essay_type: EssayTypeSchema,
  title: z.string().min(1),
  prompt_text: z.string().min(1),
  suggested_document_topics: z.array(z.string()).optional(),
});
export type AssignmentGenerateOutput = z.infer<typeof AssignmentGenerateSchema>;

// One step of the guided revision wizard, generated up front from a single
// grading's next_steps — a step is a question/scaffold/hint, never model-
// written essay content.
export const RevisionStepSchema = z.object({
  based_on_issue: z.string().min(1),
  restatement: z.string().min(1),
  guiding_question: z.string().min(1),
  scaffold: z.string().min(1),
  hint: z.string().min(1),
});

export const RevisionPlanSchema = z.object({
  steps: z.array(RevisionStepSchema).min(1).max(4),
});
export type RevisionPlanOutput = z.infer<typeof RevisionPlanSchema>;

// Transcription of an assignment already on paper/in a file — rubric and
// documents are optional since a real upload may not show either; the
// assignments route's RUBRIC_TEMPLATES fallback covers "no rubric visible".
export const ImportAssignmentSchema = z.object({
  essay_type: EssayTypeSchema,
  title: z.string().min(1),
  prompt_text: z.string().min(1),
  rubric: z.array(RubricCriterionSchema).optional(),
  documents: z.array(z.object({ label: z.string().min(1), source_text: z.string().min(1) })).optional(),
});
export type ImportAssignmentOutput = z.infer<typeof ImportAssignmentSchema>;
