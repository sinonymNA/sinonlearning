import { NextRequest, NextResponse } from "next/server";
import { getSession, getResponseStudentCount } from "@/lib/sourceRoomDb";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } },
) {
  const session = await getSession(params.code);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  // Strip host_token from public response
  const { host_token: _ht, ...publicSession } = session;

  const studentCount = await getResponseStudentCount(params.code);

  return NextResponse.json({ session: publicSession, studentCount });
}
