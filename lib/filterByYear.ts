import type { HistoricalCollection, HistoricalFeatureProps } from "@/types/historicalGeo";

export function filterByYear(
  collection: HistoricalCollection,
  year: number
): HistoricalCollection {
  const jan1 = `${year}-01-01`;
  return {
    type: "FeatureCollection",
    features: collection.features.filter((f) => {
      const { valid_from, valid_to } = f.properties as HistoricalFeatureProps;
      return valid_from <= jan1 && valid_to >= jan1;
    }),
  };
}
