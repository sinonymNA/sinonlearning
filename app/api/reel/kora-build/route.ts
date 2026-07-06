import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { createReelProject } from "@/lib/reelDb";
import { REEL_TEMPLATES, getTemplate } from "@/lib/reelTemplates";
import type { Beat } from "@/lib/reelTypes";
import { ReelBuildSchema, type ReelBeatOutput } from "@/lib/reelAiTypes";
import { callKoraStructured, KoraConfigError, KoraValidationError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 15;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, scripting a short classroom EXPLAINER VIDEO in the Reel app " +
  "from a short conversation with a teacher. The video is narrated by the teacher over clean animated slides — " +
  "think a calm, well-paced explainer, not a lecture. You write the SCRIPT as a sequence of short 'beats'. Each " +
  "beat is ONE on-screen animation chosen from a fixed set of templates, plus the exact narration the teacher " +
  "will read aloud over it. Return a single JSON object matching the schema exactly. No prose, no markdown " +
  "outside the JSON. " +
  "CRITICAL RULES: " +
  "(1) You never write animation code — you only pick a template_id per beat and fill its fields. Only set the " +
  "fields a given template uses (titleCard: headline, subtitle; bulletReveal: heading, bullets; imageCaption: " +
  "caption + image_query). Leave the rest unset. " +
  "(2) For any beat that references a concrete real-world thing (a place, a person, a book, a chart, an object), " +
  "prefer the imageCaption template and set image_query to a short web-image search phrase for it (e.g. 'New York " +
  "Stock Exchange trading floor', 'cover of the book Educated by Tara Westover'). Do NOT invent image URLs or " +
  "describe images you can't guarantee exist — image_query is a SEARCH phrase the teacher will approve. " +
  "(3) narration is the spoken script for that beat: 1-3 natural sentences the teacher reads aloud. Keep on-screen " +
  "text SHORT (headlines a few words; bullets short phrases under ~8 words) — the depth lives in the narration, " +
  "not the slide. " +
  "(4) animation_seconds is a rough on-screen duration (title ~4s, a few bullets ~8s, an image ~6s); the app " +
  "extends each beat to fit the recorded narration, so don't overthink it. " +
  "(5) Build a real arc: open with a titleCard, then alternate concise teaching beats with at least one image, " +
  "and end on a short takeaway. Aim for the requested length.";

function buildUserMessage(answers: {
  topic: string;
  audience: string;
  keyPoints: string;
  length: string;
  notes: string;
}): string {
  const lines = [`Topic: ${answers.topic}`];
  if (answers.audience) lines.push(`Audience: ${answers.audience}`);
  if (answers.keyPoints) lines.push(`Key points to cover: ${answers.keyPoints}`);
  lines.push(`Desired length: ${answers.length}`);
  if (answers.notes) lines.push(`Additional notes from the teacher: ${answers.notes}`);

  lines.push(
    `\nAvailable beat templates (pick one per beat, fill only its fields):`,
    REEL_TEMPLATES.map((t) => `- "${t.id}": ${t.description}`).join("\n"),
    `\nRules:`,
    `1. First beat must be a "titleCard".`,
    `2. Use "imageCaption" (with an image_query) whenever the script names a concrete real thing.`,
    `3. Keep on-screen text short; put the substance in narration (1-3 spoken sentences per beat).`,
    `4. Match the requested length in number of beats.`
  );
  return lines.join("\n");
}

// Map KORA's flat beat output into a full Beat with per-template params.
function toBeat(b: ReelBeatOutput): Beat {
  const template = getTemplate(b.template_id);
  const params: Record<string, string | string[]> = {};
  for (const p of template.params) {
    if (p.key === "headline") params[p.key] = b.headline ?? "";
    else if (p.key === "subtitle") params[p.key] = b.subtitle ?? "";
    else if (p.key === "heading") params[p.key] = b.heading ?? "";
    else if (p.key === "caption") params[p.key] = b.caption ?? "";
    else if (p.key === "bullets") params[p.key] = b.bullets && b.bullets.length ? b.bullets : [""];
    else params[p.key] = p.kind === "list" ? [""] : "";
  }
  const seconds = Number.isFinite(b.animation_seconds)
    ? Math.min(30, Math.max(2, Math.round(b.animation_seconds)))
    : template.defaultSeconds;
  return {
    id: randomUUID(),
    templateId: b.template_id,
    params,
    imageId: template.usesImage ? null : undefined,
    imageQuery: template.usesImage ? b.image_query : undefined,
    narration: b.narration ?? "",
    animationSeconds: seconds,
    audioId: null,
  };
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`reel-kora-build:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { topic?: string; audience?: string; keyPoints?: string; length?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return NextResponse.json({ error: "A topic is required." }, { status: 400 });
  }

  const userMessage = buildUserMessage({
    topic,
    audience: (body.audience ?? "").trim(),
    keyPoints: (body.keyPoints ?? "").trim(),
    length: (body.length ?? "Medium (~8 beats)").trim(),
    notes: (body.notes ?? "").trim(),
  });

  let output;
  try {
    const { data } = await callKoraStructured({
      model: "claude-opus-4-8",
      maxTokens: 8192,
      system: SYSTEM_PROMPT,
      cacheSystemPrompt: true,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: userMessage }],
      schema: ReelBuildSchema,
    });
    output = data;
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid script structure." }, { status: 422 });
    }
    console.error("[reel/kora-build] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }

  const beats = output.beats.map(toBeat);
  const project = await createReelProject({ teacherId: user.id, title: output.title, beats });
  return NextResponse.json({ projectId: project.id });
}
