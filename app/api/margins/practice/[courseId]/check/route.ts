import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getOrCreatePracticeProgress,
  recordPracticeAttempt,
  advancePracticeProgress,
  recomputeAndUpsertSkillMastery,
  type MasteryLevel,
  type MarginsSkillMastery,
} from "@/lib/marginsDb";
import { isPracticeCourseId, getPracticeCourse, getPracticeModule, getModuleCheckPage } from "@/lib/marginsPracticeCourses";
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

  const checkPage = getModuleCheckPage(module_);
  if (!checkPage) return NextResponse.json({ error: "This module has no check page." }, { status: 500 });
  const checkPageIndex = module_.pages.indexOf(checkPage);

  const progress = await getOrCreatePracticeProgress(user.id, courseId);
  if (module_.order !== progress.current_module) {
    return NextResponse.json({ error: "This module isn't unlocked yet." }, { status: 403 });
  }
  if (progress.current_page !== checkPageIndex) {
    return NextResponse.json({ error: "Read through the module's pages before checking in." }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`margins-practice:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in a bit." }, { status: 429 });
  }

  const isLastModule = module_.order === course.modules.length - 1;

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
      for (let i = 0; i < prompt.parts.length; i++) {
        const part = prompt.parts[i];
        const breakdown = output.rubric_breakdown[i];
        const earned = breakdown?.points_earned ?? 0;
        const possible = breakdown?.points_possible ?? 1;
        const scoreLabel = scoreLabelForPoints(earned, possible);
        await recordPracticeAttempt({
          progressId: progress.id,
          moduleId,
          promptId,
          responseText,
          passed: earned >= possible,
          feedback: breakdown ?? null,
          skill: part.skill,
          scoreLabel,
        });
        newMastery.push(await recomputeAndUpsertSkillMastery(user.id, part.skill));
      }

      const passed = output.overall_score >= output.max_score;
      const updatedProgress = passed
        ? await advancePracticeProgress(progress.id, module_.order + 1, 0, isLastModule)
        : progress;

      return NextResponse.json({
        result: output,
        passed,
        newMastery,
        advanced: passed,
        progress: updatedProgress,
      });
    }

    const prompt = checkPage.prompts.find((p) => p.id === promptId);
    if (!prompt) return NextResponse.json({ error: "Unknown prompt." }, { status: 404 });

    const output = await generatePracticeCheck({
      moduleId,
      skill: checkPage.skill,
      promptText: prompt.prompt,
      responseText,
    });

    await recordPracticeAttempt({
      progressId: progress.id,
      moduleId,
      promptId,
      responseText,
      passed: output.passed,
      feedback: output,
      skill: checkPage.skill,
      scoreLabel: output.score_label,
    });
    const newMastery = await recomputeAndUpsertSkillMastery(user.id, checkPage.skill);

    const updatedProgress = output.passed
      ? await advancePracticeProgress(progress.id, module_.order + 1, 0, isLastModule)
      : progress;

    return NextResponse.json({
      result: output,
      passed: output.passed,
      newMastery: [newMastery],
      advanced: output.passed,
      progress: updatedProgress,
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
