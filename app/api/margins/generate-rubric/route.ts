import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { RubricGenerateSchema } from "@/lib/marginsGradingTypes";
import { RUBRIC_TEMPLATES, type EssayType } from "@/lib/marginsRubrics";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI. You adapt the College Board's official AP World History: " +
  "Modern rubric categories to a specific topic — you do NOT invent new categories or change point totals.";

const ESSAY_TYPES: EssayType[] = ["DBQ", "LEQ", "SAQ"];

export async function POST(request: NextRequest) {
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
    `\nSet essay_type to "${essayType}".`,
  ].join("\n");

  try {
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 1536,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      schema: RubricGenerateSchema,
    });
    return NextResponse.json({ rubric: data });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid rubric structure." }, { status: 422 });
    }
    console.error("[margins/generate-rubric] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }
}
