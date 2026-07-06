export type SlideLayout =
  | "title" // big centered title + optional subtitle — deck opener/section cover
  | "titleBody" // header + one body paragraph
  | "titleBullets" // header + bullet list
  | "twoColumn" // header + two side-by-side body/bullet blocks
  | "titleImageBody" // header + image region + body text
  | "imageFull" // full-bleed image with a small title/caption overlay
  | "quote"; // large centered quote + attribution, no header

export interface SlideImage {
  id: string; // references slider_images.id
  attribution?: string | null;
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  columns?: [string, string]; // twoColumn only
  image?: SlideImage | null;
  quoteText?: string;
  quoteAttribution?: string;
  notes?: string; // speaker notes, not rendered on the slide itself
}

export interface SliderDeck {
  id: string;
  teacher_id: string;
  title: string;
  theme_id: string;
  slides: Slide[];
  created_at: string;
  updated_at: string;
}

export const SLIDE_LAYOUTS: { value: SlideLayout; label: string; description: string }[] = [
  { value: "title", label: "Title", description: "Big centered title + optional subtitle" },
  { value: "titleBody", label: "Header + Text", description: "Header with a single body paragraph" },
  { value: "titleBullets", label: "Header + Bullets", description: "Header with a bullet list" },
  { value: "twoColumn", label: "Two Columns", description: "Header with two side-by-side text blocks" },
  { value: "titleImageBody", label: "Image + Text", description: "Header, an image, and body text" },
  { value: "imageFull", label: "Full Image", description: "Full-bleed image with a caption overlay" },
  { value: "quote", label: "Quote", description: "Large centered quote and attribution" },
];

export function hasImageRegion(layout: SlideLayout): boolean {
  return layout === "titleImageBody" || layout === "imageFull";
}

function newSlideId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `slide-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createSlide(layout: SlideLayout): Slide {
  const base: Slide = { id: newSlideId(), layout };
  switch (layout) {
    case "title":
      return { ...base, title: "Untitled deck", subtitle: "" };
    case "titleBody":
      return { ...base, title: "New slide", body: "" };
    case "titleBullets":
      return { ...base, title: "New slide", bullets: [""] };
    case "twoColumn":
      return { ...base, title: "New slide", columns: ["", ""] };
    case "titleImageBody":
      return { ...base, title: "New slide", body: "", image: null };
    case "imageFull":
      return { ...base, title: "", image: null };
    case "quote":
      return { ...base, quoteText: "", quoteAttribution: "" };
  }
}
