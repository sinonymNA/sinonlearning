import type { Metadata } from "next";
import Classboard from "@/components/classboard/Classboard";

export const metadata: Metadata = {
  title: "Classboard — Sinon Learning",
  description:
    "Classboard is a free, all-in-one front-of-room display with a live agenda, timer, student randomizer, polls, exit tickets, and ambient YouTube backgrounds.",
};

export default function ClassboardPage() {
  return <Classboard />;
}
