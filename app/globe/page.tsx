"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import EntityInfoPanel from "@/components/globe/EntityInfoPanel";
import TimelineControls from "@/components/globe/TimelineControls";
import type { HistoricalFeatureProps } from "@/types/historicalGeo";

// Dynamic import avoids SSR issues with MapLibre (window/WebGL dependency)
const GlobeMap = dynamic(() => import("@/components/globe/GlobeMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-sky-200">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const MIN_YEAR = -3000;
const MAX_YEAR = 2023;

type Speed = 1 | 2 | 5 | 10 | 100;

export default function GlobePage() {
  const [year, setYear] = useState(-500);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(2);
  const [entity, setEntity] = useState<HistoricalFeatureProps | null>(null);

  const handleYearChange = useCallback((y: number) => {
    setYear(y);
    if (y >= MAX_YEAR) setPlaying(false);
  }, []);

  const handlePlayToggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && year >= MAX_YEAR) { setYear(MIN_YEAR); return true; }
      return !p;
    });
  }, [year]);

  const handleEntityClick = useCallback((e: HistoricalFeatureProps | null) => {
    setEntity(e);
  }, []);

  return (
    <div
      className="relative w-screen overflow-hidden bg-[#b8d4e8]"
      style={{ height: "100dvh" }}
    >
      {/* Back link */}
      <div className="absolute top-4 right-16 z-30">
        <Link
          href="/"
          className="text-xs text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
          Sinon Learning
        </Link>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <h1 className="text-slate-800 text-sm font-semibold tracking-wide opacity-70 select-none">
          Historical Globe
        </h1>
      </div>

      {/* Legend */}
      <div className="absolute top-14 left-4 z-20 pointer-events-none">
        <div className="flex flex-col gap-1.5">
          {[
            { color: "#1d4ed8", label: "Sovereign State" },
            { color: "#b45309", label: "Colony" },
            { color: "#dc2626", label: "Disputed" },
            { color: "#64748b", label: "Occupied" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border border-slate-400/40" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-slate-700 leading-none">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Globe */}
      <GlobeMap year={year} onEntityClick={handleEntityClick} />

      {/* Entity info panel */}
      <EntityInfoPanel entity={entity} onClose={() => setEntity(null)} />

      {/* Timeline controls */}
      <TimelineControls
        year={year}
        minYear={MIN_YEAR}
        maxYear={MAX_YEAR}
        playing={playing}
        speed={speed}
        onYearChange={handleYearChange}
        onPlayToggle={handlePlayToggle}
        onSpeedChange={(s) => setSpeed(s as Speed)}
      />
    </div>
  );
}
