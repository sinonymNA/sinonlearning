import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getOrCreatePracticeProgress, updatePracticeAttemptSelfDiagnosis } from "@/lib/marginsDb";
import { isPracticeCourseId } from "@/lib/marginsPracticeCourses";

export const dynamic = "force-dynamic";

// Fire-and-forget from the client — captures a student's own answer to
// "what's the weakest part of what you just wrote," before Scout's feedback
// is revealed. Never blocks the feedback reveal; a failure here is silent
// from the student's point of view.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { courseId } = await params;
  if (!isPracticeCourseId(courseId)) {
    return NextResponse.json({ error: "Unknown course." }, { status: 404 });
  }

  let body: { attemptId?: string; selfDiagnosisText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { attemptId, selfDiagnosisText } = body;
  if (!attemptId || !selfDiagnosisText || !selfDiagnosisText.trim()) {
    return NextResponse.json({ error: "attemptId and selfDiagnosisText are required." }, { status: 400 });
  }

  // Ownership check: only the attempt belonging to this student's own
  // progress row for this course can be updated.
  const progress = await getOrCreatePracticeProgress(user.id, courseId);
  const updated = await updatePracticeAttemptSelfDiagnosis(attemptId, progress.id, selfDiagnosisText.trim());
  if (!updated) {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
