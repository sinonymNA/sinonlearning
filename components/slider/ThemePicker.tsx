"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SLIDER_THEMES } from "@/lib/sliderThemes";
import type { SliderTheme } from "@/lib/sliderThemes";
import ThemeEditor from "./ThemeEditor";

interface Props {
  value: string;
  onSelect: (themeId: string) => void;
  customThemes?: SliderTheme[];
  onCustomThemesChange?: () => void;
}

export default function ThemePicker({ value, onSelect, customThemes = [], onCustomThemesChange }: Props) {
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (creating) {
    return (
      <ThemeEditor
        onCancel={() => setCreating(false)}
        onCreated={(theme) => {
          setCreating(false);
          onCustomThemesChange?.();
          onSelect(theme.id);
        }}
      />
    );
  }

  async function handleDelete(e: React.MouseEvent, themeId: string) {
    e.stopPropagation();
    setDeletingId(themeId);
    try {
      await fetch(`/api/slider/themes/${themeId}`, { method: "DELETE" });
      onCustomThemesChange?.();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SLIDER_THEMES.map((theme) => (
          <ThemeSwatch key={theme.id} theme={theme} selected={value === theme.id} onClick={() => onSelect(theme.id)} />
        ))}
      </div>

      {customThemes.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">My themes</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {customThemes.map((theme) => (
              <ThemeSwatch
                key={theme.id}
                theme={theme}
                selected={value === theme.id}
                onClick={() => onSelect(theme.id)}
                onDelete={(e) => handleDelete(e, theme.id)}
                deleting={deletingId === theme.id}
              />
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slider-300 bg-slider-50/50 py-2.5 text-xs font-semibold text-slider-600 hover:bg-slider-50 transition-colors"
      >
        <Plus size={13} /> Create your own theme
      </button>
    </div>
  );
}

function ThemeSwatch({
  theme,
  selected,
  onClick,
  onDelete,
  deleting,
}: {
  theme: SliderTheme;
  selected: boolean;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  deleting?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative rounded-xl border p-3 text-left transition-all overflow-hidden",
        selected ? "border-slider-500 ring-2 ring-slider-100" : "border-stone-200 hover:border-slider-200",
      ].join(" ")}
    >
      {onDelete && (
        <span
          role="button"
          aria-label={`Delete ${theme.name}`}
          onClick={onDelete}
          className="absolute top-1.5 right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-stone-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors"
        >
          <X size={11} />
        </span>
      )}
      <div
        className="rounded-lg aspect-video mb-2 flex items-center justify-center"
        style={{ background: theme.colors.background, opacity: deleting ? 0.4 : 1 }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-bold" style={{ color: theme.colors.heading, fontFamily: theme.fonts.heading.css }}>
            Aa
          </span>
          <span className="h-1 w-8 rounded-full" style={{ background: theme.colors.accent }} />
        </div>
      </div>
      <p className="text-[12px] font-semibold text-stone-800">{theme.name}</p>
    </button>
  );
}
