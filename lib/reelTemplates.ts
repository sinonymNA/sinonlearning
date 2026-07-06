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
