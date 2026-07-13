import { z } from "zod";
import { NotesheetPlanSchema } from "./notesheetTypes";
import { callKoraStructured } from "./koraServer";
import { buildReferenceExamplesBlock } from "./koraLabReference";
import type { KoraLabGenerateOverrides, KoraLabGenerateResult } from "./koraLab/registry";

const NOTESHEET_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. " +
  "Return a single JSON object matching the schema exactly. No prose, no markdown outside the JSON. " +
  "Every student_prompt must be self-contained classroom content — never reference slides, notes, or materials. " +
  "For fill_blank sections, write real sentences with real blanks (___) using facts extracted from the slide content.";

function sectionCountRange(targetPages: number): string {
  if (targetPages <= 1) return "3-4";
  if (targetPages === 2) return "5-6";
  if (targetPages === 3) return "7-9";
  return "10-12";
}

export const NotesheetGenerateInputSchema = z.object({
  rawText: z.string().min(1),
  concept: z.string().default(""),
  subject: z.string().default(""),
  gradeBand: z.string().default(""),
  targetPages: z.number().default(2),
});
export type NotesheetGenerateInput = z.infer<typeof NotesheetGenerateInputSchema>;

function buildNotesheetUserMessage(params: NotesheetGenerateInput & { targetPages: number }): string {
  const { rawText, concept, subject, gradeBand, targetPages } = params;
  const countRange = sectionCountRange(targetPages);
  const effectiveConcept = concept.trim() || "infer the main concept from the slide content";
  const effectiveSubject = subject.trim() || "infer from slide content";
  const effectiveGrade = gradeBand.trim() || "infer from slide content";
  return [
    `Concept: ${effectiveConcept} | Subject: ${effectiveSubject} | Grade: ${effectiveGrade}`,
    `Target: ${targetPages} printed page${targetPages === 1 ? "" : "s"}.`,
    `Design EXACTLY ${countRange} sections. Every section must fit compactly — keep student_prompt to 1-3 sentences.`,
    `Space budget per section type (approximate): warmup_box=small, fill_blank=small, numbered_response=medium, two_column_box=large, three_column_box=large, drawing_box=large, content_box=small.`,
    `For a ${targetPages}-page sheet, use at most ${targetPages <= 2 ? "1 large section (two_column_box, three_column_box, or drawing_box)" : "2 large sections"}. Prefer warmup_box, fill_blank, and numbered_response for the rest.`,
    `\nSlideshow Content:\n${rawText.slice(0, 9000)}`,
    `\nRules:`,
    `1. fill_blank: Write 2–4 short, numbered fill-in-the-blank sentences separated by a line break character (\\n). Each sentence is self-contained with 1–3 blanks drawn from slide facts. Example student_prompt: "1. For approximately ___% of human history, humans were ___-gatherers.\\n2. The Agricultural Revolution began around ___ BCE in the ___ Crescent.\\n3. Early cities like Ur grew to populations of about ___ people." NEVER write "use the slides", "fill in from the notes", or any meta-instruction. NEVER put all blanks into one run-on paragraph — each numbered sentence stands alone. Each blank replaces exactly one key term or number.`,
    `2. Section types: Use numbered_response ONLY when listing discrete, countable items (e.g. "Name 3 causes"). Use warmup_box for any task asking students to pick one thing and write about it, or any analytical/reflection/sentence-writing task.`,
    `3. num_lines: Set num_lines to match the exact count of items requested (ask for 3 causes → num_lines: 3). If the task is open-ended prose, omit num_lines or use warmup_box. For two_column_box and three_column_box, set num_lines to exactly how many data rows students need to fill in — if the prompt says "record THREE" then num_lines: 3, giving 3 rows.`,
    `4. Cover all key facts from the slides — do not skip major lesson points.`,
    `5. heading: Every section MUST have a heading field. Use a short, descriptive label (2-5 words) that names what students are doing in that section. Examples: "Warm Up", "Key Terms", "Main Causes", "Diagram", "Concept Check".`,
    `6. answer_key_notes: Be specific. Include the actual correct answers, not just "see slides". For fill_blank, list each answer in order. For numbered_response, list all expected items. For warmup_box, describe what a strong response would include.`,
    `7. warmup_box specificity: Warmup prompts must reference specific content from the lesson. Instead of "What do you think about this topic?", write "Pick one cause from today's lesson and explain in 2-3 sentences how it led to the main event."`,
    `\nStart with a warmup_box. Mix types to match the content.`,
  ].join("\n");
}

export async function generateNotesheetPlan(
  input: NotesheetGenerateInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult> {
  const referenceBlock = await buildReferenceExamplesBlock("notesheet_generate");
  const system = (overrides?.systemPromptOverride ?? NOTESHEET_SYSTEM_PROMPT) + referenceBlock;
  const model = overrides?.model ?? "claude-sonnet-4-6";
  const maxTokens = 3000;
  const clampedPages = Math.max(1, Math.min(4, Math.round(input.targetPages)));
  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    messages: [{ role: "user", content: buildNotesheetUserMessage({ ...input, targetPages: clampedPages }) }],
    schema: NotesheetPlanSchema,
  });
  return {
    system,
    output: data,
    configUsed: { model, thinking: false, maxTokens, label: overrides?.label, systemPromptOverride: overrides?.systemPromptOverride },
  };
}
