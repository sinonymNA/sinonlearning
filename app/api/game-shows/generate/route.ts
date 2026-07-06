import { NextRequest, NextResponse } from "next/server";
import { isGameShowType, type RacePayload } from "@/lib/gameShowTypes";
import { GAME_SHOW_SCHEMAS } from "@/lib/gameShowSchemas";
import { buildGenerationPrompt } from "@/lib/gameShowPrompts";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const MAX_CONTENT_LENGTH = 6000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 8;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`game-shows-generate:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)) {
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
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 4096,
      messages: [{ role: "user", content: buildGenerationPrompt(type, rawContent) }],
      schema: GAME_SHOW_SCHEMAS[type],
    });

    // Cross-field check the schema can't express: each race question's
    // correctIndex must point at one of its own choices.
    if (type === "race") {
      const race = data as RacePayload;
      const badIndex = race.questions.some((q) => q.correctIndex >= q.choices.length);
      if (badIndex) {
        return NextResponse.json(
          {
            error:
              "The AI generated content that didn't quite fit the game format. You can try again or fill in the content manually.",
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json(
        { error: "AI generation isn't set up right now. You can fill in the content manually below." },
        { status: 503 }
      );
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json(
        {
          error:
            "The AI generated content that didn't quite fit the game format. You can try again or fill in the content manually.",
        },
        { status: 502 }
      );
    }
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
