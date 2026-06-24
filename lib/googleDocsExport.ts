import type { docs_v1 } from "googleapis";
import { richTextToPlainText } from "./richText";
import type { AnchoredNotesProject } from "./anchoredNotesTypes";
import type { TeacherStudioProject } from "./studioTypes";

/**
 * Mirrors the structure of projectToMarkdown (studioExport.ts) but as typed blocks
 * that convert to native Google Docs paragraphs/headings/bullets instead of markdown text.
 */
export interface DocTableData {
  headers: string[];
  rows: string[][];
}

export interface DocBlock {
  text: string;
  style?: "TITLE" | "HEADING_1" | "HEADING_2" | "NORMAL_TEXT";
  bulletPreset?: "BULLET_DISC_CIRCLE_SQUARE" | "NUMBERED_DECIMAL_ALPHA_ROMAN";
  italic?: boolean;
  bold?: boolean;
  /** When present, this block renders as a table instead of a text paragraph. */
  table?: DocTableData;
}

export interface DocTableJob {
  index: number;
  table: DocTableData;
}

function blank(): DocBlock {
  return { text: "" };
}

export function buildDocBlocks(project: TeacherStudioProject, includeAnswerKey: boolean): DocBlock[] {
  const blocks: DocBlock[] = [];

  blocks.push({ text: project.title || "Untitled", style: "TITLE" });
  const meta = [
    project.subject,
    project.gradeLevel,
    project.durationMinutes ? `${project.durationMinutes} min` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (meta) blocks.push({ text: meta, italic: true });
  blocks.push(blank());

  if (project.teacherGuide.overview || project.teacherGuide.objectives.length > 0) {
    blocks.push({ text: "Teacher Guide", style: "HEADING_1" });
    const overview = richTextToPlainText(project.teacherGuide.overview);
    if (overview) blocks.push({ text: overview });
    if (project.teacherGuide.objectives.length > 0) {
      blocks.push({ text: "Objectives", style: "HEADING_2" });
      project.teacherGuide.objectives.forEach((obj) => blocks.push({ text: obj, bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" }));
    }
    if (project.teacherGuide.materials.length > 0) {
      blocks.push({ text: "Materials", style: "HEADING_2" });
      project.teacherGuide.materials.forEach((m) => blocks.push({ text: m, bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" }));
    }
    const timingNotes = richTextToPlainText(project.teacherGuide.timingNotes);
    if (timingNotes) {
      blocks.push({ text: "Timing notes", style: "HEADING_2" });
      blocks.push({ text: timingNotes });
    }
    blocks.push(blank());
  }

  project.slides.forEach((slide, i) => {
    blocks.push({ text: `Slide ${i + 1}: ${slide.title || "Untitled"}`, style: "HEADING_1" });
    if (slide.subtitle) blocks.push({ text: slide.subtitle, italic: true });
    if (slide.body) blocks.push({ text: slide.body });
    slide.bullets.forEach((b) => {
      if (b.text) blocks.push({ text: b.text, bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" });
    });
    (slide.extraElements ?? []).forEach((el) => {
      if (el.kind === "text" && el.text.trim()) blocks.push({ text: el.text });
    });
    if (slide.studentInstructions) blocks.push({ text: `Student instructions: ${slide.studentInstructions}` });
    if (slide.teacherNotes) blocks.push({ text: `Teacher notes: ${slide.teacherNotes}`, italic: true });
    blocks.push(blank());
  });

  project.worksheetSections.forEach((section) => {
    blocks.push({ text: section.title || "Untitled section", style: "HEADING_1" });
    const directions = richTextToPlainText(section.directions);
    if (directions) blocks.push({ text: directions, italic: true });
    section.questions.forEach((q) => {
      blocks.push({ text: richTextToPlainText(q.prompt), bulletPreset: "NUMBERED_DECIMAL_ALPHA_ROMAN" });
      (q.choices ?? []).forEach((choice, ci) => blocks.push({ text: `${String.fromCharCode(65 + ci)}. ${choice}` }));
    });
    blocks.push(blank());
  });

  if (includeAnswerKey) {
    const sectionKeyEntries = project.worksheetSections.flatMap((section) =>
      Object.entries(section.answerKey).map(([qId, answer]) => {
        const question = section.questions.find((q) => q.id === qId);
        return `${question ? richTextToPlainText(question.prompt) : qId}: ${answer}`;
      })
    );
    const globalKeyEntries = Object.entries(project.answerKey).map(([key, answer]) => `${key}: ${answer}`);
    const allEntries = [...globalKeyEntries, ...sectionKeyEntries];
    if (allEntries.length > 0) {
      blocks.push({ text: "Answer Key", style: "HEADING_1" });
      allEntries.forEach((entry) => blocks.push({ text: entry, bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" }));
    }
  }

  return blocks;
}

/**
 * Converts blocks into a single Docs batchUpdate: one insertText carrying the full
 * body text, followed by style requests addressed by the character offsets that
 * insertion produced. Offsets are computed up front since they're deterministic.
 *
 * Table blocks render as a blank line in the main text pass; their `insertTable`
 * requests are appended afterward in descending document order, so an earlier
 * table's insertion never shifts the index a later table was computed against.
 */
export function docBlocksToBatchRequests(blocks: DocBlock[]): { requests: object[]; tableJobs: DocTableJob[] } {
  let index = 1;
  let fullText = "";
  const styleRequests: object[] = [];
  const tableJobs: DocTableJob[] = [];

  blocks.forEach((block) => {
    const startIndex = index;
    const lineText = `${block.text}\n`;
    const textEndIndex = startIndex + block.text.length;
    fullText += lineText;
    index = startIndex + lineText.length;

    if (block.table) {
      tableJobs.push({ index: startIndex, table: block.table });
    }

    if (block.text.length === 0) return;

    if (block.style) {
      styleRequests.push({
        updateParagraphStyle: {
          range: { startIndex, endIndex: index },
          paragraphStyle: { namedStyleType: block.style },
          fields: "namedStyleType",
        },
      });
    }
    if (block.bulletPreset) {
      styleRequests.push({
        createParagraphBullets: { range: { startIndex, endIndex: index }, bulletPreset: block.bulletPreset },
      });
    }
    if (block.italic || block.bold) {
      styleRequests.push({
        updateTextStyle: {
          range: { startIndex, endIndex: textEndIndex },
          textStyle: {
            ...(block.italic ? { italic: true } : {}),
            ...(block.bold ? { bold: true } : {}),
          },
          fields: [block.italic && "italic", block.bold && "bold"].filter(Boolean).join(","),
        },
      });
    }
  });

  if (!fullText) return { requests: [], tableJobs: [] };

  const tableRequests = [...tableJobs]
    .sort((a, b) => b.index - a.index)
    .map((job) => ({
      insertTable: {
        location: { index: job.index },
        rows: job.table.rows.length + 1,
        columns: job.table.headers.length,
      },
    }));

  return {
    requests: [{ insertText: { location: { index: 1 }, text: fullText } }, ...styleRequests, ...tableRequests],
    tableJobs,
  };
}

/**
 * Finds tables in a freshly-fetched document, in document order, by walking the
 * body content. Used to match `DocTableJob`s (recorded by insertion order) back to
 * the `Table` elements the API actually created, since `insertTable` doesn't return
 * the new table's location.
 */
export function findTablesInOrder(document: docs_v1.Schema$Document): docs_v1.Schema$Table[] {
  const tables: docs_v1.Schema$Table[] = [];
  (document.body?.content ?? []).forEach((el) => {
    if (el.table) tables.push(el.table);
  });
  return tables;
}

/**
 * Second-phase, best-effort batchUpdate: fills each table's cells with text.
 * Cell-fill requests are addressed by the document offsets returned by
 * `documents.get()`, so they're sorted descending by startIndex (bottom of the
 * document first) to avoid one cell's insertText shifting another's index.
 */
export function buildTableFillRequests(document: docs_v1.Schema$Document, tableJobs: DocTableJob[]): object[] {
  const tables = findTablesInOrder(document);
  const cellInserts: { startIndex: number; text: string }[] = [];

  tableJobs.forEach((job, jobIndex) => {
    const table = tables[jobIndex];
    if (!table?.tableRows) return;
    const allRows = [job.table.headers, ...job.table.rows];
    allRows.forEach((rowValues, rowIndex) => {
      const row = table.tableRows?.[rowIndex];
      rowValues.forEach((value, colIndex) => {
        const cell = row?.tableCells?.[colIndex];
        const cellStartIndex = cell?.content?.[0]?.startIndex;
        if (cellStartIndex != null && value) {
          cellInserts.push({ startIndex: cellStartIndex, text: value });
        }
      });
    });
  });

  return cellInserts
    .sort((a, b) => b.startIndex - a.startIndex)
    .map(({ startIndex, text }) => ({ insertText: { location: { index: startIndex }, text } }));
}

/**
 * Converts an Anchored Notes project into Docs-native blocks. Mirrors buildDocBlocks
 * above but reads the Anchored Notes block model and respects its settings toggles
 * instead of the Teacher Studio slide/worksheet model.
 */
export function buildAnchoredNotesDocBlocks(project: AnchoredNotesProject): DocBlock[] {
  const blocks: DocBlock[] = [];
  const { settings } = project;

  blocks.push({ text: project.title || "Untitled", style: "TITLE" });
  if (settings.includeCourseHeader) {
    const meta = [project.course, project.unit, project.lessonNumber ? `Lesson ${project.lessonNumber}` : "", project.gradeLevel]
      .filter(Boolean)
      .join(" · ");
    if (meta) blocks.push({ text: meta, italic: true });
  }
  if (settings.includeNameLine) blocks.push({ text: "Name: ________________________" });
  blocks.push(blank());

  project.blocks.forEach((block) => {
    if (!block.include) return;
    if (block.type === "imagePlaceholder" && !settings.includeImagePlaceholders) return;
    if (block.type === "outsideInfoBank" && !settings.includeOutsideInfoBank) return;
    if (block.type === "essentialQuestion" && !settings.includeEssentialQuestionBox) return;

    switch (block.type) {
      case "title":
        blocks.push({ text: block.content ?? "", style: "TITLE" });
        break;
      case "header":
        blocks.push({ text: block.content ?? "" });
        break;
      case "essentialQuestion":
        blocks.push({ text: `Essential Question: ${block.content ?? ""}`, bold: true });
        break;
      case "warmupBox":
        blocks.push({ text: block.title ?? "Before the Lesson", style: "HEADING_2" });
        blocks.push({ text: block.content ?? "" });
        break;
      case "sectionHeading":
        blocks.push({ text: block.title ?? "", style: "HEADING_1" });
        break;
      case "guidedParagraph":
        blocks.push({ text: block.content ?? "" });
        break;
      case "numberedList":
        (block.items ?? []).forEach((item) => blocks.push({ text: item, bulletPreset: "NUMBERED_DECIMAL_ALPHA_ROMAN" }));
        break;
      case "table":
        if (block.table) blocks.push({ text: "", table: block.table });
        break;
      case "responseBox":
        blocks.push({ text: block.content ?? "" });
        for (let i = 0; i < Math.max(block.responseLines ?? 3, 1); i++) {
          blocks.push({ text: "_".repeat(60) });
        }
        break;
      case "imagePlaceholder": {
        const need = project.imageNeeds.find((n) => n.id === block.imageNeedId);
        blocks.push({ text: `[Image: ${need?.description || "placeholder"}]`, italic: true });
        break;
      }
      case "synthesisPrompt":
        blocks.push({ text: block.title ?? "Synthesis", style: "HEADING_2" });
        blocks.push({ text: block.content ?? "" });
        for (let i = 0; i < Math.max(settings.synthesisResponseLines, 1); i++) {
          blocks.push({ text: "_".repeat(60) });
        }
        break;
      case "outsideInfoBank":
        blocks.push({ text: block.title ?? "Outside Information Bank", style: "HEADING_2" });
        (block.items ?? []).forEach((item) => blocks.push({ text: item, bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" }));
        break;
      case "callout":
        blocks.push({ text: block.content ?? "", italic: true });
        break;
      case "divider":
        blocks.push({ text: "―――――――――――――――――――――――" });
        break;
      default:
        break;
    }
    blocks.push(blank());
  });

  if (settings.includeAnswerKeyPlaceholder) {
    blocks.push({ text: "Answer Key", style: "HEADING_1" });
    blocks.push({ text: "(Add answers here before sharing with students.)", italic: true });
  }

  return blocks;
}
