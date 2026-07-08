"use client";

import { useState } from "react";
import { Folder, X, MessageSquare, FileText } from "lucide-react";

export interface EvidenceFolderEntry {
  id: string;
  label: string;
  preview: string;
  kind: "chatExchange" | "evidenceExhibit";
}

interface Props {
  entries: EvidenceFolderEntry[];
  onRemove: (id: string) => void;
}

function EntryCard({ entry, onRemove }: { entry: EvidenceFolderEntry; onRemove: (id: string) => void }) {
  const Icon = entry.kind === "chatExchange" ? MessageSquare : FileText;
  return (
    <div className="relative rounded-lg border border-stone-200 bg-stone-50 p-2.5">
      <button
        onClick={() => onRemove(entry.id)}
        aria-label="Remove from evidence folder"
        className="absolute top-1.5 right-1.5 text-stone-300 hover:text-stone-500 transition-colors"
      >
        <X size={13} />
      </button>
      <div className="flex items-center gap-1.5 pr-4">
        <Icon size={12} className="shrink-0 text-teal-600" />
        <p className="text-[11px] font-semibold text-stone-700 truncate">{entry.label}</p>
      </div>
      <p className="mt-1 text-[11px] text-stone-500 line-clamp-3">{entry.preview}</p>
    </div>
  );
}

function EmptyState() {
  return <p className="text-[11px] leading-relaxed text-stone-400">Evidence you save will show up here — use it while you write.</p>;
}

export default function EvidenceFolderPanel({ entries, onRemove }: Props) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop / wide viewports: sticky docked column, stays visible while writing. */}
      <div className="hidden lg:block">
        <div className="sticky top-6 w-full rounded-2xl border border-stone-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Folder size={15} className="text-teal-600" />
            <p className="text-[13px] font-bold text-stone-800">
              Evidence Folder{entries.length > 0 ? ` (${entries.length})` : ""}
            </p>
          </div>
          {entries.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} onRemove={onRemove} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Narrow viewports: floating pill that expands into a bottom sheet. */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
        >
          <Folder size={14} />
          Evidence{entries.length > 0 ? ` (${entries.length})` : ""}
        </button>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-stone-900/30" onClick={() => setIsMobileOpen(false)} />
            <div className="relative max-h-[70vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[14px] font-bold text-stone-900">Evidence Folder</p>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close evidence folder"
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              {entries.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="flex flex-col gap-2">
                  {entries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} onRemove={onRemove} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
