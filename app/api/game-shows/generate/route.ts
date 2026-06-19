import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { isGameShowType } from "@/lib/gameShowTypes";
import { validateGameShowData } from "@/lib/gameShowValidation";
import { buildGenerationPrompt } from "@/lib/gameShowPrompts";

export const dynamic = "force-dynamic";

const MAX_CONTENT_LENGTH = 6000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;

const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI generation isn't set up right now. You can fill in the content manually below." },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "AI generation is busy right now. Please try again in a bit, or fill in the content manually." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const type = body.type;
  const rawContent = typeof body.rawContent === "string" ? body.rawContent.trim() : "";

  if (!isGameShowType(type)) {
    return NextResponse.json({ error: "Unknown game type." }, { status: 400 });
  }
  if (!rawContent) {
    return NextResponse.json({ error: "Please paste in some content first." }, { status: 400 });
  }
  if (rawContent.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `Content is too long (max ${MAX_CONTENT_LENGTH} characters).` },
      { status: 400 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: buildGenerationPrompt(type, rawContent) }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(text));
    } catch {
      return NextResponse.json(
        {
          error:
            "The AI response wasn't in the right format. You can try again or fill in the content manually.",
        },
        { status: 502 }
      );
    }

    const result = validateGameShowData(type, parsed);
    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            "The AI generated content that didn't quite fit the game format. You can try again or fill in the content manually.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: result.data });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return NextResponse.json(
        { error: "AI generation is busy right now. Please try again in a moment." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "AI generation failed. You can always fill in the content manually." },
      { status: 500 }
    );
  }
}
