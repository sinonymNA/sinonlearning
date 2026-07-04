import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getSubmissionById, getAssignmentById, getClassById, overrideGrading } from "@/lib/marginsDb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { submissionId } = await params;
  const submission = await getSubmissionById(submissionId);
  if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });

  const assignment = await getAssignmentById(submission.assignment_id);
  const cls = assignment ? await getClassById(assignment.class_id) : undefined;
  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: { overrideScore?: number; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body.overrideScore !== "number") {
    return NextResponse.json({ error: "overrideScore is required." }, { status: 400 });
  }

  const grading = await overrideGrading(submissionId, body.overrideScore, body.notes ?? "");
  if (!grading) return NextResponse.json({ error: "No grading found for this submission." }, { status: 404 });

  return NextResponse.json({ grading });
}
