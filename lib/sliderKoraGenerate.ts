import { randomUUID } from "crypto";
import { z } from "zod";
import { SLIDE_LAYOUTS, type Slide } from "./sliderTypes";
import { SLIDER_THEMES } from "./sliderThemes";
import {
  SliderKoraBuildSchema,
  type SliderKoraBuildOutput,
  SliderDesignBriefSchema,
  type SliderDesignBrief,
  SliderRedTeamSchema,
  type SliderRedTeamOutput,
} from "./sliderAiTypes";
import { callKoraStructured } from "./koraServer";
import { buildReferenceExamplesBlock } from "./koraLabReference";
import type { KoraLabGenerateOverrides, KoraLabGenerateResult } from "./koraLab/registry";

// Slider's KORA build is a three-phase pipeline, not one call: (1) a Design
// Brief that makes the pedagogical decisions BEFORE any slide exists — what
// must be covered, the one activity moment, the one personal connection, one
// vivid concrete detail, the closing question, and the structural approach —
// (2) Build, which renders those binding decisions into the slide schema, and
// (3) a Red Team pass that writes the 3 most likely assessment questions on
// the topic, checks the built deck against them, and flags exactly which
// slides (by index) fall short so a conditional revise pass can fix only
// those. A one-pass "just build the slides" process can't see its own gaps
// until after the deck is finished; this catches them before the teacher
// does.
const DEFAULT_MODEL = "claude-sonnet-5";
const REPAIR_MODEL = "claude-haiku-4-5";

export const SliderBuildInputSchema = z.object({
  topic: z.string().min(1),
  audience: z.string().default(""),
  keyPoints: z.string().min(1),
  length: z.string().default("Medium (~8 slides)"),
  notes: z.string().default(""),
});
export type SliderBuildInput = z.infer<typeof SliderBuildInputSchema>;
type KoraSlides = SliderKoraBuildOutput["slides"];

function isShortDeck(length: string): boolean {
  return length.trim().toLowerCase().startsWith("short");
}

// ── Phase 1: Design Brief ──

const DESIGN_BRIEF_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. Before any slide is built, you make the design " +
  "decisions that should drive a classroom slideshow's structure — decide these first, from your " +
  "own subject-matter knowledge (you have no search tool; write from what you reliably know, and " +
  "keep the content audit general rather than fabricating specifics you're unsure of). Return a " +
  "single JSON object matching the schema exactly — no prose outside the JSON. " +
  "Fields: " +
  "(1) contentAudit — 1-3 sentences: what this topic must cover to be taught accurately at the " +
  "stated audience's level, and any adjacent content that is out of scope for this specific deck. " +
  "(2) activityMoment — a single concrete activity or discussion moment (Turn and Talk, a specific " +
  "prediction, a short group task, a check-for-understanding question) tied to one specific point " +
  "from the key points — describe the actual task, not just its category. " +
  "(3) personalConnection — the single most genuine connection between this content and the stated " +
  "audience's real, everyday experience. It must be something a listener would recognize as true " +
  "about themselves, not a stretched analogy — if no real connection exists for this audience, say " +
  "so plainly instead of forcing one. " +
  "(4) vividDetail — one concrete, specific detail (a number, a name, a place, a moment) that makes " +
  "the topic feel real rather than abstract — specific enough that it needs no further explanation " +
  "to land. " +
  "(5) closingQuestion — the reflection question the deck should end on: harder and more specific " +
  "than an opening hook, with no clean answer, that leaves the audience genuinely thinking. " +
  "(6) structuralApproach — 1-2 sentences on how the deck's middle should be organized given the " +
  "activity moment and key points (e.g. build toward the activity, contrast two ideas, walk a " +
  "sequence) — Slider's slide layouts are fixed regardless, so this is about ordering and emphasis, " +
  "not visual design.";

function buildDesignBriefUserMessage(input: SliderBuildInput): string {
  const lines = [`Topic: ${input.topic}`];
  if (input.audience) lines.push(`Audience: ${input.audience}`);
  lines.push(`Key points to cover: ${input.keyPoints}`);
  lines.push(`Desired length: ${input.length}`);
  if (input.notes) lines.push(`Additional notes from the teacher: ${input.notes}`);
  return lines.join("\n");
}

// ── Phase 2: Build ──

// Shared slide-formatting constraints reused by every Build-phase-shaped
// system prompt — both the wizard's invent-from-scratch Build phase and the
// paste-your-content fill phase (see CONTENT_FILL_SYSTEM_PROMPT below) render
// into the exact same slide schema, so the arc structure, brevity limits, and
// no-image-field rule must never drift between the two.
const SLIDE_FORMAT_RULES =
  "NEVER include an image field or claim an image is attached — Slider always adds images " +
  "separately after generation; every slide you write must stand on its own with text only, even " +
  "for layouts that have an image region. " +
  "Keep every slide SHORT: bullets are short phrases (well under 15 words each, never full " +
  "sentences stacked into a list), body text is at most 2-3 short sentences, and twoColumn text is " +
  "brief and parallel between the two sides. Prefer titleBullets or twoColumn over titleBody for " +
  "teaching content — reserve titleBody for a short framing sentence or two, never a dense " +
  "paragraph. " +
  "Build a real classroom arc, not a lecture dump: a title slide, then an OPENER right after it — a " +
  "provocative question, a surprising fact, or a striking comparison that hooks students before you " +
  "teach anything — then a few slides that concisely teach the content, then at least one ACTIVITY " +
  "OR DISCUSSION slide that asks students to actually do something (Turn and Talk, a quick check-" +
  "for-understanding question, a short group task, a prediction) rather than just receive " +
  "information, and finally a closing slide (a memorable reflection question or a short summary — a " +
  "\"quote\" layout works well here). Every deck must include a genuine opener and a genuine " +
  "activity, regardless of length.";

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
  "(2) " + SLIDE_FORMAT_RULES + " " +
  "(3) You will be given a Design Brief with binding decisions already made — the activity moment, the " +
  "personal connection, the vivid detail, and the closing question. Do not re-derive or replace these " +
  "decisions; build the slide sequence to implement them faithfully, placing each where the content has " +
  "earned it rather than forcing it into an arbitrary slide.";

// ── Content Fill: a separate, single-phase entry point for teachers who ──
// ── already have their own material and just want it formatted into ──
// ── Slider's slide templates, rather than invented from a topic. ──

export const SliderContentFillInputSchema = z.object({
  rawContent: z.string().min(1),
  audience: z.string().default(""),
  notes: z.string().default(""),
});
export type SliderContentFillInput = z.infer<typeof SliderContentFillInputSchema>;

// The "master prompt" for content-fill: one fixed prompt used identically on
// every request, so a teacher pasting in their own material always gets the
// same reliable template-filling behavior — unlike the wizard's Build phase,
// this never receives per-request invented pedagogical decisions.
const CONTENT_FILL_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, formatting a teacher's OWN lesson content into a " +
  "classroom-ready slideshow in the Slider app. This is a FORMATTING task, not an authoring task — the " +
  "teacher has already written or gathered the material below; your job is to distribute it across " +
  "Slider's fixed slide templates faithfully, not to invent new pedagogical content. Return a single " +
  "JSON object matching the schema exactly. No prose, no markdown outside the JSON. " +
  "CRITICAL RULES: " +
  "(1) Do not introduce any fact, example, statistic, or claim that is not present in the provided " +
  "content. You may add a title slide and brief connective framing — an opening hook question, a " +
  "closing reflection question — but every substantive slide must trace back to the source text. If " +
  "the provided content is sparse, produce a shorter deck rather than padding it with invented " +
  "material. " +
  "(2) " + SLIDE_FORMAT_RULES + " " +
  "(3) Reorganize, condense, and lightly rephrase for slide brevity as needed, but never change what " +
  "the content actually says.";

function buildContentFillUserMessage(input: SliderContentFillInput): string {
  const lines = [`Content to format into slides:`, input.rawContent];
  if (input.audience) lines.push(``, `Audience: ${input.audience}`);
  if (input.notes) lines.push(`Additional notes from the teacher: ${input.notes}`);

  lines.push(
    `\nAvailable slide layouts (use a mix, choose what fits each idea):`,
    SLIDE_LAYOUTS.map((l) => `- "${l.value}": ${l.description}`).join("\n"),
    `\nAvailable themes (pick the one that best fits the subject/tone):`,
    SLIDER_THEMES.map((t) => `- "${t.id}": ${t.name}`).join("\n"),
    `\nRules:`,
    `1. deck_title is a short, specific title describing this content (not a generic label).`,
    `2. theme_id must be exactly one of the ids listed above.`,
    `3. First slide must use layout "title". Only set the fields that layout actually uses — omit fields a layout doesn't use.`,
    `4. Build a real arc from the provided content: slide 1 is "title"; slide 2 is a genuine OPENER drawn from or framing the content; then slides that distribute the actual provided material; then at least one ACTIVITY OR DISCUSSION slide; then a closing slide (a reflection question fits well as a "quote" layout). Let the amount of provided content determine how many slides you need — do not pad to hit a target length.`,
    `5. Keep slides short: bullets under 15 words each, body at most 2-3 short sentences, twoColumn brief and parallel. Prefer titleBullets or twoColumn over titleBody.`,
    `6. Never include an "image" field — images are added separately by the teacher after generation.`,
    `7. notes (optional, any layout): 1-2 sentences of speaker notes/talking points for the teacher presenting that slide.`,
    `8. columns (twoColumn layout only) must contain exactly two strings.`
  );
  return lines.join("\n");
}

export async function generateSliderDeckFromContent(
  input: SliderContentFillInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult<SliderKoraBuildOutput>> {
  const referenceBlock = await buildReferenceExamplesBlock("slider_fill");
  const system = (overrides?.systemPromptOverride ?? CONTENT_FILL_SYSTEM_PROMPT) + referenceBlock;
  const model = overrides?.model;
  const thinking = resolveThinking(false, overrides?.thinking);

  const built = await callKoraStructured({
    model: model ?? DEFAULT_MODEL,
    repairModel: REPAIR_MODEL,
    maxTokens: 8192,
    system,
    cacheSystemPrompt: true,
    ...(thinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildContentFillUserMessage(input) }],
    schema: SliderKoraBuildSchema,
  });

  return {
    system,
    output: built.data,
    configUsed: {
      model: model ?? DEFAULT_MODEL,
      thinking,
      maxTokens: 8192,
      label: overrides?.label,
      systemPromptOverride: overrides?.systemPromptOverride,
    },
  };
}

function buildSliderUserMessage(input: SliderBuildInput, brief: SliderDesignBrief): string {
  const lines = [
    `Design brief (binding constraints — build the deck to implement these, do not re-derive them):`,
    `- What must be covered / scope: ${brief.contentAudit}`,
    `- Activity/discussion moment to include: ${brief.activityMoment}`,
    `- Personal connection to the audience: ${brief.personalConnection}`,
    `- Vivid concrete detail to use: ${brief.vividDetail}`,
    `- Closing question (final slide): ${brief.closingQuestion}`,
    `- Structural approach: ${brief.structuralApproach}`,
    ``,
    `Topic: ${input.topic}`,
  ];
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
    `4. Required arc, regardless of length: slide 1 is "title"; slide 2 is a genuine OPENER (a provocative question, surprising fact, or striking comparison — not content teaching yet); then concise content slides; then at least one ACTIVITY OR DISCUSSION slide implementing the brief's activity moment; then a closing slide using the brief's closing question ("quote" layout works well). Never cut the opener or activity to save length — trim the middle content slides instead.`,
    `5. Match the requested length by adjusting how many CONTENT slides sit between the opener and the activity: Short ~4-5 slides total (title, opener, 1-2 content, activity/close), Medium ~7-9 slides (title, opener, 3-5 content, activity, close), Long ~11-13 slides (title, opener, several content slides possibly with a second activity, close).`,
    `6. Keep slides short: bullets under 15 words each, body at most 2-3 short sentences, twoColumn brief and parallel. Prefer titleBullets or twoColumn over titleBody.`,
    `7. Never include an "image" field — images are added separately by the teacher after generation.`,
    `8. notes (optional, any layout): 1-2 sentences of speaker notes/talking points for the teacher presenting that slide. For the activity slide, make notes a concrete facilitation instruction (e.g. how long to give students, what to listen for).`,
    `9. columns (twoColumn layout only) must contain exactly two strings.`
  );
  return lines.join("\n");
}

// ── Phase 3: Red Team ──

const RED_TEAM_SYSTEM_PROMPT =
  "You are an adversarial examiner reviewing a classroom slideshow before it's approved for use. " +
  "Write the 3 assessment questions a student is most likely to be asked on this topic, then check " +
  "each one against the actual slides provided — not against what the topic could theoretically " +
  "cover, but against what these specific slides say. For each question, list which slide indices " +
  "(0-based) address it and judge honestly whether a student who learned only from this deck could " +
  "answer it: \"yes\" (fully), \"partially\" (some support but missing something specific), or " +
  "\"no\" (not addressed). If not \"yes\", state exactly what is missing. Then write a short, honest " +
  "gapStatement: what this deck does not cover at the depth a real assessment would require, " +
  "regardless of how the 3 questions scored — be specific, not reassuring. Return a single JSON " +
  "object matching the schema exactly, no prose outside it.";

function buildRedTeamUserMessage(deckTitle: string, slides: KoraSlides, input: SliderBuildInput): string {
  const slideSummaries = slides.map((s, i) => {
    const parts = [`layout=${s.layout}`];
    if (s.title) parts.push(`title="${s.title}"`);
    if (s.subtitle) parts.push(`subtitle="${s.subtitle}"`);
    if (s.body) parts.push(`body="${s.body}"`);
    if (s.bullets?.length) parts.push(`bullets=${JSON.stringify(s.bullets)}`);
    if (s.columns) parts.push(`columns=${JSON.stringify(s.columns)}`);
    if (s.quoteText) parts.push(`quote="${s.quoteText}"${s.quoteAttribution ? ` — ${s.quoteAttribution}` : ""}`);
    return `[${i}] ${parts.join(", ")}`;
  });
  return [
    `Topic: ${input.topic}`,
    input.audience ? `Audience: ${input.audience}` : null,
    `Key points the deck was meant to cover: ${input.keyPoints}`,
    ``,
    `Deck title: ${deckTitle}`,
    `Slides:`,
    ...slideSummaries,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

// ── Phase 3b: Revise (conditional) ──

function buildReviseUserMessage(
  deckTitle: string,
  theme_id: string,
  slides: KoraSlides,
  redTeam: SliderRedTeamOutput,
  input: SliderBuildInput
): string {
  const flaggedIndices = new Set<number>();
  const gapLines: string[] = [];
  for (const q of redTeam.examQuestions) {
    if (q.coverageSufficient === "yes") continue;
    for (const i of q.relevantSlideIndices) flaggedIndices.add(i);
    gapLines.push(`- "${q.question}" (${q.coverageSufficient}): ${q.gapIfNotSufficient ?? "insufficient coverage"}`);
  }
  const keepIndices = slides.map((_, i) => i).filter((i) => !flaggedIndices.has(i));

  return [
    `Topic: ${input.topic}`,
    `Key points to cover: ${input.keyPoints}`,
    ``,
    `Current deck (deck_title="${deckTitle}", theme_id="${theme_id}"):`,
    JSON.stringify(slides),
    ``,
    `A Red Team review found these gaps:`,
    ...gapLines,
    ``,
    `Revise ONLY slide indices [${[...flaggedIndices].sort((a, b) => a - b).join(", ")}] to fix the gaps above. ` +
      `Reproduce every other slide (indices [${keepIndices.join(", ")}]) exactly as given, unchanged. ` +
      `Return the full corrected slide array in order, plus deck_title and theme_id (unchanged unless the fix genuinely requires it).`,
  ].join("\n");
}

// ── Orchestration ──

// An explicit override applies uniformly to every phase (so a KoraLab admin
// can force "everything on/off" for comparison); otherwise each phase uses
// the default suited to its own task.
function resolveThinking(phaseDefault: boolean, override: boolean | undefined): boolean {
  return override ?? phaseDefault;
}

async function callDesignBrief(
  input: SliderBuildInput,
  referenceBlock: string,
  overrideModel: string | undefined,
  thinkingOverride: boolean | undefined
) {
  const system = DESIGN_BRIEF_SYSTEM_PROMPT + referenceBlock;
  const thinking = resolveThinking(true, thinkingOverride);
  const { data } = await callKoraStructured({
    model: overrideModel ?? DEFAULT_MODEL,
    repairModel: REPAIR_MODEL,
    maxTokens: 2048,
    system,
    ...(thinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildDesignBriefUserMessage(input) }],
    schema: SliderDesignBriefSchema,
  });
  return data;
}

async function callRedTeam(
  deckTitle: string,
  slides: KoraSlides,
  input: SliderBuildInput,
  overrideModel: string | undefined,
  thinkingOverride: boolean | undefined
) {
  const thinking = resolveThinking(true, thinkingOverride);
  const { data } = await callKoraStructured({
    model: overrideModel ?? DEFAULT_MODEL,
    repairModel: REPAIR_MODEL,
    maxTokens: 2048,
    system: RED_TEAM_SYSTEM_PROMPT,
    ...(thinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildRedTeamUserMessage(deckTitle, slides, input) }],
    schema: SliderRedTeamSchema,
  });
  return data;
}

async function callRevise(
  deckTitle: string,
  themeId: string,
  slides: KoraSlides,
  redTeam: SliderRedTeamOutput,
  input: SliderBuildInput,
  system: string,
  overrideModel: string | undefined,
  thinkingOverride: boolean | undefined
) {
  const thinking = resolveThinking(false, thinkingOverride);
  const { data } = await callKoraStructured({
    model: overrideModel ?? DEFAULT_MODEL,
    repairModel: REPAIR_MODEL,
    maxTokens: 8192,
    system,
    cacheSystemPrompt: true,
    ...(thinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildReviseUserMessage(deckTitle, themeId, slides, redTeam, input) }],
    schema: SliderKoraBuildSchema,
  });
  return data;
}

const FALLBACK_GAP_STATEMENT =
  "Automatic quality check couldn't complete — review this deck's coverage yourself before teaching from it.";

export async function generateSliderDeck(
  input: SliderBuildInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult<SliderKoraBuildOutput & { gapStatement?: string }>> {
  const referenceBlock = await buildReferenceExamplesBlock("slider_build");
  const buildSystem = (overrides?.systemPromptOverride ?? SLIDER_SYSTEM_PROMPT) + referenceBlock;
  const model = overrides?.model;
  // Only the Build phase's thinking setting is reported in configUsed (below);
  // an explicit override applies to every phase uniformly (see resolveThinking),
  // otherwise each phase uses the default appropriate to its own task.
  const thinkingOverride = overrides?.thinking;
  const buildThinking = resolveThinking(false, thinkingOverride);

  const brief = await callDesignBrief(input, referenceBlock, model, thinkingOverride);

  const built = await callKoraStructured({
    model: model ?? DEFAULT_MODEL,
    repairModel: REPAIR_MODEL,
    maxTokens: 8192,
    system: buildSystem,
    cacheSystemPrompt: true,
    ...(buildThinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildSliderUserMessage(input, brief) }],
    schema: SliderKoraBuildSchema,
  });

  let deck_title = built.data.deck_title;
  let theme_id = built.data.theme_id;
  let slides = built.data.slides;
  let gapStatement: string | undefined;

  if (!isShortDeck(input.length)) {
    try {
      const redTeam = await callRedTeam(deck_title, slides, input, model, thinkingOverride);
      gapStatement = redTeam.gapStatement;
      const needsRevision = redTeam.examQuestions.some((q) => q.coverageSufficient !== "yes");
      if (needsRevision) {
        const revised = await callRevise(
          deck_title,
          theme_id,
          slides,
          redTeam,
          input,
          buildSystem,
          model,
          thinkingOverride
        );
        deck_title = revised.deck_title;
        theme_id = revised.theme_id;
        slides = revised.slides;
      }
    } catch (err) {
      // A slow or failed Red Team/Revise pass must never cost the teacher the
      // deck the Build phase already produced.
      console.warn("[sliderKoraGenerate] Red Team/Revise pass failed, returning built deck as-is:", err);
      gapStatement = gapStatement ?? FALLBACK_GAP_STATEMENT;
    }
  }

  return {
    system: buildSystem,
    output: { deck_title, theme_id, slides, gapStatement },
    configUsed: {
      model: model ?? DEFAULT_MODEL,
      thinking: buildThinking,
      maxTokens: 8192,
      label: overrides?.label,
      systemPromptOverride: overrides?.systemPromptOverride,
    },
  };
}

// Shared by both API routes (kora-build, kora-fill): converts a KORA build
// output's slide array into Slider's own Slide[] shape with fresh ids, and
// validates a theme id against the known theme catalog.
export function buildSlidesWithIds(slides: KoraSlides): Slide[] {
  return slides.map((s) => ({
    id: randomUUID(),
    layout: s.layout,
    title: s.title,
    subtitle: s.subtitle,
    body: s.body,
    bullets: s.bullets,
    columns: s.columns ? ([s.columns[0], s.columns[1]] as [string, string]) : undefined,
    image: null,
    quoteText: s.quoteText,
    quoteAttribution: s.quoteAttribution,
    notes: s.notes,
  }));
}

export function resolveThemeId(themeId: string): string {
  return SLIDER_THEMES.some((t) => t.id === themeId) ? themeId : SLIDER_THEMES[0].id;
}
