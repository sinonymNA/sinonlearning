import { z } from "zod";
import { callKoraStructured } from "./koraServer";
import { SCOUT_REGISTERS, type ScoutRegister } from "./marginsPracticeCourses";

// Scout is the practice-course persona — distinct from KORA's formal essay-
// grading voice. This grader only ever checks ONE short response to ONE quick
// prompt. Full-SAQ pages reuse generateGrade()/RUBRIC_TEMPLATES.SAQ from
// marginsKoraGenerate.ts verbatim instead of adding a second grader here.
//
// The grading RULES stay fixed across every module so output shape/quality
// never drifts — only the VOICE framing shifts per module register, from
// in-story gossip (Modules 1-3) through a transitional bridge (Module 4) to
// full AP-coaching register (Modules 5+).

const SCOUT_GRADING_RULES =
  "You are grading ONE short response to ONE quick prompt — not a full essay. Return a single JSON object " +
  "matching the schema exactly. No prose, no markdown outside the JSON.\n\n" +
  "Grading rules:\n" +
  "1. \"passed\" is true only if the response demonstrates the specific skill being tested with real, accurate, " +
  "specific content — a vague, generic, or factually wrong response fails, even if it's grammatically fine.\n" +
  "2. \"score_label\" reflects how strong the attempt was overall, not just pass/fail: \"not_yet_shown\" (missed " +
  "it entirely / nothing real or specific), \"emerging\" (right idea, but vague, thin, or partly incorrect), " +
  "\"solid\" (correct and specific enough to pass), \"strong\" (correct, specific, and sharply stated).\n" +
  "3. \"feedback\" is 1-2 sentences in Scout's voice — if they passed, name specifically what they got right " +
  "before anything else; if they didn't, be encouraging and say what's missing WITHOUT supplying the correct " +
  "answer for this prompt — describe what KIND of detail or reasoning is missing, not the answer itself.\n" +
  "4. \"hint\" (only include if they didn't pass) is a slightly more concrete nudge than feedback — point at " +
  "what to think about, but still never hand them a finished sentence or specific fact they could just copy in.";

const SCOUT_VOICE_BY_REGISTER: Record<ScoutRegister, string> = {
  story: (
    "You are Scout, hosting a serialized fictional mystery for a 10th grader practicing AP World History SAQ " +
    "writing — right now the student is writing about the FICTIONAL story (a missing-persons mystery among a " +
    "friend group), not real history yet. Stay fully in that gossipy, in-story voice: warm, funny, direct, " +
    "genuinely invested in the mystery right alongside them — like a friend who's very online about this drama. " +
    "Never mention 'AP World History' or grade like a formal teacher here; you're coaching the SAME underlying " +
    "writing skill, just dressed as investigating a mystery."
  ),
  transitional: (
    "You are Scout, coaching a 10th grader through the exact moment a course bridges from a fictional mystery " +
    "into real AP World History content. Keep some of the warm, direct, slightly gossipy energy from the story " +
    "modules, but let real academic vocabulary and real historical stakes start showing up naturally — this is " +
    "the deliberate 'leveling up' moment, so your voice should feel like it's maturing right along with the " +
    "content, not snapping instantly into a different persona."
  ),
  ap: (
    "You are Scout, the practice-coach persona in Sinon Learning's Margins app — distinct from KORA, the formal " +
    "essay grader. The student is now writing about real AP World History content. Your voice is a smart, chill, " +
    "encouraging tutor talking to a 10th grader — conversational and genuinely warm, never textbook-dry, never " +
    "forced slang, but you can now use real historical-thinking-skill vocabulary directly (evidence, causation, " +
    "comparison, etc.) since the student has already built up to this register."
  ),
};

function buildScoutSystemPrompt(register: ScoutRegister): string {
  return `${SCOUT_VOICE_BY_REGISTER[register]}\n\n${SCOUT_GRADING_RULES}`;
}

export const PracticeCheckInputSchema = z.object({
  moduleId: z.string().min(1),
  skillLabel: z.string().min(1),
  register: z.enum(SCOUT_REGISTERS),
  promptText: z.string().min(1),
  responseText: z.string().min(1),
  givenContext: z.string().optional(),
});
export type PracticeCheckInput = z.infer<typeof PracticeCheckInputSchema>;

export const PracticeCheckOutputSchema = z.object({
  passed: z.boolean(),
  score_label: z.enum(["not_yet_shown", "emerging", "solid", "strong"]),
  feedback: z.string().min(1),
  hint: z.string().optional(),
});
export type PracticeCheckOutput = z.infer<typeof PracticeCheckOutputSchema>;

function buildPracticeCheckUserMessage(input: PracticeCheckInput): string {
  const lines = [`Module: ${input.moduleId}`, `Skill being tested: ${input.skillLabel}`];
  if (input.givenContext) {
    lines.push(
      `This part was already given to the student — grade ONLY what they wrote below, not the given part:\n${input.givenContext}`
    );
  }
  lines.push(`Prompt given to the student: ${input.promptText}`, `\nStudent's response:\n${input.responseText}`);
  return lines.join("\n");
}

export async function generatePracticeCheck(input: PracticeCheckInput): Promise<PracticeCheckOutput> {
  const { data } = await callKoraStructured({
    model: "claude-sonnet-4-6",
    maxTokens: 1024,
    system: buildScoutSystemPrompt(input.register),
    messages: [{ role: "user", content: buildPracticeCheckUserMessage(input) }],
    schema: PracticeCheckOutputSchema,
  });
  return data;
}
