import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/koraGame";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const session = getSession(code);
  if (!session) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  return NextResponse.json({ session });
}
