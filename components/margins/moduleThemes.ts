import { Search, Clock, EyeOff, Landmark, Users, Gavel, Timer, type LucideIcon } from "lucide-react";

export interface ModuleTheme {
  icon: LucideIcon;
  pill: string;
  labelText: string;
  cardBorder: string;
  ring: string;
  iconBg: string;
  iconText: string;
}

const DEFAULT_THEME: ModuleTheme = {
  icon: Search,
  pill: "bg-teal-500",
  labelText: "text-teal-500",
  cardBorder: "border-teal-100",
  ring: "ring-teal-200",
  iconBg: "bg-teal-100",
  iconText: "text-teal-600",
};

// One distinct color + icon per module — reusing hues already established
// elsewhere in Margins (CHARACTER_META, ComparisonChart) so nothing new is
// introduced to the palette. Keyed by module id, not array index, so it
// can't silently drift if modules are reordered.
export const MODULE_THEMES: Record<string, ModuleTheme> = {
  "the-vanishing": DEFAULT_THEME,
  "the-alibi": {
    icon: Clock,
    pill: "bg-violet-500",
    labelText: "text-violet-500",
    cardBorder: "border-violet-100",
    ring: "ring-violet-200",
    iconBg: "bg-violet-100",
    iconText: "text-violet-600",
  },
  "the-betrayal": {
    icon: EyeOff,
    pill: "bg-rose-500",
    labelText: "text-rose-500",
    cardBorder: "border-rose-100",
    ring: "ring-rose-200",
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
  },
  "the-bridge": {
    icon: Landmark,
    pill: "bg-amber-500",
    labelText: "text-amber-600",
    cardBorder: "border-amber-100",
    ring: "ring-amber-200",
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
  },
  "conflicting-accounts": {
    icon: Users,
    pill: "bg-sky-500",
    labelText: "text-sky-500",
    cardBorder: "border-sky-100",
    ring: "ring-sky-200",
    iconBg: "bg-sky-100",
    iconText: "text-sky-600",
  },
  "the-verdict": {
    icon: Gavel,
    pill: "bg-indigo-500",
    labelText: "text-indigo-500",
    cardBorder: "border-indigo-100",
    ring: "ring-indigo-200",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
  },
  capstone: {
    icon: Timer,
    pill: "bg-orange-500",
    labelText: "text-orange-600",
    cardBorder: "border-orange-100",
    ring: "ring-orange-200",
    iconBg: "bg-orange-100",
    iconText: "text-orange-700",
  },
};

export function getModuleTheme(moduleId: string): ModuleTheme {
  return MODULE_THEMES[moduleId] ?? DEFAULT_THEME;
}
