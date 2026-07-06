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
import { RevisionPlanSchema } from "@/lib/marginsGradingTypes";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 12;

const SYSTEM_PROMPT =
  "You are KORA, Sinon Learning's pedagogical AI, coaching an AP World History: Modern student through " +
  "revising their essay based on feedback they already received. You are NOT rewriting or drafting any part " +
  "of their essay. Your job is to build their own writing ability, not do the writing for them. CRITICAL, " +
  "NON-NEGOTIABLE RULE: never write a sentence, phrase, thesis statement, piece of analysis, or any text the " +
  "student could copy directly into their essay. Every field you produce — restatement, guiding_question, " +
  "scaffold, hint — must describe a MOVE, a QUESTION, or a STRUCTURAL FRAME with blanks, never finished prose " +
  "about the actual historical content of their essay. A \"scaffold\" means a sentence template like " +
  "\"One reason ___ changed was ___, which is shown by ___\" — never a filled-in example using their actual " +
  "topic. A \"hint\" is a MORE concrete nudge than the guiding_question (e.g. naming which paragraph to look " +
  "at, or what kind of connector word to consider) but still requires the student to supply the historical " +
  "content and words themselves. If you are ever tempted to write actual historical content, stop and turn it " +
  "into a question instead. Match the encouraging, non-punitive tone of the grading feedback — this is a " +
  "coaching conversation, not a second round of criticism.";

function buildUserMessage(params: {
  essayType: string;
  promptText: string;
  rubric: { category: string; points_possible: number; description: string }[];
  essayText: string;
  nextSteps: { issue: string; why_it_matters: string; how_to_fix: string; skill: string }[];
}): string {
  const { essayType, promptText, rubric, essayText, nextSteps } = params;
  const lines = [
    `Essay Type: ${essayType}`,
    `Prompt: ${promptText}`,
    "\nRubric:",
  ];
  rubric.forEach((r) =>
    lines.push(`- ${r.category} (${r.points_possible} pt${r.points_possible === 1 ? "" : "s"}): ${r.description}`)
  );
  lines.push("\nGrowth areas from the grading (address in this order):");
  nextSteps.forEach((s, i) =>
    lines.push(`${i + 1}. Issue: ${s.issue}\n   Why it matters: ${s.why_it_matters}\n   How to fix: ${s.how_to_fix}\n   Skill: ${s.skill}`)
  );
  lines.push(`\nStudent's current essay:\n${essayText}`);
  lines.push(
    `\nRules:`,
    `1. Produce exactly one step per next_step given above, in the same order (most important first).`,
    `2. "based_on_issue" must exactly copy the issue text given above so the UI can link the step back to its grading note.`,
    `3. "restatement" reframes the issue warmly and simply — assume the student is anxious about it, not lecturing them.`,
    `4. "guiding_question" is a genuine Socratic question that gets the student thinking about THEIR essay's actual content without you supplying it (e.g. "Look at your second body paragraph — after your evidence about [topic from essay], what unstated assumption connects it to your thesis?").`,
    `5. "scaffold" is a reusable sentence-structure template with blanks the student fills in themselves — never a worked example with real content plugged in.`,
    `6. "hint" is only shown if the student asks for extra help — it should be more specific than the guiding_question (e.g. naming a technique or where to look) but must still stop short of supplying actual words or analysis.`,
    `7. NEVER include real historical facts, argument content, or finished sentences about the essay's topic in any field.`
  );
  return lines.join("\n");
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
  if (user.id !== submission.student_id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  if (submission.status !== "graded") {
    return NextResponse.json({ error: "This submission hasn't been graded yet." }, { status: 400 });
  }

  const assignment = await getAssignmentById(submission.assignment_id);
  if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

  const grading = await getGradingBySubmission(submissionId);
  if (!grading) return NextResponse.json({ error: "This submission hasn't been graded yet." }, { status: 400 });

  // Idempotent: return the existing plan rather than regenerating it, so
  // refreshing the wizard's entry page doesn't burn another LLM call.
  const existingPlan = await getRevisionPlanBySubmission(submissionId);
  if (existingPlan) return NextResponse.json({ plan: existingPlan });

  const ip = getClientIp(request);
  if (isRateLimited(`margins-revision-coach:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  try {
    // Coaching quality directly shapes the student's revision — runs on Opus
    // with adaptive thinking; larger budget leaves room for the thinking pass.
    const { data } = await callKoraStructured({
      model: "claude-opus-4-8",
      maxTokens: 8192,
      system: SYSTEM_PROMPT,
      cacheSystemPrompt: true,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: buildUserMessage({
            essayType: assignment.essay_type,
            promptText: assignment.prompt_text,
            rubric: assignment.rubric,
            essayText: submission.essay_text,
            nextSteps: grading.next_steps,
          }),
        },
      ],
      schema: RevisionPlanSchema,
    });
    const plan = await createRevisionPlan(submissionId, data.steps);
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
