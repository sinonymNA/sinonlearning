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
    label: "Jeopardy!",
    tagline: "Categories, dollar values, and a big reveal — the classic trivia board.",
    description:
      "Five categories of clues worth increasing dollar amounts. Teams pick a category and value, you reveal the clue, then the answer.",
    accent: "teal",
    icon: Grid3x3,
  },
  {
    type: "wheel",
    label: "Wheel of Fortune",
    tagline: "Spin for points, then guess the hidden phrase letter by letter.",
    description:
      "A spinning prize wheel sets the stakes, then students call out letters to reveal a hidden word or phrase.",
    accent: "purple",
    icon: CircleDot,
  },
  {
    type: "feud",
    label: "Family Feud",
    tagline: "Name the most popular answers before you rack up three strikes.",
    description:
      "Reveal ranked survey answers one at a time, tracking wrong guesses with strikes — just like the classic show.",
    accent: "amber",
    icon: MessageSquareQuote,
  },
  {
    type: "race",
    label: "Who Wants to Be a Millionaire?",
    tagline: "Four choices, one correct answer — who has what it takes?",
    description:
      "Multiple-choice questions presented one at a time, Millionaire-style, with a running team leaderboard.",
    accent: "rose",
    icon: Zap,
  },
  {
    type: "memory",
    label: "Concentration",
    tagline: "Flip cards to match terms with their definitions.",
    description:
      "A classic concentration game built from term/definition pairs — great for vocabulary review.",
    accent: "fuchsia",
    icon: Layers,
  },
];

export function getGameShowTypeInfo(type: string): GameShowTypeInfo | undefined {
  return gameShowCatalog.find((entry) => entry.type === type);
}
