import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getSubmissionById, getAssignmentById, getClassById, finalizeGrading } from "@/lib/marginsDb";

interface FinalizeRow {
  category: string;
  points_earned: number;
  points_possible: number;
  justification?: string;
}

// The only route that can ever make a grade official. It requires the
// teacher's own score for every rubric row — KORA's suggestions never reach
// this endpoint on their own, and a single aggregate number is not accepted
// in place of the per-row breakdown.
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
  if (!assignment || !cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: { rubricBreakdown?: FinalizeRow[]; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rubricBreakdown = body.rubricBreakdown;
  if (!Array.isArray(rubricBreakdown) || rubricBreakdown.length === 0) {
    return NextResponse.json({ error: "A score for every rubric row is required." }, { status: 400 });
  }

  // Every rubric category on the assignment must have an active teacher
  // choice — this is what makes "the teacher must choose every rubric point"
  // an enforced rule rather than a UI suggestion.
  const requiredCategories = new Set(assignment.rubric.map((r) => r.category));
  const providedCategories = new Set(rubricBreakdown.map((r) => r.category));
  if (requiredCategories.size !== providedCategories.size || [...requiredCategories].some((c) => !providedCategories.has(c))) {
    return NextResponse.json({ error: "A score for every rubric row is required." }, { status: 400 });
  }
  for (const row of rubricBreakdown) {
    if (typeof row.points_earned !== "number" || row.points_earned < 0 || row.points_earned > row.points_possible) {
      return NextResponse.json({ error: "Invalid rubric score." }, { status: 400 });
    }
  }

  const normalizedBreakdown = rubricBreakdown.map((row) => ({ ...row, justification: row.justification ?? "" }));
  const grading = await finalizeGrading(submissionId, normalizedBreakdown, body.notes ?? "");
  if (!grading) return NextResponse.json({ error: "No KORA evaluation found for this submission." }, { status: 404 });

  return NextResponse.json({ grading });
}
