import type { Metadata } from "next";
import KoraDemoApp from "@/components/kora/KoraDemoApp";

export const metadata: Metadata = {
  title: "KORA Live Demo — Sinon Learning",
  description:
    "Research a concept, then let KORA assess your understanding and guide you to mastery through Socratic discovery.",
};

export default function KoraDemoPage() {
  return <KoraDemoApp />;
}
