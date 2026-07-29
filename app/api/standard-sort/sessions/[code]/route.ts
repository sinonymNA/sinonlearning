import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getParticipants,
  getParticipantResponses,
  getSessionResults,
} from "@/lib/standardSortDb";

export const dynamic = "force-dynamic";

// Single polled endpoint, branching on what the caller needs:
//  - base session info (units, standards, title) is always returned
//  - ?participantToken=... adds that participant's saved answers, for
//    resuming a sort after a refresh
//  - ?results=1 adds the full tally — kept behind a flag because the sort
//    screen polls too and has no use for the aggregate on every request

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const participantToken = request.nextUrl.searchParams.get("participantToken");
  const wantResults = request.nextUrl.searchParams.get("results") === "1";

  const session = await getSession(code);
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  const base = {
    code: session.code,
    title: session.title,
    units: session.units,
    standards: session.standards,
  };

  let me: { name: string; responses: Record<string, string[]> } | null = null;
  if (participantToken) {
    const participants = await getParticipants(code);
    const p = participants.find((x) => x.participant_token === participantToken);
    if (p) {
      me = { name: p.name, responses: await getParticipantResponses(code, participantToken) };
    }
  }

  let results = null;
  if (wantResults) {
    results = await getSessionResults(code);
  }

  return NextResponse.json({ ...base, me, results });
}
