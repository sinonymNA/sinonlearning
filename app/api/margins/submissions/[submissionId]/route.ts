import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getSubmissionById, updateSubmissionText, getAssignmentById, getClassById } from "@/lib/marginsDb";

async function authorize(submissionId: string, requireOwner: boolean) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Not authorized." }, { status: 401 }) };

  const submission = await getSubmissionById(submissionId);
  if (!submission) return { error: NextResponse.json({ error: "Submission not found." }, { status: 404 }) };

  if (requireOwner) {
    if (user.id !== submission.student_id) {
      return { error: NextResponse.json({ error: "Not authorized." }, { status: 403 }) };
    }
    return { user, submission };
  }

  if (user.id === submission.student_id) return { user, submission };
  const assignment = await getAssignmentById(submission.assignment_id);
  const cls = assignment ? await getClassById(assignment.class_id) : undefined;
  if (user.role === "teacher" && cls?.teacher_id === user.id) return { user, submission };
  return { error: NextResponse.json({ error: "Not authorized." }, { status: 403 }) };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const auth = await authorize(submissionId, false);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ submission: auth.submission });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const auth = await authorize(submissionId, true);
  if ("error" in auth) return auth.error;

  if (auth.submission.status !== "draft") {
    return NextResponse.json({ error: "This essay has already been submitted." }, { status: 409 });
  }

  let body: { essayText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updated = await updateSubmissionText(submissionId, body.essayText ?? "");
  return NextResponse.json({ submission: updated });
}
