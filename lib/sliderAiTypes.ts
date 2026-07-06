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
