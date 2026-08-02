import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getSubmissionById,
  getAssignmentById,
  getClassById,
  getGradingBySubmission,
  getRevisionPlanBySubmission,
  createRevisionPlan,
} from "@/lib/marginsDb";
import { generateRevisionPlan } from "@/lib/marginsKoraGenerate";
import { KoraConfigError, KoraValidationError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 12;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  let body: { submissionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const submissionId = body.submissionId;
  if (!submissionId) return NextResponse.json({ error: "submissionId is required." }, { status: 400 });

  const submission = await getSubmissionById(submissionId);
  if (!submission) return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  if (user.id !== submission.student_id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  if (submission.status !== "evaluated" && submission.status !== "graded") {
    return NextResponse.json({ error: "This submission doesn't have feedback yet." }, { status: 400 });
  }

  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

  const grading = await getGradingBySubmission(submissionId);
  if (!grading) return NextResponse.json({ error: "This submission doesn't have feedback yet." }, { status: 400 });

  // Idempotent: return the existing plan rather than regenerating it, so
  // refreshing the wizard's entry page doesn't burn another LLM call.
  const existingPlan = await getRevisionPlanBySubmission(submissionId);
  if (existingPlan) return NextResponse.json({ plan: existingPlan });

  const ip = getClientIp(request);
  if (isRateLimited(`margins-revision-coach:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  try {
    const { output } = await generateRevisionPlan({
      essayType: assignment.essay_type,
      promptText: assignment.prompt_text,
      rubric: assignment.rubric,
      essayText: submission.essay_text,
      nextSteps: grading.next_steps,
    });
    const plan = await createRevisionPlan(submissionId, output.steps);
    return NextResponse.json({ plan });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid revision plan." }, { status: 422 });
    }
    console.error("[margins/revision-coach] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }
}
