"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { importPptxFile } from "@/lib/pptxImport";
import { generateKoraNotes } from "@/lib/koraClient";
import { createBlankAnchoredProject } from "@/lib/anchoredNotesDefaults";
import { saveAnchoredProject } from "@/lib/anchoredNotesStorage";
import type { KoraNotesOutput } from "@/lib/koraTypes";
import type { AnchoredNotesBlock } from "@/lib/anchoredNotesTypes";
import type { TeacherStudioProject } from "@/lib/studioTypes";

function extractSlideText(project: TeacherStudioProject): string {
  return project.slides
    .map((slide, i) => {
      const parts: string[] = [`--- Slide ${i + 1} ---`];
      if (slide.title) parts.push(slide.title);
      if (slide.subtitle) parts.push(slide.subtitle);
      if (slide.body) parts.push(slide.body);
      for (const b of slide.bullets) {
        if (b.text) parts.push(`• ${b.text}`);
      }
      for (const el of slide.extraElements ?? []) {
        if (el.kind === "text" && el.text) parts.push(el.text);
      }
      return parts.filter(Boolean).join("\n");
    })
    .join("\n\n");
}

function koraNotesToBlocks(notes: KoraNotesOutput): AnchoredNotesBlock[] {
  const blocks: AnchoredNotesBlock[] = [];

  if (notes.essential_question) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "essentialQuestion",
      include: true,
      content: notes.essential_question,
    });
  }

  for (const section of notes.sections) {
    if (section.type === "anchor") {
      blocks.push({
        id: crypto.randomUUID(),
        type: "sectionHeading",
        include: true,
        content: section.heading,
      });
      blocks.push({
        id: crypto.randomUUID(),
        type: "guidedParagraph",
        include: true,
        title: "Anchor Statement",
        content: section.content,
      });
    } else if (section.type === "prerequisite_check") {
      blocks.push({
        id: crypto.randomUUID(),
        type: "callout",
        include: true,
        title: section.heading,
        content: section.content,
      });
    } else if (section.type === "core_idea") {
      blocks.push({
        id: crypto.randomUUID(),
        type: "sectionHeading",
        include: true,
        content: section.heading,
      });
      blocks.push({
        id: crypto.randomUUID(),
        type: "guidedParagraph",
        include: true,
        content: section.content,
      });
    } else if (section.type === "example_analysis") {
      const examples = section.content
        .split("\n")
        .map((l) => l.replace(/^[-•]\s*/, "").trim())
        .filter(Boolean);
      blocks.push({
        id: crypto.randomUUID(),
        type: "sectionHeading",
        include: true,
        content: section.heading,
      });
      blocks.push({
        id: crypto.randomUUID(),
        type: "table",
        include: true,
        table: {
          headers: ["Example", "Why It Shows the Concept"],
          rows: examples.length
            ? examples.map((ex) => [ex, ""])
            : [[section.content, ""]],
        },
      });
    } else if (section.type === "misconception_alert") {
      blocks.push({
        id: crypto.randomUUID(),
        type: "callout",
        include: true,
        title: section.heading,
        content: section.content,
      });
    } else if (section.type === "transfer_challenge") {
      blocks.push({
        id: crypto.randomUUID(),
        type: "sectionHeading",
        include: true,
        content: section.heading,
      });
      blocks.push({
        id: crypto.randomUUID(),
        type: "responseBox",
        include: true,
        content: section.content,
        responseLines: 5,
      });
    }
  }

  if (notes.key_vocabulary?.length) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "sectionHeading",
      include: true,
      content: "Key Vocabulary",
    });
    blocks.push({
      id: crypto.randomUUID(),
      type: "table",
      include: true,
      table: {
        headers: ["Term", "Definition", "Example"],
        rows: notes.key_vocabulary.map((v) => [v.term, v.definition, v.example]),
      },
    });
  }

  if (notes.self_check_questions?.length) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "sectionHeading",
      include: true,
      content: "Self-Check Questions",
    });
    for (const q of notes.self_check_questions) {
      blocks.push({
        id: crypto.randomUUID(),
        type: "responseBox",
        include: true,
        content: q.question,
        responseLines: 3,
      });
    }
  }

  return blocks;
}

export default function KoraNotesGenerator() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [sourceText, setSourceText] = useState("");
  const [fileName, setFileName] = useState("");
  const [concept, setConcept] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [standard, setStandard] = useState("");
  const [teacherGoal, setTeacherGoal] = useState("");

  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    if (!file.name.endsWith(".pptx")) {
      setError("Please upload a .pptx file.");
      return;
    }
    setParsing(true);
    setError("");
    try {
      const { project } = await importPptxFile(file);
      const text = extractSlideText(project);
      setSourceText(text);
      setFileName(file.name);
      if (!concept && project.title) setConcept(project.title);
      if (!subject && project.subject) setSubject(project.subject);
      if (!gradeLevel && project.gradeLevel) setGradeLevel(project.gradeLevel);
    } catch {
      setError("Could not read the file. Make sure it is a valid .pptx.");
    } finally {
      setParsing(false);
    }
  }

  async function handleGenerate() {
    if (!concept.trim()) { setError("Please enter a concept name."); return; }
    if (!subject.trim()) { setError("Please enter a subject."); return; }
    if (!gradeLevel.trim()) { setError("Please enter a grade band."); return; }
    if (!sourceText.trim()) { setError("Please add lesson content (upload a .pptx or paste text)."); return; }

    setGenerating(true);
    setError("");

    try {
      const notes = await generateKoraNotes({
        concept: concept.trim(),
        subject: subject.trim(),
        gradeLevel: gradeLevel.trim(),
        sourceContent: sourceText.trim(),
        standard: standard.trim() || undefined,
        teacherGoal: teacherGoal.trim() || undefined,
      });

      const now = Date.now();
      const project = createBlankAnchoredProject({
        title: notes.title || `Notes: ${concept}`,
        course: subject.trim(),
        gradeLevel: gradeLevel.trim(),
        blocks: koraNotesToBlocks(notes),
        createdAt: now,
        updatedAt: now,
      });

      saveAnchoredProject(project);
      router.push(`/studio/anchored-notes/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setGenerating(false);
    }
  }

  const canGenerate = concept.trim() && subject.trim() && gradeLevel.trim() && sourceText.trim();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-navy-900">Notes from Slideshow</h1>
        <p className="mt-2 text-navy-700/70">
          Upload your lesson slides — KORA generates structured notes designed for deep understanding,
          not fill-in-the-blank.
        </p>
      </div>

      <div className="space-y-6">
        {/* Source content */}
        <div className="rounded-3xl border border-navy-900/8 bg-white p-6">
          <p className="mb-3 text-sm font-medium text-navy-800">Lesson content</p>

          {fileName ? (
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-teal-50 px-4 py-3">
              <FileText size={18} className="shrink-0 text-teal-700" />
              <span className="text-sm font-medium text-teal-800">{fileName}</span>
              <button
                type="button"
                onClick={() => { setFileName(""); setSourceText(""); }}
                className="ml-auto text-teal-600 hover:text-teal-900"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={parsing}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy-900/15 bg-navy-50/50 py-6 text-sm text-navy-600 transition hover:border-teal-400/50 hover:bg-teal-50 disabled:opacity-60"
            >
              {parsing ? (
                <><Loader2 size={18} className="animate-spin" /> Parsing slides…</>
              ) : (
                <><Upload size={18} /> Upload a .pptx file</>
              )}
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".pptx"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          <label className="mb-1 block text-xs font-medium text-navy-700/60">
            Or paste lesson text
          </label>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Paste your lesson notes, outline, or any text about this concept…"
            rows={6}
            className="w-full resize-none rounded-2xl border border-navy-900/10 bg-navy-50/50 px-4 py-3 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
          />
        </div>

        {/* Concept metadata */}
        <div className="rounded-3xl border border-navy-900/8 bg-white p-6">
          <p className="mb-4 text-sm font-medium text-navy-800">Concept details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-700/60">
                Concept name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g. Opportunity Cost"
                className="w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-700/60">
                Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. AP Economics"
                className="w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-700/60">
                Grade band <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. 11–12"
                className="w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-700/60">Standard (optional)</label>
              <input
                type="text"
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                placeholder="e.g. ECON.4.1"
                className="w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-navy-700/60">
                Teacher goal (optional)
              </label>
              <input
                type="text"
                value={teacherGoal}
                onChange={(e) => setTeacherGoal(e.target.value)}
                placeholder="e.g. Students can identify hidden trade-offs in everyday decisions"
                className="w-full rounded-xl border border-navy-900/10 bg-navy-50/50 px-3 py-2 text-sm text-navy-800 placeholder:text-navy-400 focus:border-teal-400/60 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || generating || parsing}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 size={18} className="animate-spin" /> KORA is generating your notes…</>
          ) : (
            "Generate KORA Notes"
          )}
        </button>

        {generating && (
          <p className="text-center text-xs text-navy-700/50">
            This takes 10–20 seconds. KORA is structuring notes for deep understanding.
          </p>
        )}
      </div>
    </div>
  );
}
