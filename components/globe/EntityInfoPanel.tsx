"use client";

import type { HistoricalFeatureProps } from "@/types/historicalGeo";
import { STATUS_LABEL } from "@/lib/globeColors";

interface EntityInfoPanelProps {
  entity: HistoricalFeatureProps | null;
  onClose: () => void;
}

function formatYear(dateStr: string): string {
  if (!dateStr || dateStr.startsWith("9999")) return "present";
  return dateStr.slice(0, 4);
}

const CERTAINTY_COLOR = {
  high:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  low:    "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function EntityInfoPanel({ entity, onClose }: EntityInfoPanelProps) {
  if (!entity) return null;

  const fromYear = formatYear(entity.valid_from);
  const toYear = formatYear(entity.valid_to);
  const duration = toYear === "present"
    ? `${fromYear} – present`
    : `${fromYear} – ${toYear} (${Number(toYear) - Number(fromYear)} yrs)`;

  return (
    <div className="absolute top-4 left-4 z-20 w-72 bg-[#0a1929]/95 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-3 border-b border-white/8">
        <div>
          <h2 className="text-white font-bold text-base leading-tight">{entity.name}</h2>
          <p className="text-slate-400 text-xs mt-0.5 capitalize">{entity.type}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors ml-2 mt-0.5 shrink-0"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Dates */}
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500 shrink-0 fill-none stroke-current" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
          </svg>
          <span className="text-slate-300 text-sm">{duration}</span>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500 shrink-0 fill-none stroke-current" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4l3 3" strokeLinecap="round" />
          </svg>
          <span className="text-slate-300 text-sm">{STATUS_LABEL[entity.status]}</span>
        </div>

        {/* Capital */}
        {entity.capital && (
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-500 shrink-0 fill-none stroke-current" strokeWidth="1.5">
              <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 0114 0c0 3.5-3 7-7 11z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span className="text-slate-300 text-sm">{entity.capital}</span>
          </div>
        )}

        {/* Description */}
        {entity.description && (
          <p className="text-slate-400 text-xs leading-relaxed border-t border-white/8 pt-3">
            {entity.description}
          </p>
        )}

        {/* Successor / Predecessor */}
        {(entity.predecessor || entity.successor) && (
          <div className="space-y-1 border-t border-white/8 pt-3">
            {entity.predecessor && (
              <p className="text-xs text-slate-500">
                <span className="text-slate-600">Preceded by:</span>{" "}
                <span className="text-slate-400">{entity.predecessor}</span>
              </p>
            )}
            {entity.successor && (
              <p className="text-xs text-slate-500">
                <span className="text-slate-600">Succeeded by:</span>{" "}
                <span className="text-slate-400">{entity.successor}</span>
              </p>
            )}
          </div>
        )}

        {/* Certainty + source */}
        <div className="flex items-center justify-between border-t border-white/8 pt-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CERTAINTY_COLOR[entity.certainty]}`}>
            {entity.certainty} certainty
          </span>
          <span className="text-[10px] text-slate-600">{entity.source}</span>
        </div>
      </div>
    </div>
  );
}
