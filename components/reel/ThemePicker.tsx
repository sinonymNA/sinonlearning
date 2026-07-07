"use client";

import { REEL_THEMES } from "@/lib/reelTypes";
import { reelFontClass } from "@/lib/reelFonts";

export default function ThemePicker({ value, onSelect }: { value: string; onSelect: (themeId: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {REEL_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onSelect(theme.id)}
          className={[
            "overflow-hidden rounded-xl border p-2.5 text-left transition-all",
            value === theme.id ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200 hover:border-sky-200",
          ].join(" ")}
        >
          <div
            className="mb-2 flex aspect-video items-center justify-center rounded-lg"
            style={{ background: theme.colors.background }}
          >
            <div className="flex flex-col items-center gap-1">
              <span
                className={`text-[13px] font-bold ${reelFontClass(theme.fonts.heading)}`}
                style={{ color: theme.colors.heading }}
              >
                Aa
              </span>
              <span className="h-1 w-8 rounded-full" style={{ background: theme.colors.accent }} />
            </div>
          </div>
          <p className="text-[12px] font-semibold text-slate-700">{theme.name}</p>
        </button>
      ))}
    </div>
  );
}
