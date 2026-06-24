import type { AnchoredTemplateStyleId } from "./anchoredNotesTypes";

/**
 * Visual tokens for each Anchored Notes template style, consumed by the preview/print
 * renderer (BlockRenderer). These are CSS-level style configs, not real Google template
 * files — Google Doc export reads the same block content and applies its own (simpler)
 * Docs-native styling, since the Docs API can't replicate arbitrary CSS.
 */
export interface AnchoredTemplateConfig {
  id: AnchoredTemplateStyleId;
  name: string;
  pageClassName: string;
  headerClassName: string;
  titleClassName: string;
  sectionHeadingClassName: string;
  boxClassName: string;
  tableClassName: string;
  tableHeaderClassName: string;
  responseBoxClassName: string;
  accentColor: string;
}

export const ANCHORED_TEMPLATE_CONFIGS: Record<AnchoredTemplateStyleId, AnchoredTemplateConfig> = {
  apwhAnchoredNotes: {
    id: "apwhAnchoredNotes",
    name: "APWH Anchored Notes",
    pageClassName: "font-serif text-[13px] leading-relaxed text-black",
    headerClassName: "flex items-center justify-between border-b-2 border-black pb-2 text-[11px] uppercase tracking-wide",
    titleClassName: "mt-4 text-center text-xl font-bold uppercase tracking-wide",
    sectionHeadingClassName: "mt-6 border-b border-black pb-1 text-sm font-bold uppercase tracking-wide",
    boxClassName: "mt-3 border-2 border-black p-3",
    tableClassName: "mt-3 w-full border-collapse border-2 border-black text-[12px]",
    tableHeaderClassName: "border border-black bg-black/5 p-1.5 text-left font-bold",
    responseBoxClassName: "mt-2 min-h-[1.5em] border-b border-dotted border-black/60",
    accentColor: "#000000",
  },
  cleanPrintable: {
    id: "cleanPrintable",
    name: "Clean Printable Notes",
    pageClassName: "font-sans text-[13px] leading-relaxed text-neutral-900",
    headerClassName: "flex items-center justify-between border-b border-neutral-300 pb-2 text-[11px] uppercase tracking-wide text-neutral-500",
    titleClassName: "mt-4 text-center text-xl font-semibold",
    sectionHeadingClassName: "mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-700",
    boxClassName: "mt-3 rounded-md border border-neutral-300 p-3",
    tableClassName: "mt-3 w-full border-collapse text-[12px]",
    tableHeaderClassName: "border border-neutral-300 bg-neutral-50 p-1.5 text-left font-semibold",
    responseBoxClassName: "mt-2 min-h-[1.5em] border-b border-neutral-300",
    accentColor: "#404040",
  },
  modernHandout: {
    id: "modernHandout",
    name: "Modern Handout",
    pageClassName: "font-sans text-[13px] leading-relaxed text-navy-900",
    headerClassName: "flex items-center justify-between border-b border-teal-200 pb-2 text-[11px] uppercase tracking-wide text-teal-700",
    titleClassName: "mt-4 text-center text-xl font-bold text-navy-900",
    sectionHeadingClassName: "mt-6 rounded-md bg-teal-50 px-2.5 py-1 text-sm font-semibold text-teal-800",
    boxClassName: "mt-3 rounded-xl border border-teal-200 bg-teal-50/40 p-3",
    tableClassName: "mt-3 w-full border-collapse overflow-hidden rounded-lg text-[12px]",
    tableHeaderClassName: "border border-teal-200 bg-teal-100/60 p-1.5 text-left font-semibold text-teal-900",
    responseBoxClassName: "mt-2 min-h-[1.5em] rounded border-b border-teal-200",
    accentColor: "#0d9488",
  },
  boxedNotes: {
    id: "boxedNotes",
    name: "Boxed Notes",
    pageClassName: "font-sans text-[13px] leading-relaxed text-black",
    headerClassName: "flex items-center justify-between border-2 border-black p-2 text-[11px] uppercase tracking-wide",
    titleClassName: "mt-4 border-2 border-black p-2 text-center text-xl font-bold",
    sectionHeadingClassName: "mt-6 border-2 border-black bg-black/5 p-1.5 text-sm font-bold uppercase",
    boxClassName: "mt-3 border-2 border-black p-3",
    tableClassName: "mt-3 w-full border-collapse border-2 border-black text-[12px]",
    tableHeaderClassName: "border-2 border-black bg-black/10 p-1.5 text-left font-bold",
    responseBoxClassName: "mt-2 min-h-[1.5em] border-2 border-black",
    accentColor: "#000000",
  },
};

export function getAnchoredTemplateConfig(id: AnchoredTemplateStyleId): AnchoredTemplateConfig {
  return ANCHORED_TEMPLATE_CONFIGS[id];
}
