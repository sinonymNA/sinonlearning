import { NextRequest, NextResponse } from "next/server";
import { getBoardById, deleteBoard } from "@/lib/dashJam";
import { getCurrentUser } from "@/lib/marginsAuth";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { boardId } = await params;
  const board = await getBoardById(boardId);
  if (!board || board.teacher_id !== user.id) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }
  // Returns the stored host token so the owner can resume hosting from any
  // device — never regenerated, so links/tokens already in use stay valid.
  return NextResponse.json({
    code: board.code,
    boardId: board.id,
    hostToken: board.host_token,
    title: board.title,
  });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ boardId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { boardId } = await params;
  const removed = await deleteBoard(boardId, user.id);
  if (!removed) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
