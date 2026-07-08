"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Presentation, Sparkles, Clock } from "lucide-react";
import { resolveTheme, DEFAULT_THEME_ID } from "@/lib/sliderThemes";
import type { SliderDeck } from "@/lib/sliderTypes";
import { useMountReveal } from "@/lib/marginsMotion";
import { useSliderCustomThemes } from "@/lib/useSliderCustomThemes";
import ThemePicker from "./ThemePicker";
import SliderModal from "./SliderModal";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function DeckHub({ decks }: { decks: SliderDeck[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { customThemes, refresh: refreshCustomThemes } = useSliderCustomThemes();

  useMountReveal(containerRef, ".hub-block", { stagger: 90, translateY: 16, duration: 420 });

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
    <div ref={containerRef} className="flex flex-col gap-6">
      <div className="hub-block flex flex-wrap items-center justify-between gap-4" style={{ opacity: 0 }}>
        <div>
          <h1 className="text-xl font-bold text-stone-900">Your decks</h1>
          <p className="text-sm text-stone-400 mt-0.5">Pick up where you left off, or start something new.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/slider/build"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slider-200 bg-white px-4 py-2.5 text-sm font-semibold text-slider-700 hover:bg-slider-50 hover:border-slider-300 transition-colors"
          >
            <Sparkles size={15} className="text-slider-500" /> Build with KORA
          </Link>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-slider-500 to-slider-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slider-200 hover:shadow-md transition-all"
          >
            <Plus size={15} /> New deck
          </button>
        </div>
      </div>

      {showPicker && (
        <SliderModal title="Pick a theme to start" onClose={() => setShowPicker(false)}>
          <ThemePicker
            value={themeId}
            onSelect={setThemeId}
            customThemes={customThemes}
            onCustomThemesChange={refreshCustomThemes}
          />
          {error && <p className="text-[12px] text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="self-end rounded-xl bg-gradient-to-br from-slider-500 to-slider-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slider-200 hover:shadow-md transition-all disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create deck"}
          </button>
        </SliderModal>
      )}

      {decks.length === 0 ? (
        <div className="hub-block rounded-2xl border border-dashed border-slider-200 bg-slider-50/40 p-12 text-center flex flex-col items-center gap-3" style={{ opacity: 0 }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slider-500 to-slider-700 text-white shadow-sm shadow-slider-200">
            <Presentation size={22} />
          </span>
          <p className="text-sm font-semibold text-stone-700">No decks yet</p>
          <p className="text-[13px] text-stone-400 max-w-xs">
            Create one from scratch, or let KORA build a first draft from a short chat above.
          </p>
        </div>
      ) : (
        <div className="hub-block grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ opacity: 0 }}>
          {decks.map((deck) => {
            const theme = resolveTheme(deck.theme_id, customThemes);
            return (
              <Link
                key={deck.id}
                href={`/slider/${deck.id}`}
                className="group rounded-2xl border border-stone-100 bg-white p-4 hover:border-slider-200 hover:shadow-lg hover:shadow-slider-100 hover:-translate-y-0.5 transition-all flex flex-col gap-3"
              >
                <div
                  className="relative rounded-lg aspect-video flex items-center justify-center overflow-hidden"
                  style={{ background: theme.colors.background }}
                >
                  <Presentation
                    size={26}
                    className="transition-transform group-hover:scale-110"
                    style={{ color: theme.colors.accent }}
                  />
                  <span
                    className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full"
                    style={{ background: theme.colors.accent }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800 truncate">{deck.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[11px] text-stone-400">
                      {deck.slides.length} slide{deck.slides.length === 1 ? "" : "s"} · {theme.name}
                    </p>
                    <span className="text-stone-200">·</span>
                    <p className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Clock size={10} /> {timeAgo(deck.updated_at)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
