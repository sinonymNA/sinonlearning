"use client";

import { Sparkles } from "lucide-react";
import { SAMPLE_LESSON_CONTENT } from "@/lib/anchoredNotesSample";

interface ContentPastePanelProps {
  rawContent: string;
  onChange: (value: string) => void;
}

export default function ContentPastePanel({ rawContent, onChange }: ContentPastePanelProps) {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="anchored-raw-content" className="text-sm font-semibold text-navy-900">
          Paste your lesson content
        </label>
        <button
          type="button"
          onClick={() => onChange(SAMPLE_LESSON_CONTENT)}
          className="flex items-center gap-1.5 rounded-full border border-teal-400/40 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 transition hover:bg-teal-100"
        >
          <Sparkles size={13} /> Try a Sample
        </button>
      </div>
      <p className="mb-2 text-xs text-navy-700/60">
        Paste notes, an outline, or markdown-style text. Use headings (e.g. &ldquo;Essential Question&rdquo;, &ldquo;Synthesis&rdquo;), numbered
        questions, and <code>| table | rows |</code> — Teacher Studio will turn them into structured blocks. Parsing is heuristic, so
        you&apos;ll get a chance to review and adjust before generating.
      </p>
      <textarea
        id="anchored-raw-content"
        value={rawContent}
        onChange={(e) => onChange(e.target.value)}
        placeholder="# Lesson title&#10;&#10;## Essential Question&#10;Why did...&#10;&#10;## Part 1: ...&#10;..."
        className="h-64 w-full resize-y rounded-xl border border-navy-900/10 bg-white p-3 font-mono text-sm text-navy-900 outline-none focus:border-teal-400/60"
      />
    </div>
  );
}
