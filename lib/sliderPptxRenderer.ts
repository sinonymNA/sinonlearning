import type PptxGenJS from "pptxgenjs";
import type { Slide } from "./sliderTypes";
import type { SliderTheme } from "./sliderThemes";

function hex(color: string): string {
  return color.replace("#", "");
}

function addHeader(
  pptxSlide: PptxGenJS.Slide,
  title: string | undefined,
  theme: SliderTheme
): void {
  pptxSlide.addText(title || "", {
    x: "6%",
    y: "6%",
    w: "88%",
    h: "14%",
    fontSize: 26,
    bold: true,
    valign: "middle",
    fontFace: theme.fonts.heading,
    color: hex(theme.colors.heading),
  });
  pptxSlide.addShape("rect", {
    x: "6%",
    y: "20%",
    w: "20%",
    h: 0.04,
    fill: { color: hex(theme.colors.accent) },
    line: { type: "none" },
  });
}

// Mirrors components/slider/SlideRenderer.tsx's layout switch — same Slide +
// SliderTheme data, same positions, so the exported file matches the preview.
export function renderSlideToPptx(
  pptx: PptxGenJS,
  slide: Slide,
  theme: SliderTheme,
  imageDataUri?: string | null
): void {
  const pptxSlide = pptx.addSlide();
  pptxSlide.background = { color: hex(theme.colors.background) };

  const headingFont = { fontFace: theme.fonts.heading, color: hex(theme.colors.heading) };
  const bodyFont = { fontFace: theme.fonts.body, color: hex(theme.colors.body) };

  switch (slide.layout) {
    case "title":
      pptxSlide.addText(slide.title || "", {
        x: "5%",
        y: "36%",
        w: "90%",
        h: "22%",
        fontSize: 40,
        bold: true,
        align: "center",
        valign: "middle",
        ...headingFont,
      });
      if (slide.subtitle) {
        pptxSlide.addText(slide.subtitle, {
          x: "10%",
          y: "58%",
          w: "80%",
          h: "10%",
          fontSize: 18,
          align: "center",
          valign: "top",
          ...bodyFont,
        });
      }
      break;

    case "titleBody":
      addHeader(pptxSlide, slide.title, theme);
      pptxSlide.addText(slide.body || "", {
        x: "6%",
        y: "26%",
        w: "88%",
        h: "64%",
        fontSize: 18,
        valign: "top",
        ...bodyFont,
      });
      break;

    case "titleBullets":
      addHeader(pptxSlide, slide.title, theme);
      pptxSlide.addText(
        (slide.bullets ?? [])
          .filter((b) => b.trim())
          .map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        { x: "6%", y: "26%", w: "88%", h: "64%", fontSize: 18, valign: "top", ...bodyFont }
      );
      break;

    case "twoColumn":
      addHeader(pptxSlide, slide.title, theme);
      pptxSlide.addText(slide.columns?.[0] || "", {
        x: "6%",
        y: "26%",
        w: "42%",
        h: "64%",
        fontSize: 16,
        valign: "top",
        ...bodyFont,
      });
      pptxSlide.addText(slide.columns?.[1] || "", {
        x: "52%",
        y: "26%",
        w: "42%",
        h: "64%",
        fontSize: 16,
        valign: "top",
        ...bodyFont,
      });
      break;

    case "titleImageBody": {
      addHeader(pptxSlide, slide.title, theme);
      const hasImage = Boolean(imageDataUri);
      if (imageDataUri) {
        pptxSlide.addImage({ data: imageDataUri, x: "6%", y: "26%", w: "40%", h: "64%" });
      }
      pptxSlide.addText(slide.body || "", {
        x: hasImage ? "50%" : "6%",
        y: "26%",
        w: hasImage ? "44%" : "88%",
        h: "64%",
        fontSize: 16,
        valign: "top",
        ...bodyFont,
      });
      break;
    }

    case "imageFull":
      if (imageDataUri) {
        pptxSlide.addImage({ data: imageDataUri, x: 0, y: 0, w: "100%", h: "100%" });
      }
      if (slide.title) {
        pptxSlide.addShape("rect", {
          x: 0,
          y: "84%",
          w: "100%",
          h: "16%",
          fill: { color: "000000", transparency: 30 },
          line: { type: "none" },
        });
        pptxSlide.addText(slide.title, {
          x: "5%",
          y: "86%",
          w: "90%",
          h: "12%",
          fontSize: 22,
          bold: true,
          color: "FFFFFF",
          valign: "middle",
        });
      }
      break;

    case "quote":
      pptxSlide.addText(slide.quoteText ? `“${slide.quoteText}”` : "", {
        x: "10%",
        y: "28%",
        w: "80%",
        h: "40%",
        fontSize: 28,
        italic: true,
        align: "center",
        valign: "middle",
        ...headingFont,
      });
      if (slide.quoteAttribution) {
        pptxSlide.addText(`— ${slide.quoteAttribution}`, {
          x: "10%",
          y: "70%",
          w: "80%",
          h: "10%",
          fontSize: 16,
          align: "center",
          ...bodyFont,
        });
      }
      break;
  }

  if (slide.notes) {
    pptxSlide.addNotes(slide.notes);
  }
}
