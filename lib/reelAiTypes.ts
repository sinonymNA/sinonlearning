import { z } from "zod";

// KORA "script -> beats" output. Fields are FLAT and optional (not a dynamic
// params record) so they translate cleanly to the structured-output JSON schema
// subset — mirrors how Slider's KoraSlideSchema uses flat optional fields that
// the route maps into a Slide. The route maps these into each Beat's `params`.
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
  headline: z.string().optional(),
  subtitle: z.string().optional(),
  heading: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  caption: z.string().optional(),
  // labeledDiagram
  center_label: z.string().optional(),
  labels: z.array(z.string()).optional(),
  // beforeAfter
  left_title: z.string().optional(),
  left_body: z.string().optional(),
  right_title: z.string().optional(),
  right_body: z.string().optional(),
  arrow_label: z.string().optional(),
  // timeline
  events: z.array(z.string()).optional(),
  // simpleGraph
  x_label: z.string().optional(),
  y_label: z.string().optional(),
  trend: z.string().optional(),
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
