import { z } from "zod";

// KORA "script -> beats" output. Fields are FLAT and optional (not a dynamic
// params record) so they translate cleanly to the structured-output JSON schema
// subset — mirrors how Slider's KoraSlideSchema uses flat optional fields that
// the route maps into a Slide. The route maps these into each Beat's `params`.
//
// text1-text5 and items are GENERIC slots reused across the 7 templates (a beat
// only ever uses one template, so the same slot never means two things at
// once), rather than one uniquely-named optional field per template purpose.
// Anthropic's structured outputs enforce an (undocumented-threshold) grammar
// complexity ceiling driven by a schema's total optional-field count — the
// earlier one-field-per-template-purpose version had 17 optional fields and
// tripped it in production ("Schema is too complex" 400 on every request).
// This version has 7. See app/api/reel/kora-build/route.ts's SYSTEM_PROMPT for
// the per-template slot meanings and its toBeat() for how slots map back to
// each template's real param keys.
//
// Note: KORA emits `image_query` (WHAT to search for), never image data — the
// app fetches/persists the image and the teacher approves, exactly like Slider.

export const ReelBeatSchema = z.object({
  template_id: z.enum([
    "titleCard",
    "bulletReveal",
    "imageCaption",
    "labeledDiagram",
    "beforeAfter",
    "timeline",
    "simpleGraph",
  ]),
  text1: z.string().optional(),
  text2: z.string().optional(),
  text3: z.string().optional(),
  text4: z.string().optional(),
  text5: z.string().optional(),
  items: z.array(z.string()).optional(),
  narration: z.string(),
  animation_seconds: z.number(),
  image_query: z.string().optional(),
});

export const ReelBuildSchema = z.object({
  title: z.string().min(1),
  beats: z.array(ReelBeatSchema).min(3).max(24),
});

export type ReelBuildOutput = z.infer<typeof ReelBuildSchema>;
export type ReelBeatOutput = z.infer<typeof ReelBeatSchema>;
