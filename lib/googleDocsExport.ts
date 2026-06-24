import { richTextToPlainText } from "./richText";
import type { TeacherStudioProject } from "./studioTypes";

/**
 * Mirrors the structure of projectToMarkdown (studioExport.ts) but as typed blocks
 * that convert to native Google Docs paragraphs/headings/bullets instead of markdown text.
 */
export interface DocBlock {
  text: string;
  style?: "TITLE" | "HEADING_1" | "HEADING_2" | "NORMAL_TEXT";
  bulletPreset?: "BULLET_DISC_CIRCLE_SQUARE" | "NUMBERED_DECIMAL_ALPHA_ROMAN";
  italic?: boolean;
  bold?: boolean;
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
 */
export function docBlocksToBatchRequests(blocks: DocBlock[]): object[] {
  let index = 1;
  let fullText = "";
  const styleRequests: object[] = [];

  blocks.forEach((block) => {
    const startIndex = index;
    const lineText = `${block.text}\n`;
    const textEndIndex = startIndex + block.text.length;
    fullText += lineText;
    index = startIndex + lineText.length;

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

  if (!fullText) return [];
  return [{ insertText: { location: { index: 1 }, text: fullText } }, ...styleRequests];
}
