"use client";

import SlideCanvas from "./SlideCanvas";
import type { ImagePlaceholder, PreviewAudience, StudioSlide } from "@/lib/studioTypes";

interface SlidePreviewProps {
  slide: StudioSlide;
  audience: PreviewAudience;
  linkedPlaceholder?: ImagePlaceholder;
  onChange: (patch: Partial<StudioSlide>) => void;
  onAddImagePlaceholder: () => void;
  onUpdatePlaceholder: (patch: Partial<ImagePlaceholder>) => void;
  onRemovePlaceholder: () => void;
  /** Tailwind max-width class for the slide frame. Defaults to a comfortable reading width. */
  frameMaxWidth?: string;
}

export default function SlidePreview({
  slide,
  audience,
  linkedPlaceholder,
  onChange,
  onAddImagePlaceholder,
  onUpdatePlaceholder,
  onRemovePlaceholder,
  frameMaxWidth = "max-w-3xl",
}: SlidePreviewProps) {
  return (
    <div className={`mx-auto w-full ${frameMaxWidth}`}>
      <SlideCanvas
        slide={slide}
        audience={audience}
        linkedPlaceholder={linkedPlaceholder}
        onChange={onChange}
        onAddImagePlaceholder={onAddImagePlaceholder}
        onUpdatePlaceholder={onUpdatePlaceholder}
        onRemovePlaceholder={onRemovePlaceholder}
      />
    </div>
  );
}
