import { getAnchoredTemplateConfig } from "@/lib/anchoredNotesTemplates";
import BlockRenderer from "./BlockRenderer";
import type { AnchoredNotesProject } from "@/lib/anchoredNotesTypes";

interface AnchoredNotesPreviewProps {
  project: AnchoredNotesProject;
  className?: string;
}

/** The live student-handout preview, also reused as the print/PDF view inside ExportPanel. */
export default function AnchoredNotesPreview({ project, className = "" }: AnchoredNotesPreviewProps) {
  const config = getAnchoredTemplateConfig(project.templateStyle);
  const meta = [project.course, project.unit, project.lessonNumber ? `Lesson ${project.lessonNumber}` : "", project.gradeLevel]
    .filter(Boolean)
    .join(" · ");
  const spacing = project.settings.density === "compact" ? "p-6" : "p-10";

  return (
    <div className={`mx-auto w-full max-w-[680px] bg-white shadow-sm ${spacing} ${config.pageClassName} ${className}`}>
      {project.settings.includeCourseHeader && meta && (
        <div className={config.headerClassName}>
          <span>{meta}</span>
          {project.teacherName && <span>{project.teacherName}</span>}
        </div>
      )}
      {project.settings.includeNameLine && (
        <p className="mt-2 text-[11px]">Name: ________________________</p>
      )}

      {project.blocks.length === 0 ? (
        <p className="mt-10 text-center text-sm opacity-50">
          Paste your lesson content and click &ldquo;Structure Content&rdquo; to see your Anchored Notes here.
        </p>
      ) : (
        project.blocks.map((block) => <BlockRenderer key={block.id} block={block} config={config} project={project} />)
      )}

      {project.settings.includeAnswerKeyPlaceholder && (
        <div className={`${config.boxClassName} mt-8`}>
          <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">Answer Key</p>
          <p className="mt-1 text-xs opacity-60">(Add answers here before sharing with students.)</p>
        </div>
      )}
    </div>
  );
}
