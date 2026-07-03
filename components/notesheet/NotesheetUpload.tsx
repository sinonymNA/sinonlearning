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
    <div className="flex flex-col items-center gap-5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          "flex flex-col items-center justify-center gap-4 w-full h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
          dragging
            ? "border-violet-400 bg-violet-50"
            : "border-stone-300 bg-white hover:border-violet-300 hover:bg-violet-50/40",
        ].join(" ")}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-7 h-7 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-stone-500">Reading slides…</p>
          </div>
        ) : (
          <>
            <div className={["w-12 h-12 rounded-xl flex items-center justify-center transition-colors", dragging ? "bg-violet-100" : "bg-stone-100"].join(" ")}>
              <FileUp size={22} className={dragging ? "text-violet-600" : "text-stone-400"} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-stone-700">Drop your slideshow here</p>
              <p className="text-xs text-stone-400 mt-1">PowerPoint (.pptx) · up to 100 MB</p>
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
          className="flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors shadow-sm"
        >
          <Upload size={14} />
          Choose file
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm text-center max-w-xs bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
