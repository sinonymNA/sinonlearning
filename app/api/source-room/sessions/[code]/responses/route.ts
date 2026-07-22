import { NextRequest, NextResponse } from "next/server";
import { getSession, getResponses } from "@/lib/sourceRoomDb";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } },
) {
  const hostToken = request.nextUrl.searchParams.get("hostToken");
  if (!hostToken) {
    return NextResponse.json({ error: "hostToken query param required." }, { status: 400 });
  }

  const session = await getSession(params.code);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  if (session.host_token !== hostToken) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const responses = await getResponses(params.code);
  return NextResponse.json({ responses });
}
