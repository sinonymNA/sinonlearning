import { getFont } from "./sliderFonts";

export interface SliderThemeFont {
  css: string; // full CSS stack for the live preview, e.g. "'Playfair Display', serif"
  pptx: string; // exact face name written into the exported PPTX, e.g. "Playfair Display"
}

export interface SliderTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    surface: string;
    heading: string;
    body: string;
    accent: string;
  };
  fonts: {
    heading: SliderThemeFont;
    body: SliderThemeFont;
  };
  custom?: boolean;
}

function font(fontId: string): SliderThemeFont {
  const f = getFont(fontId);
  return { css: f.cssStack, pptx: f.pptxFace };
}

export const SLIDER_THEMES: SliderTheme[] = [
  {
    id: "modern-violet",
    name: "Modern Violet",
    colors: {
      background: "#FFFFFF",
      surface: "#F5F3FF",
      heading: "#312E81",
      body: "#44403C",
      accent: "#7C3AED",
    },
    fonts: { heading: font("georgia"), body: font("verdana") },
  },
  {
    id: "chalkboard",
    name: "Chalkboard",
    colors: {
      background: "#1F2A24",
      surface: "#24352C",
      heading: "#FFFFFF",
      body: "#E7E5E4",
      accent: "#FBBF24",
    },
    fonts: { heading: font("trebuchet"), body: font("verdana") },
  },
  {
    id: "minimal-mono",
    name: "Minimal Mono",
    colors: {
      background: "#FFFFFF",
      surface: "#FAFAFA",
      heading: "#18181B",
      body: "#3F3F46",
      accent: "#000000",
    },
    fonts: { heading: font("arial"), body: font("arial") },
  },
  {
    id: "warm-academic",
    name: "Warm Academic",
    colors: {
      background: "#FBF7F0",
      surface: "#F3E9D8",
      heading: "#7C2D12",
      body: "#57534E",
      accent: "#C2410C",
    },
    fonts: { heading: font("georgia"), body: font("georgia") },
  },
  {
    id: "bold-primary",
    name: "Bold Primary",
    colors: {
      background: "#FFFFFF",
      surface: "#EFF6FF",
      heading: "#1E3A8A",
      body: "#1F2937",
      accent: "#DC2626",
    },
    fonts: { heading: font("trebuchet"), body: font("verdana") },
  },
  {
    id: "slate-steel",
    name: "Slate Steel",
    colors: {
      background: "#0F172A",
      surface: "#1E293B",
      heading: "#F1F5F9",
      body: "#CBD5E1",
      accent: "#38BDF8",
    },
    fonts: { heading: font("arial"), body: font("arial") },
  },
  {
    id: "editorial-serif",
    name: "Editorial Serif",
    colors: {
      background: "#FFFDF9",
      surface: "#F6F1E7",
      heading: "#1C1917",
      body: "#44403C",
      accent: "#B45309",
    },
    fonts: { heading: font("playfair"), body: font("lato") },
  },
  {
    id: "field-notes",
    name: "Field Notes",
    colors: {
      background: "#FAF9F6",
      surface: "#EFEBE2",
      heading: "#3F3D2E",
      body: "#5B5847",
      accent: "#6B8E23",
    },
    fonts: { heading: font("roboto-slab"), body: font("nunito") },
  },
  {
    id: "poster-pop",
    name: "Poster Pop",
    colors: {
      background: "#FFFBEB",
      surface: "#FEF3C7",
      heading: "#7C2D12",
      body: "#3F3F46",
      accent: "#EA580C",
    },
    fonts: { heading: font("bebas-neue"), body: font("montserrat") },
  },
  {
    id: "midnight-lecture",
    name: "Midnight Lecture",
    colors: {
      background: "#111827",
      surface: "#1F2937",
      heading: "#F9FAFB",
      body: "#D1D5DB",
      accent: "#A78BFA",
    },
    fonts: { heading: font("oswald"), body: font("lato") },
  },
];

export const DEFAULT_THEME_ID = SLIDER_THEMES[0].id;

export function getTheme(themeId: string): SliderTheme {
  return SLIDER_THEMES.find((t) => t.id === themeId) ?? SLIDER_THEMES[0];
}

// Resolves a deck's theme_id against the built-in presets first, then a
// teacher's own saved custom themes (custom theme ids are random UUIDs, so
// they never collide with the preset slugs above).
export function resolveTheme(themeId: string, customThemes: SliderTheme[] = []): SliderTheme {
  return (
    SLIDER_THEMES.find((t) => t.id === themeId) ??
    customThemes.find((t) => t.id === themeId) ??
    SLIDER_THEMES[0]
  );
}
