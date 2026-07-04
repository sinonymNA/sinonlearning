import { NextRequest, NextResponse } from "next/server";
import { getBoardByCode, addBoardPost, type BoardPostKind, type DashBoardPostContent } from "@/lib/dashJam";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const VALID_KINDS: BoardPostKind[] = ["sticky", "text", "image", "link"];
const STICKY_COLORS = ["yellow", "pink", "blue", "green", "orange"];

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const ip = getClientIp(request);
  if (isRateLimited(`dash-board-post:${ip}`, 60 * 1000, 20)) {
    return NextResponse.json({ error: "Slow down — too many posts. Try again in a moment." }, { status: 429 });
  }

  const { code } = await params;
  const board = await getBoardByCode(code);
  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }

  let body: { kind?: string; content?: DashBoardPostContent; authorName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const kind = body.kind as BoardPostKind;
  if (!VALID_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Invalid post kind." }, { status: 400 });
  }

  const rawContent = body.content ?? {};
  const content: DashBoardPostContent = {};
  if (rawContent.text) content.text = String(rawContent.text).trim().slice(0, 500);
  if (rawContent.color && STICKY_COLORS.includes(rawContent.color)) content.color = rawContent.color;
  if (rawContent.imageUrl) content.imageUrl = String(rawContent.imageUrl).trim().slice(0, 2000);
  if (rawContent.linkUrl) content.linkUrl = String(rawContent.linkUrl).trim().slice(0, 2000);

  if (!content.text && !content.imageUrl && !content.linkUrl) {
    return NextResponse.json({ error: "Post needs some content." }, { status: 400 });
  }

  const authorName = (body.authorName ?? "").trim().slice(0, 40) || "Anonymous";

  const post = await addBoardPost({ boardId: board.id, kind, content, authorName });
  return NextResponse.json({
    post: {
      id: post.id,
      kind: post.kind,
      content: post.content,
      authorName: post.author_name,
      x: post.x,
      y: post.y,
      z: post.z,
      createdAt: post.created_at,
    },
    ownerToken: post.owner_token,
  });
}
