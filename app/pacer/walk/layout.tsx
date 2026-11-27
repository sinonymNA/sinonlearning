import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pacer Walk — Interval Walking Timer With Your Book Read Aloud | Sinon Learning",
  description: "Japanese-style interval walking: 3 minutes brisk, 3 minutes easy, 30 minutes, with tones that tell you when to switch while your book is read aloud. Add your Apple Health steps to estimate calories. Free and private.",
};

export default function PacerWalkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
