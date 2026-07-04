import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getSubmissionById, markSubmissionSubmitted } from "@/lib/marginsDb";

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
  if (submission.status !== "draft") {
    return NextResponse.json({ error: "This essay has already been submitted." }, { status: 409 });
  }
  if (!submission.essay_text.trim()) {
    return NextResponse.json({ error: "Write something before submitting." }, { status: 400 });
  }

  const updated = await markSubmissionSubmitted(submissionId);
  return NextResponse.json({ submission: updated });
}
