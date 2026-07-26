// Lengua — supported classroom languages.
//
// Adding a language is one entry here. Everything downstream (glossary
// generation, the join picker, the lookup cache, RTL handling) reads from this
// registry, so a new language needs no other code change — its glossaries are
// then generated per deck on demand and cached forever.

export interface LenguaLanguage {
  /** BCP-47 base code. Also the cache key in lengua_lexicon. */
  code: string;
  /** English name, for the teacher's UI. */
  name: string;
  /** Endonym — what a speaker calls their own language. Shown in the student picker. */
  endonym: string;
  /** Right-to-left script. Arabic needs this; getting it wrong makes the app unusable. */
  rtl: boolean;
  /** Font stack hint for scripts the default stack renders poorly. */
  fontFamily?: string;
}

export const LENGUA_LANGUAGES: LenguaLanguage[] = [
  { code: "es", name: "Spanish", endonym: "Español", rtl: false },
  {
    code: "ar",
    name: "Arabic",
    endonym: "العربية",
    rtl: true,
    // The default sans stack renders Arabic with poor joining on some systems.
    fontFamily: '"Noto Naskh Arabic", "Segoe UI", Tahoma, sans-serif',
  },
  { code: "vi", name: "Vietnamese", endonym: "Tiếng Việt", rtl: false },
  { code: "yo", name: "Yoruba", endonym: "Yorùbá", rtl: false },
];

export function languageByCode(code: string): LenguaLanguage | undefined {
  return LENGUA_LANGUAGES.find((l) => l.code === code);
}

export function isSupportedLanguage(code: string): boolean {
  return LENGUA_LANGUAGES.some((l) => l.code === code);
}

/** Direction attribute for a rendered block of L1 text. */
export function dirFor(code: string): "rtl" | "ltr" {
  return languageByCode(code)?.rtl ? "rtl" : "ltr";
}

// ─── Support tiers ────────────────────────────────────────────────────────────
// The scaffold, and its fading. A newcomer needs L1 to survive the hour; an
// intermediate student is actively held back by it. The tier decides how much
// help a tap actually yields.
//
// Tier 3 is the one that matters: help arrives in *simplified English* only.
// That is the transition from translating to thinking in the language, and it
// is the point of the whole product.

export type LenguaTier = 1 | 2 | 3 | 4;

export interface TierDef {
  tier: LenguaTier;
  label: string;
  description: string;
  /** Show the L1 translation alongside the English gloss immediately. */
  showL1OnFirstTap: boolean;
  /** Offer L1 at all (tier 4 is English-only, no escape hatch). */
  offerL1: boolean;
}

export const LENGUA_TIERS: TierDef[] = [
  {
    tier: 1,
    label: "Newcomer",
    description: "Tapping a word shows your language straight away, with simple English beside it.",
    showL1OnFirstTap: true,
    offerL1: true,
  },
  {
    tier: 2,
    label: "Building",
    description: "Tapping shows simple English first. Tap again for your language.",
    showL1OnFirstTap: false,
    offerL1: true,
  },
  {
    tier: 3,
    label: "Stretching",
    description: "Simple English first, and your language stays available — but try English twice before you reach for it.",
    showL1OnFirstTap: false,
    offerL1: true,
  },
  {
    tier: 4,
    label: "English only",
    description: "Help arrives in simpler English. No translation — you're past needing it.",
    showL1OnFirstTap: false,
    offerL1: false,
  },
];

export function tierDef(tier: number): TierDef {
  return LENGUA_TIERS.find((t) => t.tier === tier) ?? LENGUA_TIERS[1];
}

export const DEFAULT_TIER: LenguaTier = 2;

/**
 * Delay before the L1 translation becomes tappable, in ms.
 *
 * Deliberate friction, not latency. An instant translation short-circuits the
 * attempt to read the English at all; a beat of enforced hesitation is what
 * separates a scaffold from a crutch. Falls to zero for newcomers, who are
 * trying to follow the lesson rather than stretch.
 */
export function l1DelayMs(tier: number): number {
  if (tier <= 1) return 0;
  if (tier === 2) return 1200;
  return 2500;
}
