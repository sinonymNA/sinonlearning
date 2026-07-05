import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getSubmissionById,
  getRevisionPlanBySubmission,
  updateRevisionProgress,
  markRevisionPlanCompleted,
} from "@/lib/marginsDb";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { submissionId } = await params;
  const submission = await getSubmissionById(submissionId);
  if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  if (submission.student_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const plan = await getRevisionPlanBySubmission(submissionId);
  if (!plan) return NextResponse.json({ error: "No revision plan found." }, { status: 404 });

  let body: { currentStep?: number; studentResponses?: string[]; completed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updated = await updateRevisionProgress(
    submissionId,
    body.currentStep ?? plan.current_step,
    body.studentResponses ?? plan.student_responses
  );
  if (body.completed) await markRevisionPlanCompleted(submissionId);

  return NextResponse.json({ plan: updated });
}
