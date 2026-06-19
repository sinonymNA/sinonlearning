import { NextRequest, NextResponse } from "next/server";
import { createGameShow, getGameShowsByIds } from "@/lib/gameShows";
import { buildGameShowPayload } from "@/lib/gameShowValidation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const gameShows = await getGameShowsByIds(ids);
  return NextResponse.json({ gameShows });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const result = buildGameShowPayload(body.type, body.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const gameShow = await createGameShow(result.payload.type, title, result.payload);
  return NextResponse.json({ gameShow }, { status: 201 });
}
