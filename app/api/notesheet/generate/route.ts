import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { NotesheetPlanSchema } from "@/lib/notesheetTypes";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. " +
  "Return a single JSON object matching the schema exactly. No prose, no markdown outside the JSON.";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

function sectionCountRange(targetPages: number): string {
  if (targetPages <= 1) return "3-4";
  if (targetPages === 2) return "5-6";
  if (targetPages === 3) return "7-9";
  return "10-12";
}

function buildUserMessage(params: {
  rawText: string;
  concept: string;
  subject: string;
  gradeBand: string;
  targetPages: number;
}): string {
  const { rawText, concept, subject, gradeBand, targetPages } = params;
  const countRange = sectionCountRange(targetPages);
  return [
    `Concept: ${concept} | Subject: ${subject} | Grade: ${gradeBand}`,
    `Target: ${targetPages} printed page${targetPages === 1 ? "" : "s"}.`,
    `Design EXACTLY ${countRange} sections. Every section must fit compactly — keep student_prompt to 1-3 sentences.`,
    `Space budget per section type (approximate): warmup_box=small, fill_blank=small, numbered_response=medium, two_column_box=large, three_column_box=large, drawing_box=large, content_box=small.`,
    `For a ${targetPages}-page sheet, use at most ${targetPages <= 2 ? "1 large section (two_column_box, three_column_box, or drawing_box)" : "2 large sections"}. Prefer warmup_box, fill_blank, and numbered_response for the rest.`,
    `\nSlideshow Content:\n${rawText.slice(0, 5000)}`,
    `\nReturn JSON matching this schema exactly:`,
    `{"concept":string,"title":string,"grade_band":string,"subject":string,"learning_objective":string,"essential_question":string,"sections":[{"id":string,"type":"warmup_box"|"fill_blank"|"numbered_response"|"content_box"|"two_column_box"|"drawing_box"|"three_column_box","heading":string(optional),"content":string,"student_prompt":string,"answer_key_notes":string,"num_lines":number(optional,for numbered_response),"columns":[{"header":string,"width_pct":number,"prefilled":boolean}](optional,for two/three_column_box)}]}`,
    `\nStart with a warmup_box. Mix types to match the content. Output only the JSON.`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`notesheet-generate:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { rawText: string; concept: string; subject: string; gradeBand: string; targetPages?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { rawText, concept, subject, gradeBand, targetPages = 2 } = body;
  if (!rawText || !concept || !subject || !gradeBand) {
    return NextResponse.json(
      { error: "rawText, concept, subject, and gradeBand are required." },
      { status: 400 }
    );
  }

  const clampedPages = Math.max(1, Math.min(4, Math.round(targetPages)));

  let raw = "";
  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage({ rawText, concept, subject, gradeBand, targetPages: clampedPages }),
        },
      ],
    });
    raw = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (err) {
    console.error("[notesheet/generate] Claude call failed:", err);
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    console.error("[notesheet/generate] JSON parse failed. Raw:", raw.slice(0, 500));
    return NextResponse.json({ error: "AI returned an unreadable response." }, { status: 422 });
  }

  const result = NotesheetPlanSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[notesheet/generate] Zod validation failed:", result.error.flatten());
    return NextResponse.json(
      { error: "AI returned an invalid plan structure.", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  return NextResponse.json({ plan: result.data });
}
