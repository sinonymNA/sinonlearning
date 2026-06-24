import { newId } from "./studioDefaults";
import type { AnchoredImageNeed, AnchoredNotesBlock, AnchoredBlockType } from "./anchoredNotesTypes";

/**
 * Turns pasted lesson text/markdown into structured Anchored Notes blocks. Heuristic,
 * not a full markdown parser — it's built to recognize common lesson-handout shapes
 * (headings, essential questions, tables, synthesis prompts) well enough to give a
 * teacher a useful starting structure, not to parse arbitrary markdown perfectly.
 */

type RawChunk =
  | { kind: "heading"; level: number; text: string }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "paragraph"; text: string }
  | { kind: "divider" }
  | { kind: "image"; alt: string; url: string };

function parseTableRow(line: string): string[] {
  const cells = line.split("|").map((c) => c.trim());
  if (cells.length > 0 && cells[0] === "") cells.shift();
  if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

function parseTableChunk(lines: string[]): RawChunk {
  const headers = parseTableRow(lines[0]);
  let dataLines = lines.slice(1);
  if (dataLines[0] && /^[\s|:-]+$/.test(dataLines[0])) {
    dataLines = dataLines.slice(1);
  }
  const rows = dataLines.map(parseTableRow);
  return { kind: "table", headers, rows };
}

function tokenize(raw: string): RawChunk[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const chunks: RawChunk[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === "") {
      i++;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      chunks.push({ kind: "heading", level: heading[1].length, text: heading[2].trim() });
      i++;
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      chunks.push({ kind: "divider" });
      i++;
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
    if (image) {
      chunks.push({ kind: "image", alt: image[1], url: image[2] });
      i++;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      chunks.push(parseTableChunk(tableLines));
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ""));
        i++;
      }
      chunks.push({ kind: "list", ordered: true, items });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      chunks.push({ kind: "list", ordered: false, items });
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (
        t === "" ||
        /^#{1,6}\s+/.test(t) ||
        /^-{3,}$/.test(t) ||
        t.startsWith("|") ||
        /^\d+[.)]\s+/.test(t) ||
        /^[-*]\s+/.test(t) ||
        /^!\[/.test(t)
      ) {
        break;
      }
      paraLines.push(t);
      i++;
    }
    chunks.push({ kind: "paragraph", text: paraLines.join(" ") });
  }

  return chunks;
}

function makeBlock(type: AnchoredBlockType, overrides: Partial<AnchoredNotesBlock> = {}): AnchoredNotesBlock {
  return { id: newId(), type, include: true, ...overrides };
}

const PROMPT_STARTERS =
  /^(explain|describe|analyze|evaluate|compare|contrast|how does|how did|why did|why does|what (was|were|is|are)|in what ways|to what extent)/i;

function looksLikeOpenPrompt(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length > 50 && /\?\s*$/.test(trimmed)) return true;
  return PROMPT_STARTERS.test(trimmed) && trimmed.length > 40;
}

export interface ParsedLessonContent {
  blocks: AnchoredNotesBlock[];
  imageNeeds: AnchoredImageNeed[];
}

export function parseLessonContent(raw: string, defaultSynthesisLines = 6): ParsedLessonContent {
  const chunks = tokenize(raw);
  const blocks: AnchoredNotesBlock[] = [];
  const imageNeeds: AnchoredImageNeed[] = [];
  let titleAssigned = false;

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];

    if (chunk.kind === "heading") {
      const lower = chunk.text.toLowerCase();

      if (/essential question/.test(lower)) {
        let content = chunk.text.replace(/essential question:?/i, "").trim();
        if (!content && chunks[idx + 1]?.kind === "paragraph") {
          content = (chunks[idx + 1] as { text: string }).text;
          idx++;
        }
        blocks.push(makeBlock("essentialQuestion", { content }));
        continue;
      }

      if (/before the lesson|warm.?up/.test(lower)) {
        let content = "";
        if (chunks[idx + 1]?.kind === "paragraph") {
          content = (chunks[idx + 1] as { text: string }).text;
          idx++;
        }
        blocks.push(makeBlock("warmupBox", { title: chunk.text, content }));
        continue;
      }

      if (/outside information bank/.test(lower)) {
        let items: string[] = [];
        if (chunks[idx + 1]?.kind === "list") {
          items = (chunks[idx + 1] as { items: string[] }).items;
          idx++;
        }
        blocks.push(makeBlock("outsideInfoBank", { title: chunk.text, items }));
        continue;
      }

      if (/^synthesis/.test(lower)) {
        let content = "";
        if (chunks[idx + 1]?.kind === "paragraph") {
          content = (chunks[idx + 1] as { text: string }).text;
          idx++;
        }
        blocks.push(makeBlock("synthesisPrompt", { title: chunk.text, content, responseLines: defaultSynthesisLines }));
        continue;
      }

      if (!titleAssigned && chunk.level <= 2) {
        blocks.push(makeBlock("title", { content: chunk.text }));
        titleAssigned = true;
        continue;
      }

      blocks.push(makeBlock("sectionHeading", { title: chunk.text }));
      continue;
    }

    if (chunk.kind === "table") {
      blocks.push(makeBlock("table", { table: { headers: chunk.headers, rows: chunk.rows } }));
      continue;
    }

    if (chunk.kind === "list") {
      blocks.push(makeBlock("numberedList", { items: chunk.items }));
      continue;
    }

    if (chunk.kind === "divider") {
      blocks.push(makeBlock("divider"));
      continue;
    }

    if (chunk.kind === "image") {
      const need: AnchoredImageNeed = {
        id: newId(),
        description: chunk.alt || "Image",
        suggestedSearch: chunk.alt || "",
        url: chunk.url || null,
        placement: "inline",
        status: chunk.url ? "provided" : "needed",
      };
      imageNeeds.push(need);
      blocks.push(makeBlock("imagePlaceholder", { imageNeedId: need.id }));
      continue;
    }

    if (looksLikeOpenPrompt(chunk.text)) {
      blocks.push(makeBlock("responseBox", { content: chunk.text, responseLines: 5 }));
    } else {
      blocks.push(makeBlock("guidedParagraph", { content: chunk.text }));
    }
  }

  return { blocks, imageNeeds };
}
