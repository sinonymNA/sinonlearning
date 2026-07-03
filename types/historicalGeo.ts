export type EntityStatus = "independent" | "colonial" | "disputed" | "occupied";

export interface HistoricalFeatureProps {
  id: string;
  name: string;
  type: string;
  valid_from: string; // "YYYY-MM-DD"
  valid_to: string;   // "YYYY-MM-DD" or "9999-12-31" for present
  status: EntityStatus;
  certainty: "high" | "medium" | "low";
  capital?: string;
  source: string;
  successor?: string;
  predecessor?: string;
  description?: string;
}

export type HistoricalFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, HistoricalFeatureProps>;
export type HistoricalCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, HistoricalFeatureProps>;
