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

    case "structured_concept_box": {
      const fields = section.fields ?? ["Definition:", "Key Relationship:", "Example:"];
      const conceptTitle = esc(section.heading ?? section.content ?? "Key Concept");
      return `
        <div class="section structured-concept-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="concept-box">
                <div class="concept-box-title">${conceptTitle}</div>
                ${fields.map(f => `
                  <div class="concept-field">
                    <div class="concept-field-label">${esc(f)}</div>
                    <div class="blank-line"></div>
                  </div>`).join("")}
              </div>`
          }
        </div>`;
    }

    case "graph_box":
      return `
        <div class="section graph-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Expected:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="graph-area">
                <div class="graph-y-label">Price (P)</div>
                <div class="graph-plot">
                  <div class="graph-axes"></div>
                  <div class="graph-arrow-y">↑</div>
                  <div class="graph-arrow-x">→</div>
                </div>
                <div class="graph-x-label">Quantity (Q)</div>
              </div>`
          }
        </div>`;

    case "acronym_scaffold": {
      const letters = (section.acronym ?? "").toUpperCase().split("");
      return `
        <div class="section acronym-scaffold">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="acronym-rows">
                ${letters.map(l => `
                  <div class="acronym-row">
                    <div class="acronym-letter">${esc(l)}</div>
                    <div class="blank-line" style="flex:1; margin-left:10px;"></div>
                  </div>`).join("")}
              </div>`
          }
        </div>`;
    }

    case "labeled_comparison_table": {
      const colLabels = section.col_labels ?? [];
      const rowLabels = section.row_labels ?? [];
      if (colLabels.length === 0 || rowLabels.length === 0) return "";
      const headerRow = `<tr><th class="row-label-th"></th>${colLabels.map(c => `<th>${esc(c)}</th>`).join("")}</tr>`;
      const dataRows = rowLabels.map(rl =>
        `<tr><td class="row-label-cell">${esc(rl)}</td>${colLabels.map(() =>
          mode === "teacher_key" ? `<td></td>` : `<td class="blank-cell"></td>`
        ).join("")}</tr>`
      ).join("");
      return `
        <div class="section labeled-comparison-table">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          <table class="notesheet-table">${headerRow}${dataRows}</table>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : ""}
        </div>`;
    }

    case "frayer_model": {
      const term = esc(section.content || section.heading || "Term");
      return `
        <div class="section frayer-model">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="frayer-grid">
                <div class="frayer-cell">
                  <div class="frayer-label">Definition</div>
                  <div class="blank-line"></div><div class="blank-line"></div>
                </div>
                <div class="frayer-cell">
                  <div class="frayer-label">Characteristics</div>
                  <div class="blank-line"></div><div class="blank-line"></div>
                </div>
                <div class="frayer-center">${term}</div>
                <div class="frayer-cell">
                  <div class="frayer-label">Examples</div>
                  <div class="blank-line"></div><div class="blank-line"></div>
                </div>
                <div class="frayer-cell">
                  <div class="frayer-label">Non-Examples</div>
                  <div class="blank-line"></div><div class="blank-line"></div>
                </div>
              </div>`
          }
        </div>`;
    }

    case "t_chart": {
      const cols = section.col_labels ?? ["Side A", "Side B"];
      const n = section.num_lines ?? 4;
      const headerRow = `<tr><th>${esc(cols[0] ?? "Side A")}</th><th>${esc(cols[1] ?? "Side B")}</th></tr>`;
      const dataRows = Array.from({ length: n }, () =>
        `<tr><td class="blank-cell" style="width:50%;height:36px;"></td><td class="blank-cell" style="width:50%;height:36px;"></td></tr>`
      ).join("");
      return `
        <div class="section t-chart">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : `<table class="notesheet-table">${headerRow}${dataRows}</table>`}
        </div>`;
    }

    case "sequence_box": {
      const steps = Math.max(2, Math.min(6, section.num_lines ?? 4));
      return `
        <div class="section sequence-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="sequence-steps">
                ${Array.from({ length: steps }, (_, i) => `
                  <div class="sequence-step">
                    <div class="step-num">${i + 1}</div>
                    <div class="blank-line" style="flex:1; margin-left:10px; margin-bottom:0;"></div>
                  </div>
                  ${i < steps - 1 ? '<div class="step-arrow">↓</div>' : ""}`).join("")}
              </div>`
          }
        </div>`;
    }

    case "cause_effect_box": {
      const dir = section.direction ?? "one_to_many";
      const knownLabel = esc(section.content || (dir === "one_to_many" ? "Cause" : "Effect"));
      const blanks = Math.max(2, Math.min(4, section.num_lines ?? 3));
      const blankTitle = dir === "one_to_many" ? "Effect" : "Cause";
      const knownTitle = dir === "one_to_many" ? "CAUSE" : "EFFECT";
      return `
        <div class="section cause-effect-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="ce-layout">
                <div class="ce-known">
                  <div class="ce-known-label">${knownTitle}</div>
                  <div class="ce-known-text">${knownLabel}</div>
                </div>
                <div class="ce-arrow">→</div>
                <div class="ce-blanks">
                  ${Array.from({ length: blanks }, (_, i) => `
                    <div class="ce-blank-box">
                      <div style="font-size:8pt;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:4px;">${blankTitle} ${i + 1}</div>
                      <div class="blank-line"></div>
                    </div>`).join("")}
                </div>
              </div>`
          }
        </div>`;
    }

    case "timeline_box": {
      const events = Math.max(2, Math.min(6, section.num_lines ?? 4));
      return `
        <div class="section timeline-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="timeline-wrap">
                <div class="timeline-bar">
                  ${Array.from({ length: events }, () => '<div class="timeline-tick"></div>').join("")}
                </div>
                <div class="timeline-dates">
                  ${Array.from({ length: events }, () => `
                    <div class="timeline-slot">
                      <div class="blank-line" style="width:80%;margin:0 auto 2px;"></div>
                      <div style="font-size:7pt;color:#aaa;text-align:center;">date</div>
                    </div>`).join("")}
                </div>
                <div class="timeline-events">
                  ${Array.from({ length: events }, () => `<div class="timeline-event-box"></div>`).join("")}
                </div>
              </div>`
          }
        </div>`;
    }

    case "exit_ticket": {
      const questions = section.student_prompt.split(/\n/).filter(Boolean);
      return `
        <div class="section exit-ticket">
          <div class="exit-ticket-header">
            <span class="exit-divider"></span>
            <span class="exit-label">EXIT TICKET</span>
            <span class="exit-divider"></span>
          </div>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : questions.map((q, i) => `
                <div class="exit-question">
                  <p class="prompt">${i + 1}. ${esc(q.trim())}</p>
                  <div class="blank-line"></div>
                  <div class="blank-line"></div>
                </div>`).join("")
          }
        </div>`;
    }

    case "spectrum_bar": {
      const ends = section.col_labels ?? ["←", "→"];
      const slots = Math.max(2, Math.min(5, section.num_lines ?? 3));
      return `
        <div class="section spectrum-bar">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="spectrum-container">
                <div class="spectrum-ends">
                  <span class="spectrum-end-label">${esc(ends[0] ?? "←")}</span>
                  <div class="spectrum-line"></div>
                  <span class="spectrum-end-label">${esc(ends[1] ?? "→")}</span>
                </div>
                <div class="spectrum-slots">
                  ${Array.from({ length: slots }, () => `<div class="spectrum-slot"></div>`).join("")}
                </div>
              </div>`
          }
        </div>`;
    }

    case "mind_map_box": {
      const central = esc(section.content || section.heading || "Central Concept");
      const n = Math.max(4, Math.min(8, section.num_lines ?? 6));
      const top = Math.ceil(n / 2);
      const bottom = Math.floor(n / 2);
      return `
        <div class="section mind-map-box">
          ${heading}
          <p class="prompt">${esc(section.student_prompt)}</p>
          ${mode === "teacher_key"
            ? `<div class="answer-key"><span class="key-label">Key:</span> ${esc(section.answer_key_notes)}</div>`
            : `<div class="mind-map">
                <div class="mind-map-row top-row">
                  ${Array.from({ length: top }, () => `<div class="mind-branch top-branch"><div class="blank-line" style="margin:0;"></div></div>`).join("")}
                </div>
                <div class="mind-map-center-row">
                  <div class="mind-line"></div>
                  <div class="mind-central">${central}</div>
                  <div class="mind-line"></div>
                </div>
                <div class="mind-map-row bottom-row">
                  ${Array.from({ length: bottom }, () => `<div class="mind-branch bottom-branch"><div class="blank-line" style="margin:0;"></div></div>`).join("")}
                </div>
              </div>`
          }
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
  /* Structured concept box */
  .concept-box {
    border: 1px solid #ccc;
    margin-top: 6px;
    border-radius: 2px;
    overflow: hidden;
  }
  .concept-box-title {
    background: #1e3a5f;
    color: #fff;
    text-align: center;
    font-weight: bold;
    font-size: 11pt;
    padding: 6px 12px;
    letter-spacing: 0.01em;
  }
  .concept-field {
    padding: 7px 12px;
    border-top: 1px solid #e2e8f0;
  }
  .concept-field-label {
    font-size: 8pt;
    font-weight: bold;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  /* Graph box */
  .graph-area {
    margin-top: 8px;
    height: 180px;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .graph-y-label {
    font-size: 8pt;
    color: #64748b;
    margin-left: 4px;
    margin-bottom: 2px;
  }
  .graph-plot {
    flex: 1;
    position: relative;
    margin-left: 28px;
    margin-bottom: 4px;
  }
  .graph-axes {
    position: absolute;
    inset: 0;
    border-left: 2px solid #334155;
    border-bottom: 2px solid #334155;
  }
  .graph-arrow-y {
    position: absolute;
    top: -10px;
    left: -6px;
    font-size: 12pt;
    color: #334155;
  }
  .graph-arrow-x {
    position: absolute;
    bottom: -12px;
    right: -10px;
    font-size: 12pt;
    color: #334155;
  }
  .graph-x-label {
    font-size: 8pt;
    color: #64748b;
    text-align: right;
    margin-right: 4px;
  }
  /* Acronym scaffold */
  .acronym-rows { margin-top: 6px; }
  .acronym-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  .acronym-letter {
    width: 28px;
    height: 28px;
    background: #1e3a5f;
    color: #fff;
    font-weight: bold;
    font-size: 14pt;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 2px;
  }
  /* Frayer model */
  .frayer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    gap: 0;
    border: 1px solid #ccc;
    margin-top: 6px;
  }
  .frayer-cell {
    border: 1px solid #ccc;
    padding: 8px 10px;
    min-height: 70px;
  }
  .frayer-label {
    font-size: 8pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #64748b;
    margin-bottom: 6px;
  }
  .frayer-center {
    grid-column: 1 / -1;
    background: #1e3a5f;
    color: #fff;
    text-align: center;
    font-weight: bold;
    font-size: 12pt;
    padding: 8px;
  }
  /* T-chart (uses notesheet-table) */
  /* Sequence box */
  .sequence-steps { margin-top: 6px; }
  .sequence-step {
    display: flex;
    align-items: center;
    border: 1px solid #ccc;
    padding: 8px 10px;
    border-radius: 3px;
  }
  .step-num {
    width: 24px;
    height: 24px;
    background: #1e3a5f;
    color: #fff;
    font-weight: bold;
    font-size: 11pt;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .step-arrow { text-align: center; font-size: 16pt; color: #94a3b8; margin: 2px 0; }
  /* Cause-effect */
  .ce-layout { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .ce-known {
    flex: 2;
    border: 1px solid #ccc;
    padding: 10px;
    background: #f8fafc;
    text-align: center;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .ce-known-label {
    font-size: 8pt;
    font-weight: bold;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ce-known-text { font-size: 10pt; font-weight: bold; color: #1e3a5f; }
  .ce-arrow { font-size: 20pt; color: #94a3b8; flex-shrink: 0; }
  .ce-blanks { flex: 3; display: flex; flex-direction: column; gap: 6px; }
  .ce-blank-box { border: 1px solid #ccc; padding: 6px 8px; }
  /* Timeline */
  .timeline-wrap { margin-top: 10px; }
  .timeline-bar {
    display: flex;
    align-items: flex-end;
    border-bottom: 3px solid #1e3a5f;
    padding-bottom: 0;
    margin-bottom: 6px;
  }
  .timeline-tick {
    flex: 1;
    height: 10px;
    border-left: 2px solid #1e3a5f;
    margin-left: calc(50% - 1px);
  }
  .timeline-dates, .timeline-events {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }
  .timeline-slot { flex: 1; text-align: center; }
  .timeline-event-box {
    flex: 1;
    border: 1px solid #ccc;
    min-height: 48px;
  }
  /* Exit ticket */
  .exit-ticket { background: #fffbf0; border-color: #fcd34d !important; }
  .exit-ticket-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .exit-label {
    font-size: 9pt;
    font-weight: bold;
    color: #d97706;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }
  .exit-divider { flex: 1; border-top: 1px solid #fcd34d; display: block; height: 1px; }
  .exit-question { margin-bottom: 10px; }
  /* Spectrum bar */
  .spectrum-container { margin-top: 8px; }
  .spectrum-ends {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .spectrum-end-label { font-weight: bold; font-size: 9pt; color: #1e3a5f; white-space: nowrap; }
  .spectrum-line { flex: 1; border-top: 3px solid #1e3a5f; }
  .spectrum-slots { display: flex; gap: 5px; }
  .spectrum-slot { flex: 1; border: 1px solid #ccc; min-height: 44px; }
  /* Mind map */
  .mind-map { margin-top: 6px; }
  .mind-map-row { display: flex; gap: 5px; }
  .mind-branch {
    flex: 1;
    border: 1px solid #ccc;
    padding: 8px;
    min-height: 36px;
  }
  .top-branch { border-bottom: none; }
  .bottom-branch { border-top: none; }
  .mind-map-center-row {
    display: flex;
    align-items: center;
  }
  .mind-line { flex: 1; height: 1px; background: #ccc; }
  .mind-central {
    background: #1e3a5f;
    color: #fff;
    font-weight: bold;
    font-size: 10pt;
    padding: 6px 14px;
    white-space: nowrap;
  }
  /* Labeled comparison table */
  .row-label-th { width: 20%; }
  .row-label-cell {
    font-weight: bold;
    font-size: 9pt;
    color: #1e3a5f;
    background: #f8fafc;
    border: 1px solid #ccc;
    padding: 4px 8px;
    vertical-align: middle;
  }
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
