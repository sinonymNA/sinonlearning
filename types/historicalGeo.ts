export type EntityStatus = "independent" | "colonial" | "disputed" | "occupied";

export interface HistoricalFeatureProps {
  id: string;
  name: string;
  type: string;
  valid_from: string; // "YYYY-MM-DD" or year string like "-3000"
  valid_to: string;   // "YYYY-MM-DD", "9999-12-31" for present, or year string
  year_from?: number; // integer BCE/CE year (negative = BCE); preferred for ancient data
  year_to?: number;   // integer BCE/CE year; 9999 = present
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
