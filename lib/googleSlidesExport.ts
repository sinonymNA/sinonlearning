import { getDefaultRects } from "./studioLayout";
import type { FreeformElement, Rect, TeacherStudioProject } from "./studioTypes";

/** Default new-presentation widescreen page size (10in x 5.625in), set explicitly so layout math is predictable. */
export const PAGE_WIDTH_EMU = 9144000;
export const PAGE_HEIGHT_EMU = 5143500;
export const PAGE_SIZE = {
  width: { magnitude: PAGE_WIDTH_EMU, unit: "EMU" as const },
  height: { magnitude: PAGE_HEIGHT_EMU, unit: "EMU" as const },
};

export function slideObjectId(index: number): string {
  return `slide_${index}`;
}

function emu(pctValue: number, total: number): number {
  return Math.round((pctValue / 100) * total);
}

function transformFor(rect: Rect) {
  return {
    size: {
      width: { magnitude: Math.max(emu(rect.width, PAGE_WIDTH_EMU), 1), unit: "EMU" as const },
      height: { magnitude: Math.max(emu(rect.height, PAGE_HEIGHT_EMU), 1), unit: "EMU" as const },
    },
    transform: {
      scaleX: 1,
      scaleY: 1,
      translateX: emu(rect.x, PAGE_WIDTH_EMU),
      translateY: emu(rect.y, PAGE_HEIGHT_EMU),
      unit: "EMU" as const,
    },
  };
}

function hexToRgb01(hex: string): { red: number; green: number; blue: number } {
  const clean = hex.replace("#", "");
  const normalized = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean.padEnd(6, "0").slice(0, 6);
  const num = parseInt(normalized, 16) || 0;
  return {
    red: ((num >> 16) & 255) / 255,
    green: ((num >> 8) & 255) / 255,
    blue: (num & 255) / 255,
  };
}

let shapeCounter = 0;
function nextShapeId(prefix: string): string {
  shapeCounter += 1;
  return `${prefix}_${shapeCounter}`;
}

function textBoxRequests(
  objectId: string,
  slideId: string,
  rect: Rect,
  text: string,
  opts: { bold?: boolean; fontSize?: number; bullet?: boolean; italic?: boolean } = {}
): object[] {
  const requests: object[] = [
    { createShape: { objectId, shapeType: "TEXT_BOX", elementProperties: { pageObjectId: slideId, ...transformFor(rect) } } },
  ];
  if (!text) return requests;

  requests.push({ insertText: { objectId, insertionIndex: 0, text } });
  if (opts.bullet) {
    requests.push({
      createParagraphBullets: { objectId, textRange: { type: "ALL" }, bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" },
    });
  }
  if (opts.bold || opts.fontSize || opts.italic) {
    requests.push({
      updateTextStyle: {
        objectId,
        textRange: { type: "ALL" },
        style: {
          ...(opts.bold ? { bold: true } : {}),
          ...(opts.italic ? { italic: true } : {}),
          ...(opts.fontSize ? { fontSize: { magnitude: opts.fontSize, unit: "PT" } } : {}),
        },
        fields: [opts.bold && "bold", opts.italic && "italic", opts.fontSize && "fontSize"].filter(Boolean).join(","),
      },
    });
  }
  return requests;
}

export interface SlideImageJob {
  slideId: string;
  rect: Rect;
  url: string;
}
export interface SlideNoteJob {
  slideId: string;
  text: string;
}

/**
 * Builds the guaranteed-success part of the export: slides, text boxes, and shape
 * elements. Images and speaker notes are returned as separate jobs so the caller can
 * apply them in best-effort follow-up calls — one bad pasted image URL shouldn't be
 * able to sink the whole presentation.
 */
export function buildCoreSlideRequests(project: TeacherStudioProject): {
  requests: object[];
  imageJobs: SlideImageJob[];
  noteJobs: SlideNoteJob[];
} {
  const requests: object[] = [];
  const imageJobs: SlideImageJob[] = [];
  const noteJobs: SlideNoteJob[] = [];
  const placeholderById = new Map(project.imagePlaceholders.map((p) => [p.id, p]));

  project.slides.forEach((slide, index) => {
    const slideId = slideObjectId(index);
    const placeholder = slide.imagePlaceholderId ? placeholderById.get(slide.imagePlaceholderId) : undefined;
    const defaults = getDefaultRects(slide.layout, Boolean(placeholder));
    const contentRect: Rect = slide.layoutOverrides?.content ?? defaults.content ?? { x: 6, y: 8, width: 88, height: 84 };
    const imageRect = slide.layoutOverrides?.image ?? defaults.image;

    requests.push({ createSlide: { objectId: slideId, slideLayoutReference: { predefinedLayout: "BLANK" } } });

    const titleRect: Rect = {
      x: contentRect.x,
      y: contentRect.y,
      width: contentRect.width,
      height: Math.min(14, contentRect.height),
    };
    requests.push(
      ...textBoxRequests(nextShapeId(`${slideId}_title`), slideId, titleRect, slide.title || "Untitled slide", {
        bold: true,
        fontSize: 22,
      })
    );

    const bodyLines = [
      slide.subtitle ?? "",
      slide.body ?? "",
      ...slide.bullets.map((b) => b.text).filter(Boolean),
      slide.studentInstructions ? `Instructions: ${slide.studentInstructions}` : "",
    ].filter(Boolean);
    if (bodyLines.length > 0) {
      const bodyRect: Rect = {
        x: contentRect.x,
        y: contentRect.y + titleRect.height,
        width: contentRect.width,
        height: Math.max(contentRect.height - titleRect.height, 8),
      };
      requests.push(
        ...textBoxRequests(nextShapeId(`${slideId}_body`), slideId, bodyRect, bodyLines.join("\n"), {
          fontSize: 13,
          bullet: slide.bullets.length > 0,
        })
      );
    }

    (slide.extraElements ?? []).forEach((el: FreeformElement) => {
      if (el.kind === "text") {
        if (el.text.trim()) {
          requests.push(...textBoxRequests(nextShapeId(`${slideId}_extra`), slideId, el, el.text, { fontSize: 13 }));
        }
        return;
      }
      if (el.kind === "image") {
        const extraPlaceholder = placeholderById.get(el.placeholderId);
        if (extraPlaceholder?.link) {
          imageJobs.push({ slideId, rect: el, url: extraPlaceholder.link });
        }
        return;
      }
      const shapeId = nextShapeId(`${slideId}_shape`);
      requests.push({
        createShape: {
          objectId: shapeId,
          shapeType: el.shapeType === "ellipse" ? "ELLIPSE" : "RECTANGLE",
          elementProperties: { pageObjectId: slideId, ...transformFor(el) },
        },
      });
      requests.push({
        updateShapeProperties: {
          objectId: shapeId,
          shapeProperties: { shapeBackgroundFill: { solidFill: { color: { rgbColor: hexToRgb01(el.color) } } } },
          fields: "shapeBackgroundFill.solidFill.color",
        },
      });
    });

    if (placeholder?.link && imageRect) {
      imageJobs.push({ slideId, rect: imageRect, url: placeholder.link });
    }
    if (slide.teacherNotes.trim()) {
      noteJobs.push({ slideId, text: slide.teacherNotes });
    }
  });

  return { requests, imageJobs, noteJobs };
}

export function buildImageRequest(slideId: string, rect: Rect, url: string): object {
  return {
    createImage: {
      objectId: nextShapeId(`${slideId}_image`),
      url,
      elementProperties: { pageObjectId: slideId, ...transformFor(rect) },
    },
  };
}

export function buildNotesRequest(speakerNotesObjectId: string, text: string): object {
  return { insertText: { objectId: speakerNotesObjectId, insertionIndex: 0, text } };
}
