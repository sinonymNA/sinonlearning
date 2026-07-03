"use client";

import { useEffect, useRef } from "react";

const SPEEDS = [1, 2, 5, 10] as const;
type Speed = typeof SPEEDS[number];

interface TimelineControlsProps {
  year: number;
  minYear: number;
  maxYear: number;
  playing: boolean;
  speed: Speed;
  onYearChange: (year: number) => void;
  onPlayToggle: () => void;
  onSpeedChange: (speed: Speed) => void;
}

export default function TimelineControls({
  year, minYear, maxYear, playing, speed,
  onYearChange, onPlayToggle, onSpeedChange,
}: TimelineControlsProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!playing) return;
    intervalRef.current = setInterval(() => {
      onYearChange(Math.min(year + 1, maxYear));
      if (year + 1 >= maxYear) onPlayToggle();
    }, 1000 / speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, year, speed, maxYear, onYearChange, onPlayToggle]);

  const pct = ((year - minYear) / (maxYear - minYear)) * 100;

  return (
    <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-20">
      <div className="max-w-3xl mx-auto bg-[#0a1929]/90 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 shadow-2xl">
        {/* Year display */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-4xl font-bold tabular-nums tracking-tight text-white" style={{ fontFamily: "var(--font-fraunces)" }}>
            {year}
          </span>
          <div className="flex items-center gap-2">
            {/* Speed selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                    speed === s
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
            {/* Play/pause */}
            <button
              onClick={onPlayToggle}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center shadow-lg"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <rect x="5" y="4" width="4" height="16" rx="1" />
                  <rect x="15" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="w-full h-1 appearance-none bg-transparent cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`,
              borderRadius: "9999px",
            }}
          />
        </div>

        {/* Era labels */}
        <div className="flex justify-between mt-2 text-[10px] text-slate-500 select-none">
          <span>{minYear}</span>
          <span className="text-slate-600">·</span>
          <span>1914 WWI</span>
          <span className="text-slate-600">·</span>
          <span>1939 WWII</span>
          <span className="text-slate-600">·</span>
          <span>1991 USSR</span>
          <span className="text-slate-600">·</span>
          <span>{maxYear}</span>
        </div>
      </div>
    </div>
  );
}
