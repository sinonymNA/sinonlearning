import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getRemediationByAttempt,
  updateRemediation,
  recordLearningEvidence,
} from "@/lib/marginsLearningLabDb";
import {
  validateTutorProposal,
  type TutorProposal,
  type LearningStatus,
  type RemediationStage,
} from "@/lib/marginsLearningLab";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { attemptId } = await params;
  const remediation = await getRemediationByAttempt(attemptId);
  if (!remediation || remediation.state.studentId !== user.id) {
    return NextResponse.json({ error: "Remediation not found." }, { status: 404 });
  }
  return NextResponse.json({ remediation });
}

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

  let body: {
    questionId?: string;
    studentMessage?: string;
    proposal?: TutorProposal;
  };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const state = remediation.state;
  if (!body.questionId || body.questionId !== state.currentQuestionId || !body.proposal) {
    return NextResponse.json({ error: "The proposal must target the current remediation question." }, { status: 400 });
  }

  try {
    validateTutorProposal(state.stage, body.proposal);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid tutor transition." }, { status: 422 });
  }

  const nextState = {
    ...state,
    stage: body.proposal.nextStage as RemediationStage,
    supportsUsed: body.proposal.supportUsed
      ? [...state.supportsUsed, body.proposal.supportUsed]
      : state.supportsUsed,
    statuses: body.proposal.status
      ? { ...state.statuses, [body.questionId]: body.proposal.status as LearningStatus }
      : state.statuses,
    explanations: body.studentMessage
      ? { ...state.explanations, [body.questionId]: body.studentMessage }
      : state.explanations,
    updatedAt: new Date().toISOString(),
  };
  const updated = await updateRemediation(remediation.id, user.id, nextState);
  const evidence = await recordLearningEvidence(remediation.id, body.questionId, state.stage, {
    studentMessage: body.studentMessage ?? null,
    tutorMessage: body.proposal.message,
    nextStage: body.proposal.nextStage,
    evidence: body.proposal.evidence,
    supportUsed: body.proposal.supportUsed ?? null,
    status: body.proposal.status ?? null,
  });
  return NextResponse.json({ remediation: updated, evidence });
}
