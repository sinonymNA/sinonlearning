import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { NotesheetPlanSchema } from "@/lib/notesheetTypes";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. " +
  "Return a single JSON object matching the schema exactly. No prose, no markdown outside the JSON. " +
  "Every student_prompt must be self-contained classroom content — never reference slides, notes, or materials. " +
  "For fill_blank sections, write real sentences with real blanks (___) using facts extracted from the slide content.";

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
  const effectiveConcept = concept.trim() || "infer the main concept from the slide content";
  const effectiveSubject = subject.trim() || "infer from slide content";
  const effectiveGrade = gradeBand.trim() || "infer from slide content";
  return [
    `Concept: ${effectiveConcept} | Subject: ${effectiveSubject} | Grade: ${effectiveGrade}`,
    `Target: ${targetPages} printed page${targetPages === 1 ? "" : "s"}.`,
    `Design EXACTLY ${countRange} sections. Every section must fit compactly — keep student_prompt to 1-3 sentences.`,
    `Space budget per section type (approximate): warmup_box=small, fill_blank=small, numbered_response=medium, two_column_box=large, three_column_box=large, drawing_box=large, content_box=small.`,
    `For a ${targetPages}-page sheet, use at most ${targetPages <= 2 ? "1 large section (two_column_box, three_column_box, or drawing_box)" : "2 large sections"}. Prefer warmup_box, fill_blank, and numbered_response for the rest.`,
    `\nSlideshow Content:\n${rawText.slice(0, 5000)}`,
    `\nRules:`,
    `1. fill_blank: Write real sentences with actual blanks drawn from slide facts. Example student_prompt: "For approximately ___% of human history, humans were ___-___." NEVER write "use the slides", "fill in from the notes", or any meta-instruction. The sentence with blanks IS the student_prompt.`,
    `2. Section types: Use numbered_response ONLY when listing discrete, countable items (e.g. "Name 3 causes"). Use warmup_box for any task asking students to pick one thing and write about it, or any analytical/reflection/sentence-writing task.`,
    `3. num_lines: Set num_lines to match the exact count of items requested (ask for 3 causes → num_lines: 3). If the task is open-ended prose, omit num_lines or use warmup_box.`,
    `4. Cover all key facts from the slides — do not skip major lesson points.`,
    `\nStart with a warmup_box. Mix types to match the content.`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`notesheet-generate:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { rawText: string; concept?: string; subject?: string; gradeBand?: string; targetPages?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { rawText, concept = "", subject = "", gradeBand = "", targetPages = 2 } = body;
  if (!rawText) {
    return NextResponse.json({ error: "rawText is required." }, { status: 400 });
  }

  const clampedPages = Math.max(1, Math.min(4, Math.round(targetPages)));

  try {
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage({ rawText, concept, subject, gradeBand, targetPages: clampedPages }),
        },
      ],
      schema: NotesheetPlanSchema,
    });
    return NextResponse.json({ plan: data });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "AI returned an invalid plan structure." }, { status: 422 });
    }
    console.error("[notesheet/generate] Claude call failed:", err);
    return NextResponse.json({ error: "AI service unavailable. Please try again." }, { status: 502 });
  }
}
