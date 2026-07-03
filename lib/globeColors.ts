import type { EntityStatus } from "@/types/historicalGeo";

export const STATUS_FILL: Record<EntityStatus, string> = {
  independent: "#1d4ed8",  // blue-700 — vivid, stands out from dark land
  colonial:    "#b45309",  // amber-700 — darker for light basemap
  disputed:    "#dc2626",  // red-600
  occupied:    "#64748b",  // slate-500
};

export const STATUS_FILL_HOVER: Record<EntityStatus, string> = {
  independent: "#3b82f6",  // blue-500
  colonial:    "#d97706",  // amber-600
  disputed:    "#ef4444",  // red-400
  occupied:    "#94a3b8",  // slate-400
};

export const STATUS_LABEL: Record<EntityStatus, string> = {
  independent: "Sovereign State",
  colonial:    "Colony / Territory",
  disputed:    "Disputed Territory",
  occupied:    "Occupied Territory",
};

// MapLibre match expression
export const STATUS_FILL_EXPRESSION = [
  "match",
  ["get", "status"],
  "independent", STATUS_FILL.independent,
  "colonial",    STATUS_FILL.colonial,
  "disputed",    STATUS_FILL.disputed,
  "occupied",    STATUS_FILL.occupied,
  "#334155",
];
