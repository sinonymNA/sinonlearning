import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { insertKoraLabPair, listKoraLabPairs, countKoraLabPairs, type KoraLabWinner } from "@/lib/koraLabDb";

export const dynamic = "force-dynamic";

const WINNERS: KoraLabWinner[] = ["a", "b", "tie", "both_bad"];

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const url = new URL(request.url);
  const taskType = url.searchParams.get("taskType") ?? undefined;
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50));
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

  const [pairs, total] = await Promise.all([
    listKoraLabPairs({ taskType, limit, offset }),
    countKoraLabPairs({ taskType }),
  ]);
  return NextResponse.json({ pairs, total });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: {
    taskType?: string;
    inputContext?: Record<string, unknown>;
    systemPromptSnapshot?: string;
    candidateA?: unknown;
    candidateAConfig?: Record<string, unknown>;
    candidateB?: unknown;
    candidateBConfig?: Record<string, unknown>;
    winner?: string;
    reason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    !body.taskType ||
    !body.inputContext ||
    typeof body.systemPromptSnapshot !== "string" ||
    body.candidateA === undefined ||
    body.candidateB === undefined ||
    !body.candidateAConfig ||
    !body.candidateBConfig ||
    !body.winner ||
    !WINNERS.includes(body.winner as KoraLabWinner)
  ) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const pair = await insertKoraLabPair({
    taskType: body.taskType,
    inputContext: body.inputContext,
    systemPromptSnapshot: body.systemPromptSnapshot,
    candidateA: body.candidateA,
    candidateAConfig: body.candidateAConfig as never,
    candidateB: body.candidateB,
    candidateBConfig: body.candidateBConfig as never,
    winner: body.winner as KoraLabWinner,
    reason: body.reason?.trim() || null,
  });
  return NextResponse.json({ pair });
}
