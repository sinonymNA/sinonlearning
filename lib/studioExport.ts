import { richTextToMarkdown } from "./richText";
import type { TeacherStudioProject } from "./studioTypes";

export interface StudioExportFile {
  schemaVersion: 1;
  project: TeacherStudioProject;
}

export function projectToJSON(project: TeacherStudioProject): string {
  const payload: StudioExportFile = { schemaVersion: 1, project };
  return JSON.stringify(payload, null, 2);
}

export function projectToMarkdown(
  project: TeacherStudioProject,
  options: { includeAnswerKey?: boolean } = {}
): string {
  const includeAnswerKey = options.includeAnswerKey ?? true;
  const lines: string[] = [];

  lines.push(`# ${project.title}`);
  lines.push("");
  const meta = [
    project.subject && `Subject: ${project.subject}`,
    project.gradeLevel && `Grade: ${project.gradeLevel}`,
    project.durationMinutes && `Duration: ${project.durationMinutes} min`,
  ].filter(Boolean);
  if (meta.length > 0) {
    lines.push(meta.join(" · "));
    lines.push("");
  }

  if (project.teacherGuide.overview || project.teacherGuide.objectives.length > 0) {
    lines.push("## Teacher Guide");
    if (project.teacherGuide.overview) lines.push(richTextToMarkdown(project.teacherGuide.overview));
    if (project.teacherGuide.objectives.length > 0) {
      lines.push("");
      lines.push("**Objectives:**");
      project.teacherGuide.objectives.forEach((obj) => lines.push(`- ${obj}`));
    }
    if (project.teacherGuide.materials.length > 0) {
      lines.push("");
      lines.push("**Materials:**");
      project.teacherGuide.materials.forEach((m) => lines.push(`- ${m}`));
    }
    if (project.teacherGuide.timingNotes) {
      lines.push("");
      lines.push(`**Timing notes:** ${richTextToMarkdown(project.teacherGuide.timingNotes)}`);
    }
    lines.push("");
  }

  project.slides.forEach((slide, i) => {
    lines.push(`## Slide ${i + 1}: ${slide.title}`);
    if (slide.subtitle) lines.push(`*${slide.subtitle}*`);
    if (slide.body) {
      lines.push("");
      lines.push(slide.body);
    }
    if (slide.bullets.length > 0) {
      lines.push("");
      slide.bullets.forEach((b) => lines.push(`- ${b.text}`));
    }
    const extraText = (slide.extraElements ?? []).filter(
      (el) => el.kind === "text" && el.text.trim().length > 0
    );
    if (extraText.length > 0) {
      lines.push("");
      extraText.forEach((el) => lines.push(el.kind === "text" ? el.text : ""));
    }
    if (slide.studentInstructions) {
      lines.push("");
      lines.push(`**Student instructions:** ${slide.studentInstructions}`);
    }
    if (slide.teacherNotes) {
      lines.push("");
      lines.push(`> Teacher notes: ${slide.teacherNotes}`);
    }
    lines.push("");
  });

  project.worksheetSections.forEach((section) => {
    lines.push(`## ${section.title}`);
    if (section.directions) lines.push(richTextToMarkdown(section.directions));
    lines.push("");
    section.questions.forEach((q, i) => {
      lines.push(`${i + 1}. ${richTextToMarkdown(q.prompt)}`);
      if (q.choices && q.choices.length > 0) {
        q.choices.forEach((choice, ci) =>
          lines.push(`   ${String.fromCharCode(65 + ci)}. ${choice}`)
        );
      }
    });
    lines.push("");
  });

  if (includeAnswerKey) {
    const sectionKeyEntries = project.worksheetSections.flatMap((section) =>
      Object.entries(section.answerKey).map(([qId, answer]) => {
        const question = section.questions.find((q) => q.id === qId);
        return `${question ? richTextToMarkdown(question.prompt) : qId}: ${answer}`;
      })
    );
    const globalKeyEntries = Object.entries(project.answerKey).map(
      ([key, answer]) => `${key}: ${answer}`
    );
    const allEntries = [...globalKeyEntries, ...sectionKeyEntries];
    if (allEntries.length > 0) {
      lines.push("## Answer Key");
      allEntries.forEach((entry) => lines.push(`- ${entry}`));
      lines.push("");
    }
  }

  return lines.join("\n").trim() + "\n";
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function slugifyFilename(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "teacher-studio-project"
  );
}
