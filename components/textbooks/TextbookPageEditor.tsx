"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save, Plus, Trash2 } from "lucide-react";
import MarkdownContent from "@/components/blog/MarkdownContent";
import type { Textbook, TextbookPage } from "@/lib/textbooks";

export default function TextbookPageEditor({
  textbook,
  pages,
}: {
  textbook: Textbook;
  pages: TextbookPage[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(pages[0]?.page_number ?? null);
  const [content, setContent] = useState(pages.find((p) => p.page_number === selected)?.content ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset editor content when the selected page changes
    setContent(pages.find((p) => p.page_number === selected)?.content ?? "");
  }, [selected, pages]);

  const save = async () => {
    if (selected == null) return;
    setSaving(true);
    await fetch(`/api/textbooks/${textbook.slug}/pages/${selected}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    router.refresh();
  };

  const addPage = async () => {
    setBusy(true);
    const res = await fetch(`/api/textbooks/${textbook.slug}/pages`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setSelected(data.page.page_number);
      router.refresh();
    }
  };

  const deletePage = async (n: number) => {
    if (!confirm(`Delete page ${n}? This can't be undone.`)) return;
    setBusy(true);
    await fetch(`/api/textbooks/${textbook.slug}/pages/${n}`, { method: "DELETE" });
    setBusy(false);
    setSelected(null);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
      <div>
        <p className="text-sm font-medium text-navy-900">Pages</p>
        <div className="mt-2 space-y-1.5">
          {pages.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <button
                onClick={() => setSelected(p.page_number)}
                className={`flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  selected === p.page_number
                    ? "bg-teal-500 text-navy-950"
                    : "bg-white text-navy-900 hover:bg-navy-900/5"
                }`}
              >
                Page {p.page_number}
              </button>
              <button
                onClick={() => deletePage(p.page_number)}
                disabled={busy}
                className="rounded-lg p-2 text-rose-600/60 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                aria-label={`Delete page ${p.page_number}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addPage}
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-navy-900/20 px-3 py-2 text-sm font-medium text-navy-700/70 transition-colors hover:border-teal-500/40 hover:text-navy-900 disabled:opacity-40"
        >
          <Plus size={14} />
          Add page
        </button>
      </div>

      <div>
        {selected == null ? (
          <p className="rounded-2xl border border-dashed border-navy-900/15 px-6 py-12 text-center text-sm text-navy-700/50">
            Add a page to get started.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-navy-900">Page {selected} (Markdown)</p>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-teal-700 transition-colors hover:text-teal-600"
              >
                <Eye size={13} />
                {showPreview ? "Hide preview" : "Show preview"}
              </button>
            </div>
            <div className={showPreview ? "mt-1.5 grid grid-cols-1 gap-4 lg:grid-cols-2" : "mt-1.5"}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                placeholder="Write this page in Markdown..."
                className="w-full rounded-lg border border-navy-900/12 bg-white px-3 py-2 font-mono text-sm text-navy-900 placeholder:text-navy-700/35 focus:border-teal-500/50 focus:outline-none"
              />
              {showPreview && (
                <div className="rounded-lg border border-navy-900/12 bg-cream-50 px-4 py-3">
                  <MarkdownContent content={content || "*Nothing to preview yet.*"} />
                </div>
              )}
            </div>
            <button
              onClick={save}
              disabled={saving}
              className="mt-4 flex items-center gap-2 rounded-full bg-teal-500 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-400 disabled:opacity-40"
            >
              <Save size={15} />
              {saving ? "Saving..." : "Save page"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
