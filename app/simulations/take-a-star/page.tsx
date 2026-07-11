import type { Metadata } from "next";
import TakeAStarClient from "@/components/simulations/take-a-star/TakeAStarClient";

export const metadata: Metadata = {
  title: "Take a Star — Maritime Navigation Simulation",
  description: "Use a mariner's astrolabe aboard a sixteenth-century Indian Ocean voyage and discover how knowledge, technology, and empire crossed the seas.",
};

export default function TakeAStarPage() {
  return <TakeAStarClient />;
}
