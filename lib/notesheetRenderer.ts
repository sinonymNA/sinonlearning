import type { NotesheetPlan, NotesheetSection } from "@/lib/notesheetTypes";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function blankLines(n: number): string {
  return Array.from({ length: n }, () => `<div class="blank-line"></div>`).join("");
}

function renderSection(section: NotesheetSection, mode: "student" | "teacher_key"): string {
  const heading = section.heading
    ? `<h3 class="section-heading">${esc(section.heading)}</h3>`
    : "";

  switch (section.type) {
    case "warmup_box":
      return `
        <div class="section warmup-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : blankLines(5)}
        </div>`;

    case "fill_blank":
      return `
        <div class="section fill-blank">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : blankLines(3)}
        </div>`;

    case "numbered_response": {
      const n = section.num_lines ?? 5;
      const items = mode === "teacher_key"
        ? `<p class="key-text">${esc(section.answer_key_notes)}</p>`
        : Array.from({ length: n }, (_, i) =>
            `<li><div class="blank-line"></div></li>`
          ).join("");
      return `
        <div class="section numbered-response">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          <ol>${items}</ol>
        </div>`;
    }

    case "content_box":
      return `
        <div class="section content-box">
          ${heading}
          <p class="content-text">${esc(section.content)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Note:</span> ${esc(section.answer_key_notes)}</div>`
            : ""}
        </div>`;

    case "two_column_box": {
      const cols = section.columns ?? [
        { header: "Term", width_pct: 35, prefilled: true },
        { header: "Definition", width_pct: 65, prefilled: false },
      ];
      const headerRow = `<tr>${cols.map(c => `<th style="width:${c.width_pct}%">${esc(c.header)}</th>`).join("")}</tr>`;
      const dataRows = Array.from({ length: 6 }, () =>
        `<tr>${cols.map((c) =>
          mode === "teacher_key"
            ? `<td></td>`
            : `<td class="${c.prefilled ? "prefilled" : "blank-cell"}"></td>`
        ).join("")}</tr>`
      ).join("");
      return `
        <div class="section two-column-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          <table class="notesheet-table">${headerRow}${dataRows}</table>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : ""}
        </div>`;
    }

    case "drawing_box":
      return `
        <div class="section drawing-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Expected:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="draw-area"><span class="draw-label">Draw here</span></div>`}
        </div>`;

    case "three_column_box": {
      const cols = section.columns ?? [
        { header: "Concept", width_pct: 33, prefilled: false },
        { header: "Example", width_pct: 34, prefilled: false },
        { header: "Why It Works", width_pct: 33, prefilled: false },
      ];
      const headerRow = `<tr>${cols.map(c => `<th style="width:${c.width_pct}%">${esc(c.header)}</th>`).join("")}</tr>`;
      const dataRows = Array.from({ length: 4 }, () =>
        `<tr>${cols.map(() => `<td class="blank-cell"></td>`).join("")}</tr>`
      ).join("");
      return `
        <div class="section three-column-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          <table class="notesheet-table">${headerRow}${dataRows}</table>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : ""}
        </div>`;
    }

    default:
      return "";
  }
}

export function renderNotesheetHtml(plan: NotesheetPlan, mode: "student" | "teacher_key"): string {
  const modeLabel = mode === "teacher_key" ? " — Teacher Key" : "";
  const sections = plan.sections.map((s) => renderSection(s, mode)).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(plan.title)}${modeLabel}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 12pt;
    color: #1a1a1a;
    background: #fff;
    padding: 0.75in 0.75in 0.75in 0.75in;
    max-width: 8.5in;
    margin: 0 auto;
  }
  .page-header {
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 10px;
    margin-bottom: 18px;
  }
  .page-header h1 {
    font-size: 17pt;
    font-weight: bold;
    letter-spacing: -0.01em;
  }
  .page-header .meta {
    font-size: 9pt;
    color: #555;
    margin-top: 4px;
    font-style: italic;
  }
  .essential-question {
    background: #f5f3ee;
    border-left: 3px solid #333;
    padding: 8px 12px;
    margin-bottom: 18px;
    font-style: italic;
    font-size: 11pt;
  }
  .essential-question strong {
    font-style: normal;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    display: block;
    margin-bottom: 3px;
  }
  .section {
    margin-bottom: 18px;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 12px 14px;
    page-break-inside: avoid;
  }
  .section-heading {
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
    color: #333;
  }
  .prompt {
    font-size: 11pt;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  .blank-line {
    border-bottom: 1px solid #aaa;
    height: 28px;
    margin-bottom: 4px;
  }
  .draw-area {
    border: 1px dashed #999;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 6px;
  }
  .draw-label { color: #aaa; font-size: 9pt; font-style: italic; }
  .warmup-box { background: #faf9f6; }
  .content-box { background: #f0f4f8; border-color: #99b; }
  .content-text { font-size: 11pt; line-height: 1.5; }
  ol { margin-left: 18px; }
  ol li { margin-bottom: 4px; }
  .notesheet-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    font-size: 10.5pt;
  }
  .notesheet-table th {
    background: #eee;
    border: 1px solid #bbb;
    padding: 5px 8px;
    text-align: left;
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .notesheet-table td {
    border: 1px solid #ccc;
    height: 32px;
    padding: 3px 8px;
    vertical-align: middle;
  }
  .blank-cell { background: #fafafa; }
  .answer-key {
    margin-top: 10px;
    padding: 6px 10px;
    background: #fffbcc;
    border: 1px dashed #c8a;
    border-radius: 2px;
    font-size: 10pt;
    line-height: 1.4;
  }
  .key-label {
    font-weight: bold;
    font-size: 9pt;
    text-transform: uppercase;
    margin-right: 4px;
  }
  .key-text { font-size: 10.5pt; line-height: 1.4; margin-top: 4px; }
  .mode-badge {
    display: inline-block;
    font-size: 8pt;
    background: #333;
    color: #fff;
    padding: 2px 7px;
    border-radius: 2px;
    margin-left: 8px;
    vertical-align: middle;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  @media print {
    body { padding: 0; }
    .section { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page-header">
  <h1>${esc(plan.title)}${mode === "teacher_key" ? ' <span class="mode-badge">Teacher Key</span>' : ""}</h1>
  <div class="meta">${esc(plan.subject)} · ${esc(plan.grade_band)} · ${esc(plan.concept)}</div>
</div>
<div class="essential-question">
  <strong>Essential Question</strong>
  ${esc(plan.essential_question)}
</div>
${sections}
</body>
</html>`;
}
