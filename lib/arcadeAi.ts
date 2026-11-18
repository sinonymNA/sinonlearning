import { z } from "zod";
import { callKoraStructured, KoraConfigError, KoraUpstreamError, KoraValidationError } from "@/lib/koraServer";
import { GameError } from "../arcade-server/util.mjs";

// Turns a teacher's own material into content for every Classroom Arcade game. Output is untrusted: the arcade API
// runs it through sanitizeLoose() (length limits + moderation) before anything is shown to a student.

const Question = z.object({
  q: z.string(),
  choices: z.array(z.string()).min(3).max(4),
  answer: z.number().int(),
  explain: z.string(),
  concept: z.string(),
});
const QuestionsSchema = z.object({ questions: z.array(Question) });
const VocabSchema = z.object({ vocab: z.array(z.string()) });
const DrawSchema = z.object({ drawPrompts: z.array(z.string()) });
const TelSchema = z.object({ telephonePrompts: z.array(z.string()) });
const ImposterSchema = z.object({ imposterWords: z.array(z.object({ word: z.string(), related: z.array(z.string()) })) });

const SYSTEM = `You build classroom game content for teachers from the teacher's own material.
Rules:
- Use ONLY facts supported by the teacher's material (you may add obvious common-sense wording, never new facts).
- Everything must be classroom-safe and suitable for students.
- Every item must be DIFFERENT from the others and from the "already have" list. Spread items across the whole material, not just its beginning.
- Multiple-choice questions: 4 choices, exactly one correct, plausible distractors that reflect real misconceptions, "answer" is the 0-based index of the correct choice, vary the position of the correct answer. "explain" is one or two friendly sentences teaching WHY the answer is right. "concept" is a 2-5 word label for the idea tested; reuse identical labels for questions about the same idea. Mix recall, application and "which is NOT" styles.
- vocab: single words or short terms from the material (3-30 characters), good for a word game.
- drawPrompts: concrete things a student can sketch in under a minute that connect to the material (objects, scenes, processes). 1-4 words each. Prefer drawable nouns over abstractions. Include some funny or simple ones so every student can draw them.
- telephonePrompts: short fun phrases or scenes (under 80 characters) connected to the topic.
- imposterWords: a secret word (a key term) plus 5-8 related words/concepts students would use in clues.
- No names of real students, no personal info, no URLs.`;

type Counts = { questions: number; vocab: number; drawPrompts: number; telephonePrompts: number; imposterWords: number };
type Avoid = Partial<Record<keyof Counts, string[]>>;

/** One model call per content type (and per batch of 25 questions), run in parallel so big sets stay fast and complete. */
export async function generateArcadeContent(input: { text: string; grade: string; counts: Counts; avoid?: Avoid }) {
  const jobs: { key: keyof Counts; n: number; part: number; parts: number; schema: z.ZodType }[] = [];
  const add = (key: keyof Counts, total: number, batch: number, schema: z.ZodType) => {
    if (total <= 0) return;
    const parts = Math.ceil(total / batch);
    for (let part = 0; part < parts; part++) jobs.push({ key, n: Math.ceil(total / parts), part, parts, schema });
  };
  add("questions", input.counts.questions, 25, QuestionsSchema);
  add("vocab", input.counts.vocab, 60, VocabSchema);
  add("drawPrompts", input.counts.drawPrompts, 60, DrawSchema);
  add("telephonePrompts", input.counts.telephonePrompts, 50, TelSchema);
  add("imposterWords", input.counts.imposterWords, 30, ImposterSchema);

  const run = async (j: (typeof jobs)[number]) => {
    const avoid = (input.avoid?.[j.key] ?? []).slice(0, 80);
    const slice = j.parts > 1 ? `\nThis is part ${j.part + 1} of ${j.parts}: focus on the ${j.part + 1}${["st", "nd", "rd"][j.part] ?? "th"} ${j.parts === 2 ? "half" : "section"} of the material so parts don't overlap.` : "";
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 12000,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Grade level: ${input.grade}.\nMake exactly ${j.n} items of type "${j.key}".${slice}${avoid.length ? `\nAlready have (do not repeat or closely paraphrase):\n${avoid.map((a) => `- ${a}`).join("\n")}` : ""}\n\n<teacher_material>\n${input.text}\n</teacher_material>`,
      }],
      schema: j.schema,
    });
    return data as Record<string, unknown[]>;
  };

  const results = await Promise.allSettled(jobs.map(run));
  const merged: Record<string, unknown[]> = { questions: [], vocab: [], drawPrompts: [], telephonePrompts: [], imposterWords: [] };
  let firstError: unknown = null;
  results.forEach((r) => {
    if (r.status === "fulfilled") { for (const [k, v] of Object.entries(r.value)) merged[k].push(...v); }
    else firstError ??= r.reason;
  });
  if (firstError && !Object.values(merged).some((v) => v.length)) {
    const e = firstError;
    if (e instanceof KoraConfigError) throw new GameError("AI set-building isn't switched on for this server yet.", "unavailable");
    if (e instanceof KoraValidationError) throw new GameError("The AI returned something unreadable. Please try again.");
    if (e instanceof KoraUpstreamError) throw new GameError("The AI service is busy. Please try again in a moment.");
    throw e;
  }
  return merged as { questions: any[]; vocab: any[]; drawPrompts: any[]; telephonePrompts: any[]; imposterWords: any[] };
}

const VariantSchema = z.object({
  items: z.array(z.object({
    i: z.number().int(),
    variants: z.array(z.object({ q: z.string(), choices: z.array(z.string()).min(3).max(4), answer: z.number().int(), explain: z.string() })),
  })),
});

const VARIANT_SYSTEM = `You write sibling practice questions for a mastery-learning game.
For each source question write 3 NEW multiple-choice questions that test the SAME underlying idea in a different form: change numbers/examples, reword it, or use a short scenario instead of plain recall. Never copy the source question or reuse its exact choices.
Rules: 3-4 choices, exactly one correct, "answer" is the 0-based index of the correct choice, plausible distractors that reflect real misconceptions, vary the correct position. "explain" is one or two friendly sentences teaching why the answer is right. Only use facts that follow from the source question and its correct answer. Classroom-safe, no names or personal info. Return the same "i" you were given.`;

export async function generateVariants(questions: { i: number; q: string; choices: string[]; answer: number; concept: string | null }[]) {
  try {
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 16000,
      system: VARIANT_SYSTEM,
      messages: [{ role: "user", content: `<source_questions>\n${JSON.stringify(questions)}\n</source_questions>` }],
      schema: VariantSchema,
    });
    return data.items;
  } catch (e) {
    if (e instanceof KoraConfigError) throw new GameError("AI set-building isn't switched on for this server yet.", "unavailable");
    if (e instanceof KoraValidationError) throw new GameError("The AI returned something unreadable. Please try again.");
    if (e instanceof KoraUpstreamError) throw new GameError("The AI service is busy. Please try again in a moment.");
    throw e;
  }
}
