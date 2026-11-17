import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getPublishedLearningAssignment,
  getRemediationByAttempt,
  updateRemediation,
  recordLearningEvidence,
} from "@/lib/marginsLearningLabDb";
import { getStageNumber, type LearningStatus } from "@/lib/marginsLearningLab";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { attemptId } = await params;
  const remediation = await getRemediationByAttempt(attemptId);
  if (!remediation || remediation.state.studentId !== user.id) {
    return NextResponse.json({ error: "Remediation not found." }, { status: 404 });
  }
  if (remediation.state.stage !== "practice" || !remediation.state.currentQuestionId) {
    return NextResponse.json({ error: "Fresh practice is not available at this stage." }, { status: 409 });
  }

  let body: { answer?: string; requiredSupport?: boolean };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const assignment = await getPublishedLearningAssignment(remediation.state.assignmentId);
  const question = assignment?.questions.find((item) => item.id === remediation.state.currentQuestionId);
  const fresh = question?.freshPractice;
  if (!fresh || !body.answer) {
    return NextResponse.json({ error: "This question has no fresh practice item." }, { status: 422 });
  }

  const correct = body.answer === fresh.correctAnswer;
  const requiredSupport = body.requiredSupport === true;
  const status: LearningStatus = correct
    ? requiredSupport ? "demonstrated_with_support" : "demonstrated_independently"
    : "improving";
  const nextState = {
    ...remediation.state,
    stage: correct ? "verify" : "teach",
    practiceResults: [
      ...remediation.state.practiceResults,
      { questionId: remediation.state.currentQuestionId, correct, requiredSupport },
    ],
    statuses: { ...remediation.state.statuses, [remediation.state.currentQuestionId]: status },
    updatedAt: new Date().toISOString(),
  } as typeof remediation.state;
  const updated = await updateRemediation(remediation.id, user.id, nextState);
  const evidence = await recordLearningEvidence(remediation.id, remediation.state.currentQuestionId, "practice", {
    answer: body.answer,
    correct,
    requiredSupport,
    status,
    nextStage: nextState.stage,
    stageNumber: getStageNumber("practice"),
  });
  return NextResponse.json({ correct, status, remediation: updated, evidence });
}
