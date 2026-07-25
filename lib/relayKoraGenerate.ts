import { z } from "zod";
import { callKoraStructured } from "./koraServer";
import { RUBRIC_TEMPLATES, type EssayType } from "./marginsRubrics";
import { RELAY_MOVES, type RelayEssayScore } from "./relayGame";
import type { KoraLabGenerateOverrides, KoraLabGenerateResult } from "./koraLab/registry";

// Relay grading.
//
// Deliberately NOT marginsKoraGenerate.generateGrade. That call is built for a
// single finished essay: Opus, adaptive thinking, 8192 tokens, inline
// annotations spanning character offsets. Relay has to score every essay in the
// room at once — 32 in a 32-student class — while a projector waits. So this is
// a much lighter pass: Sonnet, no thinking, ~900 tokens, one verdict and one
// sentence of justification per rubric category. No annotations.
//
// The essays are also short and structurally odd (four authors, one paragraph
// each, no revision), so annotation-grade precision would be false precision
// anyway. What the reveal needs is: did this earn the point, and why not.

const RELAY_GRADE_SYSTEM_PROMPT =
  "You are KORA, grading a relay-written AP History essay. Four different students each wrote one " +
  "section without seeing the whole. Score ONLY against the rubric categories given, awarding whole " +
  "points. Be exact and be fair to the format: judge each section on its own rubric criterion, and do " +
  "not penalise the seams between authors or the absence of a conclusion. Award a point when the " +
  "criterion is genuinely met and withhold it when it is not — students learn nothing from inflated " +
  "scores. Every reason must name the specific thing that earned or lost the point, in one sentence a " +
  "student can act on. Return a single JSON object matching the schema exactly.";

const CategorySchema = z.object({
  category: z.string(),
  earned: z.coerce.number().int().min(0),
  reason: z.string(),
});

const RelayGradeSchema = z.object({
  categories: z.array(CategorySchema).min(1),
  /** Quoted back verbatim during the reveal — the line worth reading aloud. */
  standout: z.string(),
});

export const RelayGradeInputSchema = z.object({
  prompt: z.string().min(1),
  essayType: z.string().default("LEQ"),
  /** Section text in round order: thesis, contextualization, evidence, analysis. */
  sections: z.array(z.string()).min(1),
});
export type RelayGradeInput = z.infer<typeof RelayGradeInputSchema>;

function buildUserMessage(input: RelayGradeInput, rubric: { category: string; points_possible: number; description: string }[]): string {
  const sectionBlock = RELAY_MOVES.map((m, i) => {
    const text = (input.sections[i] ?? "").trim();
    return `### ${m.label}\n${text.length > 0 ? text : "(left blank — award 0 for this category)"}`;
  }).join("\n\n");

  const rubricBlock = rubric
    .map((c) => `- ${c.category} (0–${c.points_possible} pts): ${c.description}`)
    .join("\n");

  return [
    `PROMPT:\n${input.prompt}`,
    ``,
    `RUBRIC — score each category, whole points only:`,
    rubricBlock,
    ``,
    `THE RELAY ESSAY:`,
    sectionBlock,
    ``,
    `Return one entry per rubric category above, using the category name EXACTLY as written.`,
    `A blank or one-word section earns 0 — say so plainly in the reason.`,
    `standout: quote the single strongest sentence from the essay verbatim. If nothing is strong enough to quote, return an empty string.`,
  ].join("\n");
}

export async function gradeRelayEssay(
  input: RelayGradeInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult<RelayEssayScore>> {
  const essayType = (["DBQ", "LEQ", "SAQ"].includes(input.essayType) ? input.essayType : "LEQ") as EssayType;
  const rubric = RUBRIC_TEMPLATES[essayType];
  const system = overrides?.systemPromptOverride ?? RELAY_GRADE_SYSTEM_PROMPT;
  const model = overrides?.model ?? "claude-sonnet-4-6";
  const maxTokens = 900;

  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    messages: [{ role: "user", content: buildUserMessage(input, rubric) }],
    schema: RelayGradeSchema,
  });

  // Re-derive totals from the rubric rather than trusting the model's arithmetic,
  // and clamp each category to its real ceiling — a hallucinated "3" on a
  // 1-point criterion would otherwise corrupt the leaderboard.
  const categories = rubric.map((c) => {
    const hit = data.categories.find(
      (d) => d.category.trim().toLowerCase() === c.category.trim().toLowerCase()
    );
    const earned = Math.max(0, Math.min(c.points_possible, hit?.earned ?? 0));
    return {
      category: c.category,
      earned,
      possible: c.points_possible,
      reason: hit?.reason?.trim() || "No feedback returned for this category.",
    };
  });

  const total = categories.reduce((sum, c) => sum + c.earned, 0);
  const possible = categories.reduce((sum, c) => sum + c.possible, 0);

  const score: RelayEssayScore = {
    categories,
    total,
    possible,
    standout: data.standout?.trim() ?? "",
    perfect: possible > 0 && total === possible,
  };

  return {
    system,
    output: score,
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
 * Grade a whole room.
 *
 * Bounded concurrency: a 32-student class is 32 Claude calls, and firing them
 * all at once risks rate limits and a stalled projector. Six at a time keeps
 * total wall time near a single call's latency while staying well inside
 * limits. One essay failing to grade must not sink the rest — those come back
 * as a zeroed score carrying the error, so the reveal still runs.
 */
export async function gradeRelayRoom<T extends { essayOwnerId: string; sections: string[] }>(
  essays: T[],
  ctx: { prompt: string; essayType: string },
  concurrency = 6
): Promise<{
  results: Array<{ essayOwnerId: string; score: RelayEssayScore }>;
  failed: number;
  firstError: unknown;
}> {
  const results: Array<{ essayOwnerId: string; score: RelayEssayScore }> = [];
  let failed = 0;
  let firstError: unknown = null;
  let cursor = 0;

  async function worker() {
    while (cursor < essays.length) {
      const mine = essays[cursor++];
      try {
        const { output } = await gradeRelayEssay({
          prompt: ctx.prompt,
          essayType: ctx.essayType,
          sections: mine.sections,
        });
        results.push({ essayOwnerId: mine.essayOwnerId, score: output });
      } catch (err) {
        console.error(`[relay] grading failed for essay ${mine.essayOwnerId}:`, err);
        failed++;
        if (firstError === null) firstError = err;
        const essayType = (["DBQ", "LEQ", "SAQ"].includes(ctx.essayType) ? ctx.essayType : "LEQ") as EssayType;
        const rubric = RUBRIC_TEMPLATES[essayType];
        results.push({
          essayOwnerId: mine.essayOwnerId,
          score: {
            categories: rubric.map((c) => ({
              category: c.category,
              earned: 0,
              possible: c.points_possible,
              reason: "Grading failed for this essay — ask your teacher to re-run it.",
            })),
            total: 0,
            possible: rubric.reduce((s, c) => s + c.points_possible, 0),
            standout: "",
            perfect: false,
          },
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, essays.length) }, worker));
  return { results, failed, firstError };
}
