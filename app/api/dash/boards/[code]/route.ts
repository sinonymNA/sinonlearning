import { NextRequest, NextResponse } from "next/server";
import { getBoardByCode, getBoardPosts } from "@/lib/dashJam";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const board = await getBoardByCode(code);
  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }
  const posts = await getBoardPosts(board.id);
  return NextResponse.json({
    board: { code: board.code, title: board.title, createdAt: board.created_at },
    posts: posts.map((p) => ({
      id: p.id,
      kind: p.kind,
      content: p.content,
      authorName: p.author_name,
      createdAt: p.created_at,
    })),
  });
}
