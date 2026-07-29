// Standard Sort — pure types and logic, no DB import.
//
// Split out from standardSortDb.ts deliberately: that file imports "./db",
// which pulls the `pg` Node driver in. A client component that imports
// anything from the same module — even just this constant — drags `pg` into
// the browser bundle and fails to build ("Module not found: util/types").
// Anything the create page needs client-side lives here instead.

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
