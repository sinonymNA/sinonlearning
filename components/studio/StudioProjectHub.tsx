"use client";

import { BookOpen, FileText, Presentation } from "lucide-react";
import SlideThumb from "./SlideThumb";
import type { TeacherStudioProject } from "@/lib/studioTypes";

interface StudioProjectHubProps {
  project: TeacherStudioProject;
  onOpenSlides: () => void;
  onOpenWorksheet: () => void;
  onOpenGuide: () => void;
}

export default function StudioProjectHub({
  project,
  onOpenSlides,
  onOpenWorksheet,
  onOpenGuide,
}: StudioProjectHubProps) {
  const slideCount = project.slides.length;
  const sectionCount = project.worksheetSections.length;
  const questionCount = project.worksheetSections.reduce((sum, s) => sum + s.questions.length, 0);
  const guide = project.teacherGuide;
  const guideHasContent =
    guide.overview.trim().length > 0 ||
    guide.objectives.some((o) => o.trim()) ||
    guide.materials.some((m) => m.trim()) ||
    guide.timingNotes.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-teal-700">Project</p>
      <h1 className="mt-1 font-display text-3xl text-navy-900">{project.title || "Untitled project"}</h1>
      <p className="mt-2 text-sm text-navy-700/60">
        Pick a material below to open its editor. Each one opens in a workspace built for that format.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Slides */}
        <button
          type="button"
          onClick={onOpenSlides}
          className="group flex flex-col rounded-2xl border border-navy-900/8 bg-white p-5 text-left shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition hover:border-teal-400/50 hover:shadow-[0_8px_28px_rgba(13,27,46,0.10)]"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <Presentation size={17} />
            </span>
            <div>
              <p className="font-display text-lg text-navy-900">Slides</p>
              <p className="text-xs text-navy-700/50">
                {slideCount > 0 ? `${slideCount} slide${slideCount === 1 ? "" : "s"}` : "No slides yet"}
              </p>
            </div>
          </div>
          {slideCount > 0 ? (
            <div className="flex gap-1.5">
              {project.slides.slice(0, 3).map((slide) => (
                <span
                  key={slide.id}
                  className="flex aspect-[16/9] flex-1 overflow-hidden rounded border border-navy-900/12 bg-white"
                >
                  <SlideThumb slide={slide} />
                </span>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[16/9] w-1/2 items-center justify-center rounded border border-dashed border-navy-900/15 text-xs text-navy-700/40">
              Empty deck
            </div>
          )}
          <span className="mt-4 text-xs font-semibold text-teal-700 group-hover:underline">
            {slideCount > 0 ? "Open slides editor →" : "Start building slides →"}
          </span>
        </button>

        {/* Worksheet */}
        <button
          type="button"
          onClick={onOpenWorksheet}
          className="group flex flex-col rounded-2xl border border-navy-900/8 bg-white p-5 text-left shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition hover:border-teal-400/50 hover:shadow-[0_8px_28px_rgba(13,27,46,0.10)]"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <FileText size={17} />
            </span>
            <div>
              <p className="font-display text-lg text-navy-900">Worksheet</p>
              <p className="text-xs text-navy-700/50">
                {sectionCount > 0
                  ? `${sectionCount} section${sectionCount === 1 ? "" : "s"} · ${questionCount} question${
                      questionCount === 1 ? "" : "s"
                    }`
                  : "No worksheet yet"}
              </p>
            </div>
          </div>
          <div className="flex-1 rounded border border-navy-900/8 bg-navy-900/[0.02] p-3">
            {sectionCount > 0 ? (
              <ul className="space-y-1">
                {project.worksheetSections.slice(0, 3).map((s) => (
                  <li key={s.id} className="truncate text-xs text-navy-700/60">
                    • {s.title || "Untitled section"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-navy-700/40">A printable handout of questions and prompts.</p>
            )}
          </div>
          <span className="mt-4 text-xs font-semibold text-teal-700 group-hover:underline">
            {sectionCount > 0 ? "Open worksheet editor →" : "Start a worksheet →"}
          </span>
        </button>

        {/* Teacher guide */}
        <button
          type="button"
          onClick={onOpenGuide}
          className="group flex flex-col rounded-2xl border border-navy-900/8 bg-white p-5 text-left shadow-[0_1px_2px_rgba(13,27,46,0.04)] transition hover:border-teal-400/50 hover:shadow-[0_8px_28px_rgba(13,27,46,0.10)] sm:col-span-2"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-700">
              <BookOpen size={17} />
            </span>
            <div>
              <p className="font-display text-lg text-navy-900">Teacher Guide</p>
              <p className="text-xs text-navy-700/50">
                {guideHasContent
                  ? `${guide.objectives.filter((o) => o.trim()).length} objective${
                      guide.objectives.filter((o) => o.trim()).length === 1 ? "" : "s"
                    }`
                  : "Not written yet"}
              </p>
            </div>
          </div>
          <p className="line-clamp-2 text-xs text-navy-700/55">
            {guide.overview.trim() || "Overview, objectives, materials, and pacing notes for teaching this lesson."}
          </p>
          <span className="mt-3 text-xs font-semibold text-teal-700 group-hover:underline">
            {guideHasContent ? "Open teacher guide →" : "Write the teacher guide →"}
          </span>
        </button>
      </div>
    </div>
  );
}
