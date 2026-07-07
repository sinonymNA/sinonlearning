"use client";

export interface NotesheetInput {
  rawText: string;
  concept: string;
  subject: string;
  gradeBand: string;
  targetPages: number;
}

export function defaultNotesheetInput(): NotesheetInput {
  return { rawText: "", concept: "", subject: "", gradeBand: "", targetPages: 2 };
}

export default function NotesheetInputForm({
  value,
  onChange,
}: {
  value: NotesheetInput;
  onChange: (v: NotesheetInput) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Slide/lesson content</span>
        <textarea
          value={value.rawText}
          onChange={(e) => onChange({ ...value, rawText: e.target.value })}
          rows={5}
          placeholder="Paste the slide/lesson content to build a notesheet from…"
          className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Concept</span>
          <input
            value={value.concept}
            onChange={(e) => onChange({ ...value, concept: e.target.value })}
            className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Subject</span>
          <input
            value={value.subject}
            onChange={(e) => onChange({ ...value, subject: e.target.value })}
            className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Grade band</span>
          <input
            value={value.gradeBand}
            onChange={(e) => onChange({ ...value, gradeBand: e.target.value })}
            className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-navy-700/50">Target pages</span>
          <input
            type="number"
            min={1}
            max={4}
            value={value.targetPages}
            onChange={(e) => onChange({ ...value, targetPages: parseInt(e.target.value, 10) || 2 })}
            className="rounded-lg border border-navy-900/12 bg-white px-3 py-2 text-sm text-navy-900 outline-none focus:border-teal-500/50"
          />
        </label>
      </div>
    </div>
  );
}
