import type { HistoricalCollection, HistoricalFeatureProps } from "@/types/historicalGeo";

export function filterByYear(
  collection: HistoricalCollection,
  year: number
): HistoricalCollection {
  return {
    type: "FeatureCollection",
    features: collection.features.filter((f) => {
      const p = f.properties as HistoricalFeatureProps;
      // Prefer numeric year fields (ancient data); fall back to parsing the string field
      const fromYear = p.year_from ?? parseInt(p.valid_from, 10);
      const toYear   = p.year_to   ?? (p.valid_to.startsWith("9999") ? 9999 : parseInt(p.valid_to, 10));
      return fromYear <= year && toYear >= year;
    }),
  };
}
