// Theme fonts are deliberately drawn from font names widely pre-installed on
// Windows/Mac/ChromeOS (Georgia, Verdana, Arial, Trebuchet MS) rather than
// loaded Google Fonts — pptxgenjs can only reference installed system fonts
// in the exported file (no webfont embedding), so picking from this common
// set is what keeps the live preview and the exported PPTX looking the same.
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
    heading: string;
    body: string;
  };
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
    fonts: { heading: "Georgia, serif", body: "Verdana, sans-serif" },
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
    fonts: { heading: "Trebuchet MS, sans-serif", body: "Verdana, sans-serif" },
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
    fonts: { heading: "Arial, sans-serif", body: "Arial, sans-serif" },
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
    fonts: { heading: "Georgia, serif", body: "Georgia, serif" },
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
    fonts: { heading: "Trebuchet MS, sans-serif", body: "Verdana, sans-serif" },
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
    fonts: { heading: "Arial, sans-serif", body: "Arial, sans-serif" },
  },
];

export const DEFAULT_THEME_ID = SLIDER_THEMES[0].id;

export function getTheme(themeId: string): SliderTheme {
  return SLIDER_THEMES.find((t) => t.id === themeId) ?? SLIDER_THEMES[0];
}
