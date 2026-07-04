import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { RubricGenerateSchema } from "@/lib/marginsGradingTypes";
import { RUBRIC_TEMPLATES, type EssayType } from "@/lib/marginsRubrics";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. You adapt the College Board's official AP World History: " +
  "Modern rubric categories to a specific topic — you do NOT invent new categories or change point totals. " +
  "Return a single JSON object matching the schema exactly. No prose, no markdown outside the JSON.";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

const ESSAY_TYPES: EssayType[] = ["DBQ", "LEQ", "SAQ"];

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });

  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`margins-generate-rubric:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { essayType?: string; topic?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const essayType = body.essayType as EssayType;
  if (!ESSAY_TYPES.includes(essayType)) {
    return NextResponse.json({ error: "essayType must be DBQ, LEQ, or SAQ." }, { status: 400 });
  }
  const topic = (body.topic ?? "").trim();
  if (!topic) return NextResponse.json({ error: "A topic is required." }, { status: 400 });

  const skeleton = RUBRIC_TEMPLATES[essayType];
  const userMessage = [
    `Essay Type: ${essayType}`,
    `Topic/Unit: ${topic}`,
    `\nRequired rubric categories and point values (do not change these):`,
    ...skeleton.map((c) => `- ${c.category}: ${c.points_possible} pt${c.points_possible === 1 ? "" : "s"}`),
    `\nTask: For each category above, write a topic-specific description of exactly what a student must do with "${topic}" content to earn that point — keep the category name and points_possible exactly as given, only customize the description.`,
    `\nReturn JSON matching this schema exactly:`,
    `{"essay_type":"${essayType}","criteria":[{"category":string,"points_possible":number,"description":string}]}`,
    `Output only the JSON.`,
  ].join("\n");

  let raw = "";
  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });
    raw = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (err) {
    console.error("[margins/generate-rubric] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    console.error("[margins/generate-rubric] JSON parse failed. Raw:", raw.slice(0, 500));
    return NextResponse.json({ error: "KORA returned an unreadable response." }, { status: 422 });
  }

  const result = RubricGenerateSchema.safeParse(parsed);
  if (!result.success) {
    return NextResponse.json(
      { error: "KORA returned an invalid rubric structure.", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  return NextResponse.json({ rubric: result.data });
}
