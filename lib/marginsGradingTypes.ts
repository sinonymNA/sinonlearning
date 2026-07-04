import { z } from "zod";

export const EssayTypeSchema = z.enum(["DBQ", "LEQ", "SAQ"]);

export const EssayAnnotationSchema = z.object({
  quote: z.string().min(1),
  category: z.string().min(1),
  comment: z.string().min(1),
});

export const RubricBreakdownRowSchema = z.object({
  category: z.string().min(1),
  points_earned: z.number().min(0),
  points_possible: z.number().min(0),
  justification: z.string().min(1),
});

export const EssayEvalSchema = z.object({
  essay_type: EssayTypeSchema,
  overall_score: z.number().min(0),
  max_score: z.number().min(0),
  rubric_breakdown: z.array(RubricBreakdownRowSchema).min(1),
  annotations: z.array(EssayAnnotationSchema),
  overall_feedback: z.string().min(1),
  strengths: z.array(z.string()),
  next_steps: z.array(z.string()),
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
