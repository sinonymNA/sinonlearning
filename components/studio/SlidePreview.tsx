"use client";

import SlideCanvas from "./SlideCanvas";
import type { ImagePlaceholder, PreviewAudience, StudioSlide } from "@/lib/studioTypes";

interface SlidePreviewProps {
  slide: StudioSlide;
  audience: PreviewAudience;
  linkedPlaceholder?: ImagePlaceholder;
  placeholders: ImagePlaceholder[];
  onChange: (patch: Partial<StudioSlide>) => void;
  onAddImagePlaceholder: () => void;
  onUpdatePlaceholder: (patch: Partial<ImagePlaceholder>) => void;
  onRemovePlaceholder: () => void;
  onUpdateExtraPlaceholder: (placeholderId: string, patch: Partial<ImagePlaceholder>) => void;
  /** Tailwind max-width class for the slide frame. Defaults to a comfortable reading width. */
  frameMaxWidth?: string;
}

export default function SlidePreview({
  slide,
  audience,
  linkedPlaceholder,
  placeholders,
  onChange,
  onAddImagePlaceholder,
  onUpdatePlaceholder,
  onRemovePlaceholder,
  onUpdateExtraPlaceholder,
  frameMaxWidth = "max-w-3xl",
}: SlidePreviewProps) {
  return (
    <div className={`mx-auto w-full ${frameMaxWidth}`}>
      <SlideCanvas
        slide={slide}
        audience={audience}
        linkedPlaceholder={linkedPlaceholder}
        placeholders={placeholders}
        onChange={onChange}
        onAddImagePlaceholder={onAddImagePlaceholder}
        onUpdatePlaceholder={onUpdatePlaceholder}
        onRemovePlaceholder={onRemovePlaceholder}
        onUpdateExtraPlaceholder={onUpdateExtraPlaceholder}
      />
    </div>
  );
}
