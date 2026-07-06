import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import {
  getReelProjectById,
  enqueueRenderJob,
  getLatestJob,
  getActiveJob,
  reapStaleJobs,
  type ReelJobKind,
} from "@/lib/reelDb";

export const dynamic = "force-dynamic";

async function ownedProject(projectId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return { error: "unauth" as const };
  const project = await getReelProjectById(projectId);
  if (!project || project.teacher_id !== user.id) return { error: "notfound" as const };
  return { user, project };
}

function parseKind(value: string | null): ReelJobKind {
  return value === "mux" ? "mux" : "render";
}

// POST — enqueue a render ("render" = beats → silent preview, "mux" = + narration → final).
export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const res = await ownedProject(projectId);
  if ("error" in res) {
    return NextResponse.json(
      { error: res.error === "unauth" ? "Not authorized." : "Project not found." },
      { status: res.error === "unauth" ? 401 : 404 }
    );
  }

  const ip = getClientIp(request);
  if (isRateLimited(`reel-render:${ip}`, 60 * 60 * 1000, 40)) {
    return NextResponse.json({ error: "Too many renders. Try again in a bit." }, { status: 429 });
  }

  let body: { kind?: string } = {};
  try {
    body = await request.json();
  } catch {
    // default kind
  }
  const kind = parseKind(body.kind ?? null);

  // Clear anything hung, then de-dupe: if a render of this kind is already in
  // flight, return it rather than stacking a duplicate.
  await reapStaleJobs();
  const active = await getActiveJob(projectId, kind);
  if (active) {
    return NextResponse.json({ jobId: active.id, status: active.status, kind, reused: true });
  }

  const job = await enqueueRenderJob(projectId, kind);
  return NextResponse.json({ jobId: job.id, status: job.status, kind });
}

// GET — poll the latest job of a kind for this project (?kind=render|mux).
export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const res = await ownedProject(projectId);
  if ("error" in res) {
    return NextResponse.json(
      { error: res.error === "unauth" ? "Not authorized." : "Project not found." },
      { status: res.error === "unauth" ? 401 : 404 }
    );
  }
  const kind = parseKind(new URL(request.url).searchParams.get("kind"));
  // Self-heal on poll: if the worker is down/crashed, nothing else clears a job
  // hung in 'rendering', so the editor would poll forever. Reaping here bounds it.
  await reapStaleJobs();
  const job = await getLatestJob(projectId, kind);
  if (!job) return NextResponse.json({ status: "none", kind });
  return NextResponse.json({ jobId: job.id, status: job.status, kind, error: job.error });
}
