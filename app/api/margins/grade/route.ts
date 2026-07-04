import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getSubmissionById, getAssignmentById, getClassById, createGrading } from "@/lib/marginsDb";
import { EssayEvalSchema } from "@/lib/marginsGradingTypes";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 12;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, grading AP World History: Modern essays for the " +
  "Margins writing app. You are a rigorous but fair AP reader. Score strictly against the rubric given — " +
  "not a generic impression of essay quality. Return a single JSON object matching the schema exactly. " +
  "No prose, no markdown outside the JSON. " +
  "CRITICAL: every annotation's \"quote\" field MUST be an exact, verbatim substring copied character-for-character " +
  "from the student's essay — never paraphrase, summarize, or invent a quote. If you cannot find a good verbatim " +
  "excerpt to anchor a point, omit that annotation rather than inventing one. This is a draft grade a teacher will " +
  "review before it counts — be honest, not inflated.";

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
}): string {
  const { essayType, promptText, documents, rubric, essayText } = params;
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
  lines.push(`\nStudent Essay:\n${essayText}`);
  lines.push(
    `\nReturn JSON matching this schema exactly:`,
    `{"essay_type":"DBQ"|"LEQ"|"SAQ","overall_score":number,"max_score":number,` +
      `"rubric_breakdown":[{"category":string,"points_earned":number,"points_possible":number,"justification":string}],` +
      `"annotations":[{"quote":string,"category":string,"comment":string}],` +
      `"overall_feedback":string,"strengths":string[],"next_steps":string[]}`,
    `\nRules:`,
    `1. rubric_breakdown must have exactly one row per rubric category given above, in the same order, with the same points_possible.`,
    `2. max_score must equal the sum of points_possible across the rubric.`,
    `3. Annotations: quote must be copied verbatim from the student essay above — no paraphrasing. Aim for 4-10 annotations covering both strong moments and weaknesses, each tagged with the rubric category it relates to.`,
    `4. overall_feedback should be 2-4 sentences, honest and specific to this essay — not generic praise.`,
    `5. strengths and next_steps should each have 2-4 short, specific bullet points.`,
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
