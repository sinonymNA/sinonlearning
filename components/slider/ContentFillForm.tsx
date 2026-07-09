"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, Loader2 } from "lucide-react";

const FILL_STATUS_MESSAGES = ["Reading your content…", "Filling in your slides…"];

function KoraAvatar({ size = 32 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slider-400 to-slider-700 text-white shadow-sm shadow-slider-200"
      style={{ width: size, height: size }}
    >
      <Sparkles size={size * 0.5} />
    </span>
  );
}

export default function ContentFillForm() {
  const router = useRouter();
  const [rawContent, setRawContent] = useState("");
  const [audience, setAudience] = useState("");
  const [notes, setNotes] = useState("");
  const [building, setBuilding] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!building) return;
    setStatusIndex(0);
    const interval = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, FILL_STATUS_MESSAGES.length - 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [building]);

  async function handleSubmit() {
    setError(null);
    if (rawContent.trim().length < 20) {
      setError("Paste in a bit more content — at least a couple sentences.");
      return;
    }
    setBuilding(true);
    try {
      const res = await fetch("/api/slider/kora-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawContent, audience, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not build your slideshow.");
        setBuilding(false);
        return;
      }
      router.push(`/slider/${data.deckId}`);
    } catch {
      setError("Network error. Please try again.");
      setBuilding(false);
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4">
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-3.5 bg-gradient-to-r from-slider-50 to-white">
          <KoraAvatar size={30} />
          <div>
            <p className="text-[13px] font-bold text-stone-800">KORA</p>
            <p className="text-[11px] text-stone-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Fills your own content into slide templates
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-stone-600">
              Your lesson content
            </label>
            <textarea
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Paste your notes, an outline, a reading, or anything else you already have — KORA will format it into slides using Slider's templates without inventing new content."
              rows={10}
              className="w-full resize-y rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slider-400 focus:ring-2 focus:ring-slider-100 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-stone-600">
                Audience <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. 10th grade World History"
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slider-400 focus:ring-2 focus:ring-slider-100 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-stone-600">
                Notes <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tone, emphasis, anything else KORA should know"
                className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-slider-400 focus:ring-2 focus:ring-slider-100 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-stone-100 p-4 flex justify-end bg-stone-50/50">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={building}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-slider-500 to-slider-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slider-200 hover:shadow-md transition-all disabled:opacity-60"
          >
            {building ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {building ? FILL_STATUS_MESSAGES[statusIndex] : "Fill my slideshow"}
          </button>
        </div>
      </div>

      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
