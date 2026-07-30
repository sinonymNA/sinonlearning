// Reel — the animation template catalog. This is the single source of truth
// consumed by: the KORA prompt (stringified), body validation, the editor's
// template picker + param fields, the TS preview, and — kept in lockstep — the
// Python worker's `template_id -> Manim Scene` switch (reel_worker/templates/).
//
// Mirrors Slider's SLIDE_LAYOUTS + createSlide() pattern (lib/sliderTypes.ts).

import type { Beat, ReelTemplateId } from "./reelTypes";

export interface ReelParamDef {
  key: string;
  label: string;
  kind: "text" | "list";
  placeholder?: string;
}

export interface ReelTemplate {
  id: ReelTemplateId;
  label: string;
  description: string;
  params: ReelParamDef[];
  usesImage: boolean;
  defaultSeconds: number;
}

export const REEL_TEMPLATES: ReelTemplate[] = [
  {
    id: "titleCard",
    label: "Title Card",
    description: "Big centered title with an optional subtitle — opens the video or a section.",
    params: [
      { key: "headline", label: "Headline", kind: "text", placeholder: "The Hidden Cost of Everything" },
      { key: "subtitle", label: "Subtitle", kind: "text", placeholder: "A 2-minute intro to opportunity cost" },
    ],
    usesImage: false,
    defaultSeconds: 4,
  },
  {
    id: "bulletReveal",
    label: "Bullet Reveal",
    description: "A heading with 2–5 short points that animate in one at a time.",
    params: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "Three things to know" },
      { key: "bullets", label: "Bullets", kind: "list", placeholder: "One short point per line" },
    ],
    usesImage: false,
    defaultSeconds: 8,
  },
  {
    id: "imageCaption",
    label: "Image + Caption",
    description: "A photo eases in with a slow zoom, with a caption beneath — use when the script names a real thing (a place, a book, a chart).",
    params: [
      { key: "caption", label: "Caption", kind: "text", placeholder: "The New York Stock Exchange, 1929" },
    ],
    usesImage: true,
    defaultSeconds: 6,
  },
  {
    id: "labeledDiagram",
    label: "Labeled Diagram",
    description: "A central idea with arrows drawing out to 2–4 surrounding labels — great for causes, parts, or effects. Can include an image in the center.",
    params: [
      { key: "centerLabel", label: "Center label", kind: "text", placeholder: "Scarcity" },
      { key: "labels", label: "Surrounding labels", kind: "list", placeholder: "One label per line" },
    ],
    usesImage: true,
    defaultSeconds: 8,
  },
  {
    id: "beforeAfter",
    label: "Before → After",
    description: "Two side-by-side panels with an arrow between them — great for contrast, cause→effect, or change over time.",
    params: [
      { key: "leftTitle", label: "Left title", kind: "text", placeholder: "Before" },
      { key: "leftBody", label: "Left detail", kind: "text", placeholder: "Short phrase" },
      { key: "rightTitle", label: "Right title", kind: "text", placeholder: "After" },
      { key: "rightBody", label: "Right detail", kind: "text", placeholder: "Short phrase" },
      { key: "arrowLabel", label: "Arrow label", kind: "text", placeholder: "leads to" },
    ],
    usesImage: false,
    defaultSeconds: 7,
  },
  {
    id: "timeline",
    label: "Timeline",
    description: "A horizontal line that draws left-to-right with events popping in — great for sequences and history. Each event: 'label: detail'.",
    params: [
      { key: "events", label: "Events (label: detail)", kind: "list", placeholder: "1929: The Crash" },
    ],
    usesImage: false,
    defaultSeconds: 9,
  },
  {
    id: "simpleGraph",
    label: "Trend Graph",
    description: "Labeled axes with a line that plots an up, down, or flat trend — great for showing a relationship or change.",
    params: [
      { key: "xLabel", label: "X-axis label", kind: "text", placeholder: "Time" },
      { key: "yLabel", label: "Y-axis label", kind: "text", placeholder: "Price" },
      { key: "trend", label: "Trend (up / down / flat)", kind: "text", placeholder: "up" },
      { key: "caption", label: "Caption", kind: "text", placeholder: "As demand rises, price rises" },
    ],
    usesImage: false,
    defaultSeconds: 7,
  },
  {
    id: "statCallout",
    label: "Stat Callout",
    description: "One striking number takes over the screen with a label and short context — great for a single memorable figure.",
    params: [
      { key: "stat", label: "The number", kind: "text", placeholder: "$1.2 trillion" },
      { key: "label", label: "Label", kind: "text", placeholder: "U.S. student loan debt" },
      { key: "context", label: "Context", kind: "text", placeholder: "More than credit cards and auto loans combined" },
    ],
    usesImage: false,
    defaultSeconds: 6,
  },
  {
    id: "quote",
    label: "Quote",
    description: "A wrapped quotation with attribution and a decorative quotation mark — optionally paired with a small portrait.",
    params: [
      { key: "quote", label: "Quote", kind: "text", placeholder: "The unexamined life is not worth living." },
      { key: "attribution", label: "Attribution", kind: "text", placeholder: "Socrates" },
    ],
    usesImage: true,
    defaultSeconds: 7,
  },
  {
    id: "comparisonList",
    label: "Comparison List",
    description: "Two columns of several points each, fading in on their own side — for a real multi-point comparison, not just one line per side.",
    params: [
      { key: "leftTitle", label: "Left title", kind: "text", placeholder: "Confucianism" },
      { key: "rightTitle", label: "Right title", kind: "text", placeholder: "Buddhism" },
      { key: "items", label: "Points (prefix each with L: or R:)", kind: "list", placeholder: "L: Emphasizes social order" },
    ],
    usesImage: false,
    defaultSeconds: 10,
  },
  {
    id: "numberedSteps",
    label: "Numbered Steps",
    description: "A vertical line draws down as numbered steps pop in one at a time — great for a process or sequence.",
    params: [
      { key: "heading", label: "Heading", kind: "text", placeholder: "How a bill becomes a law" },
      { key: "steps", label: "Steps", kind: "list", placeholder: "One short step per line" },
    ],
    usesImage: false,
    defaultSeconds: 9,
  },
];

const TEMPLATE_BY_ID: Record<ReelTemplateId, ReelTemplate> = REEL_TEMPLATES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<ReelTemplateId, ReelTemplate>
);

export function getTemplate(id: ReelTemplateId): ReelTemplate {
  return TEMPLATE_BY_ID[id] ?? REEL_TEMPLATES[0];
}

export function isReelTemplateId(value: unknown): value is ReelTemplateId {
  return typeof value === "string" && value in TEMPLATE_BY_ID;
}

export function templateUsesImage(id: ReelTemplateId): boolean {
  return getTemplate(id).usesImage;
}

function newBeatId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `beat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Factory returning a fresh beat with only this template's params populated
// (empty), mirroring createSlide()'s per-layout switch.
export function createBeat(templateId: ReelTemplateId): Beat {
  const template = getTemplate(templateId);
  const params: Record<string, string | string[]> = {};
  for (const p of template.params) {
    params[p.key] = p.kind === "list" ? [""] : "";
  }
  return {
    id: newBeatId(),
    templateId,
    params,
    imageId: template.usesImage ? null : undefined,
    narration: "",
    animationSeconds: template.defaultSeconds,
    audioId: null,
  };
}
