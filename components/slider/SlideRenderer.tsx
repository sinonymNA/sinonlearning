import type { Slide } from "@/lib/sliderTypes";
import type { SliderTheme } from "@/lib/sliderThemes";

interface Props {
  slide: Slide;
  theme: SliderTheme;
  className?: string;
}

// Pure, presentational — mirrors lib/sliderPptxRenderer.ts's layout switch and
// percentage positions exactly, so the live preview matches the exported file.
export default function SlideRenderer({ slide, theme, className = "" }: Props) {
  const imageSrc = slide.image?.id ? `/api/slider/images/${slide.image.id}` : null;

  return (
    <div
      className={`relative w-full aspect-video overflow-hidden rounded-lg ${className}`}
      style={{ background: theme.colors.background, containerType: "inline-size" }}
    >
      {slide.layout === "title" && (
        <>
          <div
            className="absolute flex items-center justify-center text-center px-4"
            style={{ top: "36%", left: "5%", width: "90%", height: "22%", color: theme.colors.heading, fontFamily: theme.fonts.heading.css }}
          >
            <p className="font-bold text-[7cqw] leading-tight" style={{ fontSize: "clamp(14px, 5cqw, 40px)" }}>
              {slide.title || "Untitled"}
            </p>
          </div>
          {slide.subtitle && (
            <div
              className="absolute text-center px-4"
              style={{ top: "58%", left: "10%", width: "80%", height: "10%", color: theme.colors.body, fontFamily: theme.fonts.body.css }}
            >
              <p style={{ fontSize: "clamp(10px, 2.2cqw, 18px)" }}>{slide.subtitle}</p>
            </div>
          )}
        </>
      )}

      {(slide.layout === "titleBody" || slide.layout === "titleBullets" || slide.layout === "twoColumn" || slide.layout === "titleImageBody") && (
        <>
          <div
            className="absolute flex items-center"
            style={{ top: "6%", left: "6%", width: "88%", height: "14%", color: theme.colors.heading, fontFamily: theme.fonts.heading.css }}
          >
            <p className="font-bold" style={{ fontSize: "clamp(12px, 3.2cqw, 26px)" }}>{slide.title || "Untitled"}</p>
          </div>
          <div className="absolute" style={{ top: "20%", left: "6%", width: "20%", height: "3px", background: theme.colors.accent }} />
        </>
      )}

      {slide.layout === "titleBody" && (
        <div
          className="absolute overflow-hidden whitespace-pre-wrap"
          style={{ top: "26%", left: "6%", width: "88%", height: "64%", color: theme.colors.body, fontFamily: theme.fonts.body.css, fontSize: "clamp(9px, 1.8cqw, 16px)" }}
        >
          {slide.body}
        </div>
      )}

      {slide.layout === "titleBullets" && (
        <ul
          className="absolute list-disc pl-5 overflow-hidden"
          style={{ top: "26%", left: "6%", width: "88%", height: "64%", color: theme.colors.body, fontFamily: theme.fonts.body.css, fontSize: "clamp(9px, 1.8cqw, 16px)" }}
        >
          {(slide.bullets ?? []).filter((b) => b.trim()).map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}

      {slide.layout === "twoColumn" && (
        <>
          <div
            className="absolute overflow-hidden whitespace-pre-wrap"
            style={{ top: "26%", left: "6%", width: "42%", height: "64%", color: theme.colors.body, fontFamily: theme.fonts.body.css, fontSize: "clamp(9px, 1.6cqw, 14px)" }}
          >
            {slide.columns?.[0]}
          </div>
          <div
            className="absolute overflow-hidden whitespace-pre-wrap"
            style={{ top: "26%", left: "52%", width: "42%", height: "64%", color: theme.colors.body, fontFamily: theme.fonts.body.css, fontSize: "clamp(9px, 1.6cqw, 14px)" }}
          >
            {slide.columns?.[1]}
          </div>
        </>
      )}

      {slide.layout === "titleImageBody" && (
        <>
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              className="absolute object-cover rounded"
              style={{ top: "26%", left: "6%", width: "40%", height: "64%" }}
            />
          ) : (
            <div
              className="absolute rounded border border-dashed flex items-center justify-center text-[10px]"
              style={{ top: "26%", left: "6%", width: "40%", height: "64%", borderColor: theme.colors.accent, color: theme.colors.body }}
            >
              No image yet
            </div>
          )}
          <div
            className="absolute overflow-hidden whitespace-pre-wrap"
            style={{
              top: "26%",
              left: imageSrc ? "50%" : "6%",
              width: imageSrc ? "44%" : "88%",
              height: "64%",
              color: theme.colors.body,
              fontFamily: theme.fonts.body.css,
              fontSize: "clamp(9px, 1.6cqw, 16px)",
            }}
          >
            {slide.body}
          </div>
        </>
      )}

      {slide.layout === "imageFull" && (
        <>
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[11px]" style={{ color: theme.colors.body }}>
              No image yet
            </div>
          )}
          {slide.title && (
            <div className="absolute flex items-center px-4" style={{ top: "84%", left: 0, width: "100%", height: "16%", background: "rgba(0,0,0,0.55)" }}>
              <p className="font-bold text-white" style={{ fontSize: "clamp(11px, 2.4cqw, 22px)" }}>{slide.title}</p>
            </div>
          )}
        </>
      )}

      {slide.layout === "quote" && (
        <>
          <div
            className="absolute flex items-center justify-center text-center px-8"
            style={{ top: "28%", left: "10%", width: "80%", height: "40%", color: theme.colors.heading, fontFamily: theme.fonts.heading.css }}
          >
            <p className="italic font-semibold" style={{ fontSize: "clamp(12px, 3cqw, 26px)" }}>
              {slide.quoteText ? `“${slide.quoteText}”` : ""}
            </p>
          </div>
          {slide.quoteAttribution && (
            <div
              className="absolute text-center"
              style={{ top: "70%", left: "10%", width: "80%", height: "10%", color: theme.colors.body, fontFamily: theme.fonts.body.css }}
            >
              <p style={{ fontSize: "clamp(10px, 2cqw, 16px)" }}>— {slide.quoteAttribution}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
