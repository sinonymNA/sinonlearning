"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate } from "animejs";
import confetti from "canvas-confetti";
import {
  Plus,
  Trash2,
  Sparkles,
  PenLine,
  ListChecks,
  Layers,
  Image as ImageIcon,
  Loader2,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { RUBRIC_TEMPLATES, type EssayType, type RubricCriterion } from "@/lib/marginsRubrics";
import { revealStagger } from "@/lib/marginsMotion";

interface DocumentEntry {
  label: string;
  source_text: string;
  image_id?: string;
  uploading?: boolean;
  uploadError?: string;
}

const ESSAY_TYPES: { value: EssayType; label: string; hint: string; icon: typeof PenLine }[] = [
  { value: "LEQ", label: "LEQ", hint: "Long Essay · 6 pts", icon: PenLine },
  { value: "SAQ", label: "SAQ", hint: "Short Answer · 3 pts", icon: ListChecks },
  { value: "DBQ", label: "DBQ", hint: "Document-Based · 7 pts", icon: Layers },
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
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [suggestedDocTopics, setSuggestedDocTopics] = useState<string[]>([]);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [generatingRubric, setGeneratingRubric] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const rubricRef = useRef<HTMLDivElement>(null);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDragOver, setImportDragOver] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const docsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formRef.current) {
      revealStagger(formRef.current, ".wizard-block", { stagger: 90, duration: 460, translateY: 16 });
    }
  }, []);

  useEffect(() => {
    if (essayType === "DBQ" && docsRef.current) {
      animate(docsRef.current, { opacity: [0, 1], translateY: [16, 0], duration: 420, easing: "outQuart" });
    }
  }, [essayType]);

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

  async function handleImportFile(file: File) {
    setImportError(null);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/margins/import-assignment", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error ?? "Could not read that file.");
        return;
      }
      const imported = data.assignment as {
        essay_type: EssayType;
        title: string;
        prompt_text: string;
        rubric?: RubricCriterion[];
        documents?: { label: string; source_text: string }[];
      };
      setEssayType(imported.essay_type);
      setRubric(
        imported.rubric && imported.rubric.length > 0 ? imported.rubric : RUBRIC_TEMPLATES[imported.essay_type]
      );
      setTitle((cur) => (cur.trim() ? cur : imported.title));
      setPromptText((cur) => (cur.trim() ? cur : imported.prompt_text));
      if (imported.documents && imported.documents.length > 0) {
        setDocuments(imported.documents.map((d) => ({ label: d.label, source_text: d.source_text })));
      }
    } catch {
      setImportError("Network error. Please try again.");
    } finally {
      setImporting(false);
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
  function updateDocumentField(i: number, patch: Partial<DocumentEntry>) {
    setDocuments((d) => d.map((doc, idx) => (idx === i ? { ...doc, ...patch } : doc)));
  }

  async function handleImageUpload(i: number, file: File) {
    updateDocumentField(i, { uploading: true, uploadError: undefined });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/margins/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        updateDocumentField(i, { uploading: false, uploadError: data.error ?? "Upload failed." });
        return;
      }
      updateDocumentField(i, { uploading: false, image_id: data.imageId, uploadError: undefined });
    } catch {
      updateDocumentField(i, { uploading: false, uploadError: "Network error." });
    }
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
          documents:
            essayType === "DBQ"
              ? documents
                  .filter((d) => d.source_text.trim() || d.image_id)
                  .map((d) => ({ label: d.label, source_text: d.source_text, image_id: d.image_id }))
              : undefined,
          maxRevisions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create assignment.");
        setLoading(false);
        return;
      }
      setPublished(true);
      confetti({
        particleCount: 130,
        spread: 75,
        startVelocity: 32,
        origin: { y: 0.65 },
        colors: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ede9fe", "#ffffff"],
      });
      setTimeout(() => {
        router.push(`/margins/teacher/classes/${classId}`);
        router.refresh();
      }, 650);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const maxScore = rubric.reduce((sum, r) => sum + (r.points_possible || 0), 0);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* Import from file */}
      <div
        className="wizard-block rounded-xl border border-sky-100 bg-sky-50/50 overflow-hidden"
        style={{ opacity: 0 }}
      >
        <button
          type="button"
          onClick={() => setImportOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-[13px] font-semibold text-sky-700 flex items-center gap-1.5">
            <Upload size={14} /> Already have this assignment on paper or as a file? Import it.
          </span>
          <span className="text-sky-400 text-xs">{importOpen ? "▲" : "▼"}</span>
        </button>
        {importOpen && (
          <div className="px-4 pb-4 flex flex-col gap-2.5">
            <div
              onClick={() => importInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setImportDragOver(true);
              }}
              onDragLeave={() => setImportDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setImportDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  setImportFile(file);
                  handleImportFile(file);
                }
              }}
              className={[
                "flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-6 text-xs cursor-pointer transition-colors",
                importDragOver
                  ? "border-sky-400 bg-sky-50 text-sky-600"
                  : "border-sky-200 bg-white text-stone-400 hover:border-sky-300",
                importing ? "shadow-[0_0_20px_rgba(14,165,233,0.3)] animate-pulse" : "",
              ].join(" ")}
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin text-sky-500" />
                  <span className="text-sky-600 font-medium">Reading your assignment…</span>
                </>
              ) : importFile ? (
                <>
                  <FileText size={18} className="text-sky-500" />
                  <span>{importFile.name}</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Click or drag an image or PDF</span>
                </>
              )}
              <input
                ref={importInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImportFile(file);
                    handleImportFile(file);
                  }
                  e.target.value = "";
                }}
              />
            </div>
            {importError && <p className="text-[12px] text-red-600">{importError}</p>}
          </div>
        )}
      </div>

      {/* Essay type */}
      <div className="wizard-block" style={{ opacity: 0 }}>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Essay type</p>
        <div className="grid grid-cols-3 gap-2.5">
          {ESSAY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={(e) => {
                animate(e.currentTarget, { scale: [0.88, 1.06, 1], duration: 420, easing: "outElastic(1, .6)" });
                changeEssayType(t.value);
              }}
              className={[
                "rounded-xl border p-3.5 text-left transition-all",
                essayType === t.value
                  ? "border-violet-500 bg-violet-50"
                  : "border-stone-200 bg-white hover:border-violet-200",
              ].join(" ")}
            >
              <t.icon
                size={16}
                className={essayType === t.value ? "text-violet-500 mb-1" : "text-stone-300 mb-1"}
              />
              <p className="font-bold text-stone-900">{t.label}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{t.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* KORA generator */}
      <div
        className={[
          "wizard-block rounded-xl border p-4 flex flex-col gap-2.5 transition-shadow duration-300",
          generatingPrompt || generatingRubric
            ? "border-violet-300 bg-violet-50/50 shadow-[0_0_24px_rgba(139,92,246,0.35)] animate-pulse"
            : "border-violet-100 bg-violet-50/50",
        ].join(" ")}
        style={{ opacity: 0 }}
      >
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
              {generatingPrompt ? "Writing…" : "Prompt"}
            </button>
            <button
              type="button"
              onClick={handleGenerateRubric}
              disabled={generatingRubric}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-60"
            >
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
      <label className="wizard-block flex flex-col gap-1.5" style={{ opacity: 0 }}>
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

      <label className="wizard-block flex flex-col gap-1.5" style={{ opacity: 0 }}>
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
        <div ref={docsRef} style={{ opacity: 0 }}>
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

                {doc.image_id ? (
                  <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/margins/images/${doc.image_id}`}
                      alt={doc.label}
                      className="max-h-48 w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => updateDocumentField(i, { image_id: undefined })}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/60 text-white p-1 hover:bg-black/80"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : doc.uploading ? (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white py-6 text-stone-400 text-xs">
                    <Loader2 size={14} className="animate-spin" /> Uploading…
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRefs.current[i]?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIndex(i);
                    }}
                    onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverIndex(null);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageUpload(i, file);
                    }}
                    className={[
                      "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-5 text-xs cursor-pointer transition-colors",
                      dragOverIndex === i
                        ? "border-violet-400 bg-violet-50 text-violet-500"
                        : "border-stone-300 bg-white text-stone-400 hover:border-violet-300",
                    ].join(" ")}
                  >
                    <ImageIcon size={16} />
                    <span>Click or drag a photo of this document</span>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[i] = el;
                      }}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(i, file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
                {doc.uploadError && <p className="text-[11px] text-red-600">{doc.uploadError}</p>}

                <textarea
                  rows={3}
                  value={doc.source_text}
                  onChange={(e) => updateDocument(i, "source_text", e.target.value)}
                  placeholder="Optional: add a caption, attribution, or transcription."
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-violet-400 resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rubric */}
      <div className="wizard-block" style={{ opacity: 0 }}>
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
      <div className="wizard-block" style={{ opacity: 0 }}>
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
        className="wizard-block rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 py-3.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:shadow-md transition-all disabled:opacity-60"
        style={{ opacity: 0 }}
      >
        {published ? "Published!" : loading ? "Publishing…" : "Publish assignment"}
      </button>
    </form>
  );
}
