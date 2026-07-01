import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/koraGame";
import type { GameRound } from "@/lib/koraGame";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    concept: string;
    subject: string;
    gradeLevel: string;
    sourceContent: string;
    rounds: GameRound[];
    mode: "teacher-paced" | "student-paced";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { concept, subject, gradeLevel, sourceContent, rounds, mode } = body;
  if (!concept || !rounds?.length) {
    return NextResponse.json({ error: "concept and rounds are required." }, { status: 400 });
  }

  const code = createSession({
    concept,
    subject: subject || "",
    gradeLevel: gradeLevel || "",
    sourceContent: sourceContent || "",
    rounds,
    mode: mode || "student-paced",
  });

  return NextResponse.json({ code });
}
