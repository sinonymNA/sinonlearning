import { z } from "zod";

// KORA "script -> beats" output. Fields are FLAT and optional (not a dynamic
// params record) so they translate cleanly to the structured-output JSON schema
// subset — mirrors how Slider's KoraSlideSchema uses flat optional fields that
// the route maps into a Slide. The route maps these into each Beat's `params`.
//
// Note: KORA emits `image_query` (WHAT to search for), never image data — the
// app fetches/persists the image and the teacher approves, exactly like Slider.

export const ReelBeatSchema = z.object({
  template_id: z.enum(["titleCard", "bulletReveal", "imageCaption"]),
  headline: z.string().optional(),
  subtitle: z.string().optional(),
  heading: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  caption: z.string().optional(),
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
