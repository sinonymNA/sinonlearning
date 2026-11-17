import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById, isStudentInClass } from "@/lib/marginsDb";
import { createLearningAssignment, getPublishedLearningAssignment, publishLearningAssignmentVersion } from "@/lib/marginsLearningLabDb";
import type { LearningLabAssignmentType, LearningLabQuestion, PublishedAssignmentSnapshot } from "@/lib/marginsLearningLab";

function validQuestion(value: unknown): value is LearningLabQuestion {
  if (!value || typeof value !== "object") return false;
  const q = value as Partial<LearningLabQuestion>;
  return typeof q.id === "string" && typeof q.questionText === "string" &&
    Array.isArray(q.choices) && typeof q.correctAnswer === "string" &&
    typeof q.pointValue === "number" && typeof q.skill === "string" &&
    typeof q.explanation === "string" &&
    (!q.freshPractice || (typeof q.freshPractice === "object" &&
      typeof q.freshPractice.questionText === "string" &&
      Array.isArray(q.freshPractice.choices) &&
      typeof q.freshPractice.correctAnswer === "string"));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  let body: {
    classId?: string;
    type?: LearningLabAssignmentType;
    title?: string;
    questions?: unknown[];
    context?: {
      vocabulary?: string[];
      priorInstruction?: string[];
      workedExamples?: string[];
      prerequisiteKnowledge?: string[];
      teacherMethods?: string[];
    };
  };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.classId || !body.title?.trim() || !body.type ||
      !["writing_lab", "practice_relearn"].includes(body.type) ||
      !body.questions?.length || !body.questions.every(validQuestion)) {
    return NextResponse.json({ error: "A class, assignment type, title, and valid questions are required." }, { status: 400 });
  }
  const cls = await getClassById(body.classId);
  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not authorized for this class." }, { status: 403 });
  }
  const snapshot = await createLearningAssignment({
    classId: cls.id,
    createdBy: user.id,
    type: body.type,
    title: body.title.trim(),
    questions: body.questions as LearningLabQuestion[],
    context: {
      vocabulary: body.context?.vocabulary ?? [],
      priorInstruction: body.context?.priorInstruction ?? [],
      workedExamples: body.context?.workedExamples ?? [],
      prerequisiteKnowledge: body.context?.prerequisiteKnowledge ?? [],
      teacherMethods: body.context?.teacherMethods ?? [],
    },
  });
  return NextResponse.json({ assignment: snapshot }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  let body: { assignmentId?: string; title?: string; questions?: unknown[]; context?: PublishedAssignmentSnapshot["context"] };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.assignmentId || !body.title?.trim() || !body.questions?.length || !body.questions.every(validQuestion)) {
    return NextResponse.json({ error: "An assignment ID, title, and valid questions are required." }, { status: 400 });
  }
  const current = await getPublishedLearningAssignment(body.assignmentId);
  if (!current) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  const cls = await getClassById(current.classId);
  if (!cls || cls.teacher_id !== user.id) return NextResponse.json({ error: "Not authorized for this class." }, { status: 403 });
  const assignment = await publishLearningAssignmentVersion({
    assignment: current,
    title: body.title.trim(),
    questions: body.questions as LearningLabQuestion[],
    context: body.context ?? current.context,
  });
  return NextResponse.json({ assignment });
}

export async function GET(
  request: NextRequest
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const assignmentId = new URL(request.url).searchParams.get("assignmentId");
  if (!assignmentId) return NextResponse.json({ error: "assignmentId is required." }, { status: 400 });
  const assignment = await getPublishedLearningAssignment(assignmentId);
  if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  const cls = await getClassById(assignment.classId);
  const allowed = user.role === "teacher"
    ? cls?.teacher_id === user.id
    : !!cls && await isStudentInClass(cls.id, user.id);
  if (!allowed) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (user.role === "student") {
    return NextResponse.json({
      assignment: {
        ...assignment,
        questions: assignment.questions.map((question) => ({
          id: question.id,
          questionText: question.questionText,
          choices: question.choices,
          pointValue: question.pointValue,
          standard: question.standard,
          skill: question.skill,
          prerequisiteSkills: question.prerequisiteSkills,
          materialRefs: question.materialRefs,
          freshPractice: question.freshPractice ? {
            questionText: question.freshPractice.questionText,
            choices: question.freshPractice.choices,
          } : undefined,
        })),
      },
    });
  }
  return NextResponse.json({ assignment });
}

