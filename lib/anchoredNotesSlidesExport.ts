import { PAGE_HEIGHT_EMU, PAGE_WIDTH_EMU, slideObjectId } from "./googleSlidesExport";
import type { AnchoredNotesProject } from "./anchoredNotesTypes";

/**
 * Deliberately the simplest possible slide outline: one slide per major section of
 * the parsed lesson (title, essential question, each heading, synthesis). No images,
 * no speaker notes, no layout variety. Anchored Notes' primary output is the Google
 * Doc — this is a basic starting point a teacher can rearrange in Slides, not a full
 * slides editor, which is intentionally out of scope for this phase.
 */

function emu(pct: number, total: number): number {
  return Math.round((pct / 100) * total);
}

function rectTransform(x: number, y: number, width: number, height: number) {
  return {
    size: {
      width: { magnitude: Math.max(emu(width, PAGE_WIDTH_EMU), 1), unit: "EMU" as const },
      height: { magnitude: Math.max(emu(height, PAGE_HEIGHT_EMU), 1), unit: "EMU" as const },
    },
    transform: {
      scaleX: 1,
      scaleY: 1,
      translateX: emu(x, PAGE_WIDTH_EMU),
      translateY: emu(y, PAGE_HEIGHT_EMU),
      unit: "EMU" as const,
    },
  };
}

let counter = 0;
function shapeId(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}`;
}

function textBox(
  slideId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  opts: { bold?: boolean; fontSize?: number; bullet?: boolean } = {}
): object[] {
  const objectId = shapeId(`${slideId}_box`);
  const requests: object[] = [
    { createShape: { objectId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, ...rectTransform(x, y, width, height) } } },
  ];
  if (!text) return requests;

  requests.push({ insertText: { objectId, insertionIndex: 0, text } });
  if (opts.bullet) {
    requests.push({
      createParagraphBullets: { objectId, textRange: { type: "ALL" }, bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" },
    });
  }
  if (opts.bold || opts.fontSize) {
    requests.push({
      updateTextStyle: {
        objectId,
        textRange: { type: "ALL" },
        style: {
          ...(opts.bold ? { bold: true } : {}),
          ...(opts.fontSize ? { fontSize: { magnitude: opts.fontSize, unit: "PT" } } : {}),
        },
        fields: [opts.bold && "bold", opts.fontSize && "fontSize"].filter(Boolean).join(","),
      },
    });
  }
  return requests;
}

interface OutlineSlide {
  title: string;
  body: string[];
}

export function buildAnchoredNotesSlideOutline(project: AnchoredNotesProject): OutlineSlide[] {
  const slides: OutlineSlide[] = [];
  const meta = [project.course, project.unit].filter(Boolean).join(" · ");
  slides.push({ title: project.title || "Untitled lesson", body: meta ? [meta] : [] });

  project.blocks.forEach((block) => {
    if (!block.include) return;
    switch (block.type) {
      case "essentialQuestion":
        slides.push({ title: "Essential Question", body: [block.content ?? ""] });
        break;
      case "sectionHeading":
        slides.push({ title: block.title ?? "Section", body: [] });
        break;
      case "guidedParagraph":
        if (slides.length > 0) slides[slides.length - 1].body.push(block.content ?? "");
        break;
      case "numberedList":
        if (slides.length > 0) slides[slides.length - 1].body.push(...(block.items ?? []));
        break;
      case "synthesisPrompt":
        slides.push({ title: block.title ?? "Synthesis", body: [block.content ?? ""] });
        break;
      default:
        break;
    }
  });

  return slides.filter((slide) => slide.title || slide.body.length > 0);
}

export function buildAnchoredNotesSlideRequests(project: AnchoredNotesProject): { requests: object[] } {
  const outline = buildAnchoredNotesSlideOutline(project);
  const requests: object[] = [];

  outline.forEach((slide, index) => {
    const slideId = slideObjectId(index);
    requests.push({ createSlide: { objectId: slideId, slideLayoutReference: { predefinedLayout: "BLANK" } } });
    requests.push(...textBox(slideId, 6, 6, 88, 16, slide.title, { bold: true, fontSize: 22 }));
    const body = slide.body.filter(Boolean);
    if (body.length > 0) {
      requests.push(...textBox(slideId, 6, 24, 88, 68, body.join("\n"), { fontSize: 14, bullet: body.length > 1 }));
    }
  });

  return { requests };
}
