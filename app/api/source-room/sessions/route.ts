import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { createSession } from "@/lib/sourceRoomDb";
import type { SourceRoomQuestion } from "@/lib/sourceRoomDb";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const {
    sourceText,
    sourceImageUrl,
    sourceLabel,
    sourceCitation,
    questions,
    timerSeconds,
  } = body as {
    sourceText?: string;
    sourceImageUrl?: string;
    sourceLabel?: string;
    sourceCitation?: string;
    questions: SourceRoomQuestion[];
    timerSeconds: number;
  };

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "At least one question is required." }, { status: 400 });
  }

  if (!sourceText && !sourceImageUrl) {
    return NextResponse.json({ error: "A source text or image URL is required." }, { status: 400 });
  }

  const user = await getCurrentUser().catch(() => null);

  const { code, hostToken } = await createSession({
    sourceText,
    sourceImageUrl,
    sourceLabel,
    sourceCitation,
    questions,
    timerSeconds: timerSeconds ?? 180,
    teacherId: user?.id,
  });

  return NextResponse.json({ code, hostToken });
}
