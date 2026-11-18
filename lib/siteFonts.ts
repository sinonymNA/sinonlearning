import localFont from "next/font/local";

// Self-hosted copies of the Google fonts the site uses, so builds never depend on fetching
// fonts.googleapis.com (Railway builds failed on that). Files live in app/fonts/.
export const inter = localFont({
  src: [
    { path: "../app/fonts/inter-400.ttf", weight: "400", style: "normal" },
    { path: "../app/fonts/inter-500.ttf", weight: "500", style: "normal" },
    { path: "../app/fonts/inter-600.ttf", weight: "600", style: "normal" },
    { path: "../app/fonts/inter-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const fraunces = localFont({
  src: [
    { path: "../app/fonts/fraunces-400.ttf", weight: "400", style: "normal" },
    { path: "../app/fonts/fraunces-500.ttf", weight: "500", style: "normal" },
    { path: "../app/fonts/fraunces-600.ttf", weight: "600", style: "normal" },
    { path: "../app/fonts/fraunces-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-fraunces",
  display: "swap",
});

export const patrickHand = localFont({
  src: [{ path: "../app/fonts/patrickhand-400.ttf", weight: "400", style: "normal" }],
  display: "swap",
});
