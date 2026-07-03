"use client";

import { useRef, useState } from "react";
import { Upload, FileUp } from "lucide-react";

interface UploadResult {
  slides: string[];
  slideCount: number;
  rawText: string;
}

interface Props {
  onUpload: (result: UploadResult) => void;
}

export default function NotesheetUpload({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/notesheet/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Upload failed."); return; }
      onUpload(data as UploadResult);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "flex flex-col items-center justify-center gap-4 w-full max-w-md h-56 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
          dragging ? "border-teal-400 bg-teal-50/5" : "border-white/20 hover:border-white/40",
        ].join(" ")}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-teal-300 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/60">Reading slides...</p>
          </div>
        ) : (
          <>
            <FileUp size={36} className="text-white/40" />
            <div className="text-center">
              <p className="text-sm font-medium text-white/80">Drop your slideshow here</p>
              <p className="text-xs text-white/45 mt-1">PowerPoint (.pptx) · up to 10 MB</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pptx,.pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      {!loading && (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 hover:bg-teal-200 transition-colors"
        >
          <Upload size={14} />
          Choose file
        </button>
      )}

      {error && <p className="text-red-400 text-sm text-center max-w-xs">{error}</p>}
    </div>
  );
}
