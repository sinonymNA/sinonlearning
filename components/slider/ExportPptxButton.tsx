"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function ExportPptxButton({ deckId }: { deckId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/slider/decks/${deckId}/export/pptx`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Export failed.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="(.+?)"/);
      const fileName = match?.[1] ?? "deck.pptx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 hover:shadow-md transition-all disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {loading ? "Exporting…" : "Export as PPTX"}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
