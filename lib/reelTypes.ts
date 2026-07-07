// Reel — data model for AI-assisted explainer videos.
//
// A project is an ordered list of "beats". Each beat maps to one animation
// TEMPLATE (rendered by the Manim worker) whose blanks are filled in `params`,
// plus optional narration (teleprompter text + recorded audio) and an optional
// image. KORA never writes animation code — it only picks a template per beat
// and fills the blanks, exactly like Slider's layout system.

export type ReelTemplateId =
  | "titleCard"
  | "bulletReveal"
  | "imageCaption"
  | "labeledDiagram"
  | "beforeAfter"
  | "timeline"
  | "simpleGraph";

export interface Beat {
  id: string;
  templateId: ReelTemplateId;
  // Filled blanks for this template. Values are strings or string lists
  // depending on the template's param definitions (see lib/reelTemplates.ts).
  params: Record<string, string | string[]>;
  // Reference to a stored image (reel_images.id) — KORA-suggested or uploaded.
  imageId?: string | null;
  // KORA's suggested web-image search phrase for this beat (image templates
  // only) — offered as a one-click search in the editor; never rendered.
  imageQuery?: string;
  // Teleprompter text the teacher reads for this beat.
  narration: string;
  // Baseline on-screen animation length in seconds (the final beat duration is
  // max(animationSeconds, recorded narration length), computed by the worker).
  animationSeconds: number;
  // Reference to the recorded narration clip (reel_audio.id) once made.
  audioId?: string | null;
}

export type ReelStatus = "draft" | "rendered" | "produced";

export interface ReelProject {
  id: string;
  teacher_id: string;
  title: string;
  beats: Beat[];
  status: ReelStatus;
  created_at: string;
  updated_at: string;
}

// A single clean built-in look for v1 (multiple themes are a later add). Shared
// as the contract between the TS preview and the Python renderer — the worker
// hardcodes the same values.
export const REEL_THEME = {
  background: "#F8F2E6", // warm cream (site's own cream-100 brand token)
  heading: "#0D1B2E", // deep navy — matches the site's primary text color
  body: "#8B7D87", // muted warm mauve-taupe
  accent: "#B0567A", // dusty pastel rose
  panel: "#F0E6D3", // soft neutral panel fill (beforeAfter boxes)
  font: "Inter", // a common font; the worker falls back gracefully
} as const;

export const REEL_WIDTH = 1920;
export const REEL_HEIGHT = 1080;
export const REEL_FPS = 30;
