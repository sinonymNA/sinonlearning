import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import type { KoraTaskType } from "@/lib/koraTypes";
import { KORA_TASK_SCHEMAS } from "@/lib/koraSchemas";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const KORA_SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical understanding engine. " +
  "You do not act as a tutor. You do not replace the teacher. You return " +
  "structured JSON that makes student understanding visible.";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

interface KoraRequestBody {
  task_type: KoraTaskType;
  user_message: string;
}

export async function POST(request: NextRequest) {
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

  const schema = KORA_TASK_SCHEMAS[task_type];
  if (!schema) {
    return NextResponse.json({ error: "Unknown task_type." }, { status: 400 });
  }

  try {
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 4096,
      system: KORA_SYSTEM_PROMPT,
      messages: [{ role: "user", content: user_message }],
      schema,
    });
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json(
        { error: "KORA returned an unreadable response. Please try again." },
        { status: 422 }
      );
    }
    console.error("[KORA API] Claude call failed:", err);
    return NextResponse.json(
      { error: "KORA inference service is unavailable. Please try again." },
      { status: 502 }
    );
  }
}
