// Pure server-safe metadata — no JSX, no "use client"
export const STOCK_UNIT_SLUGS = [
  "unit-1", "unit-2", "unit-3", "unit-4", "unit-5",
  "unit-6", "unit-7", "unit-8", "unit-9",
] as const;

export function isValidStockSlug(slug: string): boolean {
  return (STOCK_UNIT_SLUGS as readonly string[]).includes(slug);
}
