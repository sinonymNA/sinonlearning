import { z } from "zod";
import {
  NotesheetPlanSchema,
  WorksheetDesignBriefSchema,
  type WorksheetDesignBrief,
} from "./notesheetTypes";
import { callKoraStructured } from "./koraServer";
import { buildReferenceExamplesBlock } from "./koraLabReference";
import type { KoraLabGenerateOverrides, KoraLabGenerateResult } from "./koraLab/registry";

const DEFAULT_MODEL = "claude-sonnet-4-6";

const NOTESHEET_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. " +
  "Return a single JSON object matching the schema exactly. No prose, no markdown outside the JSON. " +
  "Every student_prompt must be self-contained classroom content — never reference slides, notes, or materials. " +
  "For fill_blank sections, write real sentences with real blanks (___) using facts extracted from the source content.";

const DESIGN_BRIEF_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, acting as an instructional designer. " +
  "A teacher has described a worksheet they want. Your job is NOT to write the worksheet yet — it is to " +
  "decide what kind of worksheet this should be and justify the structure before anything is built. " +
  "Think about what the teacher is actually trying to get students to DO, then choose the section types " +
  "that make students do exactly that. A worksheet is not always guided notes: it may be a practice set, " +
  "a lab, a station rotation, a card sort, a data analysis, a debate prep sheet, a reading guide, a " +
  "problem set, or a hands-on activity. Match the form to the intent. " +
  "Return a single JSON object matching the schema exactly. No prose outside the JSON.";

function sectionCountRange(targetPages: number): string {
  if (targetPages <= 1) return "3-4";
  if (targetPages === 2) return "5-6";
  if (targetPages === 3) return "7-9";
  return "10-12";
}

/** Rough page-area budget so the reasoning pass doesn't plan a 3-page sheet onto 1 page. */
const SPACE_BUDGET_LINE =
  `Space budget per section type (approximate): warmup_box=small, fill_blank=small, numbered_response=medium, ` +
  `content_box=small, acronym_scaffold=medium, sequence_box=medium, exit_ticket=small, t_chart=medium, ` +
  `spectrum_bar=medium, mind_map_box=medium, two_column_box=large, three_column_box=large, drawing_box=large, ` +
  `structured_concept_box=large, graph_box=large, labeled_comparison_table=large, frayer_model=large, ` +
  `cause_effect_box=large, timeline_box=large.`;

function largeSectionLine(targetPages: number): string {
  return (
    `For a ${targetPages}-page sheet, use at most ${
      targetPages <= 2
        ? "1 large section (two_column_box, three_column_box, drawing_box, structured_concept_box, graph_box, labeled_comparison_table, frayer_model, cause_effect_box, or timeline_box)"
        : "2 large sections"
    }. Prefer small/medium types for the rest.`
  );
}

/**
 * The section-type contract. Shared verbatim by both generation paths (slideshow
 * upload and teacher description) so a rule fix lands in both at once — the two
 * paths differ only in where their content comes from, not in what the renderer
 * can draw.
 *
 * `sourceNoun` names where facts come from ("the slide content" vs "the teacher's
 * description") so the examples read correctly in each context.
 */
function sectionTypeRules(sourceNoun: string): string[] {
  return [
    `1. fill_blank: Write 2–4 short, numbered fill-in-the-blank sentences separated by a line break character (\\n). Each sentence is self-contained with 1–3 blanks drawn from ${sourceNoun}. Example student_prompt: "1. For approximately ___% of human history, humans were ___-gatherers.\\n2. The Agricultural Revolution began around ___ BCE in the ___ Crescent.\\n3. Early cities like Ur grew to populations of about ___ people." NEVER write "use the slides", "fill in from the notes", or any meta-instruction. NEVER put all blanks into one run-on paragraph — each numbered sentence stands alone. Each blank replaces exactly one key term or number.`,
    `2. Section types: Use numbered_response ONLY when listing discrete, countable items (e.g. "Name 3 causes"). Use warmup_box for any task asking students to pick one thing and write about it, or any analytical/reflection/sentence-writing task.`,
    `3. num_lines: CRITICAL — num_lines MUST match the exact count stated in student_prompt. If student_prompt says "list four effects," set num_lines: 4. If it says "three examples," set num_lines: 3. Never write a number in student_prompt that differs from num_lines. For two_column_box and three_column_box, set num_lines to exactly how many data rows students need to fill in. If the task is open-ended prose, omit num_lines or use warmup_box.`,
    `4. heading: Every section MUST have a heading field. Use a short, descriptive label (2-5 words) that names what students are doing in that section. Examples: "Warm Up", "Key Terms", "Main Causes", "Diagram", "Concept Check".`,
    `5. answer_key_notes: Be specific. Include the actual correct answers, not just "see slides". For fill_blank, list each answer in order. For numbered_response, list all expected items. For warmup_box, describe what a strong response would include.`,
    `6. warmup_box specificity: Warmup prompts must reference specific content from the lesson. Instead of "What do you think about this topic?", write "Pick one cause from today's lesson and explain in 2-3 sentences how it led to the main event."`,
    `7. structured_concept_box: Use for a single named concept with multiple sub-components (Law of Demand, Supply Curve, etc.). heading = the concept name exactly as the lesson states it. fields = 2-4 labeled row prompts students fill in, e.g., ["Definition:", "Key Relationship:", "Example:"]. student_prompt = brief instruction like "Complete the concept box below." Do NOT use this for comparing multiple concepts — use labeled_comparison_table for that.`,
    `8. graph_box: Use when students need to draw a graph (supply/demand curves, PPC, business cycle, etc.). student_prompt must be specific: state exactly what graph to draw, what to label, and any shifts to show (e.g., "Draw a demand curve. Label the axes P and Q. Show a rightward shift and label it D1 → D2."). answer_key_notes describes the correct graph. Only use when the content actually involves a graph.`,
    `9. acronym_scaffold: Use ONLY when the lesson explicitly teaches a mnemonic acronym (like ROTTEN, MERIT, PEMDAS). acronym = the full acronym word in uppercase (e.g., "ROTTEN"). Each letter renders with a blank fill-in line. student_prompt = "Fill in what each letter of [ACRONYM] stands for:" answer_key_notes must list every letter and its meaning (e.g., "R=Resources, O=Other goods price, T=Technology...").`,
    `10. labeled_comparison_table: Use when comparing 2-4 entities (business structures, market types, historical figures, etc.) across multiple attributes. col_labels = the entities being compared (2-4 items, e.g., ["Sole Proprietorship", "Partnership", "Corporation"]). row_labels = the attributes (2-6 items, e.g., ["Definition", "Examples", "Pros", "Cons"]). num_lines must equal the length of row_labels. student_prompt describes what to compare. Do NOT use two_column_box or three_column_box when you need row labels — use this type instead.`,
    `11. frayer_model: Use for vocabulary words requiring deep conceptual understanding. content (or heading) = the exact vocabulary term (e.g., "Elasticity"). Renders four quadrants: Definition, Characteristics, Examples, Non-Examples. Use at most once or twice per worksheet — one term per frayer_model.`,
    `12. t_chart: Use for exactly two-sided comparisons — pros/cons, advantages/disadvantages, before/after, arguments for/against. col_labels = exactly 2 labels (e.g., ["Advantages", "Disadvantages"]). num_lines = rows per column (3-6). Do NOT use when row labels are needed — use labeled_comparison_table instead.`,
    `13. sequence_box: Use for ordered steps in a process (scientific method, how a law is passed, stages of production, business formation steps). num_lines = number of steps (3-6). Each step renders as a box with a downward arrow. student_prompt = what process to sequence.`,
    `14. cause_effect_box: Use for causal relationships with ONE known side and MULTIPLE unknown slots. direction = "one_to_many" (student fills in multiple effects from a single given cause) OR "many_to_one" (student fills in multiple causes leading to one given effect). content = the label for the known "one" side (e.g., "Increase in oil prices" or "The Great Depression"). num_lines = number of blank slots on the "many" side (2-4).`,
    `15. timeline_box: Use for chronological sequences of historical events, economic phases, or time-ordered processes. num_lines = number of events to mark (3-6). Students fill in dates AND event names at each tick mark on a horizontal timeline. student_prompt = what events to place on the timeline.`,
    `16. exit_ticket: End-of-class formative assessment. If used, it MUST be the FINAL section. student_prompt = 2-3 complete questions separated by newline (\\n). CRITICAL: Do NOT number the questions in student_prompt — write them as plain sentences only (e.g., "Why is scarcity considered permanent?\\nWhat is the difference between a trade-off and an opportunity cost?"). The renderer automatically adds numbers. num_lines = number of questions.`,
    `17. spectrum_bar: Use when concepts fall on a continuum. col_labels = exactly 2 items — the left and right extremes (e.g., ["Pure Free Market", "Pure Command Economy"] or ["Most Competitive", "Least Competitive"]). num_lines = number of blank slots where students place concepts (3-5). student_prompt = what to place on the spectrum.`,
    `18. mind_map_box: Use for brainstorming all factors, examples, or connections radiating from one central concept. content = the central concept label (what goes in the center — e.g., "Factors That Shift Demand"). num_lines = number of branches (4-8, default 6). student_prompt = what to identify (e.g., "Identify 6 factors that can shift the demand curve and write one in each branch.").`,
    `19. content_box: Use ONLY for pre-filled reference text that students READ (not fill in). The renderer shows section.content as a paragraph — no blanks, no table. NEVER use content_box for a comparison, activity, or anything students need to complete. For comparisons with two sides, use t_chart. For comparisons with row attributes, use labeled_comparison_table.`,
    `20. Comparison content: When the source contains a table comparing two concepts (e.g., Scarcity vs. Shortage, Command vs. Market Economy), ALWAYS translate it into a t_chart or labeled_comparison_table — never a content_box. For two-column comparisons without row labels, use t_chart with col_labels = [the two concepts]. For comparisons with named attributes down the left side, use labeled_comparison_table with row_labels = those attributes.`,
  ];
}

// ── Path A: generate from an uploaded slideshow ───────────────────────────────

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
    SPACE_BUDGET_LINE,
    largeSectionLine(targetPages),
    `\nSlideshow Content:\n${rawText.slice(0, 9000)}`,
    `\nFIDELITY — the most important rule:`,
    `A. This notesheet accompanies THIS slideshow. Every section must correspond to content that actually appears in the slides above. Do NOT invent topics, examples, activities, or assessments the slides do not contain.`,
    `B. Work through the slides in order. The notesheet's section order should track the lesson's order so students can follow along live.`,
    `C. Only include an exit_ticket if the slides actually end with a closing/reflection/assessment slide. If the deck has no closing assessment, do NOT add one — end with whatever the last real content section is. An invented exit ticket is a fidelity failure.`,
    `D. If the slides contain a named in-class activity (a simulation, budget exercise, card sort, lab), build a section that supports THAT activity rather than replacing it with generic questions.`,
    `E. Cover all key facts from the slides — do not skip major lesson points.`,
    `\nSection type rules:`,
    ...sectionTypeRules("slide facts"),
    `\nStart with a warmup_box drawn from the opening slide's hook. Mix types to match the content.`,
  ].join("\n");
}

export async function generateNotesheetPlan(
  input: NotesheetGenerateInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult> {
  const referenceBlock = await buildReferenceExamplesBlock("notesheet_generate");
  const system = (overrides?.systemPromptOverride ?? NOTESHEET_SYSTEM_PROMPT) + referenceBlock;
  const model = overrides?.model ?? DEFAULT_MODEL;
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

// ── Path B: generate from a teacher's written description ─────────────────────
// Two passes. Pass 1 reasons about what kind of worksheet the description calls
// for and commits to a section plan with justifications; pass 2 builds the
// actual sections from that plan. The brief is returned alongside the plan so
// the teacher can see (and argue with) the design decisions.

export const WorksheetDescribeInputSchema = z.object({
  description: z.string().min(1),
  subject: z.string().default(""),
  gradeBand: z.string().default(""),
  targetPages: z.number().default(2),
});
export type WorksheetDescribeInput = z.infer<typeof WorksheetDescribeInputSchema>;

function buildDesignBriefUserMessage(input: WorksheetDescribeInput & { targetPages: number }): string {
  const { description, subject, gradeBand, targetPages } = input;
  const countRange = sectionCountRange(targetPages);
  return [
    `A teacher wants a worksheet. Here is their description, verbatim:`,
    `"""`,
    description.slice(0, 6000),
    `"""`,
    ``,
    `Subject: ${subject.trim() || "infer from the description"}`,
    `Grade band: ${gradeBand.trim() || "infer from the description"}`,
    `Target length: ${targetPages} printed page${targetPages === 1 ? "" : "s"} (${countRange} sections).`,
    ``,
    `Decide the design before anything is written. Specifically:`,
    `1. What KIND of worksheet is this? Read the teacher's intent carefully. "Have students compare three economic systems" is a comparison table, not guided notes. "Students rotate through four stations" is a station sheet. "Practice solving for x" is a problem set. "Prepare for a debate" is an argument-planning sheet. Do not default to guided notes.`,
    `2. What will students be able to DO when they finish? State it as a concrete, observable outcome.`,
    `3. What does a student physically do, start to finish? Describe the actual work: reading, sorting, computing, drawing, arguing, filling.`,
    `4. Plan ${countRange} sections in the order they appear on the page. For EACH one, name the section type and justify it in a single sentence — why THAT type makes students do the thing you named in step 2.`,
    ``,
    `Rules for the plan:`,
    `- The teacher's description is the authority. If they name a specific activity, scenario, dataset, or set of terms, your plan must use it — do not substitute your own.`,
    `- If the description is thin, you may reasonably expand it with grade-appropriate content, but stay inside the topic they named.`,
    `- Only include an exit_ticket if the description asks for a closing assessment or reflection. Do not add one reflexively.`,
    `- Vary the section types. A worksheet of five near-identical boxes is a design failure.`,
    SPACE_BUDGET_LINE,
    largeSectionLine(targetPages),
    ``,
    `Available section types: warmup_box, fill_blank, numbered_response, content_box, two_column_box, drawing_box, three_column_box, structured_concept_box, graph_box, acronym_scaffold, labeled_comparison_table, frayer_model, t_chart, sequence_box, cause_effect_box, timeline_box, exit_ticket, spectrum_bar, mind_map_box.`,
    `Brief guide to each: warmup_box=open response lines · fill_blank=sentences with ___ blanks · numbered_response=numbered blank lines · content_box=pre-filled read-only text · two_column_box/three_column_box=blank table with column headers · drawing_box=empty drawing area · structured_concept_box=one concept with labeled sub-rows · graph_box=grid to draw a graph · acronym_scaffold=one line per acronym letter · labeled_comparison_table=grid with both row and column labels · frayer_model=4-quadrant vocabulary box · t_chart=two-column comparison · sequence_box=numbered step boxes with arrows · cause_effect_box=one known side, several blank slots · timeline_box=horizontal timeline with tick marks · exit_ticket=closing questions · spectrum_bar=continuum with blank slots · mind_map_box=central term with branches.`,
  ].join("\n");
}

function buildFromBriefUserMessage(
  input: WorksheetDescribeInput & { targetPages: number },
  brief: WorksheetDesignBrief
): string {
  const { description, targetPages } = input;
  const planLines = brief.section_plan
    .map((s, i) => `${i + 1}. ${s.type} — "${s.heading}" — ${s.rationale}`)
    .join("\n");
  return [
    `Build the worksheet described below. The design has already been decided — your job is to write the actual content into it.`,
    ``,
    `TEACHER'S ORIGINAL DESCRIPTION:`,
    `"""`,
    description.slice(0, 6000),
    `"""`,
    ``,
    `APPROVED DESIGN BRIEF:`,
    `Worksheet type: ${brief.worksheet_type}`,
    `Subject: ${brief.subject} | Grade: ${brief.grade_band}`,
    `Learning goal: ${brief.learning_goal}`,
    `Essential question: ${brief.essential_question}`,
    `Design rationale: ${brief.design_rationale}`,
    `Student experience: ${brief.student_experience}`,
    ``,
    `SECTION PLAN — build exactly these ${brief.section_plan.length} sections, in this order:`,
    planLines,
    ``,
    `Follow the section plan's types and headings. Write real, specific student content into each — the teacher should be able to print this and hand it out without editing.`,
    `Use the teacher's own scenarios, terms, numbers, and examples wherever the description supplies them.`,
    `Target: ${targetPages} printed page${targetPages === 1 ? "" : "s"}. Keep every student_prompt to 1-3 sentences.`,
    `Set plan-level fields from the brief: subject, grade_band, learning_objective (from learning goal), essential_question, and a title that names the worksheet.`,
    ``,
    `Section type rules:`,
    ...sectionTypeRules("the teacher's description"),
  ].join("\n");
}

export async function generateWorksheetFromDescription(
  input: WorksheetDescribeInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult> {
  const referenceBlock = await buildReferenceExamplesBlock("worksheet_describe");
  const buildSystem = (overrides?.systemPromptOverride ?? NOTESHEET_SYSTEM_PROMPT) + referenceBlock;
  const model = overrides?.model ?? DEFAULT_MODEL;
  const clampedPages = Math.max(1, Math.min(4, Math.round(input.targetPages)));
  const scoped = { ...input, targetPages: clampedPages };

  // Pass 1 — reason about form before content. Thinking on by default: this is
  // the judgment call ("is this guided notes or a station rotation?"), and it's
  // a small, cheap call relative to the build.
  const useThinking = overrides?.thinking ?? true;
  const { data: brief } = await callKoraStructured({
    model,
    maxTokens: 2048,
    system: DESIGN_BRIEF_SYSTEM_PROMPT,
    ...(useThinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildDesignBriefUserMessage(scoped) }],
    schema: WorksheetDesignBriefSchema,
  });

  // Pass 2 — write the worksheet against the approved plan.
  const maxTokens = 4096;
  const { data: plan } = await callKoraStructured({
    model,
    maxTokens,
    system: buildSystem,
    messages: [{ role: "user", content: buildFromBriefUserMessage(scoped, brief) }],
    schema: NotesheetPlanSchema,
  });

  return {
    system: buildSystem,
    output: { ...plan, designBrief: brief },
    configUsed: {
      model,
      thinking: useThinking,
      maxTokens,
      label: overrides?.label,
      systemPromptOverride: overrides?.systemPromptOverride,
    },
  };
}
