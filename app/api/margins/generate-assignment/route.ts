import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { AssignmentGenerateSchema } from "@/lib/marginsGradingTypes";
import type { EssayType } from "@/lib/marginsRubrics";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, drafting AP World History: Modern essay prompts. " +
  "Return a single JSON object matching the schema exactly. No prose, no markdown outside the JSON. " +
  "CRITICAL SAFETY RULE: you must NEVER invent, fabricate, or write text presented as a real historical " +
  "primary source document, quote, or excerpt. For DBQ, do not write document content — only the essay " +
  "prompt/title and, optionally, a list of real, general topics or source types (e.g. 'a colonial trade " +
  "ledger', 'a speech by a nationalist leader') the teacher should go find and add themselves. Fabricated " +
  "primary sources presented as real would mis-teach students preparing for an actual exam — this rule is " +
  "never optional.";

const ESSAY_TYPES: EssayType[] = ["DBQ", "LEQ", "SAQ"];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`margins-generate-assignment:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
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

  const typeInstructions: Record<EssayType, string> = {
    DBQ: "Write a DBQ-style prompt asking students to develop an argument, evaluated using documents. " +
      "Do NOT write any document text. Include 6-7 suggested_document_topics (real topic/source-type " +
      "suggestions, not invented quotes) the teacher should source themselves.",
    LEQ: "Write an LEQ-style prompt using a historical reasoning skill (comparison, causation, or " +
      "continuity/change) appropriate to the topic. No documents needed — omit suggested_document_topics.",
    SAQ: "Write an SAQ-style prompt with three labeled parts (a, b, c), each asking students to identify, " +
      "explain, or compare ONE specific thing. No documents needed — omit suggested_document_topics.",
  };

  const userMessage = [
    `Essay Type: ${essayType}`,
    `Topic/Unit: ${topic}`,
    `\nTask: ${typeInstructions[essayType]}`,
    `\nSet essay_type to "${essayType}".`,
  ].join("\n");

  try {
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
      schema: AssignmentGenerateSchema,
    });
    return NextResponse.json({ assignment: data });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid assignment structure." }, { status: 422 });
    }
    console.error("[margins/generate-assignment] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }
}
