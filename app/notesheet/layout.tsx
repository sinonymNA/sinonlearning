import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scaffold — AI Notesheets by Sinon Learning",
  description: "Upload your slideshow and get a structured student notesheet in seconds, powered by KORA.",
};

export default function ScaffoldLayout({ children }: { children: React.ReactNode }) {
  return children;
}
