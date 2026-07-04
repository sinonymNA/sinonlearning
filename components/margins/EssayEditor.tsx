"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface DocumentEntry {
  label: string;
  source_text: string;
}

interface Props {
  submissionId: string;
  initialText: string;
  promptText: string;
  documents: DocumentEntry[] | null;
}

export default function EssayEditor({ submissionId, initialText, promptText, documents }: Props) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setText(value);
    setSaveState("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(value), 1200);
  }

  async function saveDraft(value: string) {
    setSaveState("saving");
    try {
      await fetch(`/api/margins/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayText: value }),
      });
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!text.trim()) {
      setError("Write something before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await fetch(`/api/margins/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayText: text }),
      });
      const submitRes = await fetch(`/api/margins/submissions/${submissionId}/submit`, { method: "POST" });
      const submitData = await submitRes.json();
      if (!submitRes.ok) {
        setError(submitData.error ?? "Could not submit.");
        setSubmitting(false);
        return;
      }
      const gradeRes = await fetch(`/api/margins/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      if (!gradeRes.ok) {
        // Submission succeeded even if grading failed — the teacher can re-trigger grading.
        console.error("Grading failed after submission.");
      }
      router.push(`/margins/student/submissions/${submissionId}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className={documents && documents.length > 0 ? "lg:col-span-2 flex flex-col gap-4" : "lg:col-span-5 flex flex-col gap-4"}>
        <div className="rounded-2xl border border-stone-100 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Prompt</p>
          <p className="text-[15px] text-stone-700 leading-relaxed whitespace-pre-wrap">{promptText}</p>
        </div>

        {documents && documents.length > 0 && (
          <div className="flex flex-col gap-3">
            {documents.map((doc, i) => (
              <div key={i} className="rounded-2xl border border-stone-100 bg-white p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-1.5">{doc.label}</p>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{doc.source_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={documents && documents.length > 0 ? "lg:col-span-3 flex flex-col gap-3" : "lg:col-span-5 flex flex-col gap-3"}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Your essay</span>
          <span className="text-xs text-stone-400">
            {wordCount} words · {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          rows={20}
          placeholder="Start writing…"
          className="rounded-2xl border border-stone-200 bg-white p-5 text-[15px] leading-relaxed text-stone-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none min-h-[420px]"
        />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-[13px] text-red-600">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="self-end rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all disabled:opacity-60"
        >
          {submitting ? "Submitting & grading…" : "Submit for grading"}
        </button>
      </div>
    </div>
  );
}
