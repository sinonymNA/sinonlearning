import type { Metadata } from "next";
import ClothExperience from "@/components/simulations/cloth/ClothExperience";

export const metadata: Metadata = {
  title: "The Cloth That Conquered the World — AP World History",
  description: "Investigate one Indian cotton textile to uncover trade, labor, industrialization, and empire from 1450 to 1900.",
};

export default function ClothPage() {
  return <ClothExperience />;
}
