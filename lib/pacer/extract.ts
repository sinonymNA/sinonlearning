/* eslint-disable @typescript-eslint/no-explicit-any */
// Reading files in the browser: EPUB (JSZip), PDF (pdf.js, loaded only when a PDF is opened), plain text and HTML. Nothing is uploaded anywhere.
import { parseEpub, xhtmlToParas } from "./epub.mjs";
import { textToParas, pagesToParas } from "./text.mjs";

export type Para = { text: string; kind: "p" | "h"; pg?: number };
export type Chapter = { title: string; paras: Para[] };
export type Book = { id: string; title: string; author?: string; chapters: Chapter[]; words: number; added: number };
export const MAX_SEGMENT_WORDS = 4000;
const count = (paras: Para[]) => paras.reduce((n, p) => n + p.text.split(/\s+/).filter(Boolean).length, 0);
const fnv = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };

/** Split very long chapters at paragraph boundaries so the page view only ever draws a few thousand words at a time. */
export function segment(chapters: Chapter[]): Chapter[] {
  const out: Chapter[] = [];
  for (const c of chapters) {
    if (count(c.paras) <= MAX_SEGMENT_WORDS * 1.25) { out.push(c); continue; }
    let cur: Para[] = [], n = 0, part = 1;
    for (const p of c.paras) { const w = p.text.split(/\s+/).length; if (n + w > MAX_SEGMENT_WORDS && cur.length) { out.push({ title: part === 1 ? c.title : `${c.title} (${part})`, paras: cur }); part++; cur = []; n = 0; } cur.push(p); n += w; }
    if (cur.length) out.push({ title: part === 1 ? c.title : `${c.title} (${part})`, paras: cur });
  }
  return out;
}
export function makeBook(title: string, chapters: Chapter[], author?: string): Book {
  const segs = segment(chapters.filter((c) => c.paras.length)), words = segs.reduce((n, c) => n + count(c.paras), 0), first = segs[0]?.paras[0]?.text.slice(0, 120) || "";
  return { id: fnv(`${title}|${first}|${words}`), title, author, chapters: segs, words, added: Date.now() };
}
export function textBook(title: string, text: string): Book {
  const paras = textToParas(text) as Para[]; if (!paras.length) throw new Error("There is no text to read.");
  const heads = paras.map((p, i) => (p.kind === "h" && i > 0 ? i : -1)).filter((i) => i > 0);
  if (heads.length < 2) return makeBook(title, [{ title, paras }]);
  const cs: Chapter[] = []; let start = 0; const cuts = [...heads, paras.length];
  if (heads[0] > 0) { /* text before the first later heading belongs to the first chapter */ }
  for (const cut of cuts) { const slice = paras.slice(start, cut); if (slice.length) cs.push({ title: slice[0].kind === "h" ? slice[0].text.slice(0, 70) : `Part ${cs.length + 1}`, paras: slice }); start = cut; }
  return makeBook(title, cs);
}

export type Progress = (msg: string, frac: number) => void;
async function pdfBook(file: File, onProgress?: Progress): Promise<Book> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const data = new Uint8Array(await file.arrayBuffer()), pdf = await pdfjs.getDocument({ data }).promise, pages: { height: number; items: { str: string; x: number; y: number; h: number; w: number }[] }[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i), vp = page.getViewport({ scale: 1 }), tc = await page.getTextContent();
    pages.push({ height: vp.height, items: tc.items.filter((it: any) => "str" in it).map((it: any) => ({ str: it.str as string, x: it.transform[4] as number, y: it.transform[5] as number, h: (Math.hypot(it.transform[2], it.transform[3]) || it.height || 10) as number, w: (it.width as number) || 0 })) });
    onProgress?.(`Reading page ${i} of ${pdf.numPages}…`, i / pdf.numPages);
  }
  const paras = pagesToParas(pages) as Para[], words = count(paras);
  if (words < Math.max(40, pdf.numPages * 8)) throw new Error("This PDF has almost no selectable text. It may be a scan (a picture of pages). Try a text version, or paste the text instead.");
  // chapters from the PDF's own outline when it has one, else blocks of pages
  let starts: { title: string; page: number }[] = [];
  try {
    const outline = await pdf.getOutline();
    if (outline) for (const o of outline) { let dest: any = o.dest; if (typeof dest === "string") dest = await pdf.getDestination(dest); if (Array.isArray(dest) && dest[0]) { const page = await pdf.getPageIndex(dest[0]); starts.push({ title: String(o.title || "").trim(), page }); } }
  } catch { starts = []; }
  starts = starts.filter((s, i, a) => s.title && (i === 0 || s.page > a[i - 1].page)); if (starts.length < 2) { const step = Math.max(5, Math.ceil(pdf.numPages / 12)); starts = []; for (let p = 0; p < pdf.numPages; p += step) starts.push({ title: pdf.numPages <= step ? "Document" : `Pages ${p + 1}–${Math.min(pdf.numPages, p + step)}`, page: p }); }
  const chapters: Chapter[] = starts.map((s, i) => ({ title: s.title, paras: paras.filter((p) => (p.pg ?? 0) >= s.page && (p.pg ?? 0) < (starts[i + 1]?.page ?? 1e9)) }));
  const first = paras.filter((p) => (p.pg ?? 0) < starts[0].page); if (first.length) chapters[0].paras = [...first, ...chapters[0].paras];
  const info: any = await pdf.getMetadata().catch(() => null);
  return makeBook(String(info?.info?.Title || file.name.replace(/\.pdf$/i, "")), chapters, info?.info?.Author || undefined);
}
async function epubBook(file: File): Promise<Book> {
  const JSZip = (await import("jszip")).default, b = await parseEpub(await file.arrayBuffer(), { JSZip, DOMParser });
  return makeBook(b.title || file.name.replace(/\.epub$/i, ""), b.chapters, b.author || undefined);
}
/** Open a file the user picked. Throws an Error with a friendly message when it cannot be read. */
export async function readFile(file: File, onProgress?: Progress): Promise<Book> {
  const name = file.name.toLowerCase();
  if (file.size > 120 * 1024 * 1024) throw new Error("That file is very large (over 120 MB). Try a smaller one.");
  if (name.endsWith(".epub") || file.type === "application/epub+zip") return epubBook(file);
  if (name.endsWith(".pdf") || file.type === "application/pdf") return pdfBook(file, onProgress);
  if (name.endsWith(".html") || name.endsWith(".htm") || file.type === "text/html") { const d = new DOMParser().parseFromString(await file.text(), "text/html"); const paras = xhtmlToParas(d) as Para[]; if (!paras.length) throw new Error("There is no text in that page."); return makeBook(file.name.replace(/\.html?$/i, ""), [{ title: "Page", paras }]); }
  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) return textBook(file.name.replace(/\.(txt|md)$/i, ""), await file.text());
  throw new Error("Pacer opens PDF, EPUB, HTML and text files.");
}
