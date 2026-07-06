import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { createDeck } from "@/lib/sliderDb";
import { SLIDE_LAYOUTS, type Slide } from "@/lib/sliderTypes";
import { SLIDER_THEMES, DEFAULT_THEME_ID } from "@/lib/sliderThemes";
import { SliderKoraBuildSchema } from "@/lib/sliderAiTypes";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 15;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, helping a teacher build a classroom slideshow in the " +
  "Slider app from a short conversation about their lesson. Write real, substantive educational content for " +
  "each slide — you are not filling in a lesson-plan outline, you are writing the actual words that will " +
  "appear on the slides. Return a single JSON object matching the schema exactly. No prose, no markdown " +
  "outside the JSON. CRITICAL RULES: (1) Never invent a specific citation, statistic, or quote attribution " +
  "presented as verifiably real unless it is common, well-established knowledge for the subject — when " +
  "unsure, write generally rather than fabricate specifics. (2) NEVER include an image field or claim an " +
  "image is attached — Slider always adds images separately after generation; every slide you write must " +
  "stand on its own with text only, even for layouts that have an image region. (3) Build a real narrative " +
  "arc: open with a title slide, close with a memorable summary or reflection (a \"quote\" layout works " +
  "well for a closing line), and use the middle slides to substantively teach the requested key points — " +
  "don't just restate the teacher's list back at them.";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

function buildUserMessage(answers: {
  topic: string;
  audience: string;
  keyPoints: string;
  length: string;
  notes: string;
}): string {
  const lines = [`Topic: ${answers.topic}`];
  if (answers.audience) lines.push(`Audience: ${answers.audience}`);
  lines.push(`Key points to cover: ${answers.keyPoints}`);
  lines.push(`Desired length: ${answers.length}`);
  if (answers.notes) lines.push(`Additional notes from the teacher: ${answers.notes}`);

  lines.push(
    `\nAvailable slide layouts (use a mix, choose what fits each idea):`,
    SLIDE_LAYOUTS.map((l) => `- "${l.value}": ${l.description}`).join("\n"),
    `\nAvailable themes (pick the one that best fits the subject/tone):`,
    SLIDER_THEMES.map((t) => `- "${t.id}": ${t.name}`).join("\n"),
    `\nReturn JSON matching this schema exactly:`,
    `{"deck_title":string,"theme_id":string,"slides":[{"layout":"title"|"titleBody"|"titleBullets"|"twoColumn"|"titleImageBody"|"imageFull"|"quote","title":string(optional),"subtitle":string(optional),"body":string(optional),"bullets":string[](optional),"columns":[string,string](optional),"quoteText":string(optional),"quoteAttribution":string(optional),"notes":string(optional)}]}`,
    `\nRules:`,
    `1. deck_title is a short, specific title for this deck (not just repeating the topic verbatim).`,
    `2. theme_id must be exactly one of the ids listed above.`,
    `3. First slide must use layout "title". Only set the fields that layout actually uses (see the layout descriptions) — omit fields a layout doesn't use.`,
    `4. Match the requested length: Short ~4-5 slides, Medium ~7-9 slides, Long ~11-13 slides.`,
    `5. Never include an "image" field — images are added separately by the teacher after generation.`,
    `6. notes (optional, any layout): 1-2 sentences of speaker notes/talking points for the teacher presenting that slide.`,
    `Output only the JSON.`
  );
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`slider-kora-build:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { topic?: string; audience?: string; keyPoints?: string; length?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim();
  const keyPoints = (body.keyPoints ?? "").trim();
  if (!topic || !keyPoints) {
    return NextResponse.json({ error: "A topic and key points are required." }, { status: 400 });
  }

  const userMessage = buildUserMessage({
    topic,
    audience: (body.audience ?? "").trim(),
    keyPoints,
    length: (body.length ?? "Medium (~8 slides)").trim(),
    notes: (body.notes ?? "").trim(),
  });

  let raw = "";
  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    raw = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (err) {
    console.error("[slider/kora-build] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    console.error("[slider/kora-build] JSON parse failed. Raw:", raw.slice(0, 500));
    return NextResponse.json({ error: "KORA returned an unreadable response." }, { status: 422 });
  }

  const result = SliderKoraBuildSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[slider/kora-build] Zod validation failed:", result.error.flatten());
    return NextResponse.json(
      { error: "KORA returned an invalid slideshow structure.", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const themeId = SLIDER_THEMES.some((t) => t.id === result.data.theme_id) ? result.data.theme_id : DEFAULT_THEME_ID;
  const slides: Slide[] = result.data.slides.map((s) => ({
    id: randomUUID(),
    layout: s.layout,
    title: s.title,
    subtitle: s.subtitle,
    body: s.body,
    bullets: s.bullets,
    columns: s.columns,
    image: null,
    quoteText: s.quoteText,
    quoteAttribution: s.quoteAttribution,
    notes: s.notes,
  }));

  const deck = await createDeck({ teacherId: user.id, title: result.data.deck_title, themeId, slides });
  return NextResponse.json({ deckId: deck.id });
}
