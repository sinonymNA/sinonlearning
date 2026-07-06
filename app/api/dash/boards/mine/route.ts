import { NextResponse } from "next/server";
import { getBoardsByTeacher } from "@/lib/dashJam";
import { getCurrentUser } from "@/lib/marginsAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const boards = await getBoardsByTeacher(user.id);
  return NextResponse.json({
    boards: boards.map((b) => ({ id: b.id, code: b.code, title: b.title, createdAt: b.created_at })),
  });
}
