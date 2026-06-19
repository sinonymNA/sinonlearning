import type { MaterialKind } from "./googleMaterial";

export interface Material {
  id: number;
  title: string;
  url: string;
  kind: MaterialKind;
  file_id: string;
  created_at: string;
}
