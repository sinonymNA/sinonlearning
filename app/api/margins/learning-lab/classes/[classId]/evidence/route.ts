import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById } from "@/lib/marginsDb";
import { getLearningEvidenceForClass } from "@/lib/marginsLearningLabDb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not authorized for this class." }, { status: 403 });
  }
  const evidence = await getLearningEvidenceForClass(classId);
  return NextResponse.json({ evidence });
}
