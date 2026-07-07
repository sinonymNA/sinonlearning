import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { exportKoraLabPairs } from "@/lib/koraLabDb";

export const dynamic = "force-dynamic";

// GET — line-delimited JSON export of rated pairs, one decisive {chosen,
// rejected} row per line. `tie`/`both_bad` ratings are excluded: they're
// useful signal (visible via /api/kora-lab/stats) but there's no defensible
// chosen/rejected pair to export for them.
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const taskType = url.searchParams.get("taskType") ?? undefined;

  const pairs = await exportKoraLabPairs({ taskType });
  const lines = pairs
    .filter((p) => p.winner === "a" || p.winner === "b")
    .map((p) => {
      const aWins = p.winner === "a";
      return JSON.stringify({
        task_type: p.task_type,
        input_context: p.input_context,
        system_prompt_snapshot: p.system_prompt_snapshot,
        chosen: aWins ? p.candidate_a : p.candidate_b,
        rejected: aWins ? p.candidate_b : p.candidate_a,
        chosen_config: aWins ? p.candidate_a_config : p.candidate_b_config,
        rejected_config: aWins ? p.candidate_b_config : p.candidate_a_config,
        reason: p.reason,
        rated_at: p.created_at,
      });
    });

  const filename = `kora-lab-pairs${taskType ? `-${taskType}` : ""}.jsonl`;
  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
