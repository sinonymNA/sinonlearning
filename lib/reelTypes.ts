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
  | "simpleGraph"
  | "statCallout"
  | "quote"
  | "comparisonList"
  | "numberedSteps";

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
  themeId: string;
  created_at: string;
  updated_at: string;
}

// A small set of built-in looks — each pairs a color palette with a font
// pairing. Shared as the contract between the TS preview and the Python
// renderer: reel_worker/templates.py's THEMES dict mirrors this array
// exactly (same ids, same hex values, same font family names) since the
// fonts referenced here are bundled into the render worker's Docker image
// (reel_worker/fonts/) — this is real typography baked into the video
// pixels, not just a browser-preview affordance.
export interface ReelTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    heading: string;
    body: string;
    accent: string;
    panel: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export const REEL_THEMES: ReelTheme[] = [
  {
    id: "cream-rose",
    name: "Cream & Rose",
    colors: {
      background: "#F8F2E6", // warm cream (site's own cream-100 brand token)
      heading: "#0D1B2E", // deep navy — matches the site's primary text color
      body: "#8B7D87", // muted warm mauve-taupe
      accent: "#B0567A", // dusty pastel rose
      panel: "#F0E6D3", // soft neutral panel fill
    },
    fonts: { heading: "Inter", body: "Inter" },
  },
  {
    id: "warm-academic",
    name: "Warm Academic",
    colors: {
      // Deliberately mirrors Slider's own "Warm Academic" theme (lib/sliderThemes.ts)
      // so a teacher using both apps gets a recognizably matching look.
      background: "#F3E9D8",
      heading: "#7C2D12",
      body: "#57534E",
      accent: "#C2410C",
      panel: "#EAD9BE",
    },
    fonts: { heading: "Fraunces", body: "Inter" },
  },
  {
    id: "handwritten",
    name: "Handwritten Notebook",
    colors: {
      background: "#FDFBF6",
      heading: "#2D3142", // soft graphite
      body: "#6B7280",
      accent: "#6FA287", // pastel sage green
      panel: "#E7EFE9",
    },
    fonts: { heading: "Patrick Hand", body: "Patrick Hand" },
  },
];

export const DEFAULT_REEL_THEME_ID = REEL_THEMES[0].id;

export function getReelTheme(themeId: string | null | undefined): ReelTheme {
  return REEL_THEMES.find((t) => t.id === themeId) ?? REEL_THEMES[0];
}

export const REEL_WIDTH = 1920;
export const REEL_HEIGHT = 1080;
export const REEL_FPS = 30;
