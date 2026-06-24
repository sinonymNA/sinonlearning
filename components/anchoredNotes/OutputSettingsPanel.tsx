"use client";

import type { AnchoredNotesSettings } from "@/lib/anchoredNotesTypes";

interface OutputSettingsPanelProps {
  settings: AnchoredNotesSettings;
  onChange: (patch: Partial<AnchoredNotesSettings>) => void;
}

const TOGGLES: { key: keyof AnchoredNotesSettings; label: string }[] = [
  { key: "includeNameLine", label: "Include name line" },
  { key: "includeCourseHeader", label: "Include course header" },
  { key: "includeEssentialQuestionBox", label: "Include essential question box" },
  { key: "includeImagePlaceholders", label: "Include image placeholders" },
  { key: "includeOutsideInfoBank", label: "Include outside information bank" },
  { key: "includeAnswerKeyPlaceholder", label: "Include answer key placeholder" },
];

export default function OutputSettingsPanel({ settings, onChange }: OutputSettingsPanelProps) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold text-navy-900">Settings</p>

      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-navy-700/70">Density</span>
        <div className="flex overflow-hidden rounded-full border border-navy-900/10">
          {(["compact", "spacious"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ density: d })}
              className={`px-3 py-1 text-xs capitalize transition ${
                settings.density === d ? "bg-teal-500 text-white" : "bg-white text-navy-700 hover:bg-navy-900/5"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {TOGGLES.map((toggle) => (
          <label key={toggle.key} className="flex items-center justify-between gap-2 text-xs text-navy-800">
            {toggle.label}
            <input
              type="checkbox"
              checked={Boolean(settings[toggle.key])}
              onChange={(e) => onChange({ [toggle.key]: e.target.checked })}
              className="h-4 w-4 accent-teal-500"
            />
          </label>
        ))}
      </div>

      <div className="mt-3">
        <label htmlFor="anchored-synthesis-lines" className="mb-1 block text-xs font-medium text-navy-700/70">
          Synthesis response lines: {settings.synthesisResponseLines}
        </label>
        <input
          id="anchored-synthesis-lines"
          type="range"
          min={2}
          max={12}
          value={settings.synthesisResponseLines}
          onChange={(e) => onChange({ synthesisResponseLines: Number(e.target.value) })}
          className="w-full accent-teal-500"
        />
      </div>

      <div className="mt-3">
        <span className="mb-1 block text-xs font-medium text-navy-700/70">Table row height</span>
        <div className="flex overflow-hidden rounded-full border border-navy-900/10">
          {(["compact", "normal", "large"] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => onChange({ tableRowHeight: h })}
              className={`flex-1 px-2 py-1 text-xs capitalize transition ${
                settings.tableRowHeight === h ? "bg-teal-500 text-white" : "bg-white text-navy-700 hover:bg-navy-900/5"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
