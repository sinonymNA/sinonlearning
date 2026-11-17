import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById, isStudentInClass } from "@/lib/marginsDb";
import {
  getPublishedLearningAssignment,
  getOrCreateAssessmentAttempt,
  saveAssessmentAnswers,
  submitAssessment,
  createRemediation,
} from "@/lib/marginsLearningLabDb";
import { createInitialRemediationState, scoreAssessment } from "@/lib/marginsLearningLab";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { assignmentId } = await params;
  const assignment = await getPublishedLearningAssignment(assignmentId);
  if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  const cls = await getClassById(assignment.classId);
  if (!cls || !(await isStudentInClass(cls.id, user.id))) {
    return NextResponse.json({ error: "Not authorized for this class." }, { status: 403 });
  }
  const attempt = await getOrCreateAssessmentAttempt(assignment, user.id);
  let body: { answers?: Record<string, string>; submit?: boolean };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const answers = body.answers ?? attempt.answers ?? {};
  if (!body.submit) {
    const saved = await saveAssessmentAnswers(attempt.id, user.id, answers);
    return NextResponse.json({ attempt: saved });
  }
  const result = scoreAssessment(assignment, answers);
  const submitted = await submitAssessment(attempt.id, user.id, result);
  if (!submitted) return NextResponse.json({ error: "Assessment already submitted." }, { status: 409 });
  const state = createInitialRemediationState({
    assignment,
    studentId: user.id,
    originalAnswers: answers,
  });
  const remediation = await createRemediation(attempt.id, state);
  return NextResponse.json({
    attempt: submitted,
    remediation,
    originalScore: { score: result.score, maxScore: result.maxScore },
  });
}
