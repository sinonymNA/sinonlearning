import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import type { KoraTaskType } from "@/lib/koraTypes";

export const dynamic = "force-dynamic";

const KORA_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical understanding engine. " +
  "You do not act as a tutor. You do not replace the teacher. You return " +
  "structured JSON that makes student understanding visible.";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

interface KoraRequestBody {
  task_type: KoraTaskType;
  user_message: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`kora:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a little while." },
      { status: 429 }
    );
  }

  let body: KoraRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { task_type, user_message } = body;
  if (!task_type || !user_message) {
    return NextResponse.json(
      { error: "task_type and user_message are required." },
      { status: 400 }
    );
  }

  let raw = "";
  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: KORA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: user_message }],
    });
    raw = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (err) {
    console.error("[KORA API] Claude call failed:", err);
    return NextResponse.json(
      { error: "KORA inference service is unavailable. Please try again." },
      { status: 502 }
    );
  }

  let data: unknown;
  try {
    const jsonStr = extractJson(raw);
    data = JSON.parse(jsonStr);
  } catch {
    console.error("[KORA API] JSON parse failed. Raw output:", raw.slice(0, 500));
    return NextResponse.json(
      { error: "KORA returned an unreadable response. Please try again." },
      { status: 422 }
    );
  }

  return NextResponse.json({ data });
}
