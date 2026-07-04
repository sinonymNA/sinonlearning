import { NextRequest, NextResponse } from "next/server";
import { getBoardByCode, deleteBoardPost } from "@/lib/dashJam";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; postId: string }> }
) {
  const { code, postId } = await params;
  const board = await getBoardByCode(code);
  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }

  let body: { hostToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.hostToken || body.hostToken !== board.host_token) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const removed = await deleteBoardPost(board.id, postId);
  if (!removed) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
