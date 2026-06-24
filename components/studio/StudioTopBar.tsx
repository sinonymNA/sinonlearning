"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import ProjectSaveControls from "./ProjectSaveControls";
import StudioPreviewToggle from "./StudioPreviewToggle";
import { STUDIO_DOC_TYPES } from "@/lib/studioTypes";
import type { PreviewAudience, TeacherStudioProject } from "@/lib/studioTypes";

interface StudioTopBarProps {
  project: TeacherStudioProject;
  audience: PreviewAudience;
  onAudienceChange: (audience: PreviewAudience) => void;
  onRename: (title: string) => void;
  onUpdateMeta: (patch: Partial<Pick<TeacherStudioProject, "subject" | "gradeLevel" | "durationMinutes">>) => void;
  onOpenExport: () => void;
  onDuplicate: () => void;
}

export default function StudioTopBar({
  project,
  audience,
  onAudienceChange,
  onRename,
  onUpdateMeta,
  onOpenExport,
  onDuplicate,
}: StudioTopBarProps) {
  const typeLabel = STUDIO_DOC_TYPES.find((t) => t.value === project.type)?.label ?? project.type;

  return (
    <div className="no-print flex flex-wrap items-center gap-3 border-b border-navy-900/8 bg-white px-4 py-3">
      <Link
        href="/studio"
        aria-label="Back to Teacher Studio"
        className="flex h-8 w-8 items-center justify-center rounded-full text-navy-700/60 hover:bg-navy-900/5"
      >
        <ArrowLeft size={16} />
      </Link>

      <div className="min-w-0 flex-1">
        <input
          value={project.title}
          onChange={(e) => onRename(e.target.value)}
          className="w-full min-w-0 bg-transparent font-display text-base text-navy-900 focus-visible:outline-none"
        />
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-navy-700/50">
          <span className="rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-700">
            {typeLabel}
          </span>
          <input
            value={project.subject}
            onChange={(e) => onUpdateMeta({ subject: e.target.value })}
            placeholder="Subject"
            className="w-20 bg-transparent focus-visible:outline-none"
          />
          <input
            value={project.gradeLevel}
            onChange={(e) => onUpdateMeta({ gradeLevel: e.target.value })}
            placeholder="Grade"
            className="w-16 bg-transparent focus-visible:outline-none"
          />
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={5}
              max={180}
              value={project.durationMinutes}
              onChange={(e) => onUpdateMeta({ durationMinutes: Number(e.target.value) || 50 })}
              className="w-10 bg-transparent focus-visible:outline-none"
            />
            min
          </span>
        </div>
      </div>

      <StudioPreviewToggle value={audience} onChange={onAudienceChange} />

      <button
        type="button"
        onClick={onOpenExport}
        className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-amber-400"
      >
        <Download size={14} /> Export
      </button>

      <ProjectSaveControls projectId={project.id} onDuplicate={onDuplicate} />
    </div>
  );
}
