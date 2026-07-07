import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getReelProjectById,
  updateReelProject,
  deleteReelProject,
} from "@/lib/reelDb";
import { isReelTemplateId } from "@/lib/reelTemplates";
import type { Beat } from "@/lib/reelTypes";
import { REEL_THEMES } from "@/lib/reelTypes";

export const dynamic = "force-dynamic";

async function ownedProject(projectId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return { error: "unauth" as const };
  const project = await getReelProjectById(projectId);
  if (!project || project.teacher_id !== user.id) return { error: "notfound" as const };
  return { user, project };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const res = await ownedProject(projectId);
  if ("error" in res) {
    return NextResponse.json(
      { error: res.error === "unauth" ? "Not authorized." : "Project not found." },
      { status: res.error === "unauth" ? 401 : 404 }
    );
  }
  return NextResponse.json({ project: res.project });
}

// Light structural validation — beats must reference a known template.
function validateBeats(beats: unknown): beats is Beat[] {
  if (!Array.isArray(beats)) return false;
  return beats.every(
    (b) =>
      b &&
      typeof b === "object" &&
      typeof (b as Beat).id === "string" &&
      isReelTemplateId((b as Beat).templateId) &&
      typeof (b as Beat).narration === "string" &&
      typeof (b as Beat).animationSeconds === "number"
  );
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const res = await ownedProject(projectId);
  if ("error" in res) {
    return NextResponse.json(
      { error: res.error === "unauth" ? "Not authorized." : "Project not found." },
      { status: res.error === "unauth" ? 401 : 404 }
    );
  }

  let body: { title?: string; beats?: unknown; status?: "draft" | "rendered" | "produced"; themeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.beats !== undefined && !validateBeats(body.beats)) {
    return NextResponse.json({ error: "Invalid beats." }, { status: 400 });
  }
  if (body.themeId !== undefined && !REEL_THEMES.some((t) => t.id === body.themeId)) {
    return NextResponse.json({ error: "Unknown themeId." }, { status: 400 });
  }

  const updated = await updateReelProject(projectId, {
    title: body.title,
    beats: body.beats as Beat[] | undefined,
    status: body.status,
    themeId: body.themeId,
  });
  return NextResponse.json({ project: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const res = await ownedProject(projectId);
  if ("error" in res) {
    return NextResponse.json(
      { error: res.error === "unauth" ? "Not authorized." : "Project not found." },
      { status: res.error === "unauth" ? 401 : 404 }
    );
  }
  await deleteReelProject(projectId, res.user.id);
  return NextResponse.json({ ok: true });
}
