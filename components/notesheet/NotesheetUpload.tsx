"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";

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
  const zoneRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Entrance animation
  useEffect(() => {
    if (zoneRef.current) {
      animate(zoneRef.current, {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 500,
        easing: "easeOutQuart",
      });
    }
  }, []);

  // Drag-over spring effect
  function onDragEnter() {
    setDragging(true);
    if (zoneRef.current) {
      animate(zoneRef.current, {
        scale: [1, 1.016],
        duration: 350,
        easing: "easeOutElastic(1, .5)",
      });
    }
  }

  function onDragLeave() {
    setDragging(false);
    if (zoneRef.current) {
      animate(zoneRef.current, {
        scale: [1.016, 1],
        duration: 280,
        easing: "easeOutQuart",
      });
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    onDragLeave();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    setProgress(0);

    // Fake progress to give visual feedback during upload
    const timer = setInterval(() => setProgress((p) => Math.min(p + 6, 88)), 220);

    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/notesheet/upload", { method: "POST", body: form });
      clearInterval(timer);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        setLoading(false);
        return;
      }
      setProgress(100);
      setTimeout(() => onUpload(data as UploadResult), 300);
    } catch {
      clearInterval(timer);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={zoneRef}
        onDragOver={(e) => { e.preventDefault(); if (!dragging) onDragEnter(); }}
        onDragEnter={(e) => { e.preventDefault(); onDragEnter(); }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        style={{ opacity: 0 }} // anime.js will animate this in
        className={[
          "relative w-full rounded-2xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors",
          "flex flex-col items-center justify-center gap-5",
          "h-[260px]",
          dragging
            ? "border-violet-400 bg-violet-50/60"
            : "border-stone-200 bg-stone-50/50 hover:border-violet-200 hover:bg-violet-50/20",
        ].join(" ")}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-5 w-full px-10">
            {/* Spinner icon */}
            <div className="w-10 h-10 rounded-full border-2 border-violet-200 border-t-violet-600 animate-spin" />
            <div className="w-full">
              <div className="h-1 w-full bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[13px] text-stone-400 mt-3 text-center">Reading slides…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Upload icon */}
            <div ref={iconRef} className="flex flex-col items-center gap-4">
              <div
                className={[
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
                  dragging ? "bg-violet-100" : "bg-white border border-stone-200",
                ].join(" ")}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={["w-6 h-6 transition-colors", dragging ? "text-violet-500" : "text-stone-400"].join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="text-center">
                <p className={["text-[14px] font-medium transition-colors", dragging ? "text-violet-700" : "text-stone-600"].join(" ")}>
                  {dragging ? "Release to upload" : "Drop your slideshow here"}
                </p>
                <p className="text-[12px] text-stone-400 mt-1">PowerPoint · up to 100 MB</p>
              </div>
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
          className="flex items-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-violet-700 active:scale-95 transition-all shadow-sm shadow-violet-200"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          </svg>
          Choose file
        </button>
      )}

      {error && (
        <div className="w-full rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
