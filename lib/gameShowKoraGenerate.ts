import { z } from "zod";
import { GAME_SHOW_TYPES, type RacePayload } from "./gameShowTypes";
import { GAME_SHOW_SCHEMAS } from "./gameShowSchemas";
import { buildGenerationPrompt } from "./gameShowPrompts";
import { callKoraStructured, KoraValidationError } from "./koraServer";
import type { KoraLabGenerateOverrides, KoraLabGenerateResult } from "./koraLab/registry";

export const GameShowGenerateInputSchema = z.object({
  type: z.enum(GAME_SHOW_TYPES as [string, ...string[]]),
  rawContent: z.string().min(1).max(6000),
});
export type GameShowGenerateInput = z.infer<typeof GameShowGenerateInputSchema>;

export async function generateGameShow(
  input: GameShowGenerateInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult> {
  const type = input.type as keyof typeof GAME_SHOW_SCHEMAS;
  const model = overrides?.model ?? "claude-sonnet-4-6";
  const maxTokens = 4096;
  // This route has no separate system role — the instructions and the
  // teacher's content are combined into one user message per-type, so a
  // systemPromptOverride isn't supported here (there's no separable
  // instructions channel to swap out without also dropping rawContent).
  // The no-content version of the template stands in as the lineage snapshot.
  const { data } = await callKoraStructured({
    model,
    maxTokens,
    messages: [{ role: "user", content: buildGenerationPrompt(type, input.rawContent) }],
    schema: GAME_SHOW_SCHEMAS[type],
  });

  if (type === "race") {
    const race = data as RacePayload;
    const badIndex = race.questions.some((q) => q.correctIndex >= q.choices.length);
    if (badIndex) {
      throw new KoraValidationError("Race question correctIndex out of bounds.");
    }
  }

  return {
    system: buildGenerationPrompt(type, ""),
    output: data,
    configUsed: { model, thinking: false, maxTokens, label: overrides?.label },
  };
}
