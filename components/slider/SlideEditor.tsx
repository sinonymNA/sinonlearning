"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Copy, LayoutTemplate, Palette, GripVertical } from "lucide-react";
import { createSlide, hasImageRegion, type Slide, type SlideLayout, type SliderDeck } from "@/lib/sliderTypes";
import { getTheme } from "@/lib/sliderThemes";
import SlideRenderer from "./SlideRenderer";
import LayoutPicker from "./LayoutPicker";
import ThemePicker from "./ThemePicker";
import ImageSuggestionsPanel from "./ImageSuggestionsPanel";
import ExportPptxButton from "./ExportPptxButton";
import SliderModal from "./SliderModal";
import { useMountReveal } from "@/lib/marginsMotion";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `slide-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function SlideEditor({ deck }: { deck: SliderDeck }) {
  const [title, setTitle] = useState(deck.title);
  const [themeId, setThemeId] = useState(deck.theme_id);
  const [slides, setSlides] = useState<Slide[]>(deck.slides.length ? deck.slides : [createSlide("title")]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showAddLayout, setShowAddLayout] = useState(false);
  const [showChangeLayout, setShowChangeLayout] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const isFirstRender = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useMountReveal(containerRef, ".editor-panel", { stagger: 90, translateY: 16, duration: 420 });

  const theme = getTheme(themeId);
  const selected = slides[Math.min(selectedIndex, slides.length - 1)];

  async function saveDeck() {
    setSaveState("saving");
    try {
      await fetch(`/api/slider/decks/${deck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, themeId, slides }),
      });
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveState("idle");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(saveDeck, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, themeId, slides]);

  function updateSelected(patch: Partial<Slide>) {
    setSlides((s) => s.map((sl, i) => (i === selectedIndex ? { ...sl, ...patch } : sl)));
  }

  function addSlide(layout: SlideLayout) {
    setSlides((s) => [...s, createSlide(layout)]);
    setSelectedIndex(slides.length);
    setShowAddLayout(false);
  }

  function removeSlide(index: number) {
    if (slides.length <= 1) return;
    setSlides((s) => s.filter((_, i) => i !== index));
    setSelectedIndex((i) => Math.max(0, Math.min(i, slides.length - 2)));
  }

  function duplicateSlide(index: number) {
    setSlides((s) => {
      const copy: Slide = { ...s[index], id: newId() };
      return [...s.slice(0, index + 1), copy, ...s.slice(index + 1)];
    });
    setSelectedIndex(index + 1);
  }

  function changeSelectedLayout(layout: SlideLayout) {
    setSlides((s) =>
      s.map((sl, i) => {
        if (i !== selectedIndex) return sl;
        const fresh = createSlide(layout);
        return { ...fresh, id: sl.id, title: sl.title || fresh.title, notes: sl.notes };
      })
    );
    setShowChangeLayout(false);
  }

  function moveSlide(from: number, to: number) {
    if (from === to) return;
    setSlides((s) => {
      const next = [...s];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setSelectedIndex(to);
  }

  function updateBullet(i: number, value: string) {
    updateSelected({ bullets: (selected.bullets ?? [""]).map((b, idx) => (idx === i ? value : b)) });
  }
  function addBullet() {
    updateSelected({ bullets: [...(selected.bullets ?? []), ""] });
  }
  function removeBullet(i: number) {
    updateSelected({ bullets: (selected.bullets ?? []).filter((_, idx) => idx !== i) });
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-5">
      <div className="editor-panel flex flex-wrap items-center justify-between gap-3" style={{ opacity: 0 }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-bold text-stone-900 bg-transparent outline-none border-b border-transparent focus:border-stone-300 min-w-0"
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-400">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
          </span>
          <button
            type="button"
            onClick={() => setShowThemePicker((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 hover:border-slider-300 transition-colors"
          >
            <Palette size={13} /> Theme
          </button>
          <ExportPptxButton deckId={deck.id} />
        </div>
      </div>

      {showThemePicker && (
        <SliderModal title="Change theme" onClose={() => setShowThemePicker(false)}>
          <ThemePicker
            value={themeId}
            onSelect={(id) => {
              setThemeId(id);
              setShowThemePicker(false);
            }}
          />
        </SliderModal>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Filmstrip */}
        <div className="editor-panel lg:col-span-1 flex flex-col gap-2" style={{ opacity: 0 }}>
          <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                draggable
                onDragStart={() => (dragIndex.current = i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null) moveSlide(dragIndex.current, i);
                  dragIndex.current = null;
                }}
                onClick={() => setSelectedIndex(i)}
                className={[
                  "relative rounded-lg border p-1 text-left transition-all cursor-grab active:cursor-grabbing",
                  i === selectedIndex ? "border-slider-500 ring-2 ring-slider-100" : "border-stone-200 hover:border-slider-200",
                ].join(" ")}
              >
                <SlideRenderer slide={s} theme={theme} />
                <div className="absolute top-1 left-1 rounded bg-black/50 text-white text-[9px] px-1.5 py-0.5">
                  {i + 1}
                </div>
                <GripVertical size={12} className="absolute top-1 right-1 text-white/70" />
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddLayout((v) => !v)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slider-300 bg-slider-50/50 py-2.5 text-xs font-semibold text-slider-600 hover:bg-slider-50 transition-colors"
            >
              <Plus size={13} /> Add slide
            </button>
            {showAddLayout && (
              <div className="absolute z-10 mt-2 w-[min(90vw,420px)] rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
                <LayoutPicker onSelect={addSlide} />
              </div>
            )}
          </div>
        </div>

        {/* Stage */}
        <div className="editor-panel lg:col-span-3 flex flex-col gap-4" style={{ opacity: 0 }}>
          <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4">
            <SlideRenderer slide={selected} theme={theme} className="shadow-sm" />
          </div>

          <div className="rounded-2xl border border-stone-100 bg-white p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowChangeLayout((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:border-slider-300 transition-colors"
                >
                  <LayoutTemplate size={13} /> Change layout
                </button>
                {showChangeLayout && (
                  <div className="absolute z-10 mt-2 w-[min(90vw,420px)] rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
                    <LayoutPicker value={selected.layout} onSelect={changeSelectedLayout} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => duplicateSlide(selectedIndex)}
                  className="text-stone-400 hover:text-slider-600 transition-colors"
                  title="Duplicate slide"
                >
                  <Copy size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => removeSlide(selectedIndex)}
                  disabled={slides.length <= 1}
                  className="text-stone-400 hover:text-red-500 transition-colors disabled:opacity-30"
                  title="Delete slide"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <SlideContentFields
              slide={selected}
              onChange={updateSelected}
              onUpdateBullet={updateBullet}
              onAddBullet={addBullet}
              onRemoveBullet={removeBullet}
            />

            {hasImageRegion(selected.layout) && (
              <ImageSuggestionsPanel
                initialQuery={selected.title || ""}
                onAdd={(imageId) => updateSelected({ image: { id: imageId } })}
              />
            )}

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Speaker notes</span>
              <textarea
                rows={2}
                value={selected.notes ?? ""}
                onChange={(e) => updateSelected({ notes: e.target.value })}
                placeholder="Optional — not shown on the slide itself"
                className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-[13px] outline-none focus:border-slider-400 resize-none"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideContentFields({
  slide,
  onChange,
  onUpdateBullet,
  onAddBullet,
  onRemoveBullet,
}: {
  slide: Slide;
  onChange: (patch: Partial<Slide>) => void;
  onUpdateBullet: (i: number, value: string) => void;
  onAddBullet: () => void;
  onRemoveBullet: (i: number) => void;
}) {
  const inputCls =
    "rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-2 text-[14px] outline-none focus:border-slider-400 focus:bg-white transition-all";

  switch (slide.layout) {
    case "title":
      return (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Title</span>
            <input type="text" value={slide.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Subtitle</span>
            <input type="text" value={slide.subtitle ?? ""} onChange={(e) => onChange({ subtitle: e.target.value })} className={inputCls} />
          </label>
        </div>
      );
    case "titleBody":
    case "titleImageBody":
      return (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Header</span>
            <input type="text" value={slide.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Body text</span>
            <textarea rows={5} value={slide.body ?? ""} onChange={(e) => onChange({ body: e.target.value })} className={`${inputCls} resize-none`} />
          </label>
        </div>
      );
    case "titleBullets":
      return (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Header</span>
            <input type="text" value={slide.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Bullets</span>
            {(slide.bullets ?? [""]).map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="text" value={b} onChange={(e) => onUpdateBullet(i, e.target.value)} className={`${inputCls} flex-1`} />
                {(slide.bullets ?? []).length > 1 && (
                  <button type="button" onClick={() => onRemoveBullet(i)} className="text-stone-300 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={onAddBullet} className="self-start mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slider-600 hover:text-slider-700">
              <Plus size={12} /> Add bullet
            </button>
          </div>
        </div>
      );
    case "twoColumn":
      return (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Header</span>
            <input type="text" value={slide.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Left column</span>
              <textarea
                rows={5}
                value={slide.columns?.[0] ?? ""}
                onChange={(e) => onChange({ columns: [e.target.value, slide.columns?.[1] ?? ""] })}
                className={`${inputCls} resize-none`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Right column</span>
              <textarea
                rows={5}
                value={slide.columns?.[1] ?? ""}
                onChange={(e) => onChange({ columns: [slide.columns?.[0] ?? "", e.target.value] })}
                className={`${inputCls} resize-none`}
              />
            </label>
          </div>
        </div>
      );
    case "imageFull":
      return (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Caption (optional)</span>
          <input type="text" value={slide.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} className={inputCls} />
        </label>
      );
    case "quote":
      return (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Quote</span>
            <textarea rows={3} value={slide.quoteText ?? ""} onChange={(e) => onChange({ quoteText: e.target.value })} className={`${inputCls} resize-none`} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400">Attribution</span>
            <input type="text" value={slide.quoteAttribution ?? ""} onChange={(e) => onChange({ quoteAttribution: e.target.value })} className={inputCls} />
          </label>
        </div>
      );
  }
}
