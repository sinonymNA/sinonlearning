import type { MaterialKind } from "./googleMaterial";

export interface Material {
  id: number;
  title: string;
  url: string;
  kind: MaterialKind;
  file_id: string;
  course_slug: string;
  position: number;
  created_at: string;
}
