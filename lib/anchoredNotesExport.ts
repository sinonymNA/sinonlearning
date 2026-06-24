import { downloadTextFile, slugifyFilename } from "./studioExport";
import type { AnchoredNotesBlock, AnchoredNotesProject } from "./anchoredNotesTypes";

export { downloadTextFile as downloadAnchoredTextFile, slugifyFilename as slugifyAnchoredFilename };

function metaLine(project: AnchoredNotesProject): string {
  return [project.course, project.unit, project.lessonNumber ? `Lesson ${project.lessonNumber}` : "", project.gradeLevel]
    .filter(Boolean)
    .join(" · ");
}

function blockToMarkdown(block: AnchoredNotesBlock): string {
  if (!block.include) return "";
  switch (block.type) {
    case "title":
      return `# ${block.content ?? ""}`;
    case "header":
      return block.content ?? "";
    case "essentialQuestion":
      return `**Essential Question:** ${block.content ?? ""}`;
    case "warmupBox":
      return `**${block.title ?? "Before the Lesson"}**\n${block.content ?? ""}`;
    case "sectionHeading":
      return `## ${block.title ?? ""}`;
    case "guidedParagraph":
      return block.content ?? "";
    case "numberedList":
      return (block.items ?? []).map((item, i) => `${i + 1}. ${item}`).join("\n");
    case "table": {
      if (!block.table) return "";
      const { headers, rows } = block.table;
      const headerLine = `| ${headers.join(" | ")} |`;
      const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
      const rowLines = rows.map((r) => `| ${r.join(" | ")} |`);
      return [headerLine, sepLine, ...rowLines].join("\n");
    }
    case "responseBox":
      return `${block.content ?? ""}\n${"_".repeat(40)}\n`.repeat(1) + "\n".repeat(Math.max(block.responseLines ?? 3, 1) - 1);
    case "imagePlaceholder":
      return "[image]";
    case "synthesisPrompt":
      return `**${block.title ?? "Synthesis"}**\n${block.content ?? ""}`;
    case "outsideInfoBank":
      return `**${block.title ?? "Outside Information Bank"}**\n${(block.items ?? []).map((item) => `- ${item}`).join("\n")}`;
    case "callout":
      return `> ${block.content ?? ""}`;
    case "divider":
      return "---";
    default:
      return "";
  }
}

export function anchoredProjectToMarkdown(project: AnchoredNotesProject): string {
  const lines: string[] = [`# ${project.title || "Untitled"}`];
  const meta = metaLine(project);
  if (meta) lines.push(`*${meta}*`);
  if (project.settings.includeNameLine) lines.push("Name: ________________________");
  lines.push("");

  project.blocks.forEach((block) => {
    const md = blockToMarkdown(block);
    if (md) lines.push(md, "");
  });

  return lines.join("\n").trim() + "\n";
}

export function anchoredProjectToPlainText(project: AnchoredNotesProject): string {
  return anchoredProjectToMarkdown(project)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/\|/g, "  ");
}

export function anchoredProjectToJSON(project: AnchoredNotesProject): string {
  return JSON.stringify({ schemaVersion: 1, kind: "anchoredNotes", project }, null, 2);
}
