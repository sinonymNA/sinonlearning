import { NextRequest, NextResponse } from "next/server";
import { advanceRound } from "@/lib/relayDb";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { hostToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body.hostToken) return NextResponse.json({ error: "Host token required." }, { status: 401 });

  const status = await advanceRound(code, body.hostToken);
  if (!status) return NextResponse.json({ error: "Could not advance this room." }, { status: 400 });
  return NextResponse.json({ status });
}
