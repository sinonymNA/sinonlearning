// Standard Sort — pure types and logic, no DB import.
//
// Split out from standardSortDb.ts deliberately: that file imports "./db",
// which pulls the `pg` Node driver in. A client component that imports
// anything from the same module — even just this constant — drags `pg` into
// the browser bundle and fails to build ("Module not found: util/types").
// Anything the create page needs client-side lives here instead.
//
// ECON_PF_STANDARDS is imported as a value below (not just a type), so this
// creates a module cycle with data/econPersonalFinanceStandards.ts, which
// imports StandardItem back from here. That's fine — its import is
// `import type`, erased entirely at compile time, so there is no runtime
// cycle for the bundler to resolve.

import { ECON_PF_STANDARDS } from "@/data/econPersonalFinanceStandards";

export interface StandardItem {
  id: string;
  code: string | null;
  text: string;
}

// The 8 units given for the economics & personal finance revision — the
// create page starts here, editable, rather than hardcoding it as immutable
// elsewhere in the code.
export const DEFAULT_UNITS = [
  "Decision Making",
  "Career",
  "Paychecks & Budgeting",
  "Credit, Debt & Banking",
  "Transportation & Housing",
  "Insurance & Risk Management",
  "Investing & The Future",
  "Government, Policy and The Global Economy",
];

/**
 * One standard per line. A line may lead with a short code before a colon
 * ("SSEC.17a–d: Scarcity, allocation, opportunity cost") — the code is
 * captured separately for display; everything else is plain text. The regex
 * requires the code-like portion to contain no spaces and be short, so an
 * ordinary sentence with a colon in it later doesn't misfire.
 */
export function parseStandardsText(raw: string): StandardItem[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 200);

  return lines.map((line, i) => {
    const m = line.match(/^([A-Za-z0-9.\-–]{2,24}):\s*(.+)$/);
    if (m) return { id: String(i), code: m[1], text: m[2].slice(0, 500) };
    return { id: String(i), code: null, text: line.slice(0, 500) };
  });
}

// ─── Pre-provisioned sessions ─────────────────────────────────────────────────
//
// A seed is a session that springs into existence the first time its fixed
// code is visited, rather than requiring someone to run the create form.
// That's what makes "just go to the route and it asks for your name" work —
// there's no separate creation step for a list that's already decided.
//
// Keep the code short, memorable, and exact-case: the lookup in the API route
// is a plain string match against the URL segment, so whoever gets the link
// needs the casing as given here.

export interface StandardSortSeed {
  code: string;
  title: string;
  units: string[];
  standards: StandardItem[];
}

export const STANDARD_SORT_SEEDS: Record<string, StandardSortSeed> = {
  ECONPF: {
    code: "ECONPF",
    title: "Economics & Personal Finance — Unit Realignment",
    units: DEFAULT_UNITS,
    standards: ECON_PF_STANDARDS,
  },
};
