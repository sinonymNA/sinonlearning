import { inter, fraunces, patrickHand } from "./siteFonts";

// Loads the exact font families REEL_THEMES reference (lib/reelTypes.ts) so
// the in-browser editor preview visually matches the Manim-rendered video —
// the render worker bundles these same font files (reel_worker/fonts/) and
// references them by the same family name.

export const REEL_FONT_CLASS: Record<string, string> = {
  Inter: inter.className,
  Fraunces: fraunces.className,
  "Patrick Hand": patrickHand.className,
};

export function reelFontClass(family: string): string {
  return REEL_FONT_CLASS[family] ?? "";
}
