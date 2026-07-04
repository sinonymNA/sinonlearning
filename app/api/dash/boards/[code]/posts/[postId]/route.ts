import { NextRequest, NextResponse } from "next/server";
import { getBoardByCode, getBoardPostById, updateBoardPostPosition, deleteBoardPost } from "@/lib/dashJam";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; postId: string }> }
) {
  const { code, postId } = await params;
  const board = await getBoardByCode(code);
  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }

  const post = await getBoardPostById(board.id, postId);
  if (!post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  let body: { x?: number; y?: number; z?: number; ownerToken?: string; hostToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const isOwner = !!body.ownerToken && body.ownerToken === post.owner_token;
  const isHost = !!body.hostToken && body.hostToken === board.host_token;
  if (!isOwner && !isHost) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  if (typeof body.x !== "number" || typeof body.y !== "number" || typeof body.z !== "number") {
    return NextResponse.json({ error: "x, y, and z are required." }, { status: 400 });
  }

  const updated = await updateBoardPostPosition(board.id, postId, { x: body.x, y: body.y, z: body.z });
  if (!updated) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, x: updated.x, y: updated.y, z: updated.z });
}

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
