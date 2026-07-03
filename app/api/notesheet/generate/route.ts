import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { NotesheetPlanSchema } from "@/lib/notesheetTypes";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical understanding engine. " +
  "You do not act as a tutor. You return structured JSON that makes student understanding visible. " +
  "When asked to generate a notesheet plan, you return a JSON object matching the exact schema provided. " +
  "Never add prose or markdown outside the JSON.";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

function sectionCountRange(targetPages: number): string {
  if (targetPages <= 1) return "4-6";
  if (targetPages === 2) return "6-9";
  if (targetPages === 3) return "9-13";
  return "12-16";
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
    `Concept: ${concept}`,
    `Subject: ${subject}`,
    `Grade Band: ${gradeBand}`,
    `Target length: ${targetPages} printed page${targetPages === 1 ? "" : "s"} — design ${countRange} sections that together fill approximately ${targetPages} page${targetPages === 1 ? "" : "s"} when rendered. Shorter prompts and fewer blank lines for shorter targets.`,
    `\nSlideshow Content:\n${rawText.slice(0, 6000)}`,
    `\nTask: Analyze this slideshow and return a structured notesheet plan as JSON. The plan tells students what to write, in what format, with what prompts. Do not write the notesheet yourself — return a plan that the system will render.`,
    `\nReturn a JSON object with this exact schema:`,
    `{`,
    `  "concept": string,`,
    `  "title": string,`,
    `  "grade_band": string,`,
    `  "subject": string,`,
    `  "learning_objective": string,`,
    `  "essential_question": string,`,
    `  "sections": [`,
    `    {`,
    `      "id": string (unique, like "s1"),`,
    `      "type": "warmup_box"|"fill_blank"|"numbered_response"|"content_box"|"two_column_box"|"drawing_box"|"three_column_box",`,
    `      "heading": string (optional section title),`,
    `      "content": string (teacher-facing description of this section's purpose),`,
    `      "student_prompt": string (text shown to student),`,
    `      "answer_key_notes": string (what a strong answer includes, for teacher key),`,
    `      "num_lines": number (optional, for numbered_response — how many items),`,
    `      "columns": [{header, width_pct, prefilled}] (optional, for two/three_column_box)`,
    `    }`,
    `  ]`,
    `}`,
    `\nSection type guidance:`,
    `- warmup_box: open-ended warm-up or activating question, student writes freely`,
    `- fill_blank: a sentence or definition with blanks the student fills in`,
    `- numbered_response: a numbered list where students fill in each item (set num_lines)`,
    `- content_box: teacher-written explanatory content, no student writing (use sparingly)`,
    `- two_column_box: two columns, e.g. Term | Definition; left column prefilled`,
    `- drawing_box: student draws a diagram, graph, or visual representation`,
    `- three_column_box: three columns, e.g. Concept | Example | Why It Works`,
    `\nInclude ${countRange} sections. Start with a warmup_box. Mix section types thoughtfully based on the content.`,
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
      max_tokens: 4096,
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
