import { z } from "zod";

export const KoraSlideLayoutSchema = z.enum([
  "title",
  "titleBody",
  "titleBullets",
  "twoColumn",
  "titleImageBody",
  "imageFull",
  "quote",
]);

// Never includes an image field — Slider always attaches images separately,
// after generation, via the teacher's own search/upload.
export const KoraSlideSchema = z.object({
  layout: KoraSlideLayoutSchema,
  title: z.string().optional(),
  subtitle: z.string().optional(),
  body: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  // A fixed-length tuple isn't expressible in the structured-outputs JSON
  // schema subset, so this is an array with the 2-item bound validated
  // client-side by the SDK.
  columns: z.array(z.string()).min(2).max(2).optional(),
  quoteText: z.string().optional(),
  quoteAttribution: z.string().optional(),
  notes: z.string().optional(),
});

export const SliderKoraBuildSchema = z.object({
  deck_title: z.string().min(1),
  theme_id: z.string().min(1),
  slides: z.array(KoraSlideSchema).min(5).max(16),
});
export type SliderKoraBuildOutput = z.infer<typeof SliderKoraBuildSchema>;

// Phase 1 of the deck-generation pipeline: a lightweight content audit plus
// the pre-build decisions that should drive the deck's structure, made before
// any slide exists — rather than discovered by looking back at a finished
// deck. Structured fields (not one prose blob) so each decision is guaranteed
// to exist rather than risking one getting buried in the others.
export const SliderDesignBriefSchema = z.object({
  contentAudit: z.string().min(1),
  activityMoment: z.string().min(1),
  personalConnection: z.string().min(1),
  vividDetail: z.string().min(1),
  closingQuestion: z.string().min(1),
  structuralApproach: z.string().min(1),
});
export type SliderDesignBrief = z.infer<typeof SliderDesignBriefSchema>;

// Phase 3: an adversarial check against the built deck. `relevantSlideIndices`
// lets a conditional revise pass target exactly the slides that need fixing
// instead of guessing from prose alone.
export const SliderRedTeamSchema = z.object({
  examQuestions: z
    .array(
      z.object({
        question: z.string().min(1),
        coverageSufficient: z.enum(["yes", "partially", "no"]),
        relevantSlideIndices: z.array(z.number().int()),
        gapIfNotSufficient: z.string().optional(),
      })
    )
    .length(3),
  gapStatement: z.string().min(1),
});
export type SliderRedTeamOutput = z.infer<typeof SliderRedTeamSchema>;
