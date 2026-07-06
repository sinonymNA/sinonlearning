"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Presentation, Sparkles } from "lucide-react";
import { getTheme, DEFAULT_THEME_ID } from "@/lib/sliderThemes";
import type { SliderDeck } from "@/lib/sliderTypes";
import ThemePicker from "./ThemePicker";

export default function DeckHub({ decks }: { decks: SliderDeck[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/slider/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create deck.");
        return;
      }
      router.push(`/slider/${data.deck.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-900">Your decks</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/slider/build"
            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 transition-colors"
          >
            <Sparkles size={15} /> Build with KORA
          </Link>
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
          >
            <Plus size={15} /> New deck
          </button>
        </div>
      </div>

      {showPicker && (
        <div className="rounded-2xl border border-stone-100 bg-white p-5 flex flex-col gap-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Pick a theme to start</p>
          <ThemePicker value={themeId} onSelect={setThemeId} />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="self-end rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create deck"}
          </button>
        </div>
      )}

      {decks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-10 text-center text-sm text-stone-400">
          No decks yet — create one from scratch or let KORA build a first draft above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => {
            const theme = getTheme(deck.theme_id);
            return (
              <Link
                key={deck.id}
                href={`/slider/${deck.id}`}
                className="rounded-2xl border border-stone-100 bg-white p-4 hover:border-violet-200 hover:shadow-sm transition-all flex flex-col gap-3"
              >
                <div
                  className="rounded-lg aspect-video flex items-center justify-center"
                  style={{ background: theme.colors.background }}
                >
                  <Presentation size={22} style={{ color: theme.colors.accent }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800 truncate">{deck.title}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {deck.slides.length} slide{deck.slides.length === 1 ? "" : "s"} · {theme.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
