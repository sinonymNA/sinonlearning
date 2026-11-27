import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pacer — Read PDFs and Books Faster | Sinon Learning",
  description: "A free reader that paces your reading: open a PDF or EPUB and read it one word at a time, with a moving highlight, or as a smooth auto-scroll. Choose your speed, train it up, and keep your comprehension. Private: files never leave your device.",
};

export default function PacerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
