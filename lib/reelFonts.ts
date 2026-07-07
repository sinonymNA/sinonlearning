import { Inter, Fraunces, Patrick_Hand } from "next/font/google";

// Loads the exact font families REEL_THEMES reference (lib/reelTypes.ts) so
// the in-browser editor preview visually matches the Manim-rendered video —
// the render worker bundles these same font files (reel_worker/fonts/) and
// references them by the same family name.
const inter = Inter({ subsets: ["latin"], weight: ["400", "700"] });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["400", "700"] });
const patrickHand = Patrick_Hand({ subsets: ["latin"], weight: "400" });

export const REEL_FONT_CLASS: Record<string, string> = {
  Inter: inter.className,
  Fraunces: fraunces.className,
  "Patrick Hand": patrickHand.className,
};

export function reelFontClass(family: string): string {
  return REEL_FONT_CLASS[family] ?? "";
}
