import type { AnchoredNotesBlock, AnchoredNotesProject } from "@/lib/anchoredNotesTypes";
import type { AnchoredTemplateConfig } from "@/lib/anchoredNotesTemplates";

interface BlockRendererProps {
  block: AnchoredNotesBlock;
  config: AnchoredTemplateConfig;
  project: AnchoredNotesProject;
}

/** Renders a single Anchored Notes block as styled HTML, used by both the live preview and the print view. */
export default function BlockRenderer({ block, config, project }: BlockRendererProps) {
  if (!block.include) return null;
  if (block.type === "imagePlaceholder" && !project.settings.includeImagePlaceholders) return null;
  if (block.type === "outsideInfoBank" && !project.settings.includeOutsideInfoBank) return null;
  if (block.type === "essentialQuestion" && !project.settings.includeEssentialQuestionBox) return null;

  switch (block.type) {
    case "title":
      return <h1 className={config.titleClassName}>{block.content}</h1>;

    case "header":
      return <p className="mt-3 text-sm">{block.content}</p>;

    case "essentialQuestion":
      return (
        <div className={config.boxClassName}>
          <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">Essential Question</p>
          <p className="mt-1">{block.content}</p>
        </div>
      );

    case "warmupBox":
      return (
        <div className={config.boxClassName}>
          <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{block.title || "Before the Lesson"}</p>
          <p className="mt-1">{block.content}</p>
        </div>
      );

    case "sectionHeading":
      return <h2 className={config.sectionHeadingClassName}>{block.title}</h2>;

    case "guidedParagraph":
      return <p className="mt-2">{block.content}</p>;

    case "numberedList":
      return (
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {(block.items ?? []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );

    case "table":
      if (!block.table) return null;
      return (
        <table className={config.tableClassName}>
          <thead>
            <tr>
              {block.table.headers.map((h, i) => (
                <th key={i} className={config.tableHeaderClassName}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.table.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-current/20 p-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );

    case "responseBox":
      return (
        <div className="mt-2">
          {block.content && <p>{block.content}</p>}
          {Array.from({ length: Math.max(block.responseLines ?? 3, 1) }).map((_, i) => (
            <div key={i} className={config.responseBoxClassName} />
          ))}
        </div>
      );

    case "imagePlaceholder": {
      const need = project.imageNeeds.find((n) => n.id === block.imageNeedId);
      if (need?.url) {
        return (
          // eslint-disable-next-line @next/next/no-img-element -- teacher-pasted external image URL, not an optimizable local asset
          <img src={need.url} alt={need.description || "Lesson image"} className="mt-3 max-h-64 w-full rounded object-contain" />
        );
      }
      return (
        <div className="mt-3 flex min-h-[100px] items-center justify-center rounded border-2 border-dashed border-current/30 p-3 text-center text-xs opacity-60">
          [Image needed: {need?.description || "add a description or link"}]
        </div>
      );
    }

    case "synthesisPrompt":
      return (
        <div className={config.boxClassName}>
          <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{block.title || "Synthesis"}</p>
          <p className="mt-1">{block.content}</p>
          {Array.from({ length: Math.max(project.settings.synthesisResponseLines, 1) }).map((_, i) => (
            <div key={i} className={config.responseBoxClassName} />
          ))}
        </div>
      );

    case "outsideInfoBank":
      return (
        <div className={config.boxClassName}>
          <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{block.title || "Outside Information Bank"}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {(block.items ?? []).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      );

    case "callout":
      return <p className="mt-2 border-l-2 border-current/40 pl-3 italic opacity-80">{block.content}</p>;

    case "divider":
      return <hr className="my-4 border-current/20" />;

    default:
      return null;
  }
}
