import { randomUUID } from "crypto";
import { z } from "zod";
import { REEL_TEMPLATES } from "./reelTemplates";
import { buildBeatFromSlots } from "./reelBeatSlots";
import type { Beat } from "./reelTypes";
import { ReelBuildSchema, type ReelBeatOutput, type ReelBuildOutput } from "./reelAiTypes";
import { callKoraStructured } from "./koraServer";
import type { KoraLabGenerateOverrides, KoraLabGenerateResult } from "./koraLab/registry";

const REEL_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, scripting a short classroom EXPLAINER VIDEO in the Reel app " +
  "from a short conversation with a teacher. The video is narrated by the teacher over clean animated slides — " +
  "think a calm, well-paced explainer, not a lecture. You write the SCRIPT as a sequence of short 'beats'. Each " +
  "beat is ONE on-screen animation chosen from a fixed set of templates, plus the exact narration the teacher " +
  "will read aloud over it. Return a single JSON object matching the schema exactly. No prose, no markdown " +
  "outside the JSON. " +
  "CRITICAL RULES: " +
  "(1) You never write animation code — you only pick a template_id per beat and fill a small set of GENERIC " +
  "fields: text1, text2, text3, text4, text5 (short strings) and items (a string array). Every template reuses " +
  "these same generic slots for different purposes — set ONLY the slots below for the template you picked, and " +
  "leave every other field (including image_query unless noted) unset: " +
  "titleCard → text1 (headline), text2 (subtitle); " +
  "bulletReveal → text1 (heading), items (2-5 short bullet phrases); " +
  "imageCaption → text1 (caption), image_query; " +
  "labeledDiagram → text1 (center label), items (2-4 surrounding labels), optional image_query; " +
  "beforeAfter → text1 (left title), text2 (left detail), text3 (right title), text4 (right detail), text5 " +
  "(arrow label, e.g. 'leads to'); " +
  "timeline → items (events, each formatted as 'label: detail'); " +
  "simpleGraph → text1 (x-axis label), text2 (y-axis label), text3 (trend: 'up'|'down'|'flat'), text4 (caption). " +
  "(2) For any beat that references a concrete real-world thing (a place, a person, a book, a chart, an object), " +
  "prefer the imageCaption template and set image_query to a short web-image search phrase for it (e.g. 'New York " +
  "Stock Exchange trading floor', 'cover of the book Educated by Tara Westover'). Do NOT invent image URLs or " +
  "describe images you can't guarantee exist — image_query is a SEARCH phrase the teacher will approve. " +
  "(3) narration is the spoken script for that beat: 1-3 natural sentences the teacher reads aloud. Keep on-screen " +
  "text SHORT (headlines a few words; bullets short phrases under ~8 words) — the depth lives in the narration, " +
  "not the slide. " +
  "(4) animation_seconds is a rough on-screen duration (title ~4s, a few bullets ~8s, an image ~6s); the app " +
  "extends each beat to fit the recorded narration, so don't overthink it. " +
  "(5) Build a real arc: open with a titleCard, then alternate concise teaching beats with at least one image, " +
  "and end on a short takeaway. Aim for the requested length.";

export const ReelBuildInputSchema = z.object({
  topic: z.string().min(1),
  audience: z.string().default(""),
  keyPoints: z.string().default(""),
  length: z.string().default("Medium (~8 beats)"),
  notes: z.string().default(""),
});
export type ReelBuildInput = z.infer<typeof ReelBuildInputSchema>;

function buildReelUserMessage(input: ReelBuildInput): string {
  const lines = [`Topic: ${input.topic}`];
  if (input.audience) lines.push(`Audience: ${input.audience}`);
  if (input.keyPoints) lines.push(`Key points to cover: ${input.keyPoints}`);
  lines.push(`Desired length: ${input.length}`);
  if (input.notes) lines.push(`Additional notes from the teacher: ${input.notes}`);

  lines.push(
    `\nAvailable beat templates (pick one per beat, fill only its fields):`,
    REEL_TEMPLATES.map((t) => `- "${t.id}": ${t.description}`).join("\n"),
    `\nRules:`,
    `1. First beat must be a "titleCard".`,
    `2. Use "imageCaption" (with an image_query) whenever the script names a concrete real thing.`,
    `3. Keep on-screen text short; put the substance in narration (1-3 spoken sentences per beat).`,
    `4. Match the requested length in number of beats.`
  );
  return lines.join("\n");
}

// Map KORA's flat generic-slot beat output into a full Beat with per-template
// params. The mapping itself lives in the client-safe lib/reelBeatSlots.ts
// (this file pulls in server-only deps); this wrapper just supplies a real id.
export function toBeat(b: ReelBeatOutput): Beat {
  return buildBeatFromSlots(b, randomUUID());
}

export async function generateReelScript(
  input: ReelBuildInput,
  overrides?: KoraLabGenerateOverrides
): Promise<KoraLabGenerateResult<ReelBuildOutput>> {
  const system = overrides?.systemPromptOverride ?? REEL_SYSTEM_PROMPT;
  const model = overrides?.model ?? "claude-opus-4-8";
  const thinking = overrides?.thinking ?? true;
  const maxTokens = 8192;
  const { data } = await callKoraStructured({
    model,
    maxTokens,
    system,
    cacheSystemPrompt: true,
    ...(thinking ? { thinking: { type: "adaptive" as const } } : {}),
    messages: [{ role: "user", content: buildReelUserMessage(input) }],
    schema: ReelBuildSchema,
  });
  return {
    system,
    output: data,
    configUsed: { model, thinking, maxTokens, label: overrides?.label, systemPromptOverride: overrides?.systemPromptOverride },
  };
}
