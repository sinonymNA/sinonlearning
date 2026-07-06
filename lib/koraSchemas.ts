import { z } from "zod";
import type { KoraTaskType } from "./koraTypes";

// Zod mirrors of the KORA output interfaces in koraTypes.ts, used by the
// structured-output call in lib/koraServer.ts. Keep the two files in sync —
// the interfaces are what the client components consume.

export const KoraEvidenceLevelSchema = z.enum(["Not Yet Shown", "Emerging", "Solid", "Strong"]);

export const KoraNotesSchema = z.object({
  concept: z.string(),
  title: z.string(),
  learning_objective: z.string(),
  essential_question: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      type: z.enum([
        "anchor",
        "prerequisite_check",
        "core_idea",
        "example_analysis",
        "misconception_alert",
        "transfer_challenge",
      ]),
      content: z.string(),
      understanding_focus: z.string(),
    })
  ),
  key_vocabulary: z.array(z.object({ term: z.string(), definition: z.string(), example: z.string() })),
  common_pitfalls: z.array(z.string()),
  self_check_questions: z.array(
    z.object({
      question: z.string(),
      target_dimension: z.enum(["accuracy", "causality", "application", "transfer", "model_quality"]),
      what_strong_answer_includes: z.string(),
    })
  ),
});

export const KoraGameEvalSchema = z.object({
  concept: z.string(),
  probe: z.string(),
  student_response: z.string(),
  points: z.number(),
  understanding_level: KoraEvidenceLevelSchema,
  misconception_detected: z.boolean(),
  misconception_label: z.string().nullable(),
  feedback: z.string(),
  advance: z.boolean(),
});

export const KoraEvidenceEventsSchema = z.object({
  events: z.array(
    z.object({
      type: z.string(),
      prompt: z.string(),
      target_dimension: z.string(),
      difficulty: z.string(),
      success_criteria: z.array(z.string()),
      misconceptions_tested: z.array(z.string()),
    })
  ),
});

export const KoraAnchorSchema = z.object({
  concept: z.string(),
  anchor_statement: z.string(),
  analogy: z.string(),
  why_it_matters: z.string(),
  prerequisite_concepts: z.array(z.string()),
});

export const KoraGraphSchema = z.object({
  concept: z.string(),
  nodes: z.array(
    z.object({ id: z.string(), label: z.string(), type: z.enum(["concept", "example", "misconception"]) })
  ),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string() })),
  central_insight: z.string(),
});

export const KoraEvaluateSchema = z.object({
  concept: z.string(),
  student_response: z.string(),
  evidence_level: KoraEvidenceLevelSchema,
  evidence_summary: z.string(),
  strength_observed: z.string().nullable(),
  misconception_detected: z.boolean(),
  misconception_label: z.string().nullable(),
  next_move: z.string(),
});

export const KoraDiagnosisSchema = z.object({
  concept: z.string(),
  student_response: z.string(),
  primary_misconception: z.string().nullable(),
  misconception_category: z.string().nullable(),
  confidence: z.enum(["low", "medium", "high"]),
  diagnostic_reasoning: z.string(),
  intervention_suggestion: z.string(),
});

export const KoraMisconceptionSimSchema = z.object({
  concept: z.string(),
  misconception_label: z.string(),
  simulated_response: z.string(),
  why_this_sounds_right: z.string(),
  key_error: z.string(),
});

export const KoraNextProbeSchema = z.object({
  concept: z.string(),
  current_evidence_level: z.string(),
  probe_question: z.string(),
  cognitive_demand: z.enum(["recall", "explain", "apply", "evaluate"]),
  what_a_strong_answer_includes: z.string(),
  what_to_listen_for: z.string(),
});

export const KORA_TASK_SCHEMAS: Record<KoraTaskType, z.ZodType> = {
  notes_generation: KoraNotesSchema,
  evidence_events: KoraEvidenceEventsSchema,
  anchor: KoraAnchorSchema,
  graph: KoraGraphSchema,
  evaluate: KoraEvaluateSchema,
  diagnosis: KoraDiagnosisSchema,
  misconception_sim: KoraMisconceptionSimSchema,
  next_probe: KoraNextProbeSchema,
  game_response_eval: KoraGameEvalSchema,
};

// KORA public demo (app/api/kora-demo) — one schema per phase, matching what
// KoraDemoApp.tsx reads from each response.

export const KoraDemoQuestionSchema = z.object({
  reaction: z.string().nullable(),
  question: z.string(),
  dimension: z.enum(["accuracy", "causality", "application", "transfer"]),
  ready_to_analyze: z.boolean(),
});

export const KoraDemoAnalyzeSchema = z.object({
  overall_level: KoraEvidenceLevelSchema,
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  misconceptions: z.array(z.string()),
  summary: z.string(),
  path_to_mastery: z.string(),
});

export const KoraDemoRemediateSchema = z.object({
  acknowledgment: z.string(),
  question: z.string(),
  understanding_signal: z.string(),
  mastery_unlocked: z.boolean(),
});
