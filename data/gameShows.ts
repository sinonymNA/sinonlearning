import type { LucideIcon } from "lucide-react";
import { Grid3x3, CircleDot, MessageSquareQuote, Zap, Layers } from "lucide-react";
import type { GameShowType } from "@/lib/gameShowTypes";

export interface GameShowTypeInfo {
  type: GameShowType;
  label: string;
  tagline: string;
  description: string;
  accent: "teal" | "purple" | "amber" | "rose" | "fuchsia";
  icon: LucideIcon;
}

export const gameShowCatalog: GameShowTypeInfo[] = [
  {
    type: "grid",
    label: "Trivia Grid",
    tagline: "Categories, point values, and a big reveal—the classic trivia board.",
    description:
      "Five categories of clues worth increasing points. Teams pick a category and value, you reveal the question, then the answer.",
    accent: "teal",
    icon: Grid3x3,
  },
  {
    type: "wheel",
    label: "Mystery Wheel",
    tagline: "Spin for points, then guess the hidden phrase letter by letter.",
    description:
      "A spinning wheel sets the stakes, then the class calls out letters to reveal a hidden word or phrase.",
    accent: "purple",
    icon: CircleDot,
  },
  {
    type: "feud",
    label: "Top Answers Showdown",
    tagline: "Guess the most popular answers before you run out of strikes.",
    description:
      "Reveal ranked answers to a prompt one at a time, tracking wrong guesses with strikes—just like the classic answers board.",
    accent: "amber",
    icon: MessageSquareQuote,
  },
  {
    type: "race",
    label: "Lightning Trivia Race",
    tagline: "Fast multiple-choice questions with a live team leaderboard.",
    description:
      "Quick-fire multiple-choice questions, one at a time, with a running leaderboard to keep the energy up.",
    accent: "rose",
    icon: Zap,
  },
  {
    type: "memory",
    label: "Memory Match",
    tagline: "Flip cards to match terms with their definitions.",
    description:
      "A classic concentration game built from term/definition pairs—great for vocabulary review.",
    accent: "fuchsia",
    icon: Layers,
  },
];

export function getGameShowTypeInfo(type: string): GameShowTypeInfo | undefined {
  return gameShowCatalog.find((entry) => entry.type === type);
}
