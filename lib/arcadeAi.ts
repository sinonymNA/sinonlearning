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
const Schema = z.object({
  questions: z.array(Question),
  vocab: z.array(z.string()),
  drawPrompts: z.array(z.string()),
  telephonePrompts: z.array(z.string()),
  imposterWords: z.array(z.object({ word: z.string(), related: z.array(z.string()) })),
});

const SIZES = { small: 15, medium: 30, large: 50 } as const;

const SYSTEM = `You build classroom game content for teachers from the teacher's own material.
Rules:
- Use ONLY facts supported by the teacher's material (you may add obvious common-sense wording, never new facts).
- Everything must be classroom-safe and suitable for students.
- Multiple-choice questions: 4 choices, exactly one correct, plausible distractors that reflect real misconceptions, "answer" is the 0-based index of the correct choice, vary the position of the correct answer. "explain" is one or two friendly sentences teaching WHY the answer is right. "concept" is a 2-5 word label for the idea tested; reuse identical labels for questions about the same idea.
- vocab: single words or short terms from the material (3-30 characters), good for a word game.
- drawPrompts: concrete things a student can sketch in under a minute that connect to the material (objects, scenes, processes). 1-4 words each. Prefer drawable nouns over abstractions.
- telephonePrompts: short fun phrases or scenes (under 80 characters) connected to the topic.
- imposterWords: a secret word (a key term) plus 5-8 related words/concepts students would use in clues.
- No names of real students, no personal info, no URLs.`;

export async function generateArcadeContent(input: { text: string; grade: string; amount: "small" | "medium" | "large" }) {
  const n = SIZES[input.amount] ?? SIZES.medium;
  try {
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 16000,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Grade level: ${input.grade}.\nMake about ${n} multiple-choice questions, ${n} vocab words, ${n} drawing prompts, ${Math.round(n / 2)} telephone prompts and ${Math.round(n / 3)} imposter secret words.\n\n<teacher_material>\n${input.text}\n</teacher_material>`,
      }],
      schema: Schema,
    });
    return data;
  } catch (e) {
    if (e instanceof KoraConfigError) throw new GameError("AI set-building isn't switched on for this server yet.", "unavailable");
    if (e instanceof KoraValidationError) throw new GameError("The AI returned something unreadable. Please try again.");
    if (e instanceof KoraUpstreamError) throw new GameError("The AI service is busy. Please try again in a moment.");
    throw e;
  }
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
