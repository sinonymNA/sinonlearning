"use client";

import { REEL_THEME } from "@/lib/reelTypes";
import type { Beat } from "@/lib/reelTypes";

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="flex-1 rounded-lg border p-4 text-center"
      style={{ borderColor: REEL_THEME.accent, background: REEL_THEME.panel }}
    >
      <div className="text-sm font-bold sm:text-lg" style={{ color: REEL_THEME.accent }}>
        {title}
      </div>
      {body && (
        <div className="mt-1 text-xs sm:text-sm" style={{ color: REEL_THEME.body }}>
          {body}
        </div>
      )}
    </div>
  );
}

// A rough on-canvas approximation of a beat — a guide for the teacher while
// editing. The Manim render (reel_worker/templates.py) is the source of truth
// for the actual video; this only needs to convey layout and content.
export default function BeatPreview({ beat }: { beat: Beat }) {
  const p = beat.params;
  const asText = (v: unknown) => (typeof v === "string" ? v : "");
  const asList = (v: unknown) => (Array.isArray(v) ? v.filter((x) => String(x).trim()) : []);

  return (
    <div
      className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl"
      style={{ background: REEL_THEME.background }}
    >
      {beat.templateId === "titleCard" && (
        <div className="px-8 text-center">
          <div className="text-2xl font-bold sm:text-4xl" style={{ color: REEL_THEME.heading }}>
            {asText(p.headline) || "Headline"}
          </div>
          {asText(p.subtitle) && (
            <div className="mt-3 text-sm sm:text-lg" style={{ color: REEL_THEME.body }}>
              {asText(p.subtitle)}
            </div>
          )}
        </div>
      )}

      {beat.templateId === "bulletReveal" && (
        <div className="w-full px-10">
          <div className="mb-4 text-lg font-bold sm:text-2xl" style={{ color: REEL_THEME.accent }}>
            {asText(p.heading) || "Heading"}
          </div>
          <ul className="space-y-2">
            {(asList(p.bullets).length ? asList(p.bullets) : ["Point one", "Point two"]).slice(0, 5).map((b, i) => (
              <li key={i} className="text-sm sm:text-lg" style={{ color: REEL_THEME.body }}>
                •&nbsp;&nbsp;{b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {beat.templateId === "imageCaption" && (
        <div className="flex flex-col items-center gap-3 px-8">
          {beat.imageId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/reel/images/${beat.imageId}`}
              alt={asText(p.caption)}
              className="max-h-[55%] max-w-[70%] rounded-md object-contain"
            />
          ) : (
            <div
              className="flex h-32 w-56 items-center justify-center rounded-md border border-dashed text-xs"
              style={{ borderColor: REEL_THEME.body, color: REEL_THEME.body }}
            >
              Image goes here
            </div>
          )}
          {asText(p.caption) && (
            <div className="text-center text-sm sm:text-base" style={{ color: REEL_THEME.body }}>
              {asText(p.caption)}
            </div>
          )}
        </div>
      )}

      {beat.templateId === "labeledDiagram" && (
        <div className="grid w-full grid-cols-3 grid-rows-3 place-items-center gap-1 px-8 text-center">
          {(asList(p.labels).length ? asList(p.labels) : ["Label"]).slice(0, 4).map((l, i) => (
            <div
              key={i}
              className="text-xs sm:text-sm"
              style={{
                color: REEL_THEME.body,
                gridColumn: i % 2 === 0 ? 1 : 3,
                gridRow: i < 2 ? 1 : 3,
              }}
            >
              {l}
            </div>
          ))}
          <div
            className="col-start-2 row-start-2 rounded-lg border px-4 py-2 text-sm font-bold sm:text-lg"
            style={{ borderColor: REEL_THEME.accent, color: REEL_THEME.heading }}
          >
            {asText(p.centerLabel) || "Core idea"}
          </div>
        </div>
      )}

      {beat.templateId === "beforeAfter" && (
        <div className="flex w-full items-center justify-center gap-3 px-6">
          <Panel title={asText(p.leftTitle) || "Before"} body={asText(p.leftBody)} />
          <div className="text-xl" style={{ color: REEL_THEME.accent }}>
            →
          </div>
          <Panel title={asText(p.rightTitle) || "After"} body={asText(p.rightBody)} />
        </div>
      )}

      {beat.templateId === "timeline" && (
        <div className="w-full px-8">
          <div className="relative flex items-center justify-between border-t-2 pt-4" style={{ borderColor: REEL_THEME.accent }}>
            {(asList(p.events).length ? asList(p.events) : ["1929: Event"]).slice(0, 5).map((e, i) => {
              const [head, ...rest] = e.split(":");
              return (
                <div key={i} className="max-w-[18%] text-center">
                  <div className="text-xs font-bold sm:text-sm" style={{ color: REEL_THEME.accent }}>
                    {head}
                  </div>
                  {rest.join(":").trim() && (
                    <div className="text-[10px] sm:text-xs" style={{ color: REEL_THEME.body }}>
                      {rest.join(":").trim()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {beat.templateId === "simpleGraph" && (
        <div className="flex w-full flex-col items-center gap-2 px-10">
          <div className="relative h-32 w-full max-w-md border-b-2 border-l-2" style={{ borderColor: REEL_THEME.accent }}>
            <div
              className="absolute bottom-0 left-0 h-full w-full"
              style={{
                background: `linear-gradient(to top right, transparent calc(50% - 2px), ${REEL_THEME.accent} calc(50% - 2px), ${REEL_THEME.accent} calc(50% + 2px), transparent calc(50% + 2px))`,
                transform:
                  asText(p.trend).toLowerCase().includes("down")
                    ? "scaleY(-1)"
                    : asText(p.trend).toLowerCase().includes("flat")
                      ? "none"
                      : "none",
                opacity: asText(p.trend).toLowerCase().includes("flat") ? 0 : 1,
              }}
            />
            {asText(p.trend).toLowerCase().includes("flat") && (
              <div className="absolute left-0 top-1/2 h-[3px] w-full" style={{ background: REEL_THEME.accent }} />
            )}
            <span className="absolute -left-1 -top-5 text-[10px]" style={{ color: REEL_THEME.body }}>
              {asText(p.yLabel)}
            </span>
            <span className="absolute -bottom-5 right-0 text-[10px]" style={{ color: REEL_THEME.body }}>
              {asText(p.xLabel)}
            </span>
          </div>
          {asText(p.caption) && (
            <div className="mt-4 text-center text-sm" style={{ color: REEL_THEME.heading }}>
              {asText(p.caption)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
