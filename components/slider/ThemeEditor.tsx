"use client";

import { useState } from "react";
import { SLIDER_FONTS } from "@/lib/sliderFonts";
import type { SliderTheme } from "@/lib/sliderThemes";

interface Props {
  onCreated: (theme: SliderTheme) => void;
  onCancel: () => void;
}

const DEFAULT_COLORS = {
  background: "#FFFFFF",
  surface: "#F5F5F4",
  heading: "#1C1917",
  body: "#44403C",
  accent: "#7C3AED",
};

const COLOR_FIELDS: { key: keyof typeof DEFAULT_COLORS; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "heading", label: "Heading text" },
  { key: "body", label: "Body text" },
  { key: "accent", label: "Accent" },
];

export default function ThemeEditor({ onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [headingFontId, setHeadingFontId] = useState(SLIDER_FONTS[0].id);
  const [bodyFontId, setBodyFontId] = useState(SLIDER_FONTS[0].id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headingFont = SLIDER_FONTS.find((f) => f.id === headingFontId) ?? SLIDER_FONTS[0];
  const bodyFont = SLIDER_FONTS.find((f) => f.id === bodyFontId) ?? SLIDER_FONTS[0];

  function setColor(key: keyof typeof DEFAULT_COLORS, value: string) {
    setColors((c) => ({ ...c, [key]: value }));
  }

  async function save() {
    if (!name.trim()) {
      setError("Give your theme a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/slider/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, colors, headingFontId, bodyFontId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save theme.");
        return;
      }
      onCreated(data.theme);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Theme name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Room 204 Blue"
          className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-[14px] outline-none focus:border-slider-400 focus:bg-white transition-all"
        />
      </label>

      <div
        className="rounded-xl aspect-video flex flex-col items-center justify-center gap-2 border border-stone-100"
        style={{ background: colors.background }}
      >
        <span className="text-xl font-bold" style={{ color: colors.heading, fontFamily: headingFont.cssStack }}>
          Aa Heading
        </span>
        <span className="text-sm" style={{ color: colors.body, fontFamily: bodyFont.cssStack }}>
          Body text looks like this
        </span>
        <span className="h-1 w-10 rounded-full" style={{ background: colors.accent }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {COLOR_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{label}</span>
            <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1.5">
              <input
                type="color"
                value={colors[key]}
                onChange={(e) => setColor(key, e.target.value)}
                className="h-6 w-6 rounded border-0 bg-transparent p-0 cursor-pointer"
              />
              <input
                type="text"
                value={colors[key]}
                onChange={(e) => setColor(key, e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[12px] outline-none uppercase"
              />
            </div>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Heading font</span>
          <select
            value={headingFontId}
            onChange={(e) => setHeadingFontId(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-[14px] outline-none focus:border-slider-400"
            style={{ fontFamily: headingFont.cssStack }}
          >
            {SLIDER_FONTS.map((f) => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.cssStack }}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Body font</span>
          <select
            value={bodyFontId}
            onChange={(e) => setBodyFontId(e.target.value)}
            className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-[14px] outline-none focus:border-slider-400"
            style={{ fontFamily: bodyFont.cssStack }}
          >
            {SLIDER_FONTS.map((f) => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.cssStack }}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-[11px] text-stone-400">
        System fonts (Georgia, Verdana, Arial, Trebuchet MS, Times New Roman) export to PPTX identically on any
        computer. Google fonts look right here and in the exported file on machines that have them installed,
        otherwise PowerPoint substitutes a fallback.
      </p>

      {error && <p className="text-[12px] text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-gradient-to-br from-slider-500 to-slider-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slider-200 hover:shadow-md transition-all disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save theme"}
        </button>
      </div>
    </div>
  );
}
