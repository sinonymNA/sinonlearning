import { NextRequest, NextResponse } from "next/server";
import { createBoard } from "@/lib/dashJam";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`dash-board-create:${ip}`, 60 * 60 * 1000, 20)) {
    return NextResponse.json({ error: "Too many boards created. Please try again later." }, { status: 429 });
  }

  let body: { title?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine, title is optional
  }

  const board = await createBoard(body.title);
  return NextResponse.json({
    code: board.code,
    boardId: board.id,
    hostToken: board.host_token,
    title: board.title,
  });
}
