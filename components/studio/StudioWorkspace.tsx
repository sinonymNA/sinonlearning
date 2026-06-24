"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudioProject } from "@/hooks/useStudioProject";
import { loadProject } from "@/lib/studioStorage";
import StudioTopBar from "./StudioTopBar";
import StudioSidebar from "./StudioSidebar";
import StudioCanvas from "./StudioCanvas";
import StudioRightPanel from "./StudioRightPanel";
import StudioMobileTabs from "./StudioMobileTabs";
import ExportModal from "./ExportModal";
import type { SelectedItem } from "./StudioSidebar";
import type { MobileTab } from "./StudioMobileTabs";
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
    addSection,
    updateSection,
    removeSection,
    duplicateSection,
    reorderSection,
    addImagePlaceholder,
    updateImagePlaceholder,
    removeImagePlaceholder,
    setChecklistItemPassed,
    applyTransform,
    applyCometEdit,
    saveAs,
  } = useStudioProject(projectId, initialProject);

  const [selected, setSelected] = useState<SelectedItem>(null);
  const [audience, setAudience] = useState<PreviewAudience>("teacher");
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("pages");

  const handleDuplicateProject = () => {
    const copy = saveAs();
    if (copy) router.push(`/studio/${copy.id}`);
  };

  const canvas = (
    <StudioCanvas
      project={project}
      selected={selected}
      audience={audience}
      onChangeSlide={updateSlide}
      onChangeSection={updateSection}
      onChangeGuide={updateTeacherGuide}
      onAddImagePlaceholder={(slideId) => addImagePlaceholder({}, slideId)}
      onUpdatePlaceholder={updateImagePlaceholder}
      onRemovePlaceholder={(placeholderId) => removeImagePlaceholder(placeholderId)}
    />
  );

  return (
    <div className="flex h-screen flex-col bg-studio-canvas">
      <StudioTopBar
        project={project}
        audience={audience}
        onAudienceChange={setAudience}
        onRename={renameProject}
        onUpdateMeta={updateMeta}
        onOpenExport={() => setExportOpen(true)}
        onDuplicate={handleDuplicateProject}
      />

      <div className="hidden flex-1 overflow-hidden lg:grid lg:grid-cols-[240px_minmax(0,1fr)_300px]">
        <div className="overflow-y-auto border-r border-navy-900/8 bg-white">
          <StudioSidebar
            project={project}
            selected={selected}
            onSelect={setSelected}
            onAddSlide={() => addSlide()}
            onRemoveSlide={removeSlide}
            onDuplicateSlide={duplicateSlide}
            onReorderSlide={reorderSlide}
            onAddSection={() => addSection()}
            onRemoveSection={removeSection}
            onDuplicateSection={duplicateSection}
            onReorderSection={reorderSection}
          />
        </div>
        <div className="overflow-y-auto">{canvas}</div>
        <div className="overflow-y-auto border-l border-navy-900/8 bg-white">
          <StudioRightPanel
            project={project}
            onApplyQuickAction={applyTransform}
            onApplyCometEdit={applyCometEdit}
            onToggleChecklistItem={setChecklistItemPassed}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
        <div className="flex-1 overflow-y-auto">
          {mobileTab === "pages" && (
            <StudioSidebar
              project={project}
              selected={selected}
              onSelect={(item) => {
                setSelected(item);
                setMobileTab("editor");
              }}
              onAddSlide={() => addSlide()}
              onRemoveSlide={removeSlide}
              onDuplicateSlide={duplicateSlide}
              onReorderSlide={reorderSlide}
              onAddSection={() => addSection()}
              onRemoveSection={removeSection}
              onDuplicateSection={duplicateSection}
              onReorderSection={reorderSection}
            />
          )}
          {mobileTab === "editor" && canvas}
          {mobileTab === "comet" && (
            <StudioRightPanel
              project={project}
              onApplyQuickAction={applyTransform}
              onApplyCometEdit={applyCometEdit}
              onToggleChecklistItem={setChecklistItemPassed}
            />
          )}
          {mobileTab === "export" && (
            <div className="flex h-full items-center justify-center p-6">
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-navy-950"
              >
                Open export options
              </button>
            </div>
          )}
        </div>
        <StudioMobileTabs active={mobileTab} onChange={setMobileTab} />
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} project={project} audience={audience} />
    </div>
  );
}
