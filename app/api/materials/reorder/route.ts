import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const course = typeof body.course === "string" ? body.course.trim() : "";
  const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : null;

  if (!course || !orderedIds) {
    return NextResponse.json({ error: "course and orderedIds are required" }, { status: 400 });
  }

  await ensureSchema();
  await Promise.all(
    orderedIds.map((id: unknown, index: number) =>
      query("UPDATE materials SET position = $1 WHERE id = $2 AND course_slug = $3", [
        index,
        id,
        course,
      ])
    )
  );

  return NextResponse.json({ ok: true });
}
