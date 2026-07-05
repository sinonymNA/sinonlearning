import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getSubmissionById,
  getAssignmentById,
  getClassById,
  createGrading,
  getGradingBySubmission,
} from "@/lib/marginsDb";
import { EssayEvalSchema } from "@/lib/marginsGradingTypes";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 12;

const AP_SKILLS =
  "Contextualization, Comparison, Causation, Continuity and Change Over Time, Argumentation, Use of Evidence";

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, grading AP World History: Modern essays for the " +
  "Margins writing app. You are a rigorous but fair AP reader AND a warm, encouraging writing coach — both at " +
  "once. Score strictly against the rubric given — not a generic impression of essay quality. Your feedback " +
  "must do three things at once: (1) build the student's confidence as a writer by naming real, specific " +
  "strengths in their own words — never generic or empty praise; (2) give simple, concrete, immediately " +
  "actionable critiques — a student should read a next step and know exactly what move to make next, not an " +
  "abstract instruction; (3) build the student's understanding of the discipline by explicitly connecting each " +
  `fix to the broader AP historical-thinking skill it belongs to (${AP_SKILLS}) — the student should leave ` +
  "understanding why the skill matters generally, not just that they lost a point here. Return a single JSON " +
  "object matching the schema exactly. No prose, no markdown outside the JSON. " +
  "CRITICAL: every annotation's \"quote\" field MUST be an exact, verbatim substring copied character-for-character " +
  "from the student's essay — never paraphrase, summarize, or invent a quote. If you cannot find a good verbatim " +
  "excerpt to anchor a point, omit that annotation rather than inventing one. Tag every annotation's \"type\" as " +
  "\"praise\" (a moment worth celebrating) or \"growth\" (room to improve) — never invent a fake growth annotation " +
  "just to have one; a strong essay can be mostly praise. This is a draft grade a teacher will review before it " +
  "counts — be honest and specific, never inflated, but always find the real good in the writing first. " +
  "When grading a resubmission, you will be shown the student's prior attempt's feedback — use it to explicitly " +
  "recognize genuine improvement, reinforcing their growth as a writer.";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

function buildUserMessage(params: {
  essayType: string;
  promptText: string;
  documents: { label: string; source_text: string }[] | null;
  rubric: { category: string; points_possible: number; description: string }[];
  essayText: string;
  priorGrading?: {
    attemptNumber: number;
    overallScore: number;
    maxScore: number;
    nextSteps: { issue: string }[];
  } | null;
}): string {
  const { essayType, promptText, documents, rubric, essayText, priorGrading } = params;
  const lines = [
    `Essay Type: ${essayType}`,
    `Prompt: ${promptText}`,
  ];
  if (documents && documents.length > 0) {
    lines.push("\nSource Documents:");
    documents.forEach((d, i) => lines.push(`Document ${i + 1} (${d.label}): ${d.source_text}`));
  }
  lines.push("\nRubric:");
  rubric.forEach((r) =>
    lines.push(`- ${r.category} (${r.points_possible} pt${r.points_possible === 1 ? "" : "s"}): ${r.description}`)
  );
  if (priorGrading) {
    lines.push(
      `\nPrevious attempt (attempt ${priorGrading.attemptNumber}) feedback:`,
      `Score: ${priorGrading.overallScore}/${priorGrading.maxScore}`,
      `Growth areas identified then: ${priorGrading.nextSteps.map((s) => s.issue).join("; ")}`
    );
  }
  lines.push(`\nStudent Essay:\n${essayText}`);
  lines.push(
    `\nReturn JSON matching this schema exactly:`,
    `{"essay_type":"DBQ"|"LEQ"|"SAQ","overall_score":number,"max_score":number,` +
      `"rubric_breakdown":[{"category":string,"points_earned":number,"points_possible":number,"justification":string}],` +
      `"annotations":[{"quote":string,"category":string,"type":"praise"|"growth","comment":string}],` +
      `"overall_feedback":string,"strengths":string[],` +
      `"next_steps":[{"issue":string,"why_it_matters":string,"how_to_fix":string,"skill":string}]}`,
    `\nRules:`,
    `1. rubric_breakdown must have exactly one row per rubric category given above, in the same order, with the same points_possible.`,
    `2. max_score must equal the sum of points_possible across the rubric.`,
    `3. Annotations: quote must be copied verbatim from the student essay above — no paraphrasing. Aim for 5-10 annotations total, with AT LEAST 2 tagged "praise" regardless of overall essay quality — find real, specific things the student did well (a well-chosen piece of evidence, a clear topic sentence, a genuine attempt at complexity) even in a weak essay. Tag the rest "growth" for moments needing work.`,
    `4. overall_feedback should be 3-5 sentences. Open by naming one specific, genuine strength in this essay (never generic like "good job") before naming the most important area to grow — the student should feel seen, not just graded.`,
    `5. strengths: 2-4 short, specific bullets naming exact things the student did well (specific moves, not vague qualities like "good writing").`,
    `6. next_steps: 2-4 objects, one per growth area, most important first. For each: "issue" is a plain-language restatement of what needs work (1 sentence, no jargon); "why_it_matters" explains why this matters for scoring THIS essay well (1 sentence, concrete); "how_to_fix" is one immediately actionable, concrete move the student can apply on their next draft (e.g. "Add one sentence after your evidence explaining how it proves your thesis" — NOT "use more analysis"); "skill" names the broader AP historical-thinking skill this connects to (one of: ${AP_SKILLS}) so the student sees this as a transferable skill, not a one-off fix.`,
    `7. Never write a "how_to_fix" that supplies actual essay content (a sentence, thesis, or piece of analysis) — describe the MOVE to make, never the words to use. The student must do the writing.` +
      (priorGrading
        ? ` This is a REVISION — the student already received the feedback above and worked through a guided revision process before resubmitting. In overall_feedback, explicitly and specifically acknowledge what they improved compared to their previous attempt (reference the actual change, not a generic "good improvement"). If a previously flagged growth area is still present, treat it gently as an area for continued practice, not a repeated failure.`
        : ""),
    `Output only the JSON.`
  );
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
  }

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

  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

  const cls = await getClassById(assignment.class_id);
  const isOwner = user.id === submission.student_id;
  const isTeacher = user.role === "teacher" && cls?.teacher_id === user.id;
  if (!isOwner && !isTeacher) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (!submission.essay_text.trim()) {
    return NextResponse.json({ error: "This essay is empty." }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`margins-grade:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many grading requests. Try again in an hour." }, { status: 429 });
  }

  let priorGrading = null;
  if (submission.parent_submission_id) {
    const parentGrading = await getGradingBySubmission(submission.parent_submission_id);
    if (parentGrading) {
      priorGrading = {
        attemptNumber: submission.attempt_number - 1,
        overallScore: parentGrading.overall_score,
        maxScore: parentGrading.max_score,
        nextSteps: parentGrading.next_steps,
      };
    }
  }

  let raw = "";
  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage({
            essayType: assignment.essay_type,
            promptText: assignment.prompt_text,
            documents: assignment.documents,
            rubric: assignment.rubric,
            essayText: submission.essay_text,
            priorGrading,
          }),
        },
      ],
    });
    raw = message.content[0].type === "text" ? message.content[0].text : "";
  } catch (err) {
    console.error("[margins/grade] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    console.error("[margins/grade] JSON parse failed. Raw:", raw.slice(0, 500));
    return NextResponse.json({ error: "KORA returned an unreadable response." }, { status: 422 });
  }

  const result = EssayEvalSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[margins/grade] Zod validation failed:", result.error.flatten());
    return NextResponse.json(
      { error: "KORA returned an invalid grading structure.", issues: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const grading = await createGrading({
    submissionId,
    overallScore: result.data.overall_score,
    maxScore: result.data.max_score,
    rubricBreakdown: result.data.rubric_breakdown,
    annotations: result.data.annotations,
    overallFeedback: result.data.overall_feedback,
    strengths: result.data.strengths,
    nextSteps: result.data.next_steps,
  });

  return NextResponse.json({ grading });
}
