"use client";

import { useState } from "react";
import { Search, Loader2, Plus } from "lucide-react";

interface ImageResult {
  url: string;
  thumbnailUrl: string;
  sourcePage: string;
  title: string;
}

interface Props {
  initialQuery: string;
  onAdd: (imageId: string) => void;
}

export default function ImageSuggestionsPanel({ initialQuery, onAdd }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setError(null);
    setSearching(true);
    try {
      const res = await fetch("/api/slider/image-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Image search failed.");
        setResults([]);
        return;
      }
      setResults(data.results ?? []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(result: ImageResult) {
    setError(null);
    setAddingUrl(result.url);
    try {
      const res = await fetch("/api/slider/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: result.url, attribution: result.sourcePage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add that image.");
        return;
      }
      onAdd(data.imageId);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAddingUrl(null);
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 flex flex-col gap-2.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Suggested images</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search topic, e.g. Boston Tea Party"
          className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-violet-400"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-60"
        >
          {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          Search
        </button>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {results.map((r) => (
            <div key={r.url} className="relative rounded-lg overflow-hidden border border-stone-200 bg-white group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.thumbnailUrl} alt={r.title} className="w-full aspect-video object-cover" />
              <button
                type="button"
                onClick={() => handleAdd(r)}
                disabled={addingUrl === r.url}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
              >
                <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-violet-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  {addingUrl === r.url ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  Add
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
