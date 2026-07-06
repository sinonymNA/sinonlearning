import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getReelProjectById, getLatestJob, type ReelJobKind } from "@/lib/reelDb";

export const dynamic = "force-dynamic";

function parseKind(value: string | null): ReelJobKind {
  return value === "mux" ? "mux" : "render";
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-z0-9\- ]/gi, "").trim() || "video";
}

// GET — stream the finished MP4 for the latest done job (?kind=render|mux).
// Owner-checked (unlike public images, videos are private to the teacher).
export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const project = await getReelProjectById(projectId);
  if (!project || project.teacher_id !== user.id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const kind = parseKind(new URL(request.url).searchParams.get("kind"));
  const job = await getLatestJob(projectId, kind);
  if (!job || job.status !== "done" || !job.output) {
    return NextResponse.json({ error: "No finished video yet." }, { status: 404 });
  }

  const suffix = kind === "mux" ? "" : " (preview)";
  return new NextResponse(new Uint8Array(job.output), {
    status: 200,
    headers: {
      "Content-Type": job.output_mime || "video/mp4",
      "Content-Disposition": `inline; filename="${sanitizeFilename(project.title)}${suffix}.mp4"`,
      "Cache-Control": "no-store",
    },
  });
}
