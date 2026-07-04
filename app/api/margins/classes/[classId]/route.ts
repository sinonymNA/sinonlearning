import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById, getClassRoster, getAssignmentsByClass, isStudentInClass } from "@/lib/marginsDb";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authorized." }, { status: 401 });

  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls) return NextResponse.json({ error: "Class not found." }, { status: 404 });

  if (user.role === "teacher") {
    if (cls.teacher_id !== user.id) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    const [roster, assignments] = await Promise.all([
      getClassRoster(cls.id),
      getAssignmentsByClass(cls.id),
    ]);
    return NextResponse.json({
      class: cls,
      roster: roster.map((s) => ({ id: s.id, name: s.name, email: s.email })),
      assignments,
    });
  }

  const member = await isStudentInClass(cls.id, user.id);
  if (!member) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const assignments = await getAssignmentsByClass(cls.id);
  return NextResponse.json({ class: cls, assignments });
}
