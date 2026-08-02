import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getSubmissionById,
  getAssignmentById,
  getAttemptCount,
  createRevisionSubmission,
} from "@/lib/marginsDb";

export async function POST(
  _request: Request,
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
  if (submission.status !== "evaluated" && submission.status !== "graded") {
    return NextResponse.json({ error: "This essay doesn't have feedback yet." }, { status: 400 });
  }

  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

  const attemptsUsed = (await getAttemptCount(assignment.id, user.id)) - 1;
  if (attemptsUsed >= assignment.max_revisions) {
    return NextResponse.json({ error: "You've used all your revisions for this assignment." }, { status: 409 });
  }

  const revision = await createRevisionSubmission(submissionId);
  return NextResponse.json({ submission: revision });
}
