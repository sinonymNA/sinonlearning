import type { Rect, SlideElementRole, SlideLayout } from "./studioTypes";

/**
 * Default percentage-based positions for the two canvas regions (content, image) per
 * layout preset. A teacher dragging/resizing an element materializes an override in
 * `slide.layoutOverrides`; until then, the slide renders from these defaults.
 */
export function getDefaultRects(
  layout: SlideLayout,
  hasImage: boolean
): Partial<Record<SlideElementRole, Rect>> {
  switch (layout) {
    case "titleOnly":
      return {
        content: { x: 10, y: 30, width: 80, height: 40 },
        ...(hasImage ? { image: { x: 32, y: 72, width: 36, height: 24 } } : {}),
      };
    case "imageFocus":
      return {
        content: { x: 6, y: 10, width: 54, height: 80 },
        ...(hasImage ? { image: { x: 64, y: 10, width: 30, height: 80 } } : {}),
      };
    case "twoColumn":
      return {
        content: { x: 6, y: 8, width: 88, height: 84 },
        ...(hasImage ? { image: { x: 60, y: 58, width: 34, height: 34 } } : {}),
      };
    case "titleBody":
    case "titleBullets":
    default:
      return {
        content: { x: 6, y: 8, width: 88, height: 84 },
        ...(hasImage ? { image: { x: 60, y: 54, width: 34, height: 38 } } : {}),
      };
  }
}
