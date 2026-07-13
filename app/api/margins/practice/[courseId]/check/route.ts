import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getOrCreatePracticeProgress,
  recordPracticeAttempt,
  findPracticeAttempt,
  advancePracticeProgress,
  recomputeAndUpsertSkillMastery,
  type MasteryLevel,
  type MarginsSkillMastery,
} from "@/lib/marginsDb";
import {
  isPracticeCourseId,
  getPracticeCourse,
  getPracticeModule,
  getLastRequiredModule,
  skillTagLabel,
  type ScoutRegister,
} from "@/lib/marginsPracticeCourses";
import { generatePracticeCheck } from "@/lib/marginsPracticeKoraGenerate";
import { generateGrade } from "@/lib/marginsKoraGenerate";
import { RUBRIC_TEMPLATES } from "@/lib/marginsRubrics";
import { KoraConfigError, KoraValidationError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 60;

function scoreLabelForPoints(earned: number, possible: number): MasteryLevel {
  if (earned >= possible) return "strong";
  if (earned > 0) return "emerging";
  return "not_yet_shown";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { courseId } = await params;
  const course = getPracticeCourse(courseId);
  if (!isPracticeCourseId(courseId) || !course) {
    return NextResponse.json({ error: "Unknown course." }, { status: 404 });
  }

  let body: { moduleId?: string; promptId?: string; responseText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { moduleId, promptId, responseText } = body;
  if (!moduleId || !promptId || !responseText || !responseText.trim()) {
    return NextResponse.json({ error: "moduleId, promptId, and responseText are required." }, { status: 400 });
  }

  const module_ = getPracticeModule(courseId, moduleId);
  if (!module_) return NextResponse.json({ error: "Unknown module." }, { status: 404 });

  const progress = await getOrCreatePracticeProgress(user.id, courseId);
  if (module_.order !== progress.current_module) {
    return NextResponse.json({ error: "This module isn't unlocked yet." }, { status: 403 });
  }

  // No more "find the module's one check page" lookup — current_page IS the
  // answer, however many check-kind pages this module has and wherever they
  // sit in its sequence.
  const checkPage = module_.pages[progress.current_page];
  if (!checkPage || (checkPage.kind !== "check" && checkPage.kind !== "full_saq_check")) {
    return NextResponse.json({ error: "You're not currently on a check page." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`margins-practice:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in a bit." }, { status: 429 });
  }

  // Single-attempt pages (the timed capstone) never re-grade a replay — the
  // stored result comes back instead, both to avoid burning another live
  // grading call and to give a clean "you already did this" UX.
  if (checkPage.singleAttempt) {
    const prior = await findPracticeAttempt(progress.id, moduleId, promptId);
    if (prior) {
      return NextResponse.json({
        result: prior.feedback,
        passed: prior.passed,
        newMastery: [],
        advanced: false,
        progress,
        alreadyAttempted: true,
      });
    }
  }

  const lastRequiredModule = getLastRequiredModule(course);
  const isLastRequiredModule = module_.order === lastRequiredModule.order;
  // A module can hold more than one check page (e.g. the-alibi: alibi-check,
  // then a lesson page, then alibi-echo-check) — passing one only moves to
  // the next module if it's actually the module's last page; otherwise it
  // just steps to the next page within the same module.
  const isLastPageInModule = progress.current_page === module_.pages.length - 1;
  const nextModuleOrder = isLastPageInModule ? module_.order + 1 : module_.order;
  const nextPage = isLastPageInModule ? 0 : progress.current_page + 1;

  try {
    if (checkPage.kind === "full_saq_check") {
      const prompt = checkPage.prompts.find((p) => p.id === promptId);
      if (!prompt) return NextResponse.json({ error: "Unknown prompt." }, { status: 404 });

      const promptText = [
        prompt.stimulus,
        ...prompt.parts.map((p) => `Part ${p.label}: ${p.prompt}`),
      ].join("\n\n");

      const { output } = await generateGrade({
        essayType: "SAQ",
        promptText,
        documents: [],
        rubric: RUBRIC_TEMPLATES.SAQ,
        essayText: responseText,
      });

      const newMastery: MarginsSkillMastery[] = [];
      let firstAttemptId: string | null = null;
      for (let i = 0; i < prompt.parts.length; i++) {
        const part = prompt.parts[i];
        const breakdown = output.rubric_breakdown[i];
        const earned = breakdown?.points_earned ?? 0;
        const possible = breakdown?.points_possible ?? 1;
        const scoreLabel = scoreLabelForPoints(earned, possible);
        // Store the whole graded result (not just this part's breakdown) on
        // every part's row, so a single-attempt replay can reconstruct the
        // full result from any one of them.
        const attempt = await recordPracticeAttempt({
          progressId: progress.id,
          moduleId,
          promptId,
          responseText,
          passed: earned >= possible,
          feedback: output,
          skill: part.skill,
          scoreLabel,
        });
        if (i === 0) firstAttemptId = attempt.id;
        newMastery.push(await recomputeAndUpsertSkillMastery(user.id, part.skill));
      }

      const passed = output.overall_score >= output.max_score;
      const updatedProgress =
        passed || module_.optional
          ? await advancePracticeProgress(
              progress.id,
              nextModuleOrder,
              nextPage,
              isLastRequiredModule && isLastPageInModule
            )
          : progress;

      return NextResponse.json({
        result: output,
        passed,
        newMastery,
        advanced: passed || Boolean(module_.optional),
        progress: updatedProgress,
        attemptId: firstAttemptId,
      });
    }

    const prompt = checkPage.prompts.find((p) => p.id === promptId);
    if (!prompt) return NextResponse.json({ error: "Unknown prompt." }, { status: 404 });

    const output = await generatePracticeCheck({
      moduleId,
      skillLabel: skillTagLabel(checkPage.skill),
      register: (module_.register ?? "ap") as ScoutRegister,
      promptText: prompt.prompt,
      responseText,
      givenContext: prompt.givenContext,
    });

    const attempt = await recordPracticeAttempt({
      progressId: progress.id,
      moduleId,
      promptId,
      responseText,
      passed: output.passed,
      feedback: output,
      skill: checkPage.skill.id,
      scoreLabel: output.score_label,
    });
    const newMastery = [await recomputeAndUpsertSkillMastery(user.id, checkPage.skill.id)];
    if (checkPage.alsoTracks) {
      await recordPracticeAttempt({
        progressId: progress.id,
        moduleId,
        promptId,
        responseText,
        passed: output.passed,
        feedback: output,
        skill: checkPage.alsoTracks.id,
        scoreLabel: output.score_label,
      });
      newMastery.push(await recomputeAndUpsertSkillMastery(user.id, checkPage.alsoTracks.id));
    }

    const updatedProgress =
      output.passed || module_.optional
        ? await advancePracticeProgress(
            progress.id,
            nextModuleOrder,
            nextPage,
            isLastRequiredModule && isLastPageInModule
          )
        : progress;

    return NextResponse.json({
      result: output,
      passed: output.passed,
      newMastery,
      advanced: output.passed || Boolean(module_.optional),
      progress: updatedProgress,
      attemptId: attempt.id,
    });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "Scout is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "Scout couldn't grade that one — try again." }, { status: 422 });
    }
    console.error("[margins/practice/check] Claude call failed:", err);
    return NextResponse.json({ error: "Scout is unavailable right now. Please try again." }, { status: 502 });
  }
}
