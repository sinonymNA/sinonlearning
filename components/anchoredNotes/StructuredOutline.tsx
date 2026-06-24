"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { AnchoredNotesBlock } from "@/lib/anchoredNotesTypes";

interface StructuredOutlineProps {
  blocks: AnchoredNotesBlock[];
  onToggleInclude: (blockId: string, include: boolean) => void;
  onReorder: (index: number, direction: "up" | "down") => void;
  onRemove: (blockId: string) => void;
}

const TYPE_LABELS: Record<AnchoredNotesBlock["type"], string> = {
  title: "Title",
  header: "Header",
  essentialQuestion: "Essential Question",
  warmupBox: "Before the Lesson",
  sectionHeading: "Section Heading",
  guidedParagraph: "Paragraph",
  numberedList: "List",
  table: "Table",
  responseBox: "Response Box",
  imagePlaceholder: "Image",
  synthesisPrompt: "Synthesis",
  outsideInfoBank: "Outside Info Bank",
  callout: "Callout",
  divider: "Divider",
};

function blockSummary(block: AnchoredNotesBlock): string {
  if (block.title) return block.title;
  if (block.content) return block.content.slice(0, 60);
  if (block.items?.length) return block.items[0];
  if (block.table) return `${block.table.headers.length} columns × ${block.table.rows.length} rows`;
  return "";
}

export default function StructuredOutline({ blocks, onToggleInclude, onReorder, onRemove }: StructuredOutlineProps) {
  if (blocks.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-4 text-xs text-navy-700/50">
        Structure your content to see an editable outline here.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold text-navy-900">Outline ({blocks.length} blocks)</p>
      <div className="space-y-1.5">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={`flex items-start gap-2 rounded-lg border border-navy-900/8 bg-white p-2 ${
              block.include ? "" : "opacity-50"
            }`}
          >
            <input
              type="checkbox"
              checked={block.include}
              onChange={(e) => onToggleInclude(block.id, e.target.checked)}
              aria-label={`Include ${TYPE_LABELS[block.type]}`}
              className="mt-1 h-3.5 w-3.5 accent-teal-500"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">{TYPE_LABELS[block.type]}</p>
              <p className="truncate text-xs text-navy-800">{blockSummary(block)}</p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onReorder(index, "up")}
                disabled={index === 0}
                aria-label="Move up"
                className="rounded p-1 text-navy-700/50 transition hover:bg-navy-900/5 disabled:opacity-30"
              >
                <ChevronUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => onReorder(index, "down")}
                disabled={index === blocks.length - 1}
                aria-label="Move down"
                className="rounded p-1 text-navy-700/50 transition hover:bg-navy-900/5 disabled:opacity-30"
              >
                <ChevronDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(block.id)}
                aria-label="Remove block"
                className="rounded p-1 text-navy-700/50 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
