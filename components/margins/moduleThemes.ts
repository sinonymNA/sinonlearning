import { Search, Clock, EyeOff, Landmark, Users, Gavel, Timer, type LucideIcon } from "lucide-react";

// ─── Shared accent palette ────────────────────────────────────────────────────
// The seven hues Margins already uses (CHARACTER_META, ComparisonChart, the
// practice modules). Previously these only existed inline inside MODULE_THEMES,
// so everything outside the practice courses defaulted to violet and the app
// read as monochrome. Lifted out here so class cards and anything else that
// needs a stable per-entity colour draws from the same set.
//
// Class strings are written out in full rather than composed — Tailwind scans
// source for literals, and an interpolated `bg-${hue}-100` is never emitted.

export interface MarginsAccent {
  /** Stable id, also the Tailwind hue name. */
  id: string;
  pill: string;
  labelText: string;
  cardBorder: string;
  /** Border colour on hover — the class-card affordance. */
  hoverBorder: string;
  ring: string;
  iconBg: string;
  iconText: string;
  /** Faint surface wash for stat tiles and card headers. */
  surface: string;
}

export const MARGINS_ACCENTS: MarginsAccent[] = [
  { id: "teal",   pill: "bg-teal-500",   labelText: "text-teal-500",   cardBorder: "border-teal-100",   hoverBorder: "hover:border-teal-300",   ring: "ring-teal-200",   iconBg: "bg-teal-100",   iconText: "text-teal-600",   surface: "bg-teal-50" },
  { id: "violet", pill: "bg-violet-500", labelText: "text-violet-500", cardBorder: "border-violet-100", hoverBorder: "hover:border-violet-300", ring: "ring-violet-200", iconBg: "bg-violet-100", iconText: "text-violet-600", surface: "bg-violet-50" },
  { id: "rose",   pill: "bg-rose-500",   labelText: "text-rose-500",   cardBorder: "border-rose-100",   hoverBorder: "hover:border-rose-300",   ring: "ring-rose-200",   iconBg: "bg-rose-100",   iconText: "text-rose-600",   surface: "bg-rose-50" },
  { id: "amber",  pill: "bg-amber-500",  labelText: "text-amber-600",  cardBorder: "border-amber-100",  hoverBorder: "hover:border-amber-300",  ring: "ring-amber-200",  iconBg: "bg-amber-100",  iconText: "text-amber-700",  surface: "bg-amber-50" },
  { id: "sky",    pill: "bg-sky-500",    labelText: "text-sky-500",    cardBorder: "border-sky-100",    hoverBorder: "hover:border-sky-300",    ring: "ring-sky-200",    iconBg: "bg-sky-100",    iconText: "text-sky-600",    surface: "bg-sky-50" },
  { id: "indigo", pill: "bg-indigo-500", labelText: "text-indigo-500", cardBorder: "border-indigo-100", hoverBorder: "hover:border-indigo-300", ring: "ring-indigo-200", iconBg: "bg-indigo-100", iconText: "text-indigo-600", surface: "bg-indigo-50" },
  { id: "orange", pill: "bg-orange-500", labelText: "text-orange-600", cardBorder: "border-orange-100", hoverBorder: "hover:border-orange-300", ring: "ring-orange-200", iconBg: "bg-orange-100", iconText: "text-orange-700", surface: "bg-orange-50" },
];

function accentById(id: string): MarginsAccent {
  return MARGINS_ACCENTS.find((a) => a.id === id) ?? MARGINS_ACCENTS[0];
}

/**
 * Deterministic accent for an arbitrary key (a class id, say).
 *
 * Hashing the key rather than using list position means a class keeps its
 * colour when another is created or deleted — colour becomes a recognisable
 * property of that class instead of a side effect of sort order.
 */
export function accentForKey(key: string): MarginsAccent {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return MARGINS_ACCENTS[Math.abs(hash) % MARGINS_ACCENTS.length];
}

// ─── Practice module themes ───────────────────────────────────────────────────

export interface ModuleTheme extends MarginsAccent {
  icon: LucideIcon;
}

const DEFAULT_THEME: ModuleTheme = { ...accentById("teal"), icon: Search };

// One distinct colour + icon per module. Keyed by module id, not array index,
// so it can't silently drift if modules are reordered.
export const MODULE_THEMES: Record<string, ModuleTheme> = {
  "the-vanishing": DEFAULT_THEME,
  "the-alibi": { ...accentById("violet"), icon: Clock },
  "the-betrayal": { ...accentById("rose"), icon: EyeOff },
  "the-bridge": { ...accentById("amber"), icon: Landmark },
  "conflicting-accounts": { ...accentById("sky"), icon: Users },
  "the-verdict": { ...accentById("indigo"), icon: Gavel },
  capstone: { ...accentById("orange"), icon: Timer },
};

export function getModuleTheme(moduleId: string): ModuleTheme {
  return MODULE_THEMES[moduleId] ?? DEFAULT_THEME;
}
