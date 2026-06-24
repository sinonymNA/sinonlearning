"use client";

import { useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import StudioTopBar from "./StudioTopBar";
import SlidePreview from "./SlidePreview";
import SlideThumb from "./SlideThumb";
import CometDock from "./CometDock";
import type { CometEditOutcome } from "@/lib/cometEditValidation";
import type {
  ImagePlaceholder,
  PreviewAudience,
  StudioSlide,
  TeacherStudioProject,
} from "@/lib/studioTypes";

interface SlidesEditorProps {
  project: TeacherStudioProject;
  audience: PreviewAudience;
  onAudienceChange: (audience: PreviewAudience) => void;
  onBack: () => void;
  onRename: (title: string) => void;
  onUpdateMeta: (patch: Partial<Pick<TeacherStudioProject, "subject" | "gradeLevel" | "durationMinutes">>) => void;
  onOpenExport: () => void;
  onDuplicate: () => void;
  onAddSlide: () => void;
  onUpdateSlide: (slideId: string, patch: Partial<StudioSlide>) => void;
  onRemoveSlide: (slideId: string) => void;
  onDuplicateSlide: (slideId: string) => void;
  onReorderSlide: (slideId: string, direction: "up" | "down") => void;
  onReorderSlideTo: (slideId: string, toIndex: number) => void;
  onAddImagePlaceholder: (slideId: string) => void;
  onUpdatePlaceholder: (placeholderId: string, patch: Partial<ImagePlaceholder>) => void;
  onRemovePlaceholder: (placeholderId: string, slideId: string) => void;
  onApplyQuickAction: (actionId: string) => void;
  onApplyCometEdit: (edit: CometEditOutcome) => void;
  onToggleChecklistItem: (itemId: string, passed: boolean) => void;
}

export default function SlidesEditor({
  project,
  audience,
  onAudienceChange,
  onBack,
  onRename,
  onUpdateMeta,
  onOpenExport,
  onDuplicate,
  onAddSlide,
  onUpdateSlide,
  onRemoveSlide,
  onDuplicateSlide,
  onReorderSlide,
  onReorderSlideTo,
  onAddImagePlaceholder,
  onUpdatePlaceholder,
  onRemovePlaceholder,
  onApplyQuickAction,
  onApplyCometEdit,
  onToggleChecklistItem,
}: SlidesEditorProps) {
  const slides = project.slides;
  // Selection is tracked by position, then clamped at render — robust to add/delete/reorder
  // and to Comet replacing the whole deck (which regenerates slide ids).
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIndex = slides.length ? Math.min(selectedIndex, slides.length - 1) : -1;
  const selectedSlide = activeIndex >= 0 ? slides[activeIndex] : null;

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => () => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || index === draggedIndex) return;
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const slideId = slides[draggedIndex].id;
    onReorderSlideTo(slideId, index);
    const insertAt = Math.max(0, Math.min(draggedIndex < index ? index - 1 : index, slides.length - 1));
    setSelectedIndex(insertAt);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAddSlide = () => {
    onAddSlide();
    setSelectedIndex(slides.length);
  };

  const handleDuplicate = () => {
    if (!selectedSlide) return;
    onDuplicateSlide(selectedSlide.id);
    setSelectedIndex(activeIndex + 1);
  };

  const handleReorder = (direction: "up" | "down") => {
    if (!selectedSlide) return;
    onReorderSlide(selectedSlide.id, direction);
    setSelectedIndex((i) => (direction === "up" ? Math.max(0, i - 1) : Math.min(slides.length - 1, i + 1)));
  };

  const handleRemove = () => {
    if (!selectedSlide) return;
    onRemoveSlide(selectedSlide.id);
    setSelectedIndex((i) => Math.max(0, i - 1));
  };

  const linkedPlaceholder = selectedSlide?.imagePlaceholderId
    ? project.imagePlaceholders.find((p) => p.id === selectedSlide.imagePlaceholderId)
    : undefined;

  return (
    <div className="flex h-screen flex-col bg-studio-canvas">
      <StudioTopBar
        project={project}
        audience={audience}
        onAudienceChange={onAudienceChange}
        onRename={onRename}
        onUpdateMeta={onUpdateMeta}
        onOpenExport={onOpenExport}
        onDuplicate={onDuplicate}
        onBack={onBack}
        backLabel="Back to project"
        compact
        contextLabel="Slides"
      />

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Filmstrip — vertical on desktop, horizontal strip on mobile */}
        <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-navy-900/8 bg-white/70 p-3 lg:w-[208px] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:border-b-0 lg:border-r">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              draggable
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedIndex(index)}
              className={`group flex shrink-0 cursor-grab items-start gap-1.5 text-left active:cursor-grabbing lg:w-full ${
                draggedIndex === index ? "opacity-40" : ""
              } ${
                dragOverIndex === index && draggedIndex !== null && draggedIndex !== index
                  ? "border-l-2 border-teal-500 pl-1 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-1"
                  : ""
              }`}
            >
              <span
                className={`mt-1 hidden w-4 text-[10px] font-semibold lg:block ${
                  activeIndex === index ? "text-teal-700" : "text-navy-700/35"
                }`}
              >
                {index + 1}
              </span>
              <span
                className={`relative flex aspect-[16/9] w-32 overflow-hidden rounded-[4px] border bg-white shadow-sm transition lg:w-full ${
                  activeIndex === index
                    ? "border-teal-500 ring-1 ring-teal-500"
                    : "border-navy-900/15 group-hover:border-navy-900/30"
                }`}
              >
                <SlideThumb slide={slide} />
                <GripVertical
                  size={12}
                  className="absolute right-0.5 top-0.5 text-navy-900/20 opacity-0 transition group-hover:opacity-100"
                />
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleAddSlide}
            className="flex aspect-[16/9] w-32 shrink-0 flex-col items-center justify-center gap-1 rounded-[4px] border border-dashed border-navy-900/20 text-navy-700/45 transition hover:border-teal-400/60 hover:text-teal-700 lg:ml-[22px] lg:w-[calc(100%-22px)]"
          >
            <Plus size={16} />
            <span className="text-[10px] font-medium">Add slide</span>
          </button>
        </div>

        {/* Stage */}
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 sm:py-12">
          {selectedSlide ? (
            <SlidePreview
              slide={selectedSlide}
              audience={audience}
              linkedPlaceholder={linkedPlaceholder}
              placeholders={project.imagePlaceholders}
              frameMaxWidth="max-w-4xl"
              onChange={(patch) => onUpdateSlide(selectedSlide.id, patch)}
              onAddImagePlaceholder={() => onAddImagePlaceholder(selectedSlide.id)}
              onUpdatePlaceholder={(patch) =>
                selectedSlide.imagePlaceholderId &&
                onUpdatePlaceholder(selectedSlide.imagePlaceholderId, patch)
              }
              onRemovePlaceholder={() =>
                selectedSlide.imagePlaceholderId &&
                onRemovePlaceholder(selectedSlide.imagePlaceholderId, selectedSlide.id)
              }
              onUpdateExtraPlaceholder={onUpdatePlaceholder}
            />
          ) : (
            <div className="mx-auto flex h-full max-w-4xl flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-navy-700/50">This deck doesn&apos;t have any slides yet.</p>
              <button
                type="button"
                onClick={handleAddSlide}
                className="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Plus size={14} /> Add your first slide
              </button>
            </div>
          )}

          {selectedSlide && (
            <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-4 text-xs text-navy-700/45">
              <button type="button" onClick={handleDuplicate} className="hover:text-teal-700">
                Duplicate slide
              </button>
              <span className="h-3 w-px bg-navy-900/10" />
              <button
                type="button"
                onClick={() => handleReorder("up")}
                disabled={activeIndex === 0}
                className="hover:text-teal-700 disabled:opacity-30 disabled:hover:text-navy-700/45"
              >
                Move up
              </button>
              <button
                type="button"
                onClick={() => handleReorder("down")}
                disabled={activeIndex === slides.length - 1}
                className="hover:text-teal-700 disabled:opacity-30 disabled:hover:text-navy-700/45"
              >
                Move down
              </button>
              <span className="h-3 w-px bg-navy-900/10" />
              <button type="button" onClick={handleRemove} className="hover:text-rose-600">
                Delete slide
              </button>
            </div>
          )}
        </div>
      </div>

      <CometDock
        project={project}
        onApplyQuickAction={onApplyQuickAction}
        onApplyCometEdit={onApplyCometEdit}
        onToggleChecklistItem={onToggleChecklistItem}
      />
    </div>
  );
}
