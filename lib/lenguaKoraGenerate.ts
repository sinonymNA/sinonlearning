import { z } from "zod";
import { callKoraStructured } from "./koraServer";
import { languageByCode } from "./lenguaLanguages";
import { lookupLexicon, saveLexicon, type GlossTerm } from "./lenguaDb";
import type { KoraLabGenerateOverrides, KoraLabGenerateResult } from "./koraLab/registry";

// Lengua's two AI calls. Both are deliberately small and both are cached.
//
// Neither translates the live transcript. Streaming a 45-minute lesson through
// a model costs roughly $2 per class per period — about $1,800 a year for one
// teacher's timetable, which is not a product. Instead the transcript stays in
// English (produced free by the browser's own speech recognition) and students
// pay attention to it; only the words they actually stop on are glossed, and
// those are cached globally forever.

const GLOSSARY_SYSTEM_PROMPT =
  "You are KORA, glossing lesson vocabulary for multilingual classrooms. " +
  "For each term produce (a) a definition in deliberately simple English — the words a 12-year-old " +
  "already knows, no jargon, no reuse of the term itself — and (b) an accurate translation into the " +
  "target language as a teacher of that language would render it in this subject. " +
  "The simple-English definition is the one students see first and matters most: it is what keeps them " +
  "reading English instead of switching languages. Return a single JSON object matching the schema.";

const GlossTermSchema = z.object({
  term: z.string(),
  gloss_en: z.string(),
  gloss_l1: z.string(),
  part_of_speech: z.string().optional(),
});

const GlossarySchema = z.object({ terms: z.array(GlossTermSchema).min(1).max(40) });
const SingleGlossSchema = GlossTermSchema;

// ─── Deck glossary — generated once per (deck, language), then cached ─────────

export const LenguaGlossaryInputSchema = z.object({
  /** Flattened deck text: titles, bullets, body. */
  deckText: z.string().min(1),
  language: z.string().min(2),
  subject: z.string().default(""),
  gradeBand: z.string().default(""),
});
export type LenguaGlossaryInput = z.infer<typeof LenguaGlossaryInputSchema>;

export async function generateDeckGlossary(
  input: LenguaGlossaryInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult<{ terms: GlossTerm[] }>> {
  const lang = languageByCode(input.language);
  const langName = lang ? `${lang.name} (${lang.endonym})` : input.language;
  const system = overrides?.systemPromptOverride ?? GLOSSARY_SYSTEM_PROMPT;
  const model = overrides?.model ?? "claude-sonnet-4-6";
  const maxTokens = 3000;

  const message = [
    `Target language: ${langName}`,
    input.subject.trim() ? `Subject: ${input.subject}` : "",
    input.gradeBand.trim() ? `Grade band: ${input.gradeBand}` : "",
    ``,
    `Pull the 12–24 terms from this lesson that a student still learning English would genuinely stumble on.`,
    `Favour academic and subject vocabulary ("evaluate", "scarcity", "constitutional") over everyday words.`,
    `Include multi-word phrases where the phrase is the unit of meaning ("supply and demand").`,
    `Skip proper nouns unless the name itself needs explaining.`,
    ``,
    `LESSON CONTENT:`,
    input.deckText.slice(0, 8000),
  ]
    .filter(Boolean)
    .join("\n");

  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    messages: [{ role: "user", content: message }],
    schema: GlossarySchema,
  });

  return {
    system,
    output: { terms: data.terms },
    configUsed: {
      model,
      thinking: false,
      maxTokens,
      label: overrides?.label,
      systemPromptOverride: overrides?.systemPromptOverride,
    },
  };
}

// ─── Single term — cache-first ────────────────────────────────────────────────

export const LenguaTermInputSchema = z.object({
  term: z.string().min(1),
  language: z.string().min(2),
  /** The sentence it appeared in, so the gloss matches the sense actually used. */
  context: z.string().default(""),
});
export type LenguaTermInput = z.infer<typeof LenguaTermInputSchema>;

const TERM_SYSTEM_PROMPT =
  "You are KORA, glossing a single word a student just tapped during a live lesson. " +
  "Give a definition in deliberately simple English — the words a 12-year-old already knows, never " +
  "reusing the term itself — and an accurate translation into the target language. " +
  "If the sentence it came from is supplied, gloss the sense used THERE, not the most common sense. " +
  "Be brief: one short clause each. Return a single JSON object matching the schema.";

export async function glossTerm(
  input: LenguaTermInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult<GlossTerm>> {
  const lang = languageByCode(input.language);
  const langName = lang ? `${lang.name} (${lang.endonym})` : input.language;
  const system = overrides?.systemPromptOverride ?? TERM_SYSTEM_PROMPT;
  // Haiku is enough for one word and keeps a cache miss mid-lesson near-instant.
  const model = overrides?.model ?? "claude-haiku-4-5-20251001";
  const maxTokens = 300;

  const message = [
    `Term: ${input.term}`,
    `Target language: ${langName}`,
    input.context.trim() ? `Sentence it appeared in: "${input.context.slice(0, 400)}"` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    messages: [{ role: "user", content: message }],
    schema: SingleGlossSchema,
  });

  return {
    system,
    output: data,
    configUsed: {
      model,
      thinking: false,
      maxTokens,
      label: overrides?.label,
      systemPromptOverride: overrides?.systemPromptOverride,
    },
  };
}

/**
 * Cache-first gloss. This is the function the tap handler calls.
 *
 * A hit costs one indexed primary-key read. A miss costs one Haiku call and is
 * then a hit for every student in every school from then on — which is why the
 * lexicon table is global rather than scoped to a deck or a teacher.
 */
export async function glossTermCached(
  term: string,
  language: string,
  context = ""
): Promise<{ entry: GlossTerm; cached: boolean }> {
  const key = term.trim().toLowerCase();
  const hit = await lookupLexicon(key, language);
  if (hit) return { entry: hit, cached: true };

  const { output } = await glossTerm({ term: key, language, context });
  const entry: GlossTerm = { ...output, term: key };
  await saveLexicon(language, entry);
  return { entry, cached: false };
}
