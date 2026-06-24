"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUp, GripVertical, Plus, Shapes, Trash2, Type } from "lucide-react";
import ImagePlaceholderCard from "./ImagePlaceholderCard";
import { createFreeformShapeElement, createFreeformTextElement } from "@/lib/studioDefaults";
import { getDefaultRects } from "@/lib/studioLayout";
import type {
  ImagePlaceholder,
  PreviewAudience,
  Rect,
  SlideBullet,
  SlideElementRole,
  StudioSlide,
} from "@/lib/studioTypes";

interface SlideCanvasProps {
  slide: StudioSlide;
  audience: PreviewAudience;
  linkedPlaceholder?: ImagePlaceholder;
  placeholders: ImagePlaceholder[];
  onChange: (patch: Partial<StudioSlide>) => void;
  onAddImagePlaceholder: () => void;
  onUpdatePlaceholder: (patch: Partial<ImagePlaceholder>) => void;
  onRemovePlaceholder: () => void;
  onUpdateExtraPlaceholder: (placeholderId: string, patch: Partial<ImagePlaceholder>) => void;
}

type DragMode = "move" | "resize";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export default function SlideCanvas({
  slide,
  audience,
  linkedPlaceholder,
  placeholders,
  onChange,
  onAddImagePlaceholder,
  onUpdatePlaceholder,
  onRemovePlaceholder,
  onUpdateExtraPlaceholder,
}: SlideCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Always-current refs so in-flight drag listeners never act on stale closures.
  const slideRef = useRef(slide);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    slideRef.current = slide;
    onChangeRef.current = onChange;
  }, [slide, onChange]);

  const extraElements = slide.extraElements ?? [];
  const defaults = getDefaultRects(slide.layout, Boolean(linkedPlaceholder));

  const getRect = (role: SlideElementRole): Rect =>
    slide.layoutOverrides?.[role] ?? defaults[role] ?? { x: 6, y: 8, width: 88, height: 84 };

  const beginDrag = (
    e: React.PointerEvent,
    id: string,
    kind: "role" | "extra",
    mode: DragMode,
    startRect: Rect
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const dxPct = ((ev.clientX - startX) / bounds.width) * 100;
      const dyPct = ((ev.clientY - startY) / bounds.height) * 100;

      const next: Rect =
        mode === "move"
          ? {
              ...startRect,
              x: clamp(startRect.x + dxPct, 0, 100 - startRect.width),
              y: clamp(startRect.y + dyPct, 0, 100 - startRect.height),
            }
          : {
              ...startRect,
              width: clamp(startRect.width + dxPct, 8, 100 - startRect.x),
              height: clamp(startRect.height + dyPct, 8, 100 - startRect.y),
            };

      if (kind === "role") {
        onChangeRef.current({
          layoutOverrides: { ...slideRef.current.layoutOverrides, [id]: next },
        });
      } else {
        onChangeRef.current({
          extraElements: (slideRef.current.extraElements ?? []).map((el) =>
            el.id === id ? { ...el, ...next } : el
          ),
        });
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const updateBullet = (bulletId: string, text: string) => {
    onChange({ bullets: slide.bullets.map((b) => (b.id === bulletId ? { ...b, text } : b)) });
  };
  const addBullet = () => {
    const bullet: SlideBullet = { id: crypto.randomUUID(), text: "" };
    onChange({ bullets: [...slide.bullets, bullet] });
  };
  const removeBullet = (bulletId: string) => {
    onChange({ bullets: slide.bullets.filter((b) => b.id !== bulletId) });
  };

  const addTextBox = () => {
    const el = createFreeformTextElement({});
    onChange({ extraElements: [...extraElements, el] });
    setSelectedId(el.id);
  };
  const addShape = () => {
    const el = createFreeformShapeElement({});
    onChange({ extraElements: [...extraElements, el] });
    setSelectedId(el.id);
  };
  const updateExtraText = (id: string, text: string) => {
    onChange({
      extraElements: extraElements.map((el) => (el.id === id && el.kind === "text" ? { ...el, text } : el)),
    });
  };
  const removeExtra = (id: string) => {
    onChange({ extraElements: extraElements.filter((el) => el.id !== id) });
    setSelectedId(null);
  };
  const bringToFront = (id: string) => {
    const maxZ = Math.max(3, ...extraElements.map((el) => el.z));
    onChange({
      extraElements: extraElements.map((el) => (el.id === id ? { ...el, z: maxZ + 1 } : el)),
    });
  };

  const selectedExtra = extraElements.find((el) => el.id === selectedId);

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-navy-700/50">
        <button
          type="button"
          onClick={addTextBox}
          className="flex items-center gap-1 rounded-full border border-navy-900/10 px-2.5 py-1 hover:border-teal-400/60 hover:text-teal-700"
        >
          <Type size={12} /> Add text box
        </button>
        <button
          type="button"
          onClick={addShape}
          className="flex items-center gap-1 rounded-full border border-navy-900/10 px-2.5 py-1 hover:border-teal-400/60 hover:text-teal-700"
        >
          <Shapes size={12} /> Add shape
        </button>
        {selectedExtra && (
          <>
            <span className="h-3 w-px bg-navy-900/10" />
            <button
              type="button"
              onClick={() => bringToFront(selectedExtra.id)}
              className="flex items-center gap-1 hover:text-teal-700"
            >
              <ChevronsUp size={12} /> Bring forward
            </button>
            <button
              type="button"
              onClick={() => removeExtra(selectedExtra.id)}
              className="flex items-center gap-1 hover:text-rose-600"
            >
              <Trash2 size={12} /> Delete
            </button>
          </>
        )}
        <span className="ml-auto text-[10px] text-navy-700/35">Drag the grip to move · drag the corner to resize</span>
      </div>

      <div
        ref={containerRef}
        onPointerDown={() => setSelectedId(null)}
        className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-navy-900/10 bg-white shadow-[0_10px_30px_rgba(13,27,46,0.12)]"
      >
        <span className="pointer-events-none absolute right-3 top-3 z-40 rounded-full bg-navy-900/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-navy-700/40">
          {slide.type}
          {slide.timingMinutes ? ` · ~${slide.timingMinutes} min` : ""}
        </span>

        <ElementFrame
          rect={getRect("content")}
          zIndex={1}
          selected={selectedId === "content"}
          onSelect={() => setSelectedId("content")}
          onDragHandle={(e) => beginDrag(e, "content", "role", "move", getRect("content"))}
          onResizeHandle={(e) => beginDrag(e, "content", "role", "resize", getRect("content"))}
        >
          <div className="h-full w-full overflow-y-auto p-4 sm:p-6">
            <input
              value={slide.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Click to add title"
              className="w-full bg-transparent font-display text-xl text-navy-900 placeholder:text-navy-900/25 focus-visible:outline-none sm:text-2xl"
            />
            <input
              value={slide.subtitle ?? ""}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              placeholder="Click to add subtitle"
              className="mt-1 w-full bg-transparent text-sm text-navy-700/60 placeholder:text-navy-700/30 focus-visible:outline-none"
            />

            <ul
              className={`mt-3 space-y-1.5 ${
                slide.layout === "twoColumn" ? "sm:grid sm:grid-cols-2 sm:gap-x-6 sm:space-y-0" : ""
              }`}
            >
              {slide.bullets.map((bullet) => (
                <li key={bullet.id} className="group/bullet flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500" />
                  <textarea
                    value={bullet.text}
                    onChange={(e) => updateBullet(bullet.id, e.target.value)}
                    rows={1}
                    placeholder="Click to add text"
                    className="w-full resize-none bg-transparent text-sm text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(bullet.id)}
                    aria-label="Remove bullet"
                    className="mt-1 text-navy-700/0 transition group-hover/bullet:text-navy-700/30 hover:text-rose-600"
                  >
                    <Trash2 size={11} />
                  </button>
                </li>
              ))}
            </ul>

            {slide.body !== undefined && (
              <textarea
                value={slide.body}
                onChange={(e) => onChange({ body: e.target.value })}
                placeholder="Click to add body text"
                rows={3}
                className="mt-3 w-full resize-none bg-transparent text-sm leading-relaxed text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
              />
            )}

            <button
              type="button"
              onClick={addBullet}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-navy-700/30 hover:text-teal-700"
            >
              <Plus size={11} /> Add bullet
            </button>
          </div>
        </ElementFrame>

        {linkedPlaceholder && (
          <ElementFrame
            rect={getRect("image")}
            zIndex={2}
            selected={selectedId === "image"}
            onSelect={() => setSelectedId("image")}
            onDragHandle={(e) => beginDrag(e, "image", "role", "move", getRect("image"))}
            onResizeHandle={(e) => beginDrag(e, "image", "role", "resize", getRect("image"))}
          >
            <div className="h-full w-full overflow-y-auto p-1">
              <ImagePlaceholderCard
                placeholder={linkedPlaceholder}
                onChange={onUpdatePlaceholder}
                onRemove={onRemovePlaceholder}
              />
            </div>
          </ElementFrame>
        )}

        {extraElements.map((el) => (
          <ElementFrame
            key={el.id}
            rect={el}
            zIndex={el.z}
            selected={selectedId === el.id}
            onSelect={() => setSelectedId(el.id)}
            onDragHandle={(e) => beginDrag(e, el.id, "extra", "move", el)}
            onResizeHandle={(e) => beginDrag(e, el.id, "extra", "resize", el)}
          >
            {el.kind === "text" ? (
              <textarea
                value={el.text}
                onChange={(e) => updateExtraText(el.id, e.target.value)}
                className="h-full w-full resize-none bg-transparent p-1.5 text-sm text-navy-800 outline-none"
                style={{ textAlign: el.align ?? "left" }}
              />
            ) : el.kind === "image" ? (
              (() => {
                const placeholder = placeholders.find((p) => p.id === el.placeholderId);
                return placeholder ? (
                  <div className="h-full w-full overflow-y-auto p-1">
                    <ImagePlaceholderCard
                      placeholder={placeholder}
                      onChange={(patch) => onUpdateExtraPlaceholder(placeholder.id, patch)}
                      onRemove={() => removeExtra(el.id)}
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-sm border border-dashed border-navy-900/20 bg-navy-900/[0.02] text-[10px] text-navy-700/40">
                    Missing image
                  </div>
                );
              })()
            ) : (
              <div
                className={`h-full w-full ${el.shapeType === "ellipse" ? "rounded-full" : "rounded-sm"}`}
                style={{ backgroundColor: el.color }}
              />
            )}
          </ElementFrame>
        ))}

        {!linkedPlaceholder && (
          <button
            type="button"
            onClick={onAddImagePlaceholder}
            className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 rounded-full border border-dashed border-navy-900/20 bg-white/90 px-3 py-1.5 text-xs font-medium text-navy-700/45 hover:border-teal-400/60 hover:text-teal-700"
          >
            <Plus size={12} /> Add image
          </button>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-navy-900/8 bg-navy-900/[0.02] p-4">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-navy-700/45">
          Student instructions
        </label>
        <textarea
          value={slide.studentInstructions}
          onChange={(e) => onChange({ studentInstructions: e.target.value })}
          rows={2}
          placeholder="What should students do during this slide?"
          className="w-full resize-none bg-transparent text-sm text-navy-800 placeholder:text-navy-700/30 focus-visible:outline-none"
        />
      </div>

      {audience === "teacher" && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-amber-700/70">
            Speaker notes (hidden in student view)
          </label>
          <textarea
            value={slide.teacherNotes}
            onChange={(e) => onChange({ teacherNotes: e.target.value })}
            rows={2}
            placeholder="Notes for yourself while teaching this slide…"
            className="w-full resize-none bg-transparent text-sm text-amber-900 placeholder:text-amber-700/40 focus-visible:outline-none"
          />
        </div>
      )}
    </div>
  );
}

function ElementFrame({
  rect,
  zIndex,
  selected,
  onSelect,
  onDragHandle,
  onResizeHandle,
  children,
}: {
  rect: Rect;
  zIndex: number;
  selected: boolean;
  onSelect: () => void;
  onDragHandle: (e: React.PointerEvent) => void;
  onResizeHandle: (e: React.PointerEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        position: "absolute",
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        zIndex,
      }}
      className={
        selected
          ? "outline outline-2 outline-teal-500"
          : "outline outline-1 outline-transparent hover:outline-navy-900/15"
      }
    >
      {children}
      {selected && (
        <>
          <div
            onPointerDown={onDragHandle}
            title="Drag to move"
            className="absolute -left-2.5 -top-2.5 z-50 flex h-5 w-5 cursor-grab items-center justify-center rounded-full bg-teal-600 text-white shadow active:cursor-grabbing"
          >
            <GripVertical size={11} />
          </div>
          <div
            onPointerDown={onResizeHandle}
            title="Drag to resize"
            className="absolute -bottom-1.5 -right-1.5 z-50 h-3 w-3 cursor-nwse-resize rounded-sm border border-white bg-teal-600 shadow"
          />
        </>
      )}
    </div>
  );
}
