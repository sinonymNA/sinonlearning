import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getOrCreatePracticeProgress, findLatestAttemptForModule } from "@/lib/marginsDb";
import { isPracticeCourseId, getPracticeCourse, getPracticeModule } from "@/lib/marginsPracticeCourses";

export const dynamic = "force-dynamic";

// Read-only lookup for the course-map "review a completed check page" flow —
// returns the last recorded attempt for a module the student has already
// moved past. Never grades, never advances progress.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { courseId } = await params;
  if (!isPracticeCourseId(courseId) || !getPracticeCourse(courseId)) {
    return NextResponse.json({ error: "Unknown course." }, { status: 404 });
  }

  const moduleId = request.nextUrl.searchParams.get("moduleId");
  if (!moduleId) {
    return NextResponse.json({ error: "moduleId is required." }, { status: 400 });
  }

  const module_ = getPracticeModule(courseId, moduleId);
  if (!module_) return NextResponse.json({ error: "Unknown module." }, { status: 404 });

  const progress = await getOrCreatePracticeProgress(user.id, courseId);
  if (module_.order > progress.current_module) {
    return NextResponse.json({ error: "You haven't reached this module yet." }, { status: 403 });
  }

  const attempt = await findLatestAttemptForModule(progress.id, moduleId);
  if (!attempt) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    promptId: attempt.prompt_id,
    responseText: attempt.response_text,
    feedback: attempt.feedback,
    passed: attempt.passed,
    skill: attempt.skill,
    scoreLabel: attempt.score_label,
  });
}
