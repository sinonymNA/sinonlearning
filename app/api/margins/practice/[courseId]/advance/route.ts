import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getOrCreatePracticeProgress, advancePracticeProgress } from "@/lib/marginsDb";
import { isPracticeCourseId, getPracticeCourse, getPracticeModule } from "@/lib/marginsPracticeCourses";

export const dynamic = "force-dynamic";

// Moves a student past a lesson page — no grading, no AI call. Check pages
// (the last page in every module) only ever advance via /check, on a pass.
export async function POST(
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

  let body: { moduleId?: string; fromPage?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { moduleId, fromPage } = body;
  if (!moduleId || typeof fromPage !== "number") {
    return NextResponse.json({ error: "moduleId and fromPage are required." }, { status: 400 });
  }

  const module_ = getPracticeModule(courseId, moduleId);
  if (!module_) return NextResponse.json({ error: "Unknown module." }, { status: 404 });

  const page = module_.pages[fromPage];
  if (!page || page.kind !== "lesson") {
    return NextResponse.json({ error: "That page can't be advanced this way." }, { status: 400 });
  }

  const progress = await getOrCreatePracticeProgress(user.id, courseId);
  if (module_.order !== progress.current_module || fromPage !== progress.current_page) {
    return NextResponse.json({ error: "Your progress is out of sync — refresh and try again." }, { status: 409 });
  }

  const updated = await advancePracticeProgress(progress.id, module_.order, fromPage + 1);
  return NextResponse.json({ progress: updated });
}
