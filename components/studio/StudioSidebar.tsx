"use client";

import { BookOpen, ChevronDown, ChevronUp, Copy, FilePlus2, Trash2 } from "lucide-react";
import type { StudioSlide, TeacherStudioProject } from "@/lib/studioTypes";

export type SelectedItem =
  | { kind: "guide" }
  | { kind: "slide"; id: string }
  | { kind: "section"; id: string }
  | null;

interface StudioSidebarProps {
  project: TeacherStudioProject;
  selected: SelectedItem;
  onSelect: (item: SelectedItem) => void;
  onAddSlide: () => void;
  onRemoveSlide: (id: string) => void;
  onDuplicateSlide: (id: string) => void;
  onReorderSlide: (id: string, direction: "up" | "down") => void;
  onAddSection: () => void;
  onRemoveSection: (id: string) => void;
  onDuplicateSection: (id: string) => void;
  onReorderSection: (id: string, direction: "up" | "down") => void;
}

export default function StudioSidebar({
  project,
  selected,
  onSelect,
  onAddSlide,
  onRemoveSlide,
  onDuplicateSlide,
  onReorderSlide,
  onAddSection,
  onRemoveSection,
  onDuplicateSection,
  onReorderSection,
}: StudioSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto bg-navy-900/[0.015] p-3">
      <button
        type="button"
        onClick={() => onSelect({ kind: "guide" })}
        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition ${
          selected?.kind === "guide" ? "bg-teal-50 text-teal-800" : "text-navy-800 hover:bg-navy-900/5"
        }`}
      >
        <BookOpen size={14} />
        Teacher guide
      </button>

      {project.slides.length > 0 || project.worksheetSections.length === 0 ? (
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-navy-700/45">Slides</p>
            <button
              type="button"
              onClick={onAddSlide}
              aria-label="Add slide"
              className="flex h-6 w-6 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
            >
              <FilePlus2 size={13} />
            </button>
          </div>
          <ul className="space-y-1.5">
            {project.slides.map((slide, index) => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                index={index}
                active={selected?.kind === "slide" && selected.id === slide.id}
                onSelect={() => onSelect({ kind: "slide", id: slide.id })}
                onDuplicate={() => onDuplicateSlide(slide.id)}
                onRemove={() => onRemoveSlide(slide.id)}
                onUp={index > 0 ? () => onReorderSlide(slide.id, "up") : undefined}
                onDown={index < project.slides.length - 1 ? () => onReorderSlide(slide.id, "down") : undefined}
              />
            ))}
            {project.slides.length === 0 && <EmptyRow label="No slides yet" />}
          </ul>
        </div>
      ) : null}

      {project.worksheetSections.length > 0 || project.slides.length === 0 ? (
        <SidebarGroup title="Worksheet sections" onAdd={onAddSection} addLabel="Add section">
          {project.worksheetSections.map((section, index) => (
            <SidebarRow
              key={section.id}
              label={section.title || "Untitled section"}
              meta={`${section.questions.length} q`}
              active={selected?.kind === "section" && selected.id === section.id}
              onSelect={() => onSelect({ kind: "section", id: section.id })}
              onDuplicate={() => onDuplicateSection(section.id)}
              onRemove={() => onRemoveSection(section.id)}
              onUp={index > 0 ? () => onReorderSection(section.id, "up") : undefined}
              onDown={
                index < project.worksheetSections.length - 1
                  ? () => onReorderSection(section.id, "down")
                  : undefined
              }
            />
          ))}
          {project.worksheetSections.length === 0 && <EmptyRow label="No sections yet" />}
        </SidebarGroup>
      ) : null}
    </div>
  );
}

function SlideThumbnail({
  slide,
  index,
  active,
  onSelect,
  onDuplicate,
  onRemove,
  onUp,
  onDown,
}: {
  slide: StudioSlide;
  index: number;
  active: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onUp?: () => void;
  onDown?: () => void;
}) {
  return (
    <li className="group relative">
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-1.5 rounded-lg p-1 text-left">
        <span
          className={`mt-1 w-4 flex-shrink-0 text-[10px] font-semibold ${
            active ? "text-teal-700" : "text-navy-700/35"
          }`}
        >
          {index + 1}
        </span>
        <span
          className={`flex aspect-[16/9] w-full flex-col overflow-hidden rounded-[4px] border bg-white p-1.5 shadow-sm transition ${
            active ? "border-teal-500 ring-1 ring-teal-500" : "border-navy-900/15 group-hover:border-navy-900/25"
          }`}
        >
          <span className="line-clamp-1 font-display text-[8px] font-semibold leading-tight text-navy-900">
            {slide.title || "Untitled slide"}
          </span>
          {slide.bullets.length > 0 ? (
            <span className="mt-0.5 flex-1 space-y-0.5 overflow-hidden">
              {slide.bullets.slice(0, 3).map((b) => (
                <span key={b.id} className="line-clamp-1 block text-[6.5px] leading-tight text-navy-700/50">
                  · {b.text || "untitled"}
                </span>
              ))}
            </span>
          ) : slide.body ? (
            <span className="mt-0.5 line-clamp-3 flex-1 text-[6.5px] leading-tight text-navy-700/50">
              {slide.body}
            </span>
          ) : null}
        </span>
      </button>
      <div className="absolute right-1 top-1 flex items-center gap-0.5 rounded-md bg-white/95 px-0.5 opacity-0 shadow-sm transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onUp}
          disabled={!onUp}
          aria-label="Move slide up"
          className="flex h-5 w-5 items-center justify-center rounded text-navy-700/50 hover:bg-navy-900/10 disabled:opacity-0"
        >
          <ChevronUp size={11} />
        </button>
        <button
          type="button"
          onClick={onDown}
          disabled={!onDown}
          aria-label="Move slide down"
          className="flex h-5 w-5 items-center justify-center rounded text-navy-700/50 hover:bg-navy-900/10 disabled:opacity-0"
        >
          <ChevronDown size={11} />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          aria-label="Duplicate slide"
          className="flex h-5 w-5 items-center justify-center rounded text-navy-700/50 hover:bg-navy-900/10"
        >
          <Copy size={10} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Delete slide"
          className="flex h-5 w-5 items-center justify-center rounded text-navy-700/50 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </li>
  );
}

function SidebarGroup({
  title,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-navy-700/45">{title}</p>
        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel}
          className="flex h-6 w-6 items-center justify-center rounded-full text-teal-700 hover:bg-teal-50"
        >
          <FilePlus2 size={13} />
        </button>
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <li className="px-2 py-2 text-xs text-navy-700/40">{label}</li>;
}

function SidebarRow({
  label,
  meta,
  active,
  onSelect,
  onDuplicate,
  onRemove,
  onUp,
  onDown,
}: {
  label: string;
  meta: string;
  active: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onUp?: () => void;
  onDown?: () => void;
}) {
  return (
    <li
      className={`group flex items-center gap-1 rounded-xl px-2 py-1.5 transition ${
        active ? "bg-teal-50" : "hover:bg-navy-900/5"
      }`}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className={`truncate text-xs font-medium ${active ? "text-teal-800" : "text-navy-800"}`}>
          {label}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-navy-700/40">{meta}</p>
      </button>
      <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={onUp}
          disabled={!onUp}
          aria-label="Move up"
          className="flex h-5 w-5 items-center justify-center rounded text-navy-700/50 hover:bg-navy-900/10 disabled:opacity-0"
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          onClick={onDown}
          disabled={!onDown}
          aria-label="Move down"
          className="flex h-5 w-5 items-center justify-center rounded text-navy-700/50 hover:bg-navy-900/10 disabled:opacity-0"
        >
          <ChevronDown size={12} />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          aria-label="Duplicate"
          className="flex h-5 w-5 items-center justify-center rounded text-navy-700/50 hover:bg-navy-900/10"
        >
          <Copy size={11} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Delete"
          className="flex h-5 w-5 items-center justify-center rounded text-navy-700/50 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </li>
  );
}
