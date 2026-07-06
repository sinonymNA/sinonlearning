"use client";

import { SLIDE_LAYOUTS, type SlideLayout } from "@/lib/sliderTypes";

interface Props {
  value?: SlideLayout;
  onSelect: (layout: SlideLayout) => void;
}

function LayoutIcon({ layout }: { layout: SlideLayout }) {
  const bar = <div className="h-1.5 rounded-sm bg-stone-300" />;
  const block = "rounded-sm bg-stone-200";

  switch (layout) {
    case "title":
      return (
        <div className="w-full aspect-video rounded border border-stone-200 flex flex-col items-center justify-center gap-1 p-2">
          <div className="h-1.5 w-1/2 rounded-sm bg-stone-400" />
          <div className="h-1 w-1/3 rounded-sm bg-stone-200" />
        </div>
      );
    case "titleBody":
      return (
        <div className="w-full aspect-video rounded border border-stone-200 flex flex-col gap-1 p-2">
          {bar}
          <div className={`flex-1 ${block}`} />
        </div>
      );
    case "titleBullets":
      return (
        <div className="w-full aspect-video rounded border border-stone-200 flex flex-col gap-1 p-2">
          {bar}
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="h-1 w-4/5 rounded-sm bg-stone-200" />
            <div className="h-1 w-3/5 rounded-sm bg-stone-200" />
            <div className="h-1 w-2/3 rounded-sm bg-stone-200" />
          </div>
        </div>
      );
    case "twoColumn":
      return (
        <div className="w-full aspect-video rounded border border-stone-200 flex flex-col gap-1 p-2">
          {bar}
          <div className="flex-1 flex gap-1">
            <div className={`flex-1 ${block}`} />
            <div className={`flex-1 ${block}`} />
          </div>
        </div>
      );
    case "titleImageBody":
      return (
        <div className="w-full aspect-video rounded border border-stone-200 flex flex-col gap-1 p-2">
          {bar}
          <div className="flex-1 flex gap-1">
            <div className={`w-1/2 ${block}`} />
            <div className="flex-1 flex flex-col justify-center gap-1">
              <div className="h-1 w-full rounded-sm bg-stone-200" />
              <div className="h-1 w-2/3 rounded-sm bg-stone-200" />
            </div>
          </div>
        </div>
      );
    case "imageFull":
      return (
        <div className="w-full aspect-video rounded border border-stone-200 relative bg-stone-200 overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-stone-400/60" />
        </div>
      );
    case "quote":
      return (
        <div className="w-full aspect-video rounded border border-stone-200 flex flex-col items-center justify-center gap-1 p-2">
          <div className="h-1 w-2/3 rounded-sm bg-stone-300" />
          <div className="h-1 w-1/2 rounded-sm bg-stone-300" />
          <div className="h-1 w-1/4 rounded-sm bg-stone-200 mt-1" />
        </div>
      );
  }
}

export default function LayoutPicker({ value, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
      {SLIDE_LAYOUTS.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => onSelect(l.value)}
          title={l.description}
          className={[
            "flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
            value === l.value ? "border-slider-500 bg-slider-50" : "border-stone-200 bg-white hover:border-slider-200",
          ].join(" ")}
        >
          <LayoutIcon layout={l.value} />
          <span className="text-[10px] font-medium text-stone-500 text-center leading-tight">{l.label}</span>
        </button>
      ))}
    </div>
  );
}
