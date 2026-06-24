"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudioProject } from "@/hooks/useStudioProject";
import { loadProject } from "@/lib/studioStorage";
import StudioTopBar from "./StudioTopBar";
import StudioProjectHub from "./StudioProjectHub";
import SlidesEditor from "./SlidesEditor";
import DocsEditor from "./DocsEditor";
import ExportModal from "./ExportModal";
import type { PreviewAudience, TeacherStudioProject } from "@/lib/studioTypes";

interface StudioWorkspaceProps {
  projectId: string;
}

export default function StudioWorkspace({ projectId }: StudioWorkspaceProps) {
  const [initialProject, setInitialProject] = useState<TeacherStudioProject | null | undefined>(
    undefined
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- project lookup can't happen until after hydration (localStorage)
    setInitialProject(loadProject(projectId));
  }, [projectId]);

  if (initialProject === undefined) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-navy-700/50">
        Loading project…
      </div>
    );
  }

  if (initialProject === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
        <p className="text-navy-900">We couldn&apos;t find that project on this device.</p>
        <Link href="/studio" className="text-sm font-medium text-teal-700 hover:underline">
          Back to Teacher Studio
        </Link>
      </div>
    );
  }

  return <StudioWorkspaceEditor projectId={projectId} initialProject={initialProject} />;
}

type WorkspaceView = "hub" | "slides" | "worksheet" | "guide";

function StudioWorkspaceEditor({
  projectId,
  initialProject,
}: {
  projectId: string;
  initialProject: TeacherStudioProject;
}) {
  const router = useRouter();
  const {
    project,
    updateMeta,
    renameProject,
    updateTeacherGuide,
    addSlide,
    updateSlide,
    removeSlide,
    duplicateSlide,
    reorderSlide,
    reorderSlideTo,
    addSection,
    updateSection,
    removeSection,
    duplicateSection,
    reorderSection,
    reorderSectionTo,
    addImagePlaceholder,
    updateImagePlaceholder,
    removeImagePlaceholder,
    setChecklistItemPassed,
    applyTransform,
    applyCometEdit,
    saveAs,
  } = useStudioProject(projectId, initialProject);

  const [view, setView] = useState<WorkspaceView>("hub");
  const [audience, setAudience] = useState<PreviewAudience>("teacher");
  const [exportOpen, setExportOpen] = useState(false);

  const handleDuplicateProject = () => {
    const copy = saveAs();
    if (copy) router.push(`/studio/${copy.id}`);
  };

  const goHub = () => setView("hub");

  const sharedBarProps = {
    project,
    audience,
    onAudienceChange: setAudience,
    onRename: renameProject,
    onUpdateMeta: updateMeta,
    onOpenExport: () => setExportOpen(true),
    onDuplicate: handleDuplicateProject,
  };

  const cometProps = {
    onApplyQuickAction: applyTransform,
    onApplyCometEdit: applyCometEdit,
    onToggleChecklistItem: setChecklistItemPassed,
  };

  return (
    <>
      {view === "hub" && (
        <div className="flex min-h-screen flex-col bg-studio-canvas">
          <StudioTopBar {...sharedBarProps} />
          <div className="flex-1 overflow-y-auto">
            <StudioProjectHub
              project={project}
              onOpenSlides={() => setView("slides")}
              onOpenWorksheet={() => setView("worksheet")}
              onOpenGuide={() => setView("guide")}
            />
          </div>
        </div>
      )}

      {view === "slides" && (
        <SlidesEditor
          {...sharedBarProps}
          {...cometProps}
          onBack={goHub}
          onAddSlide={() => addSlide()}
          onUpdateSlide={updateSlide}
          onRemoveSlide={removeSlide}
          onDuplicateSlide={duplicateSlide}
          onReorderSlide={reorderSlide}
          onReorderSlideTo={reorderSlideTo}
          onAddImagePlaceholder={(slideId) => addImagePlaceholder({}, slideId)}
          onUpdatePlaceholder={updateImagePlaceholder}
          onRemovePlaceholder={(placeholderId) => removeImagePlaceholder(placeholderId)}
        />
      )}

      {(view === "worksheet" || view === "guide") && (
        <DocsEditor
          {...sharedBarProps}
          {...cometProps}
          target={view}
          onBack={goHub}
          onChangeSection={updateSection}
          onAddSection={() => addSection()}
          onRemoveSection={removeSection}
          onDuplicateSection={duplicateSection}
          onReorderSection={reorderSection}
          onReorderSectionTo={reorderSectionTo}
          onChangeGuide={updateTeacherGuide}
        />
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        project={project}
        audience={audience}
      />
    </>
  );
}
