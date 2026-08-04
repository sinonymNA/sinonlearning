import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassById } from "@/lib/marginsDb";
import { updateApwhProfile, upsertDispatch } from "@/lib/apwhDb";
import { requestIsSameOrigin, safeInternalHref } from "@/lib/apwhSecurity";

const inputSchema = z.object({
  schoolDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eyebrow: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(140),
  objective: z.string().trim().max(500),
  agenda: z.array(z.string().trim().min(1).max(240)).max(8),
  announcement: z.string().trim().max(500),
  startLabel: z.string().trim().min(1).max(80),
  startHref: z.string().trim().min(1).max(300),
  courseTitle: z.string().trim().min(1).max(100),
  periodLabel: z.string().trim().max(60),
  currentUnit: z.string().trim().min(1).max(120),
  schoolYear: z.string().trim().min(4).max(20),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  if (!requestIsSameOrigin(request)) {
    return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { classId } = await params;
  const cls = await getClassById(classId);
  if (!cls || cls.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Some dispatch fields need attention." }, { status: 400 });
  }
  const value = parsed.data;
  const [profile, dispatch] = await Promise.all([
    updateApwhProfile({
      classId,
      courseTitle: value.courseTitle,
      periodLabel: value.periodLabel,
      currentUnit: value.currentUnit,
      schoolYear: value.schoolYear,
      examDate: value.examDate,
      teacherId: user.id,
    }),
    upsertDispatch({
      classId,
      schoolDate: value.schoolDate,
      eyebrow: value.eyebrow,
      title: value.title,
      objective: value.objective,
      agenda: value.agenda,
      announcement: value.announcement,
      startLabel: value.startLabel,
      startHref: safeInternalHref(value.startHref),
      teacherId: user.id,
    }),
  ]);
  return NextResponse.json({ profile, dispatch });
}
