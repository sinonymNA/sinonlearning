import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById, createAssignment, getAssignmentsByClass, type EssayType } from "@/lib/marginsDb";
import { RUBRIC_TEMPLATES } from "@/lib/marginsRubrics";

const ESSAY_TYPES: EssayType[] = ["DBQ", "LEQ", "SAQ"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const assignments = await getAssignmentsByClass(classId);
  return NextResponse.json({ assignments });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  let body: {
    essayType?: string;
    title?: string;
    promptText?: string;
    rubric?: { category: string; points_possible: number; description: string }[];
    documents?: { label: string; source_text?: string; image_id?: string }[];
    dueAt?: string;
    maxRevisions?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const essayType = body.essayType as EssayType;
  if (!ESSAY_TYPES.includes(essayType)) {
    return NextResponse.json({ error: "essayType must be DBQ, LEQ, or SAQ." }, { status: 400 });
  }
  const title = (body.title ?? "").trim();
  const promptText = (body.promptText ?? "").trim();
  if (!title || !promptText) {
    return NextResponse.json({ error: "Title and prompt are required." }, { status: 400 });
  }
  const rubric = body.rubric && body.rubric.length > 0 ? body.rubric : RUBRIC_TEMPLATES[essayType];
  if (essayType === "DBQ") {
    if (!body.documents || body.documents.length === 0) {
      return NextResponse.json(
        { error: "DBQ assignments require at least one source document." },
        { status: 400 }
      );
    }
    const invalid = body.documents.some(
      (d) => !d.label?.trim() || !((d.source_text && d.source_text.trim()) || d.image_id)
    );
    if (invalid) {
      return NextResponse.json(
        { error: "Each document needs a label and either source text or an uploaded image." },
        { status: 400 }
      );
    }
  }

  const maxRevisions =
    typeof body.maxRevisions === "number" && Number.isFinite(body.maxRevisions)
      ? Math.max(0, Math.floor(body.maxRevisions))
      : 1;

  const assignment = await createAssignment({
    classId,
    essayType,
    title,
    promptText,
    rubric,
    documents: essayType === "DBQ" ? body.documents ?? null : null,
    dueAt: body.dueAt ? new Date(body.dueAt) : null,
    maxRevisions,
  });

  return NextResponse.json({ assignment });
}
