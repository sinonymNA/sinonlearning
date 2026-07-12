import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAllUnitProgress, markUnitComplete, saveQuizScore } from "@/lib/stockCourseDb";

export const dynamic = "force-dynamic";

const VALID_SLUGS = new Set([
  "unit-1", "unit-2", "unit-3", "unit-4", "unit-5",
  "unit-6", "unit-7", "unit-8", "unit-9", "unit-10", "unit-11",
]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const progress = await getAllUnitProgress(user.id);
  return NextResponse.json({ progress });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const { unitSlug, quizScore } = body;

  if (typeof unitSlug !== "string" || !VALID_SLUGS.has(unitSlug)) {
    return NextResponse.json({ error: "Invalid unitSlug." }, { status: 400 });
  }

  if (typeof quizScore === "number" && Number.isInteger(quizScore) && quizScore >= 0) {
    await saveQuizScore(user.id, unitSlug, quizScore);
  } else {
    await markUnitComplete(user.id, unitSlug);
  }
  return NextResponse.json({ ok: true });
}
