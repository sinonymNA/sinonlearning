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
  const contentType = job.output_mime || "video/mp4";
  const disposition = `inline; filename="${sanitizeFilename(project.title)}${suffix}.mp4"`;
  const total = job.output.length;

  // iOS/Safari's <video> element requires byte-range support to play at all
  // (it probes with a Range request before loading) — without a 206 response
  // here it shows a "can't play this video" icon rather than falling back to
  // a full download.
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match && match[1] ? parseInt(match[1], 10) : 0;
    const end = match && match[2] ? parseInt(match[2], 10) : total - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}`, "Accept-Ranges": "bytes" },
      });
    }
    const clampedEnd = Math.min(end, total - 1);
    return new NextResponse(new Uint8Array(job.output.subarray(start, clampedEnd + 1)), {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Content-Range": `bytes ${start}-${clampedEnd}/${total}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(clampedEnd - start + 1),
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(new Uint8Array(job.output), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Accept-Ranges": "bytes",
      "Content-Length": String(total),
      "Cache-Control": "no-store",
    },
  });
}
