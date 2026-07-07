import { z } from "zod";
import {
  RubricGenerateSchema,
  AssignmentGenerateSchema,
  EssayEvalSchema,
  RevisionPlanSchema,
  type EssayEvalOutput,
  type RevisionPlanOutput,
} from "./marginsGradingTypes";
import { RUBRIC_TEMPLATES, type EssayType } from "./marginsRubrics";
import { callKoraStructured } from "./koraServer";
import type { KoraLabGenerateOverrides, KoraLabGenerateResult } from "./koraLab/registry";

// Generation logic extracted from the production KORA routes under
// app/api/margins/*. Both the production route AND the KORA Lab call these
// exact functions, so there is never a chance of prompt drift between what
// teachers get and what gets rated in the Lab.

const RUBRIC_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. You adapt the College Board's official AP World History: " +
  "Modern rubric categories to a specific topic — you do NOT invent new categories or change point totals.";

export const RubricGenerateInputSchema = z.object({
  essayType: z.enum(["DBQ", "LEQ", "SAQ"]),
  topic: z.string().min(1),
});
export type RubricGenerateInput = z.infer<typeof RubricGenerateInputSchema>;

function buildRubricUserMessage(input: RubricGenerateInput): string {
  const skeleton = RUBRIC_TEMPLATES[input.essayType as EssayType];
  return [
    `Essay Type: ${input.essayType}`,
    `Topic/Unit: ${input.topic}`,
    `\nRequired rubric categories and point values (do not change these):`,
    ...skeleton.map((c) => `- ${c.category}: ${c.points_possible} pt${c.points_possible === 1 ? "" : "s"}`),
    `\nTask: For each category above, write a topic-specific description of exactly what a student must do with "${input.topic}" content to earn that point — keep the category name and points_possible exactly as given, only customize the description.`,
    `\nSet essay_type to "${input.essayType}".`,
  ].join("\n");
}

export async function generateRubric(
  input: RubricGenerateInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult> {
  const system = overrides?.systemPromptOverride ?? RUBRIC_SYSTEM_PROMPT;
  const model = overrides?.model ?? "claude-sonnet-4-6";
  const maxTokens = 1536;
  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    messages: [{ role: "user", content: buildRubricUserMessage(input) }],
    schema: RubricGenerateSchema,
  });
  return {
    system,
    output: data,
    configUsed: { model, thinking: false, maxTokens, label: overrides?.label, systemPromptOverride: overrides?.systemPromptOverride },
  };
}

const ASSIGNMENT_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, drafting AP World History: Modern essay prompts. " +
  "Return a single JSON object matching the schema exactly. No prose, no markdown outside the JSON. " +
  "CRITICAL SAFETY RULE: you must NEVER invent, fabricate, or write text presented as a real historical " +
  "primary source document, quote, or excerpt. For DBQ, do not write document content — only the essay " +
  "prompt/title and, optionally, a list of real, general topics or source types (e.g. 'a colonial trade " +
  "ledger', 'a speech by a nationalist leader') the teacher should go find and add themselves. Fabricated " +
  "primary sources presented as real would mis-teach students preparing for an actual exam — this rule is " +
  "never optional.";

const ASSIGNMENT_TYPE_INSTRUCTIONS: Record<EssayType, string> = {
  DBQ:
    "Write a DBQ-style prompt asking students to develop an argument, evaluated using documents. " +
    "Do NOT write any document text. Include 6-7 suggested_document_topics (real topic/source-type " +
    "suggestions, not invented quotes) the teacher should source themselves.",
  LEQ:
    "Write an LEQ-style prompt using a historical reasoning skill (comparison, causation, or " +
    "continuity/change) appropriate to the topic. No documents needed — omit suggested_document_topics.",
  SAQ:
    "Write an SAQ-style prompt with three labeled parts (a, b, c), each asking students to identify, " +
    "explain, or compare ONE specific thing. No documents needed — omit suggested_document_topics.",
};

export const AssignmentGenerateInputSchema = z.object({
  essayType: z.enum(["DBQ", "LEQ", "SAQ"]),
  topic: z.string().min(1),
});
export type AssignmentGenerateInput = z.infer<typeof AssignmentGenerateInputSchema>;

function buildAssignmentUserMessage(input: AssignmentGenerateInput): string {
  const essayType = input.essayType as EssayType;
  return [
    `Essay Type: ${essayType}`,
    `Topic/Unit: ${input.topic}`,
    `\nTask: ${ASSIGNMENT_TYPE_INSTRUCTIONS[essayType]}`,
    `\nSet essay_type to "${essayType}".`,
  ].join("\n");
}

export async function generateAssignment(
  input: AssignmentGenerateInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult> {
  const system = overrides?.systemPromptOverride ?? ASSIGNMENT_SYSTEM_PROMPT;
  const model = overrides?.model ?? "claude-sonnet-4-6";
  const maxTokens = 1024;
  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    messages: [{ role: "user", content: buildAssignmentUserMessage(input) }],
    schema: AssignmentGenerateSchema,
  });
  return {
    system,
    output: data,
    configUsed: { model, thinking: false, maxTokens, label: overrides?.label, systemPromptOverride: overrides?.systemPromptOverride },
  };
}

const AP_SKILLS =
  "Contextualization, Comparison, Causation, Continuity and Change Over Time, Argumentation, Use of Evidence";

export const GRADE_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, grading AP World History: Modern essays for the " +
  "Margins writing app. You are a rigorous but fair AP reader AND a warm, encouraging writing coach — both at " +
  "once. Score strictly against the rubric given — not a generic impression of essay quality. Your feedback " +
  "must do three things at once: (1) build the student's confidence as a writer by naming real, specific " +
  "strengths in their own words — never generic or empty praise; (2) give simple, concrete, immediately " +
  "actionable critiques — a student should read a next step and know exactly what move to make next, not an " +
  "abstract instruction; (3) build the student's understanding of the discipline by explicitly connecting each " +
  `fix to the broader AP historical-thinking skill it belongs to (${AP_SKILLS}) — the student should leave ` +
  "understanding why the skill matters generally, not just that they lost a point here. Return a single JSON " +
  "object matching the schema exactly. No prose, no markdown outside the JSON. " +
  "CRITICAL: every annotation's \"quote\" field MUST be an exact, verbatim substring copied character-for-character " +
  "from the student's essay — never paraphrase, summarize, or invent a quote. If you cannot find a good verbatim " +
  "excerpt to anchor a point, omit that annotation rather than inventing one. Tag every annotation's \"type\" as " +
  "\"praise\" (a moment worth celebrating) or \"growth\" (room to improve) — never invent a fake growth annotation " +
  "just to have one; a strong essay can be mostly praise. This is a draft grade a teacher will review before it " +
  "counts — be honest and specific, never inflated, but always find the real good in the writing first. " +
  "When grading a resubmission, you will be shown the student's prior attempt's feedback — use it to explicitly " +
  "recognize genuine improvement, reinforcing their growth as a writer.";

export type PriorGrading = {
  attemptNumber: number;
  overallScore: number;
  maxScore: number;
  nextSteps: { issue: string }[];
} | null | undefined;

// Shared by the text-only path below AND the production route's multimodal
// path (which sends this as trailing text after the image content blocks) —
// exported so both stay byte-for-byte identical.
export function buildRubricEssayTail(params: {
  rubric: { category: string; points_possible: number; description: string }[];
  essayText: string;
  priorGrading?: PriorGrading;
}): string {
  const { rubric, essayText, priorGrading } = params;
  const lines: string[] = ["\nRubric:"];
  rubric.forEach((r) =>
    lines.push(`- ${r.category} (${r.points_possible} pt${r.points_possible === 1 ? "" : "s"}): ${r.description}`)
  );
  if (priorGrading) {
    lines.push(
      `\nPrevious attempt (attempt ${priorGrading.attemptNumber}) feedback:`,
      `Score: ${priorGrading.overallScore}/${priorGrading.maxScore}`,
      `Growth areas identified then: ${priorGrading.nextSteps.map((s) => s.issue).join("; ")}`
    );
  }
  lines.push(`\nStudent Essay:\n${essayText}`);
  lines.push(
    `\nRules:`,
    `1. rubric_breakdown must have exactly one row per rubric category given above, in the same order, with the same points_possible.`,
    `2. max_score must equal the sum of points_possible across the rubric.`,
    `3. Annotations: quote must be copied verbatim from the student essay above — no paraphrasing. Aim for 5-10 annotations total, with AT LEAST 2 tagged "praise" regardless of overall essay quality — find real, specific things the student did well (a well-chosen piece of evidence, a clear topic sentence, a genuine attempt at complexity) even in a weak essay. Tag the rest "growth" for moments needing work.`,
    `4. overall_feedback should be 3-5 sentences. Open by naming one specific, genuine strength in this essay (never generic like "good job") before naming the most important area to grow — the student should feel seen, not just graded.`,
    `5. strengths: 2-4 short, specific bullets naming exact things the student did well (specific moves, not vague qualities like "good writing").`,
    `6. next_steps: 2-4 objects, one per growth area, most important first. For each: "issue" is a plain-language restatement of what needs work (1 sentence, no jargon); "why_it_matters" explains why this matters for scoring THIS essay well (1 sentence, concrete); "how_to_fix" is one immediately actionable, concrete move the student can apply on their next draft (e.g. "Add one sentence after your evidence explaining how it proves your thesis" — NOT "use more analysis"); "skill" names the broader AP historical-thinking skill this connects to (one of: ${AP_SKILLS}) so the student sees this as a transferable skill, not a one-off fix.`,
    `7. Never write a "how_to_fix" that supplies actual essay content (a sentence, thesis, or piece of analysis) — describe the MOVE to make, never the words to use. The student must do the writing.` +
      (priorGrading
        ? ` This is a REVISION — the student already received the feedback above and worked through a guided revision process before resubmitting. In overall_feedback, explicitly and specifically acknowledge what they improved compared to their previous attempt (reference the actual change, not a generic "good improvement"). If a previously flagged growth area is still present, treat it gently as an area for continued practice, not a repeated failure.`
        : "")
  );
  return lines.join("\n");
}

const GradeDocumentInputSchema = z.object({
  label: z.string(),
  source_text: z.string().optional(),
});

const PriorGradingInputSchema = z.object({
  attemptNumber: z.number(),
  overallScore: z.number(),
  maxScore: z.number(),
  nextSteps: z.array(z.object({ issue: z.string() })),
});

const RubricCriterionInputSchema = z.object({
  category: z.string().min(1),
  points_possible: z.number().min(0),
  description: z.string().min(1),
});

export const GradeInputSchema = z.object({
  essayType: z.string().min(1),
  promptText: z.string().min(1),
  documents: z.array(GradeDocumentInputSchema).default([]),
  rubric: z.array(RubricCriterionInputSchema).min(1),
  essayText: z.string().min(1),
  priorGrading: PriorGradingInputSchema.optional(),
});
export type GradeInput = z.infer<typeof GradeInputSchema>;

function buildGradeUserMessage(input: GradeInput): string {
  const lines = [`Essay Type: ${input.essayType}`, `Prompt: ${input.promptText}`];
  if (input.documents.length > 0) {
    lines.push("\nSource Documents:");
    input.documents.forEach((d, i) =>
      lines.push(`Document ${i + 1} (${d.label}):${d.source_text ? ` ${d.source_text}` : ""}`)
    );
  }
  return (
    lines.join("\n") +
    "\n" +
    buildRubricEssayTail({ rubric: input.rubric, essayText: input.essayText, priorGrading: input.priorGrading })
  );
}

// Text-only grading — used by the KORA Lab, and by the production route when
// none of the assignment's source documents carry an uploaded image. The
// multimodal path (image bytes attached) stays in the route itself, since
// image-byte DB fetching would otherwise be the only DB dependency this
// generate function has; it reuses GRADE_SYSTEM_PROMPT and
// buildRubricEssayTail exported above to stay byte-for-byte identical.
export async function generateGrade(
  input: GradeInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult<EssayEvalOutput>> {
  const system = overrides?.systemPromptOverride ?? GRADE_SYSTEM_PROMPT;
  const model = overrides?.model ?? "claude-opus-4-8";
  const thinking = overrides?.thinking ?? true;
  const maxTokens = 8192;
  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    cacheSystemPrompt: true,
    ...(thinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildGradeUserMessage(input) }],
    schema: EssayEvalSchema,
  });
  return {
    system,
    output: data,
    configUsed: { model, thinking, maxTokens, label: overrides?.label, systemPromptOverride: overrides?.systemPromptOverride },
  };
}

const REVISION_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, coaching an AP World History: Modern student through " +
  "revising their essay based on feedback they already received. You are NOT rewriting or drafting any part " +
  "of their essay. Your job is to build their own writing ability, not do the writing for them. CRITICAL, " +
  "NON-NEGOTIABLE RULE: never write a sentence, phrase, thesis statement, piece of analysis, or any text the " +
  "student could copy directly into their essay. Every field you produce — restatement, guiding_question, " +
  "scaffold, hint — must describe a MOVE, a QUESTION, or a STRUCTURAL FRAME with blanks, never finished prose " +
  "about the actual historical content of their essay. A \"scaffold\" means a sentence template like " +
  "\"One reason ___ changed was ___, which is shown by ___\" — never a filled-in example using their actual " +
  "topic. A \"hint\" is a MORE concrete nudge than the guiding_question (e.g. naming which paragraph to look " +
  "at, or what kind of connector word to consider) but still requires the student to supply the historical " +
  "content and words themselves. If you are ever tempted to write actual historical content, stop and turn it " +
  "into a question instead. Match the encouraging, non-punitive tone of the grading feedback — this is a " +
  "coaching conversation, not a second round of criticism.";

const RevisionNextStepInputSchema = z.object({
  issue: z.string().min(1),
  why_it_matters: z.string().min(1),
  how_to_fix: z.string().min(1),
  skill: z.string().min(1),
});

export const RevisionCoachInputSchema = z.object({
  essayType: z.string().min(1),
  promptText: z.string().min(1),
  rubric: z.array(RubricCriterionInputSchema).min(1),
  essayText: z.string().min(1),
  nextSteps: z.array(RevisionNextStepInputSchema).min(1),
});
export type RevisionCoachInput = z.infer<typeof RevisionCoachInputSchema>;

function buildRevisionCoachUserMessage(input: RevisionCoachInput): string {
  const lines = [`Essay Type: ${input.essayType}`, `Prompt: ${input.promptText}`, "\nRubric:"];
  input.rubric.forEach((r) =>
    lines.push(`- ${r.category} (${r.points_possible} pt${r.points_possible === 1 ? "" : "s"}): ${r.description}`)
  );
  lines.push("\nGrowth areas from the grading (address in this order):");
  input.nextSteps.forEach((s, i) =>
    lines.push(
      `${i + 1}. Issue: ${s.issue}\n   Why it matters: ${s.why_it_matters}\n   How to fix: ${s.how_to_fix}\n   Skill: ${s.skill}`
    )
  );
  lines.push(`\nStudent's current essay:\n${input.essayText}`);
  lines.push(
    `\nRules:`,
    `1. Produce exactly one step per next_step given above, in the same order (most important first).`,
    `2. "based_on_issue" must exactly copy the issue text given above so the UI can link the step back to its grading note.`,
    `3. "restatement" reframes the issue warmly and simply — assume the student is anxious about it, not lecturing them.`,
    `4. "guiding_question" is a genuine Socratic question that gets the student thinking about THEIR essay's actual content without you supplying it (e.g. "Look at your second body paragraph — after your evidence about [topic from essay], what unstated assumption connects it to your thesis?").`,
    `5. "scaffold" is a reusable sentence-structure template with blanks the student fills in themselves — never a worked example with real content plugged in.`,
    `6. "hint" is only shown if the student asks for extra help — it should be more specific than the guiding_question (e.g. naming a technique or where to look) but must still stop short of supplying actual words or analysis.`,
    `7. NEVER include real historical facts, argument content, or finished sentences about the essay's topic in any field.`
  );
  return lines.join("\n");
}

export async function generateRevisionPlan(
  input: RevisionCoachInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult<RevisionPlanOutput>> {
  const system = overrides?.systemPromptOverride ?? REVISION_SYSTEM_PROMPT;
  const model = overrides?.model ?? "claude-opus-4-8";
  const thinking = overrides?.thinking ?? true;
  const maxTokens = 8192;
  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    cacheSystemPrompt: true,
    ...(thinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildRevisionCoachUserMessage(input) }],
    schema: RevisionPlanSchema,
  });
  return {
    system,
    output: data,
    configUsed: { model, thinking, maxTokens, label: overrides?.label, systemPromptOverride: overrides?.systemPromptOverride },
  };
}
