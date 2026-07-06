import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getReelProjectById, createReelAudio, getReelAudio } from "@/lib/reelDb";

export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024; // narration clips are small; generous cap
const ALLOWED_MIME_PREFIXES = ["audio/"];

async function ownedProject(projectId: string, userId: string) {
  const project = await getReelProjectById(projectId);
  if (!project || project.teacher_id !== userId) return undefined;
  return project;
}

// POST — store a recorded per-beat narration clip (multipart: beatId + file).
export async function POST(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  if (!(await ownedProject(projectId, user.id))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`reel-audio:${ip}`, 60 * 60 * 1000, 200)) {
    return NextResponse.json({ error: "Too many recordings. Try again in a bit." }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }
  const beatId = String(formData.get("beatId") ?? "").trim();
  const file = formData.get("file");
  if (!beatId || !(file instanceof File)) {
    return NextResponse.json({ error: "beatId and an audio file are required." }, { status: 400 });
  }
  if (!ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
    return NextResponse.json({ error: "Only audio files are supported." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Recording exceeds 15 MB limit." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const audio = await createReelAudio({
    projectId,
    beatId,
    mimeType: file.type || "audio/webm",
    data: buffer,
  });
  return NextResponse.json({ audioId: audio.id });
}

// GET ?audioId= — serve a stored clip back for playback (owner-checked).
export async function GET(request: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  if (!(await ownedProject(projectId, user.id))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  const audioId = new URL(request.url).searchParams.get("audioId");
  if (!audioId) {
    return NextResponse.json({ error: "audioId is required." }, { status: 400 });
  }
  const audio = await getReelAudio(audioId);
  if (!audio || audio.project_id !== projectId) {
    return NextResponse.json({ error: "Audio not found." }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(audio.data), {
    status: 200,
    headers: { "Content-Type": audio.mime_type, "Cache-Control": "no-store" },
  });
}
