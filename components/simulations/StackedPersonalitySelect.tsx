import { PERSONALITY_PRESETS } from "@/lib/stackedEvents";
import type { Personality } from "@/lib/stackedTypes";

export default function StackedPersonalitySelect({
  onSelect,
}: {
  onSelect: (personality: Personality) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <h2 className="font-display text-2xl font-medium text-white">Choose your approach</h2>
      <p className="mt-2 text-white/65">
        Age 22. A new job. A blank financial slate. How do you want to play this?
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PERSONALITY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left transition-colors hover:border-teal-300/40 hover:bg-white/5"
          >
            <p className="font-display text-lg font-medium text-white">{preset.label}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-white/60">{preset.tagline}</p>
            <p className="mt-3 text-xs text-white/40">
              Starting salary ${preset.startingSalary.toLocaleString()} · Starting cash $
              {preset.startingCash.toLocaleString()}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
