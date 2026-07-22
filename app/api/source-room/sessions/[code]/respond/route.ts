import { NextRequest, NextResponse } from "next/server";
import { getSession, upsertResponse } from "@/lib/sourceRoomDb";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } },
) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.studentToken !== "string" ||
    typeof body.studentName !== "string" ||
    typeof body.questionId !== "string" ||
    typeof body.responseText !== "string"
  ) {
    return NextResponse.json(
      { error: "studentToken, studentName, questionId, and responseText required." },
      { status: 400 },
    );
  }

  const session = await getSession(params.code);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (session.status === "ended") {
    return NextResponse.json({ error: "Session has ended." }, { status: 409 });
  }

  await upsertResponse(
    params.code,
    body.studentToken,
    body.studentName,
    body.questionId,
    body.responseText,
  );

  return NextResponse.json({ ok: true });
}
