"use client";

export interface GameShowInput {
  type: "grid" | "wheel" | "feud" | "race" | "memory";
  rawContent: string;
}

export function defaultGameShowInput(): GameShowInput {
  return { type: "grid", rawContent: "" };
}

export default function GameShowInputForm({
  value,
  onChange,
}: {
  value: GameShowInput;
  onChange: (v: GameShowInput) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Game type</span>
        <select
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value as GameShowInput["type"] })}
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        >
          <option value="grid">Grid (Jeopardy-style)</option>
          <option value="wheel">Wheel</option>
          <option value="feud">Feud</option>
          <option value="race">Race</option>
          <option value="memory">Memory</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Content to convert</span>
        <textarea
          value={value.rawContent}
          onChange={(e) => onChange({ ...value, rawContent: e.target.value })}
          rows={5}
          placeholder="Paste notes, vocab list, or a study guide…"
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
    </div>
  );
}
