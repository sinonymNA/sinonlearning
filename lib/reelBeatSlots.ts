import { getTemplate } from "./reelTemplates";
import type { Beat, ReelTemplateId } from "./reelTypes";

// Pure, client-safe slot-mapping logic shared by lib/reelKoraGenerate.ts
// (server, builds real Beat rows with a real id) and the KORA Lab's preview
// (client, just needs a Beat to feed the real BeatPreview component — no
// crypto import allowed in client bundles, hence `id` is caller-supplied).

export type ReelSlotKey = "text1" | "text2" | "text3" | "text4" | "text5" | "items";

// Which generic slot (see lib/reelAiTypes.ts) holds each template's real param,
// per template_id. A beat only ever uses one template, so slot reuse across
// templates never collides.
export const REEL_SLOT_MAP: Record<string, Record<string, ReelSlotKey>> = {
  titleCard: { headline: "text1", subtitle: "text2" },
  bulletReveal: { heading: "text1", bullets: "items" },
  imageCaption: { caption: "text1" },
  labeledDiagram: { centerLabel: "text1", labels: "items" },
  beforeAfter: { leftTitle: "text1", leftBody: "text2", rightTitle: "text3", rightBody: "text4", arrowLabel: "text5" },
  timeline: { events: "items" },
  simpleGraph: { xLabel: "text1", yLabel: "text2", trend: "text3", caption: "text4" },
  statCallout: { stat: "text1", label: "text2", context: "text3" },
  quote: { quote: "text1", attribution: "text2" },
  comparisonList: { leftTitle: "text1", rightTitle: "text2", items: "items" },
  numberedSteps: { heading: "text1", steps: "items" },
};

export interface ReelSlotSource {
  template_id: ReelTemplateId;
  text1?: string;
  text2?: string;
  text3?: string;
  text4?: string;
  text5?: string;
  items?: string[];
  narration?: string;
  animation_seconds?: number;
  image_query?: string;
}

function mapReelSlotsToParams(b: ReelSlotSource): Record<string, string | string[]> {
  const template = getTemplate(b.template_id);
  const slots: Record<string, string | string[] | undefined> = {
    text1: b.text1,
    text2: b.text2,
    text3: b.text3,
    text4: b.text4,
    text5: b.text5,
    items: b.items,
  };
  const slotMap = REEL_SLOT_MAP[b.template_id] ?? {};
  const params: Record<string, string | string[]> = {};
  for (const p of template.params) {
    const slotKey = slotMap[p.key];
    const v = slotKey ? slots[slotKey] : undefined;
    if (p.kind === "list") {
      params[p.key] = Array.isArray(v) && v.length ? v : [""];
    } else {
      params[p.key] = typeof v === "string" ? v : "";
    }
  }
  return params;
}

// Builds a full Beat (minus id, which the caller supplies — a real UUID in
// production, a simple index for an ephemeral preview) from KORA's flat
// generic-slot beat output.
export function buildBeatFromSlots(b: ReelSlotSource, id: string): Beat {
  const template = getTemplate(b.template_id);
  const seconds = Number.isFinite(b.animation_seconds)
    ? Math.min(30, Math.max(2, Math.round(b.animation_seconds!)))
    : template.defaultSeconds;
  return {
    id,
    templateId: b.template_id,
    params: mapReelSlotsToParams(b),
    imageId: template.usesImage ? null : undefined,
    imageQuery: template.usesImage ? b.image_query : undefined,
    narration: b.narration ?? "",
    animationSeconds: seconds,
    audioId: null,
  };
}
