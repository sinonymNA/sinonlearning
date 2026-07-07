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
import { generateGrade, GRADE_SYSTEM_PROMPT, buildRubricEssayTail, type PriorGrading } from "@/lib/marginsKoraGenerate";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 12;

type GradingDocument = { label: string; source_text?: string; image_id?: string };

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
    if (hasImageDocuments) {
      const content = await buildMultimodalContent({
        essayType: assignment.essay_type,
        promptText: assignment.prompt_text,
        documents: assignment.documents ?? [],
        rubric: assignment.rubric,
        essayText: submission.essay_text,
        priorGrading,
      });
      // The highest-stakes call in Margins — runs on Opus with adaptive
      // thinking; the larger token budget leaves room for the thinking pass.
      const { data } = await callKoraStructured({
        model: "claude-opus-4-8",
        maxTokens: 8192,
        system: GRADE_SYSTEM_PROMPT,
        cacheSystemPrompt: true,
        thinking: { type: "adaptive" },
        messages: [{ role: "user", content }],
        schema: EssayEvalSchema,
      });
      evaluation = data;
    } else {
      const { output } = await generateGrade({
        essayType: assignment.essay_type,
        promptText: assignment.prompt_text,
        documents: assignment.documents ?? [],
        rubric: assignment.rubric,
        essayText: submission.essay_text,
        priorGrading: priorGrading ?? undefined,
      });
      evaluation = output;
    }
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
