export type GameShowAccent = "teal" | "purple" | "amber" | "rose" | "fuchsia";

interface AccentStyle {
  text: string;
  border: string;
  hoverBorder: string;
  bg: string;
  glow: string;
  solidBg: string;
  solidText: string;
}

export const ACCENT_STYLES: Record<GameShowAccent, AccentStyle> = {
  teal: {
    text: "text-teal-300",
    border: "border-teal-300/30",
    hoverBorder: "hover:border-teal-300/50",
    bg: "bg-teal-400/10",
    glow: "bg-teal-400/20",
    solidBg: "bg-teal-300",
    solidText: "text-navy-950",
  },
  purple: {
    text: "text-purple-300",
    border: "border-purple-300/30",
    hoverBorder: "hover:border-purple-300/50",
    bg: "bg-purple-400/10",
    glow: "bg-purple-500/20",
    solidBg: "bg-purple-300",
    solidText: "text-navy-950",
  },
  amber: {
    text: "text-amber-300",
    border: "border-amber-300/30",
    hoverBorder: "hover:border-amber-300/50",
    bg: "bg-amber-400/10",
    glow: "bg-amber-400/20",
    solidBg: "bg-amber-300",
    solidText: "text-navy-950",
  },
  rose: {
    text: "text-rose-300",
    border: "border-rose-300/30",
    hoverBorder: "hover:border-rose-300/50",
    bg: "bg-rose-400/10",
    glow: "bg-rose-500/20",
    solidBg: "bg-rose-300",
    solidText: "text-navy-950",
  },
  fuchsia: {
    text: "text-fuchsia-300",
    border: "border-fuchsia-300/30",
    hoverBorder: "hover:border-fuchsia-300/50",
    bg: "bg-fuchsia-400/10",
    glow: "bg-fuchsia-500/20",
    solidBg: "bg-fuchsia-300",
    solidText: "text-navy-950",
  },
};

export const TEAM_ACCENT_CYCLE: GameShowAccent[] = ["teal", "purple", "amber", "rose", "fuchsia"];
