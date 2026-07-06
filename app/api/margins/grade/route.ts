import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getSubmissionById,
  getAssignmentById,
  getClassById,
  createGrading,
  getGradingBySubmission,
  getUploadedImage,
} from "@/lib/marginsDb";
import { EssayEvalSchema } from "@/lib/marginsGradingTypes";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

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

type GradingDocument = { label: string; source_text?: string; image_id?: string };

type PriorGrading = {
  attemptNumber: number;
  overallScore: number;
  maxScore: number;
  nextSteps: { issue: string }[];
} | null | undefined;

// Rubric + prior-attempt context + essay text + the JSON-schema/rules tail —
// identical in both the plain-text and multimodal request shapes, so it's
// built once and reused rather than duplicated.
function buildRubricEssayTail(params: {
  rubric: { category: string; points_possible: number; description: string }[];
  essayText: string;
  priorGrading?: PriorGrading;
}): string {
  const { rubric, essayText, priorGrading } = params;
  const lines: string[] = ["\nRubric:"];
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
        : "")
  );
  return lines.join("\n");
}

function buildUserMessage(params: {
  essayType: string;
  promptText: string;
  documents: GradingDocument[] | null;
  rubric: { category: string; points_possible: number; description: string }[];
  essayText: string;
  priorGrading?: PriorGrading;
}): string {
  const { essayType, promptText, documents, rubric, essayText, priorGrading } = params;
  const lines = [`Essay Type: ${essayType}`, `Prompt: ${promptText}`];
  if (documents && documents.length > 0) {
    lines.push("\nSource Documents:");
    documents.forEach((d, i) =>
      lines.push(`Document ${i + 1} (${d.label}):${d.source_text ? ` ${d.source_text}` : ""}`)
    );
  }
  return lines.join("\n") + "\n" + buildRubricEssayTail({ rubric, essayText, priorGrading });
}

// Used when at least one source document carries an uploaded image — sends
// the actual image bytes to Claude instead of grading blind against only the
// caption/transcription text.
async function buildMultimodalContent(params: {
  essayType: string;
  promptText: string;
  documents: GradingDocument[];
  rubric: { category: string; points_possible: number; description: string }[];
  essayText: string;
  priorGrading?: PriorGrading;
}): Promise<Anthropic.Messages.ContentBlockParam[]> {
  const { essayType, promptText, documents, rubric, essayText, priorGrading } = params;
  const parts: Anthropic.Messages.ContentBlockParam[] = [
    { type: "text", text: `Essay Type: ${essayType}\nPrompt: ${promptText}\n\nSource Documents:` },
  ];
  for (let i = 0; i < documents.length; i++) {
    const d = documents[i];
    parts.push({
      type: "text",
      text: `Document ${i + 1} (${d.label}):${d.source_text ? ` ${d.source_text}` : ""}`,
    });
    if (d.image_id) {
      const image = await getUploadedImage(d.image_id);
      if (image) {
        parts.push({
          type: "image",
          source: {
            type: "base64",
            media_type: image.mime_type as "image/png" | "image/jpeg" | "image/gif" | "image/webp",
            data: image.data.toString("base64"),
          },
        });
      }
    }
  }
  parts.push({ type: "text", text: buildRubricEssayTail({ rubric, essayText, priorGrading }) });
  return parts;
}

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

  const hasImageDocuments = (assignment.documents ?? []).some((d) => d.image_id);

  let evaluation;
  try {
    const content = hasImageDocuments
      ? await buildMultimodalContent({
          essayType: assignment.essay_type,
          promptText: assignment.prompt_text,
          documents: assignment.documents ?? [],
          rubric: assignment.rubric,
          essayText: submission.essay_text,
          priorGrading,
        })
      : buildUserMessage({
          essayType: assignment.essay_type,
          promptText: assignment.prompt_text,
          documents: assignment.documents,
          rubric: assignment.rubric,
          essayText: submission.essay_text,
          priorGrading,
        });
    // The highest-stakes call in Margins — runs on Opus with adaptive
    // thinking; the larger token budget leaves room for the thinking pass.
    const { data } = await callKoraStructured({
      model: "claude-opus-4-8",
      maxTokens: 8192,
      system: SYSTEM_PROMPT,
      cacheSystemPrompt: true,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content }],
      schema: EssayEvalSchema,
    });
    evaluation = data;
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid grading structure." }, { status: 422 });
    }
    console.error("[margins/grade] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }

  const grading = await createGrading({
    submissionId,
    overallScore: evaluation.overall_score,
    maxScore: evaluation.max_score,
    rubricBreakdown: evaluation.rubric_breakdown,
    annotations: evaluation.annotations,
    overallFeedback: evaluation.overall_feedback,
    strengths: evaluation.strengths,
    nextSteps: evaluation.next_steps,
  });

  return NextResponse.json({ grading });
}
