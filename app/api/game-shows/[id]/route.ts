import { NextRequest, NextResponse } from "next/server";
import { getGameShowById, updateGameShow } from "@/lib/gameShows";
import { buildGameShowPayload } from "@/lib/gameShowValidation";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameShow = await getGameShowById(id);
  if (!gameShow) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  return NextResponse.json({ gameShow });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const result = buildGameShowPayload(body.type, body.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const gameShow = await updateGameShow(id, title, result.payload);
  if (!gameShow) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }
  return NextResponse.json({ gameShow });
}
