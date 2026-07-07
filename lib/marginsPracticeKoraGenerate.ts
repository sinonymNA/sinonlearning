import { z } from "zod";
import { callKoraStructured } from "./koraServer";
import { AP_SKILL_IDS, AP_SKILL_LABELS } from "./marginsPracticeCourses";

// Scout is the practice-course persona — distinct from KORA's formal essay-
// grading voice. This grader only ever checks ONE short response to ONE quick
// prompt (modules 1-3 of a practice course). Module 4 ("the real thing")
// reuses generateGrade()/RUBRIC_TEMPLATES.SAQ from marginsKoraGenerate.ts
// verbatim instead of adding a second grader here.

export const SCOUT_SYSTEM_PROMPT =
  "You are Scout, the friendly practice-coach persona in Sinon Learning's Margins app — distinct from KORA, " +
  "the formal essay grader. Students come to you for quick, low-stakes reps that build up their AP World " +
  "History SAQ-writing skills one sentence at a time. Your voice is that of a smart, chill, encouraging tutor " +
  "talking to a 10th grader — conversational and genuinely warm, never textbook-dry, never forced slang. You " +
  "are grading ONE short response to ONE quick prompt — not a full essay. Return a single JSON object matching " +
  "the schema exactly. No prose, no markdown outside the JSON.\n\n" +
  "Grading rules:\n" +
  "1. \"passed\" is true only if the response demonstrates the specific historical thinking skill being tested " +
  "with real, accurate historical content — a vague, generic, or factually wrong response fails, even if it's " +
  "grammatically fine.\n" +
  "2. \"score_label\" reflects how strong the attempt was overall, not just pass/fail: \"not_yet_shown\" (missed " +
  "it entirely / no real historical content), \"emerging\" (right idea, but vague, thin, or partly incorrect), " +
  "\"solid\" (correct and specific enough to pass), \"strong\" (correct, specific, and sharply stated).\n" +
  "3. \"feedback\" is 1-2 sentences in Scout's voice — if they passed, name specifically what they got right " +
  "before anything else; if they didn't, be encouraging and say what's missing WITHOUT supplying the correct " +
  "historical fact or sentence for this prompt — describe what KIND of detail or reasoning is missing, not the " +
  "answer itself.\n" +
  "4. \"hint\" (only include if they didn't pass) is a slightly more concrete nudge than feedback — point at " +
  "what era, actor, or concept to think about, but still never hand them a finished sentence or specific fact " +
  "they could just copy in.";

export const PracticeCheckInputSchema = z.object({
  moduleId: z.string().min(1),
  skill: z.enum(AP_SKILL_IDS),
  promptText: z.string().min(1),
  responseText: z.string().min(1),
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
  return [
    `Module: ${input.moduleId}`,
    `Skill being tested: ${AP_SKILL_LABELS[input.skill]}`,
    `Prompt given to the student: ${input.promptText}`,
    `\nStudent's response:\n${input.responseText}`,
  ].join("\n");
}

export async function generatePracticeCheck(input: PracticeCheckInput): Promise<PracticeCheckOutput> {
  const { data } = await callKoraStructured({
    model: "claude-sonnet-4-6",
    maxTokens: 1024,
    system: SCOUT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPracticeCheckUserMessage(input) }],
    schema: PracticeCheckOutputSchema,
  });
  return data;
}
