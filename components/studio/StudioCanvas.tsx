"use client";

import SlidePreview from "./SlidePreview";
import WorksheetPreview from "./WorksheetPreview";
import TeacherGuidePreview from "./TeacherGuidePreview";
import type { SelectedItem } from "./StudioSidebar";
import type {
  ImagePlaceholder,
  PreviewAudience,
  StudioSlide,
  TeacherGuide,
  TeacherStudioProject,
  WorksheetSection,
} from "@/lib/studioTypes";

interface StudioCanvasProps {
  project: TeacherStudioProject;
  selected: SelectedItem;
  audience: PreviewAudience;
  onChangeSlide: (slideId: string, patch: Partial<StudioSlide>) => void;
  onChangeSection: (sectionId: string, patch: Partial<WorksheetSection>) => void;
  onChangeGuide: (patch: Partial<TeacherGuide>) => void;
  onAddImagePlaceholder: (slideId: string) => void;
  onUpdatePlaceholder: (placeholderId: string, patch: Partial<ImagePlaceholder>) => void;
  onRemovePlaceholder: (placeholderId: string, slideId: string) => void;
}

export default function StudioCanvas({
  project,
  selected,
  audience,
  onChangeSlide,
  onChangeSection,
  onChangeGuide,
  onAddImagePlaceholder,
  onUpdatePlaceholder,
  onRemovePlaceholder,
}: StudioCanvasProps) {
  if (selected?.kind === "slide") {
    const slide = project.slides.find((s) => s.id === selected.id);
    if (!slide) return <EmptyCanvas />;
    const linkedPlaceholder = slide.imagePlaceholderId
      ? project.imagePlaceholders.find((p) => p.id === slide.imagePlaceholderId)
      : undefined;
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <SlidePreview
          slide={slide}
          audience={audience}
          linkedPlaceholder={linkedPlaceholder}
          onChange={(patch) => onChangeSlide(slide.id, patch)}
          onAddImagePlaceholder={() => onAddImagePlaceholder(slide.id)}
          onUpdatePlaceholder={(patch) =>
            slide.imagePlaceholderId && onUpdatePlaceholder(slide.imagePlaceholderId, patch)
          }
          onRemovePlaceholder={() =>
            slide.imagePlaceholderId && onRemovePlaceholder(slide.imagePlaceholderId, slide.id)
          }
        />
      </div>
    );
  }

  if (selected?.kind === "section") {
    const section = project.worksheetSections.find((s) => s.id === selected.id);
    if (!section) return <EmptyCanvas />;
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <WorksheetPreview
          section={section}
          audience={audience}
          onChange={(patch) => onChangeSection(section.id, patch)}
        />
      </div>
    );
  }

  if (selected?.kind === "guide") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <TeacherGuidePreview guide={project.teacherGuide} onChange={onChangeGuide} />
      </div>
    );
  }

  return <EmptyCanvas />;
}

function EmptyCanvas() {
  return (
    <div className="flex h-full items-center justify-center px-4 py-8 text-center text-sm text-navy-700/40">
      Select a slide, section, or the teacher guide from the sidebar to start editing.
    </div>
  );
}
