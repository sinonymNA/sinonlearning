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
    text: "text-blue-700",
    border: "border-blue-200",
    hoverBorder: "hover:border-blue-400",
    bg: "bg-blue-50",
    glow: "bg-blue-100",
    solidBg: "bg-blue-600",
    solidText: "text-white",
  },
  purple: {
    text: "text-violet-700",
    border: "border-violet-200",
    hoverBorder: "hover:border-violet-400",
    bg: "bg-violet-50",
    glow: "bg-violet-100",
    solidBg: "bg-violet-600",
    solidText: "text-white",
  },
  amber: {
    text: "text-amber-700",
    border: "border-amber-200",
    hoverBorder: "hover:border-amber-400",
    bg: "bg-amber-50",
    glow: "bg-amber-100",
    solidBg: "bg-amber-500",
    solidText: "text-white",
  },
  rose: {
    text: "text-rose-700",
    border: "border-rose-200",
    hoverBorder: "hover:border-rose-400",
    bg: "bg-rose-50",
    glow: "bg-rose-100",
    solidBg: "bg-rose-600",
    solidText: "text-white",
  },
  fuchsia: {
    text: "text-fuchsia-700",
    border: "border-fuchsia-200",
    hoverBorder: "hover:border-fuchsia-400",
    bg: "bg-fuchsia-50",
    glow: "bg-fuchsia-100",
    solidBg: "bg-fuchsia-600",
    solidText: "text-white",
  },
};

export const TEAM_ACCENT_CYCLE: GameShowAccent[] = ["teal", "purple", "amber", "rose", "fuchsia"];
