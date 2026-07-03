import type { EntityStatus } from "@/types/historicalGeo";

export const STATUS_FILL: Record<EntityStatus, string> = {
  independent: "#1e3a5f",  // navy-700
  colonial:    "#b45309",  // amber-700
  disputed:    "#dc2626",  // red-600
  occupied:    "#64748b",  // slate-500
};

export const STATUS_FILL_HOVER: Record<EntityStatus, string> = {
  independent: "#2d5287",
  colonial:    "#d97706",
  disputed:    "#ef4444",
  occupied:    "#94a3b8",
};

export const STATUS_LABEL: Record<EntityStatus, string> = {
  independent: "Sovereign State",
  colonial:    "Colony / Territory",
  disputed:    "Disputed Territory",
  occupied:    "Occupied Territory",
};

// MapLibre match expression: ["match", ["get", "status"], "independent", COLOR, ...]
export const STATUS_FILL_EXPRESSION = [
  "match",
  ["get", "status"],
  "independent", STATUS_FILL.independent,
  "colonial",    STATUS_FILL.colonial,
  "disputed",    STATUS_FILL.disputed,
  "occupied",    STATUS_FILL.occupied,
  "#334155",
];

export const STATUS_FILL_HOVER_EXPRESSION = [
  "match",
  ["get", "status"],
  "independent", STATUS_FILL_HOVER.independent,
  "colonial",    STATUS_FILL_HOVER.colonial,
  "disputed",    STATUS_FILL_HOVER.disputed,
  "occupied",    STATUS_FILL_HOVER.occupied,
  "#475569",
];
