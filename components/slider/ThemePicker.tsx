"use client";

import { SLIDER_THEMES } from "@/lib/sliderThemes";

interface Props {
  value: string;
  onSelect: (themeId: string) => void;
}

export default function ThemePicker({ value, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {SLIDER_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onSelect(theme.id)}
          className={[
            "rounded-xl border p-3 text-left transition-all overflow-hidden",
            value === theme.id ? "border-slider-500 ring-2 ring-slider-100" : "border-stone-200 hover:border-slider-200",
          ].join(" ")}
        >
          <div
            className="rounded-lg aspect-video mb-2 flex items-center justify-center"
            style={{ background: theme.colors.background }}
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-bold" style={{ color: theme.colors.heading, fontFamily: theme.fonts.heading }}>
                Aa
              </span>
              <span className="h-1 w-8 rounded-full" style={{ background: theme.colors.accent }} />
            </div>
          </div>
          <p className="text-[12px] font-semibold text-stone-800">{theme.name}</p>
        </button>
      ))}
    </div>
  );
}
