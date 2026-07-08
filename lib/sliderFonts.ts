// Every font pairs a browser-side stack (for the live editor preview, with
// generic fallbacks) with a single exact PPTX face name (what pptxgenjs writes
// into the exported file's <a:latin typeface="..."> — must be one real font
// name, not a CSS stack, or PowerPoint can't match it and silently substitutes
// its own default). System fonts need no webfont load; Google fonts do, via
// GoogleFontsLoader, and PowerPoint substitutes a fallback on any machine that
// doesn't have that Google font installed locally.
export interface SliderFont {
  id: string;
  label: string;
  cssStack: string;
  pptxFace: string;
  google?: string; // Google Fonts family param, e.g. "Playfair+Display:wght@400;700"
}

export const SLIDER_FONTS: SliderFont[] = [
  // System-safe — pre-installed on Windows/Mac/ChromeOS, identical everywhere.
  { id: "georgia", label: "Georgia", cssStack: "Georgia, serif", pptxFace: "Georgia" },
  { id: "verdana", label: "Verdana", cssStack: "Verdana, sans-serif", pptxFace: "Verdana" },
  { id: "arial", label: "Arial", cssStack: "Arial, sans-serif", pptxFace: "Arial" },
  { id: "trebuchet", label: "Trebuchet MS", cssStack: "'Trebuchet MS', sans-serif", pptxFace: "Trebuchet MS" },
  { id: "times", label: "Times New Roman", cssStack: "'Times New Roman', serif", pptxFace: "Times New Roman" },

  // Google Fonts — look right in the live editor; exported PPTX references
  // the name directly and looks perfect on a machine that has it installed.
  {
    id: "poppins",
    label: "Poppins",
    cssStack: "'Poppins', sans-serif",
    pptxFace: "Poppins",
    google: "Poppins:wght@400;600;700",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    cssStack: "'Playfair Display', serif",
    pptxFace: "Playfair Display",
    google: "Playfair+Display:wght@400;700",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    cssStack: "'Merriweather', serif",
    pptxFace: "Merriweather",
    google: "Merriweather:wght@400;700",
  },
  {
    id: "montserrat",
    label: "Montserrat",
    cssStack: "'Montserrat', sans-serif",
    pptxFace: "Montserrat",
    google: "Montserrat:wght@400;600;700",
  },
  {
    id: "roboto-slab",
    label: "Roboto Slab",
    cssStack: "'Roboto Slab', serif",
    pptxFace: "Roboto Slab",
    google: "Roboto+Slab:wght@400;700",
  },
  {
    id: "lato",
    label: "Lato",
    cssStack: "'Lato', sans-serif",
    pptxFace: "Lato",
    google: "Lato:wght@400;700",
  },
  {
    id: "oswald",
    label: "Oswald",
    cssStack: "'Oswald', sans-serif",
    pptxFace: "Oswald",
    google: "Oswald:wght@400;600",
  },
  {
    id: "nunito",
    label: "Nunito",
    cssStack: "'Nunito', sans-serif",
    pptxFace: "Nunito",
    google: "Nunito:wght@400;700",
  },
  {
    id: "bebas-neue",
    label: "Bebas Neue",
    cssStack: "'Bebas Neue', sans-serif",
    pptxFace: "Bebas Neue",
    google: "Bebas+Neue:wght@400",
  },
  {
    id: "libre-baskerville",
    label: "Libre Baskerville",
    cssStack: "'Libre Baskerville', serif",
    pptxFace: "Libre Baskerville",
    google: "Libre+Baskerville:wght@400;700",
  },
];

export function getFont(fontId: string): SliderFont {
  return SLIDER_FONTS.find((f) => f.id === fontId) ?? SLIDER_FONTS[0];
}

// One CSS2 stylesheet link covering every Google font used by a preset or
// custom theme — loaded once per /slider page via GoogleFontsLoader.
export function buildGoogleFontsHref(): string {
  const families = SLIDER_FONTS.filter((f) => f.google).map((f) => `family=${f.google}`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
