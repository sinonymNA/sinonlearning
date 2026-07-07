import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getKoraLabTask } from "@/lib/koraLab/registry";
import { KoraConfigError, KoraValidationError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 60;

interface CandidateOverrideBody {
  model?: string;
  systemPromptOverride?: string;
  label?: string;
}

// POST — generate two candidate outputs for the same input, one task at a
// time. Nothing is persisted here; a pair only becomes a durable row once a
// human rates it via /api/kora-lab/pairs.
export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`kora-lab-generate:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  let body: { taskType?: string; input?: unknown; configA?: CandidateOverrideBody; configB?: CandidateOverrideBody };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const task = body.taskType ? getKoraLabTask(body.taskType) : undefined;
  if (!task) {
    return NextResponse.json({ error: "Unknown taskType." }, { status: 400 });
  }

  const parsed = task.inputSchema.safeParse(body.input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const [candidateA, candidateB] = await Promise.all([
      task.generate(parsed.data, body.configA),
      task.generate(parsed.data, body.configB),
    ]);
    return NextResponse.json({
      taskType: body.taskType,
      inputContext: parsed.data,
      candidateA,
      candidateB,
    });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json({ error: "KORA returned an invalid structure." }, { status: 422 });
    }
    console.error("[kora-lab/generate] Claude call failed:", err);
    return NextResponse.json({ error: "KORA is unavailable right now. Please try again." }, { status: 502 });
  }
}
