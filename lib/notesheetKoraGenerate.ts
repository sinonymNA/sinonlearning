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
    `Space budget per section type (approximate): warmup_box=small, fill_blank=small, numbered_response=medium, content_box=small, acronym_scaffold=medium, sequence_box=medium, exit_ticket=small, t_chart=medium, spectrum_bar=medium, mind_map_box=medium, two_column_box=large, three_column_box=large, drawing_box=large, structured_concept_box=large, graph_box=large, labeled_comparison_table=large, frayer_model=large, cause_effect_box=large, timeline_box=large.`,
    `For a ${targetPages}-page sheet, use at most ${targetPages <= 2 ? "1 large section (two_column_box, three_column_box, drawing_box, structured_concept_box, graph_box, labeled_comparison_table, frayer_model, cause_effect_box, or timeline_box)" : "2 large sections"}. Prefer small/medium types for the rest.`,
    `\nSlideshow Content:\n${rawText.slice(0, 9000)}`,
    `\nRules:`,
    `1. fill_blank: Write 2–4 short, numbered fill-in-the-blank sentences separated by a line break character (\\n). Each sentence is self-contained with 1–3 blanks drawn from slide facts. Example student_prompt: "1. For approximately ___% of human history, humans were ___-gatherers.\\n2. The Agricultural Revolution began around ___ BCE in the ___ Crescent.\\n3. Early cities like Ur grew to populations of about ___ people." NEVER write "use the slides", "fill in from the notes", or any meta-instruction. NEVER put all blanks into one run-on paragraph — each numbered sentence stands alone. Each blank replaces exactly one key term or number.`,
    `2. Section types: Use numbered_response ONLY when listing discrete, countable items (e.g. "Name 3 causes"). Use warmup_box for any task asking students to pick one thing and write about it, or any analytical/reflection/sentence-writing task.`,
    `3. num_lines: CRITICAL — num_lines MUST match the exact count stated in student_prompt. If student_prompt says "list four effects," set num_lines: 4. If it says "three examples," set num_lines: 3. Never write a number in student_prompt that differs from num_lines. For two_column_box and three_column_box, set num_lines to exactly how many data rows students need to fill in. If the task is open-ended prose, omit num_lines or use warmup_box.`,
    `4. Cover all key facts from the slides — do not skip major lesson points.`,
    `5. heading: Every section MUST have a heading field. Use a short, descriptive label (2-5 words) that names what students are doing in that section. Examples: "Warm Up", "Key Terms", "Main Causes", "Diagram", "Concept Check".`,
    `6. answer_key_notes: Be specific. Include the actual correct answers, not just "see slides". For fill_blank, list each answer in order. For numbered_response, list all expected items. For warmup_box, describe what a strong response would include.`,
    `7. warmup_box specificity: Warmup prompts must reference specific content from the lesson. Instead of "What do you think about this topic?", write "Pick one cause from today's lesson and explain in 2-3 sentences how it led to the main event."`,
    `8. structured_concept_box: Use for a single named concept with multiple sub-components (Law of Demand, Supply Curve, etc.). heading = the concept name exactly as the lesson states it. fields = 2-4 labeled row prompts students fill in, e.g., ["Definition:", "Key Relationship:", "Example:"]. student_prompt = brief instruction like "Complete the concept box below." Do NOT use this for comparing multiple concepts — use labeled_comparison_table for that.`,
    `9. graph_box: Use when students need to draw a graph (supply/demand curves, PPC, business cycle, etc.). student_prompt must be specific: state exactly what graph to draw, what to label, and any shifts to show (e.g., "Draw a demand curve. Label the axes P and Q. Show a rightward shift and label it D1 → D2."). answer_key_notes describes the correct graph. Only use when the lesson content actually involves a graph.`,
    `10. acronym_scaffold: Use ONLY when the lesson explicitly teaches a mnemonic acronym (like ROTTEN, MERIT, PEMDAS). acronym = the full acronym word in uppercase (e.g., "ROTTEN"). Each letter renders with a blank fill-in line. student_prompt = "Fill in what each letter of [ACRONYM] stands for:" answer_key_notes must list every letter and its meaning (e.g., "R=Resources, O=Other goods price, T=Technology...").`,
    `11. labeled_comparison_table: Use when comparing 2-4 entities (business structures, market types, historical figures, etc.) across multiple attributes. col_labels = the entities being compared (2-4 items, e.g., ["Sole Proprietorship", "Partnership", "Corporation"]). row_labels = the attributes (2-6 items, e.g., ["Definition", "Examples", "Pros", "Cons"]). num_lines must equal the length of row_labels. student_prompt describes what to compare. Do NOT use two_column_box or three_column_box when you need row labels — use this type instead.`,
    `12. frayer_model: Use for vocabulary words requiring deep conceptual understanding. content (or heading) = the exact vocabulary term (e.g., "Elasticity"). Renders four quadrants: Definition, Characteristics, Examples, Non-Examples. Use at most once or twice per notesheet — one term per frayer_model.`,
    `13. t_chart: Use for exactly two-sided comparisons — pros/cons, advantages/disadvantages, before/after, arguments for/against. col_labels = exactly 2 labels (e.g., ["Advantages", "Disadvantages"]). num_lines = rows per column (3-6). Do NOT use when row labels are needed — use labeled_comparison_table instead.`,
    `14. sequence_box: Use for ordered steps in a process (scientific method, how a law is passed, stages of production, business formation steps). num_lines = number of steps (3-6). Each step renders as a box with a downward arrow. student_prompt = what process to sequence.`,
    `15. cause_effect_box: Use for causal relationships with ONE known side and MULTIPLE unknown slots. direction = "one_to_many" (student fills in multiple effects from a single given cause) OR "many_to_one" (student fills in multiple causes leading to one given effect). content = the label for the known "one" side (e.g., "Increase in oil prices" or "The Great Depression"). num_lines = number of blank slots on the "many" side (2-4).`,
    `16. timeline_box: Use for chronological sequences of historical events, economic phases, or time-ordered processes. num_lines = number of events to mark (3-6). Students fill in dates AND event names at each tick mark on a horizontal timeline. student_prompt = what events to place on the timeline.`,
    `17. exit_ticket: Use ONLY as the FINAL section on the notesheet for end-of-class formative assessment. student_prompt = 2-3 complete questions separated by newline (\\n). CRITICAL: Do NOT number the questions in student_prompt — write them as plain sentences only (e.g., "Why is scarcity considered permanent?\\nWhat is the difference between a trade-off and an opportunity cost?"). The renderer automatically adds numbers. num_lines = number of questions. Never place exit_ticket anywhere but last.`,
    `18. spectrum_bar: Use when concepts fall on a continuum. col_labels = exactly 2 items — the left and right extremes (e.g., ["Pure Free Market", "Pure Command Economy"] or ["Most Competitive", "Least Competitive"]). num_lines = number of blank slots where students place concepts (3-5). student_prompt = what to place on the spectrum.`,
    `19. mind_map_box: Use for brainstorming all factors, examples, or connections radiating from one central concept. content = the central concept label (what goes in the center — e.g., "Factors That Shift Demand"). num_lines = number of branches (4-8, default 6). student_prompt = what to identify (e.g., "Identify 6 factors that can shift the demand curve and write one in each branch.").`,
    `20. content_box: Use ONLY for pre-filled reference text that students READ (not fill in). The renderer shows section.content as a paragraph — no blanks, no table. NEVER use content_box for a comparison, activity, or anything students need to complete. For comparisons with two sides, use t_chart. For comparisons with row attributes, use labeled_comparison_table.`,
    `21. t_chart and labeled_comparison_table for comparison slides: When the slideshow contains a table comparing two concepts (e.g., Scarcity vs. Shortage, Command vs. Market Economy), ALWAYS translate that into a t_chart or labeled_comparison_table — never a content_box. For two-column comparisons without row labels (just student fills in two columns), use t_chart with col_labels = [the two concepts]. For comparisons with named attributes down the left side, use labeled_comparison_table with row_labels = those attributes.`,
    `\nStart with a warmup_box. End with an exit_ticket if appropriate. Mix types to match the content.`,
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
