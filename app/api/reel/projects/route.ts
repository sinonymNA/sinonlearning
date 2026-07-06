import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { createReelProject, getReelProjectsByTeacher } from "@/lib/reelDb";
import { createBeat } from "@/lib/reelTemplates";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const projects = await getReelProjectsByTeacher(user.id);
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`reel-project-create:${ip}`, 60 * 60 * 1000, 40)) {
    return NextResponse.json({ error: "Too many projects created. Try again later." }, { status: 429 });
  }

  let body: { title?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — title optional
  }

  // A blank project starts with a single title-card beat so the editor isn't empty.
  const project = await createReelProject({
    teacherId: user.id,
    title: body.title,
    beats: [createBeat("titleCard")],
  });
  return NextResponse.json({ projectId: project.id });
}
