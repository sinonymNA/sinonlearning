import JSZip from "jszip";
import { computeQualityChecklist } from "./studioChecklist";
import {
  createBlankProject,
  createFreeformImageElement,
  createFreeformShapeElement,
  createFreeformTextElement,
  createImagePlaceholder,
  createSlide,
  newId,
} from "./studioDefaults";
import type { FreeformElement, ImagePlaceholder, StudioSlide, TeacherStudioProject } from "./studioTypes";

const NS = {
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  rel: "http://schemas.openxmlformats.org/package/2006/relationships",
};

const FALLBACK_SHAPE_COLOR = "#5eead4";

export interface PptxImportResult {
  project: TeacherStudioProject;
  warnings: string[];
}

interface Ctx {
  offX: number;
  offY: number;
  chOffX: number;
  chOffY: number;
  scaleX: number;
  scaleY: number;
}

const ROOT_CTX: Ctx = { offX: 0, offY: 0, chOffX: 0, chOffY: 0, scaleX: 1, scaleY: 1 };

interface EmuRect {
  x: number;
  y: number;
  cx: number;
  cy: number;
}

interface ImportedShape {
  kind: "text" | "shape" | "image";
  /** Null when the shape has no explicit `<a:xfrm>` — common for placeholder shapes that
   * inherit position/size from the slide layout. Their text still carries over, routed into
   * structured slide fields (title/subtitle/bullets) instead of the freeform canvas. */
  rectEmu: EmuRect | null;
  text?: string;
  isTitle?: boolean;
  placeholderKind?: string | null;
  shapeType?: "rectangle" | "ellipse";
  color?: string;
  imageRelId?: string;
}

async function readXml(zip: JSZip, path: string): Promise<Document | null> {
  const entry = zip.file(path);
  if (!entry) return null;
  const text = await entry.async("text");
  return new DOMParser().parseFromString(text, "application/xml");
}

function directChild(parent: Element, ns: string, local: string): Element | null {
  return Array.from(parent.children).find((el) => el.namespaceURI === ns && el.localName === local) ?? null;
}

function numAttr(el: Element | null, name: string): number {
  if (!el) return 0;
  const v = el.getAttribute(name);
  return v ? parseInt(v, 10) : 0;
}

function resolvePath(sourcePartPath: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const baseDir = sourcePartPath.split("/").slice(0, -1).join("/");
  const stack: string[] = [];
  `${baseDir}/${target}`.split("/").forEach((part) => {
    if (part === "..") stack.pop();
    else if (part === "." || part === "") return;
    else stack.push(part);
  });
  return stack.join("/");
}

function relsPathFor(partPath: string): string {
  const idx = partPath.lastIndexOf("/");
  return `${partPath.slice(0, idx)}/_rels/${partPath.slice(idx + 1)}.rels`;
}

async function readRelMap(zip: JSZip, sourcePartPath: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const doc = await readXml(zip, relsPathFor(sourcePartPath));
  if (!doc) return map;
  Array.from(doc.getElementsByTagNameNS(NS.rel, "Relationship")).forEach((rel) => {
    const id = rel.getAttribute("Id");
    const target = rel.getAttribute("Target");
    if (id && target) map.set(id, resolvePath(sourcePartPath, target));
  });
  return map;
}

function findThemePath(zip: JSZip): string | null {
  if (zip.file("ppt/theme/theme1.xml")) return "ppt/theme/theme1.xml";
  const match = Object.keys(zip.files).find((name) => /^ppt\/theme\/theme\d+\.xml$/.test(name));
  return match ?? null;
}

const SCHEME_ALIASES: Record<string, string> = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };

async function readThemeColors(zip: JSZip, themePath: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const doc = await readXml(zip, themePath);
  if (!doc) return map;
  const clrScheme = doc.getElementsByTagNameNS(NS.a, "clrScheme")[0];
  if (!clrScheme) return map;
  Array.from(clrScheme.children).forEach((node) => {
    if (node.namespaceURI !== NS.a) return;
    const srgb = directChild(node, NS.a, "srgbClr");
    const sys = directChild(node, NS.a, "sysClr");
    const hex = srgb?.getAttribute("val") ?? sys?.getAttribute("lastClr");
    if (hex) map.set(node.localName, `#${hex}`);
  });
  Object.entries(SCHEME_ALIASES).forEach(([from, to]) => {
    const val = map.get(to);
    if (val) map.set(from, val);
  });
  return map;
}

function resolveFillColor(solidFill: Element, theme: Map<string, string>): string | null {
  const srgb = directChild(solidFill, NS.a, "srgbClr");
  if (srgb) return `#${srgb.getAttribute("val")}`;
  const scheme = directChild(solidFill, NS.a, "schemeClr");
  if (scheme) return theme.get(scheme.getAttribute("val") ?? "") ?? null;
  return null;
}

function readXfrm(
  spPr: Element | null
): { off: { x: number; y: number }; ext: { cx: number; cy: number }; chOff?: { x: number; y: number }; chExt?: { cx: number; cy: number } } | null {
  if (!spPr) return null;
  const xfrm = directChild(spPr, NS.a, "xfrm");
  if (!xfrm) return null;
  const off = directChild(xfrm, NS.a, "off");
  const ext = directChild(xfrm, NS.a, "ext");
  const chOff = directChild(xfrm, NS.a, "chOff");
  const chExt = directChild(xfrm, NS.a, "chExt");
  return {
    off: { x: numAttr(off, "x"), y: numAttr(off, "y") },
    ext: { cx: numAttr(ext, "cx"), cy: numAttr(ext, "cy") },
    chOff: chOff ? { x: numAttr(chOff, "x"), y: numAttr(chOff, "y") } : undefined,
    chExt: chExt ? { cx: numAttr(chExt, "cx"), cy: numAttr(chExt, "cy") } : undefined,
  };
}

function applyCtx(ctx: Ctx, x: number, y: number, cx: number, cy: number): EmuRect {
  return {
    x: ctx.offX + (x - ctx.chOffX) * ctx.scaleX,
    y: ctx.offY + (y - ctx.chOffY) * ctx.scaleY,
    cx: cx * ctx.scaleX,
    cy: cy * ctx.scaleY,
  };
}

function extractText(txBody: Element): string {
  const paragraphs = Array.from(txBody.children).filter((el) => el.namespaceURI === NS.a && el.localName === "p");
  return paragraphs
    .map((p) =>
      Array.from(p.children)
        .filter((el) => el.namespaceURI === NS.a && (el.localName === "r" || el.localName === "br"))
        .map((run) => (run.localName === "br" ? "\n" : directChild(run, NS.a, "t")?.textContent ?? ""))
        .join("")
    )
    .join("\n");
}

/** Placeholder type, or `"body"` for an unlabeled (idx-only) placeholder per the OOXML default; null if `sp` isn't a placeholder at all. */
function placeholderType(sp: Element): string | null {
  const nvSpPr = directChild(sp, NS.p, "nvSpPr");
  const nvPr = nvSpPr ? directChild(nvSpPr, NS.p, "nvPr") : null;
  const ph = nvPr ? directChild(nvPr, NS.p, "ph") : null;
  if (!ph) return null;
  return ph.getAttribute("type") ?? "body";
}

function isTitlePlaceholder(sp: Element): boolean {
  const type = placeholderType(sp);
  return type === "title" || type === "ctrTitle";
}

function readShapeStyle(
  spPr: Element | null,
  theme: Map<string, string>
): { shapeType: "rectangle" | "ellipse"; color: string } | null {
  const prstGeom = spPr ? directChild(spPr, NS.a, "prstGeom") : null;
  const solidFill = spPr ? directChild(spPr, NS.a, "solidFill") : null;
  if (!solidFill) return null;
  const shapeType: "rectangle" | "ellipse" = prstGeom?.getAttribute("prst") === "ellipse" ? "ellipse" : "rectangle";
  return { shapeType, color: resolveFillColor(solidFill, theme) ?? FALLBACK_SHAPE_COLOR };
}

function walkSpTree(
  tree: Element,
  ctx: Ctx,
  out: ImportedShape[],
  warnings: string[],
  slideNum: number,
  theme: Map<string, string>
): void {
  Array.from(tree.children).forEach((child) => {
    if (child.namespaceURI !== NS.p) return;
    switch (child.localName) {
      case "sp": {
        const spPr = directChild(child, NS.p, "spPr");
        const xfrm = readXfrm(spPr);
        const txBody = directChild(child, NS.p, "txBody");
        const text = txBody ? extractText(txBody) : "";
        if (!xfrm) {
          // Placeholder shapes (title/body/subtitle) commonly inherit position from the
          // slide layout rather than carrying their own <a:xfrm> — still keep the text,
          // routed into structured fields downstream since we don't know the real geometry.
          if (text.trim()) {
            out.push({ kind: "text", rectEmu: null, text, isTitle: isTitlePlaceholder(child), placeholderKind: placeholderType(child) });
          }
          break;
        }
        const abs = applyCtx(ctx, xfrm.off.x, xfrm.off.y, xfrm.ext.cx, xfrm.ext.cy);
        if (text.trim()) {
          out.push({ kind: "text", rectEmu: abs, text, isTitle: isTitlePlaceholder(child) });
        } else {
          const style = readShapeStyle(spPr, theme);
          if (style) out.push({ kind: "shape", rectEmu: abs, ...style });
        }
        break;
      }
      case "pic": {
        const spPr = directChild(child, NS.p, "spPr");
        const xfrm = readXfrm(spPr);
        if (!xfrm) {
          warnings.push(`Slide ${slideNum}: a picture without explicit position/size was skipped (not yet supported).`);
          break;
        }
        const abs = applyCtx(ctx, xfrm.off.x, xfrm.off.y, xfrm.ext.cx, xfrm.ext.cy);
        const blipFill = directChild(child, NS.p, "blipFill");
        const blip = blipFill ? directChild(blipFill, NS.a, "blip") : null;
        const relId = blip?.getAttributeNS(NS.r, "embed") ?? undefined;
        out.push({ kind: "image", rectEmu: abs, imageRelId: relId });
        break;
      }
      case "grpSp": {
        const grpSpPr = directChild(child, NS.p, "grpSpPr");
        const xfrm = readXfrm(grpSpPr);
        if (!xfrm || !xfrm.chExt || !xfrm.chOff) break;
        const abs = applyCtx(ctx, xfrm.off.x, xfrm.off.y, xfrm.ext.cx, xfrm.ext.cy);
        const nextCtx: Ctx = {
          offX: abs.x,
          offY: abs.y,
          chOffX: xfrm.chOff.x,
          chOffY: xfrm.chOff.y,
          scaleX: xfrm.chExt.cx ? abs.cx / xfrm.chExt.cx : 1,
          scaleY: xfrm.chExt.cy ? abs.cy / xfrm.chExt.cy : 1,
        };
        walkSpTree(child, nextCtx, out, warnings, slideNum, theme);
        break;
      }
      case "graphicFrame":
        warnings.push(`Slide ${slideNum}: a table, chart, or embedded object was skipped (not yet supported).`);
        break;
      case "cxnSp":
        warnings.push(`Slide ${slideNum}: a connector line was skipped (not yet supported).`);
        break;
      default:
        break;
    }
  });
}

function emuRectToPct(rect: EmuRect, slideWidthEmu: number, slideHeightEmu: number) {
  const pct = (v: number, total: number) => Math.max(0, Math.min(100, (v / total) * 100));
  return {
    x: pct(rect.x, slideWidthEmu),
    y: pct(rect.y, slideHeightEmu),
    width: pct(rect.cx, slideWidthEmu),
    height: pct(rect.cy, slideHeightEmu),
  };
}

/**
 * Parses a .pptx file fully client-side (JSZip + DOMParser, no upload) into an editable
 * Teacher Studio slides project. Text, shape position/size/color, and pictures (converted
 * to link-paste placeholders, never auto-hosted) carry over; fonts, animations, and
 * tables/charts/SmartArt do not yet — skipped content is reported in `warnings`.
 */
export async function importPptxFile(file: File): Promise<PptxImportResult> {
  const warnings: string[] = [];
  const zip = await JSZip.loadAsync(file);

  const presentationDoc = await readXml(zip, "ppt/presentation.xml");
  if (!presentationDoc) {
    throw new Error("This doesn't look like a valid PowerPoint (.pptx) file.");
  }

  const presRelMap = await readRelMap(zip, "ppt/presentation.xml");
  const sldSz = presentationDoc.getElementsByTagNameNS(NS.p, "sldSz")[0] ?? null;
  const slideWidthEmu = numAttr(sldSz, "cx") || 9144000;
  const slideHeightEmu = numAttr(sldSz, "cy") || 5143500;

  const sldIdLst = presentationDoc.getElementsByTagNameNS(NS.p, "sldIdLst")[0];
  const slidePaths = sldIdLst
    ? Array.from(sldIdLst.getElementsByTagNameNS(NS.p, "sldId"))
        .map((el) => el.getAttributeNS(NS.r, "id"))
        .map((rId) => (rId ? presRelMap.get(rId) : undefined))
        .filter((path): path is string => Boolean(path))
    : [];

  if (slidePaths.length === 0) {
    throw new Error("No slides were found in this PowerPoint file.");
  }

  const themePath = findThemePath(zip);
  const theme = themePath ? await readThemeColors(zip, themePath) : new Map<string, string>();

  const slides: StudioSlide[] = [];
  const imagePlaceholders: ImagePlaceholder[] = [];

  for (let i = 0; i < slidePaths.length; i += 1) {
    const slidePath = slidePaths[i];
    const slideDoc = await readXml(zip, slidePath);
    if (!slideDoc) {
      warnings.push(`Slide ${i + 1}: couldn't be read and was skipped.`);
      continue;
    }
    const slideRelMap = await readRelMap(zip, slidePath);
    const spTree = slideDoc.getElementsByTagNameNS(NS.p, "spTree")[0];
    if (!spTree) {
      warnings.push(`Slide ${i + 1}: had no readable content and was skipped.`);
      continue;
    }

    const shapes: ImportedShape[] = [];
    walkSpTree(spTree, ROOT_CTX, shapes, warnings, i + 1, theme);

    const slide = createSlide({
      title: `Slide ${i + 1}`,
      layout: "titleBullets",
      layoutOverrides: { content: { x: 0, y: 0, width: 0.1, height: 0.1 } },
    });

    const extraElements: FreeformElement[] = [];
    let titleSet = false;

    shapes.forEach((shapeInfo) => {
      if (shapeInfo.kind === "text" && !shapeInfo.rectEmu) {
        const text = shapeInfo.text?.trim();
        if (!text) return;
        if (shapeInfo.isTitle && !titleSet) {
          slide.title = text.split("\n")[0].slice(0, 200);
          titleSet = true;
        } else if (shapeInfo.placeholderKind === "subTitle" && !slide.subtitle) {
          slide.subtitle = text.split("\n")[0].slice(0, 300);
        } else {
          text
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => slide.bullets.push({ id: newId(), text: line }));
        }
        return;
      }
      if (!shapeInfo.rectEmu) return;
      const rectPct = emuRectToPct(shapeInfo.rectEmu, slideWidthEmu, slideHeightEmu);
      if (shapeInfo.kind === "text" && shapeInfo.text?.trim()) {
        if (shapeInfo.isTitle && !titleSet) {
          slide.title = shapeInfo.text.split("\n")[0].slice(0, 200);
          titleSet = true;
        }
        extraElements.push(
          createFreeformTextElement({ ...rectPct, text: shapeInfo.text, z: extraElements.length + 1 })
        );
      } else if (shapeInfo.kind === "shape" && shapeInfo.shapeType && shapeInfo.color) {
        extraElements.push(
          createFreeformShapeElement({
            ...rectPct,
            shapeType: shapeInfo.shapeType,
            color: shapeInfo.color,
            z: extraElements.length + 1,
          })
        );
      } else if (shapeInfo.kind === "image") {
        const target = shapeInfo.imageRelId ? slideRelMap.get(shapeInfo.imageRelId) : undefined;
        const placeholder = createImagePlaceholder({
          description: target ? target.split("/").pop() ?? "Imported image" : "Imported image",
          purpose: "Picture imported from PowerPoint.",
          teacherPrompt: "This slide had an embedded picture — paste a hosted image link to bring it back.",
        });
        imagePlaceholders.push(placeholder);
        extraElements.push(
          createFreeformImageElement({ ...rectPct, placeholderId: placeholder.id, z: extraElements.length + 1 })
        );
      }
    });

    if (!titleSet) {
      const firstText = shapes.find((s) => s.kind === "text" && s.text?.trim());
      slide.title = firstText?.text?.split("\n")[0].slice(0, 200) || `Slide ${i + 1}`;
    }

    slide.extraElements = extraElements;
    slides.push(slide);
  }

  const project = createBlankProject("slides", {
    title: file.name.replace(/\.pptx$/i, "") || "Imported Presentation",
    creationMode: "scratch",
    teacherGuide: {
      overview: `Imported from ${file.name}. Text, shape position/size/color, and pictures carried over — pictures became link-paste placeholders since nothing is auto-uploaded. Fonts, animations, and tables/charts/SmartArt didn't transfer.`,
      objectives: [],
      materials: [],
      timingNotes: "",
    },
  });
  project.slides = slides;
  project.imagePlaceholders = imagePlaceholders;
  project.qualityChecklist = computeQualityChecklist(project);

  return { project, warnings };
}
