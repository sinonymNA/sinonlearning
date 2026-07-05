"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { RUBRIC_TEMPLATES, type EssayType, type RubricCriterion } from "@/lib/marginsRubrics";
import { revealStagger } from "@/lib/marginsMotion";

interface DocumentEntry {
  label: string;
  source_text: string;
}

const ESSAY_TYPES: { value: EssayType; label: string; hint: string }[] = [
  { value: "LEQ", label: "LEQ", hint: "Long Essay · 6 pts" },
  { value: "SAQ", label: "SAQ", hint: "Short Answer · 3 pts" },
  { value: "DBQ", label: "DBQ", hint: "Document-Based · 7 pts" },
];

const inputCls =
  "rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[14px] text-stone-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all";

export default function AssignmentWizard({ classId }: { classId: string }) {
  const router = useRouter();
  const [essayType, setEssayType] = useState<EssayType>("LEQ");
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [rubric, setRubric] = useState<RubricCriterion[]>(RUBRIC_TEMPLATES.LEQ);
  const [documents, setDocuments] = useState<DocumentEntry[]>([{ label: "Document 1", source_text: "" }]);
  const [maxRevisions, setMaxRevisions] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [suggestedDocTopics, setSuggestedDocTopics] = useState<string[]>([]);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatingRubric, setGeneratingRubric] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const rubricRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rubricRef.current) {
      revealStagger(rubricRef.current, ".rubric-edit-row", { stagger: 50, duration: 320, translateY: 10 });
    }
  }, [rubric]);

  async function handleGeneratePrompt() {
    if (!topic.trim()) {
      setGenerateError("Enter a topic first.");
      return;
    }
    setGenerateError(null);
    setGeneratingPrompt(true);
    try {
      const res = await fetch("/api/margins/generate-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayType, topic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error ?? "Could not generate a prompt.");
        return;
      }
      setTitle(data.assignment.title);
      setPromptText(data.assignment.prompt_text);
      setSuggestedDocTopics(data.assignment.suggested_document_topics ?? []);
    } catch {
      setGenerateError("Network error. Please try again.");
    } finally {
      setGeneratingPrompt(false);
    }
  }

  async function handleGenerateRubric() {
    if (!topic.trim()) {
      setGenerateError("Enter a topic first.");
      return;
    }
    setGenerateError(null);
    setGeneratingRubric(true);
    try {
      const res = await fetch("/api/margins/generate-rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essayType, topic }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error ?? "Could not generate a rubric.");
        return;
      }
      setRubric(data.rubric.criteria);
    } catch {
      setGenerateError("Network error. Please try again.");
    } finally {
      setGeneratingRubric(false);
    }
  }

  function changeEssayType(type: EssayType) {
    setEssayType(type);
    setRubric(RUBRIC_TEMPLATES[type]);
  }

  function updateRubricRow(i: number, field: keyof RubricCriterion, value: string) {
    setRubric((r) =>
      r.map((row, idx) =>
        idx === i
          ? { ...row, [field]: field === "points_possible" ? Number(value) || 0 : value }
          : row
      )
    );
  }

  function addDocument() {
    setDocuments((d) => [...d, { label: `Document ${d.length + 1}`, source_text: "" }]);
  }
  function removeDocument(i: number) {
    setDocuments((d) => d.filter((_, idx) => idx !== i));
  }
  function updateDocument(i: number, field: keyof DocumentEntry, value: string) {
    setDocuments((d) => d.map((doc, idx) => (idx === i ? { ...doc, [field]: value } : doc)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/margins/classes/${classId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayType,
          title,
          promptText,
          rubric,
          documents: essayType === "DBQ" ? documents.filter((d) => d.source_text.trim()) : undefined,
          maxRevisions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create assignment.");
        return;
      }
      router.push(`/margins/teacher/classes/${classId}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const maxScore = rubric.reduce((sum, r) => sum + (r.points_possible || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* Essay type */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Essay type</p>
        <div className="grid grid-cols-3 gap-2.5">
          {ESSAY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={(e) => {
                animate(e.currentTarget, { scale: [0.94, 1], duration: 260, easing: "outQuart" });
                changeEssayType(t.value);
              }}
              className={[
                "rounded-xl border p-3.5 text-left transition-all",
                essayType === t.value
                  ? "border-violet-500 bg-violet-50"
                  : "border-stone-200 bg-white hover:border-violet-200",
              ].join(" ")}
            >
              <p className="font-bold text-stone-900">{t.label}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{t.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* KORA generator */}
      <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 flex flex-col gap-2.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 flex items-center gap-1.5">
          <Sparkles size={12} /> Generate with KORA
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic or unit, e.g. The Columbian Exchange"
            className={`${inputCls} flex-1`}
          />
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGeneratePrompt}
              disabled={generatingPrompt}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-60"
            >
              {generatingPrompt && <Sparkles size={11} className="animate-pulse" />}
              {generatingPrompt ? "Writing…" : "Prompt"}
            </button>
            <button
              type="button"
              onClick={handleGenerateRubric}
              disabled={generatingRubric}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-60"
            >
              {generatingRubric && <Sparkles size={11} className="animate-pulse" />}
              {generatingRubric ? "Writing…" : "Rubric"}
            </button>
          </div>
        </div>
        {generateError && <p className="text-[12px] text-red-600">{generateError}</p>}
        {essayType === "DBQ" && suggestedDocTopics.length > 0 && (
          <div className="rounded-lg bg-white/70 border border-violet-100 px-3 py-2">
            <p className="text-[11px] font-semibold text-stone-500 mb-1">
              Suggested source topics — find real documents for these, KORA won&rsquo;t invent them:
            </p>
            <ul className="text-[12px] text-stone-500 list-disc list-inside">
              {suggestedDocTopics.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Title + prompt */}
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Assignment title</span>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Unit 4 LEQ — Comparative Empires"
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
          Prompt {essayType === "SAQ" && <span className="normal-case font-normal text-stone-300">(include parts A, B, C)</span>}
        </span>
        <textarea
          required
          rows={4}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className={`${inputCls} resize-none`}
        />
      </label>

      {/* DBQ documents */}
      {essayType === "DBQ" && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
              Source documents
            </span>
            <button
              type="button"
              onClick={addDocument}
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
            >
              <Plus size={12} /> Add document
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {documents.map((doc, i) => (
              <div key={i} className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={doc.label}
                    onChange={(e) => updateDocument(i, "label", e.target.value)}
                    className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm font-medium outline-none focus:border-violet-400"
                  />
                  {documents.length > 1 && (
                    <button type="button" onClick={() => removeDocument(i)} className="text-stone-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={doc.source_text}
                  onChange={(e) => updateDocument(i, "source_text", e.target.value)}
                  placeholder="Paste the document excerpt, attribution, and date."
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-violet-400 resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rubric */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Rubric — {maxScore} points total
          </span>
        </div>
        <div ref={rubricRef} className="flex flex-col gap-2.5">
          {rubric.map((row, i) => (
            <div key={i} className="rubric-edit-row rounded-xl border border-stone-200 bg-stone-50 p-3.5 flex flex-col gap-2" style={{ opacity: 0 }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={row.category}
                  onChange={(e) => updateRubricRow(i, "category", e.target.value)}
                  className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-violet-400"
                />
                <input
                  type="number"
                  min={0}
                  value={row.points_possible}
                  onChange={(e) => updateRubricRow(i, "points_possible", e.target.value)}
                  className="w-16 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm text-center outline-none focus:border-violet-400"
                />
                <span className="text-xs text-stone-400 shrink-0">pts</span>
              </div>
              <textarea
                rows={2}
                value={row.description}
                onChange={(e) => updateRubricRow(i, "description", e.target.value)}
                className="rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-[13px] outline-none focus:border-violet-400 resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Revisions */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Revisions allowed</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={5}
            value={maxRevisions}
            onChange={(e) => setMaxRevisions(Math.max(0, Math.min(5, Number(e.target.value) || 0)))}
            className={`${inputCls} w-20 text-center`}
          />
          <p className="text-[13px] text-stone-500">
            {maxRevisions === 0
              ? "Students can't revise and resubmit this assignment."
              : `Students can revise and resubmit up to ${maxRevisions} time${maxRevisions === 1 ? "" : "s"} after grading.`}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 py-3.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all disabled:opacity-60"
      >
        {loading ? "Publishing…" : "Publish assignment"}
      </button>
    </form>
  );
}
