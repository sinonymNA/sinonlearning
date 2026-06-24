"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAnchoredNotesProject } from "@/hooks/useAnchoredNotesProject";
import { loadAnchoredProject } from "@/lib/anchoredNotesStorage";
import ContentPastePanel from "./ContentPastePanel";
import LessonMetadataForm from "./LessonMetadataForm";
import TemplateStyleSelector from "./TemplateStyleSelector";
import ImagePlaceholderManager from "./ImagePlaceholderManager";
import StructuredOutline from "./StructuredOutline";
import OutputSettingsPanel from "./OutputSettingsPanel";
import AnchoredNotesPreview from "./AnchoredNotesPreview";
import ExportPanel from "./ExportPanel";
import type { AnchoredNotesProject } from "@/lib/anchoredNotesTypes";

interface AnchoredNotesWorkspaceProps {
  projectId: string;
}

export default function AnchoredNotesWorkspace({ projectId }: AnchoredNotesWorkspaceProps) {
  const [initialProject, setInitialProject] = useState<AnchoredNotesProject | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- project lookup can't happen until after hydration (localStorage)
    setInitialProject(loadAnchoredProject(projectId));
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

  return <AnchoredNotesEditor projectId={projectId} initialProject={initialProject} />;
}

function AnchoredNotesEditor({
  projectId,
  initialProject,
}: {
  projectId: string;
  initialProject: AnchoredNotesProject;
}) {
  const {
    project,
    setRawContent,
    setMetadata,
    setTemplateStyle,
    structureContent,
    updateBlock,
    removeBlock,
    reorderBlock,
    updateSettings,
    addImageNeed,
    updateImageNeed,
    removeImageNeed,
    setGoogleDocUrl,
    renameProject,
  } = useAnchoredNotesProject(projectId, initialProject);

  return (
    <div className="min-h-screen bg-studio-canvas">
      <div className="no-print">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-navy-900/8 bg-white/80 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <Link href="/studio" className="text-xs font-medium text-navy-700/60 hover:text-navy-900">
              ← Teacher Studio
            </Link>
            <input
              type="text"
              value={project.title}
              onChange={(e) => renameProject(e.target.value)}
              aria-label="Project title"
              className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-navy-900 outline-none transition focus:border-navy-900/10 focus:bg-navy-900/[0.03]"
            />
          </div>
          <p className="text-[11px] text-navy-700/40">Saved automatically on this device</p>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          <div className="space-y-4">
            <ContentPastePanel rawContent={project.rawContent} onChange={setRawContent} />
            <LessonMetadataForm
              metadata={{
                title: project.title,
                course: project.course,
                lessonNumber: project.lessonNumber,
                unit: project.unit,
                gradeLevel: project.gradeLevel,
                teacherName: project.teacherName,
              }}
              onChange={setMetadata}
            />
            <TemplateStyleSelector value={project.templateStyle} onChange={setTemplateStyle} />
            <ImagePlaceholderManager
              imageNeeds={project.imageNeeds}
              onAdd={addImageNeed}
              onUpdate={updateImageNeed}
              onRemove={removeImageNeed}
            />
            <button
              type="button"
              onClick={structureContent}
              disabled={!project.rawContent.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles size={16} /> Structure Content
            </button>
          </div>

          <div className="space-y-4">
            <StructuredOutline
              blocks={project.blocks}
              onToggleInclude={(blockId, include) => updateBlock(blockId, { include })}
              onReorder={reorderBlock}
              onRemove={removeBlock}
            />
            <OutputSettingsPanel settings={project.settings} onChange={updateSettings} />
            <div className="glass-panel overflow-hidden rounded-2xl p-4">
              <p className="mb-3 text-sm font-semibold text-navy-900">Preview</p>
              <div className="max-h-[600px] overflow-y-auto rounded-xl bg-navy-900/[0.03] p-3">
                <AnchoredNotesPreview project={project} />
              </div>
            </div>
            <ExportPanel project={project} onGoogleDocCreated={setGoogleDocUrl} />
          </div>
        </div>
      </div>

      <AnchoredNotesPreview project={project} className="print-only" />
    </div>
  );
}
