import verdantRift from "./verdant-rift.json";
import { validateRegionManifest } from "./schema";

export const REGION_CATALOG = [validateRegionManifest(verdantRift)];
export const ACTIVE_REGION = REGION_CATALOG[0];

export function regionById(id?: string) {
  return REGION_CATALOG.find((region) => region.id === id) ?? ACTIVE_REGION;
}

export * from "./schema";
