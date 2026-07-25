import { NextRequest, NextResponse } from "next/server";
import { getSession, getPlayers, getEntries, saveScore, setStatus } from "@/lib/relayDb";
import { gradeRelayRoom } from "@/lib/relayKoraGenerate";
import { RELAY_ROUNDS } from "@/lib/relayGame";
import { KoraConfigError } from "@/lib/koraServer";

export const dynamic = "force-dynamic";
// Grading a full room is many Claude calls behind bounded concurrency; the
// default serverless timeout is not enough for a 32-student class.
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { hostToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const session = await getSession(code);
  if (!session) return NextResponse.json({ error: "Room not found." }, { status: 404 });
  if (!body.hostToken || session.host_token !== body.hostToken) {
    return NextResponse.json({ error: "Only the host can grade this room." }, { status: 403 });
  }
  if (session.status === "results") {
    return NextResponse.json({ ok: true, alreadyGraded: true });
  }

  const [players, entries] = await Promise.all([getPlayers(code), getEntries(code)]);
  const seated = players.filter((p) => p.team_id && p.seat_index !== null);
  if (seated.length === 0) {
    return NextResponse.json({ error: "Nobody is seated in this room." }, { status: 400 });
  }

  // One essay per seated player, sections in round order. A round nobody wrote
  // becomes an empty string, which the grader is told to score as 0 rather than
  // silently skipping.
  const essays = seated.map((p) => {
    const sections: string[] = [];
    for (let r = 1; r <= RELAY_ROUNDS; r++) {
      sections.push(entries.find((e) => e.essay_owner_id === p.id && e.round === r)?.text ?? "");
    }
    return { essayOwnerId: p.id, sections };
  });

  await setStatus(code, "grading");

  try {
    const { results, failed, firstError } = await gradeRelayRoom(essays, {
      prompt: session.prompt,
      essayType: session.essay_type,
    });

    // A single essay failing is survivable — it comes back zeroed with an
    // explanation and the reveal still runs. Every essay failing is not: that's
    // systemic (no API key, upstream down), and publishing a leaderboard of
    // fake zeros would tell the class they all wrote nothing. Surface it
    // instead and let the host retry.
    if (failed === essays.length) {
      await setStatus(code, "writing");
      if (firstError instanceof KoraConfigError) {
        return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
      }
      return NextResponse.json(
        { error: "KORA couldn't reach the grader — nothing was scored. Try again in a moment." },
        { status: 502 }
      );
    }

    for (const { essayOwnerId, score } of results) {
      await saveScore(code, essayOwnerId, score);
    }
    await setStatus(code, "results");
    return NextResponse.json({ ok: true, graded: results.length, failed });
  } catch (err) {
    // Put the room back so the host can retry rather than stranding it in
    // "grading" forever.
    await setStatus(code, "writing");
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    console.error("[relay/grade] failed:", err);
    return NextResponse.json({ error: "Grading failed. Please try again." }, { status: 502 });
  }
}
