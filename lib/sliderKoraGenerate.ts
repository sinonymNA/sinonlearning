import { z } from "zod";
import { SLIDE_LAYOUTS } from "./sliderTypes";
import { SLIDER_THEMES } from "./sliderThemes";
import { SliderKoraBuildSchema, type SliderKoraBuildOutput } from "./sliderAiTypes";
import { callKoraStructured } from "./koraServer";
import { buildReferenceExamplesBlock } from "./koraLabReference";
import type { KoraLabGenerateOverrides, KoraLabGenerateResult } from "./koraLab/registry";

const SLIDER_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, helping a teacher build a classroom-ready slideshow in " +
  "the Slider app from a short conversation about their lesson. You are building a TEACHING TOOL to run a " +
  "live class with, not a reading document — a wall of paragraph text is a failure state, even if the " +
  "content is accurate, because nobody can teach from a slide that dense. Return a single JSON object " +
  "matching the schema exactly. No prose, no markdown outside the JSON. " +
  "CRITICAL RULES: " +
  "(1) Never invent a specific citation, statistic, or quote attribution presented as verifiably real " +
  "unless it is common, well-established knowledge for the subject — when unsure, write generally rather " +
  "than fabricate specifics. " +
  "(2) NEVER include an image field or claim an image is attached — Slider always adds images separately " +
  "after generation; every slide you write must stand on its own with text only, even for layouts that " +
  "have an image region. " +
  "(3) Keep every slide SHORT: bullets are short phrases (well under 15 words each, never full sentences " +
  "stacked into a list), body text is at most 2-3 short sentences, and twoColumn text is brief and " +
  "parallel between the two sides. Prefer titleBullets or twoColumn over titleBody for teaching content — " +
  "reserve titleBody for a short framing sentence or two, never a dense paragraph. " +
  "(4) Build a real classroom arc, not a lecture dump: a title slide, then an OPENER right after it — a " +
  "provocative question, a surprising fact, or a striking comparison that hooks students before you teach " +
  "anything — then a few slides that concisely teach the key points, then at least one ACTIVITY OR " +
  "DISCUSSION slide that asks students to actually do something (Turn and Talk, a quick check-for-" +
  "understanding question, a short group task, a prediction) rather than just receive information, and " +
  "finally a closing slide (a memorable reflection question or a short summary — a \"quote\" layout works " +
  "well here). Every deck must include a genuine opener and a genuine activity, regardless of length.";

export const SliderBuildInputSchema = z.object({
  topic: z.string().min(1),
  audience: z.string().default(""),
  keyPoints: z.string().min(1),
  length: z.string().default("Medium (~8 slides)"),
  notes: z.string().default(""),
});
export type SliderBuildInput = z.infer<typeof SliderBuildInputSchema>;

function buildSliderUserMessage(input: SliderBuildInput): string {
  const lines = [`Topic: ${input.topic}`];
  if (input.audience) lines.push(`Audience: ${input.audience}`);
  lines.push(`Key points to cover: ${input.keyPoints}`);
  lines.push(`Desired length: ${input.length}`);
  if (input.notes) lines.push(`Additional notes from the teacher: ${input.notes}`);

  lines.push(
    `\nAvailable slide layouts (use a mix, choose what fits each idea):`,
    SLIDE_LAYOUTS.map((l) => `- "${l.value}": ${l.description}`).join("\n"),
    `\nAvailable themes (pick the one that best fits the subject/tone):`,
    SLIDER_THEMES.map((t) => `- "${t.id}": ${t.name}`).join("\n"),
    `\nRules:`,
    `1. deck_title is a short, specific title for this deck (not just repeating the topic verbatim).`,
    `2. theme_id must be exactly one of the ids listed above.`,
    `3. First slide must use layout "title". Only set the fields that layout actually uses (see the layout descriptions) — omit fields a layout doesn't use.`,
    `4. Required arc, regardless of length: slide 1 is "title"; slide 2 is a genuine OPENER (a provocative question, surprising fact, or striking comparison — not content teaching yet); then concise content slides; then at least one ACTIVITY OR DISCUSSION slide that asks students to do something (Turn and Talk, quick check-for-understanding, short task, prediction); then a closing slide (reflection question or brief summary, "quote" layout works well). Never cut the opener or activity to save length — trim the middle content slides instead.`,
    `5. Match the requested length by adjusting how many CONTENT slides sit between the opener and the activity: Short ~4-5 slides total (title, opener, 1-2 content, activity/close), Medium ~7-9 slides (title, opener, 3-5 content, activity, close), Long ~11-13 slides (title, opener, several content slides possibly with a second activity, close).`,
    `6. Keep slides short: bullets under 15 words each, body at most 2-3 short sentences, twoColumn brief and parallel. Prefer titleBullets or twoColumn over titleBody.`,
    `7. Never include an "image" field — images are added separately by the teacher after generation.`,
    `8. notes (optional, any layout): 1-2 sentences of speaker notes/talking points for the teacher presenting that slide. For the activity slide, make notes a concrete facilitation instruction (e.g. how long to give students, what to listen for).`,
    `9. columns (twoColumn layout only) must contain exactly two strings.`
  );
  return lines.join("\n");
}

export async function generateSliderDeck(
  input: SliderBuildInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult<SliderKoraBuildOutput>> {
  const referenceBlock = await buildReferenceExamplesBlock("slider_build");
  const system = (overrides?.systemPromptOverride ?? SLIDER_SYSTEM_PROMPT) + referenceBlock;
  const model = overrides?.model ?? "claude-opus-4-8";
  const thinking = overrides?.thinking ?? true;
  const maxTokens = 8192;
  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    cacheSystemPrompt: true,
    ...(thinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildSliderUserMessage(input) }],
    schema: SliderKoraBuildSchema,
  });
  return {
    system,
    output: data,
    configUsed: { model, thinking, maxTokens, label: overrides?.label, systemPromptOverride: overrides?.systemPromptOverride },
  };
}
