import { NextRequest, NextResponse } from "next/server";
import { getSession, getPlayers, getTeams, getEntries, getScores } from "@/lib/relayDb";
import { essaySeatForRound, moveForRound, crestById, RELAY_ROUNDS } from "@/lib/relayGame";

export const dynamic = "force-dynamic";

// The single polled endpoint for both the host screen and every student screen.
// Returns the shared room state plus, when a studentToken is supplied, the
// caller's own assignment for the current round — so a student's client never
// has to derive who is holding what and can't disagree with the server.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const studentToken = request.nextUrl.searchParams.get("studentToken");

  const session = await getSession(code);
  if (!session) return NextResponse.json({ error: "Room not found." }, { status: 404 });

  const [players, teams, entries] = await Promise.all([
    getPlayers(code),
    getTeams(code),
    getEntries(code),
  ]);

  const playerById = new Map(players.map((p) => [p.id, p]));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const round = session.current_round;

  const publicTeams = teams.map((t) => {
    const roster = players
      .filter((p) => p.team_id === t.id)
      .sort((a, b) => (a.seat_index ?? 0) - (b.seat_index ?? 0));
    return {
      id: t.id,
      index: t.team_index,
      crest: crestById(t.crest_id),
      members: roster.map((p) => ({ id: p.id, name: p.display_name, seat: p.seat_index ?? 0 })),
    };
  });

  // Progress for the host readout: how many of this round's essays have text.
  const writtenThisRound = entries.filter(
    (e) => e.round === round && e.text.trim().length > 0
  ).length;

  // ── Caller-specific assignment ─────────────────────────────────────────────
  let me: unknown = null;
  if (studentToken) {
    const player = players.find((p) => p.student_token === studentToken);
    if (player) {
      const team = player.team_id ? teamById.get(player.team_id) : null;
      const teammates = team
        ? players
            .filter((p) => p.team_id === team.id)
            .sort((a, b) => (a.seat_index ?? 0) - (b.seat_index ?? 0))
        : [];
      const teamSize = teammates.length;

      let assignment: unknown = null;
      if (session.status === "writing" && team && player.seat_index !== null && teamSize > 0) {
        const holdingSeat = essaySeatForRound(player.seat_index, round, teamSize);
        const owner = teammates[holdingSeat];
        if (owner) {
          const prior = entries
            .filter((e) => e.essay_owner_id === owner.id && e.round < round)
            .sort((a, b) => a.round - b.round)
            .map((e) => ({
              round: e.round,
              move: moveForRound(e.round),
              text: e.text,
              authorName: playerById.get(e.author_id)?.display_name ?? "A teammate",
            }));
          const mine = entries.find((e) => e.essay_owner_id === owner.id && e.round === round);
          assignment = {
            essayOwnerId: owner.id,
            essayOwnerName: owner.id === player.id ? "your own" : `${owner.display_name}'s`,
            isOwnEssay: owner.id === player.id,
            move: moveForRound(round),
            prior,
            text: mine?.text ?? "",
          };
        }
      }

      me = {
        id: player.id,
        name: player.display_name,
        seat: player.seat_index,
        team: team ? { id: team.id, index: team.team_index, crest: crestById(team.crest_id) } : null,
        teammates: teammates.map((p) => ({ id: p.id, name: p.display_name, seat: p.seat_index ?? 0 })),
        assignment,
      };
    }
  }

  // ── Results ────────────────────────────────────────────────────────────────
  let results: unknown = null;
  if (session.status === "results") {
    const scores = await getScores(code);
    const scoreByOwner = new Map(scores.map((s) => [s.essay_owner_id, s.score]));

    const essays = players
      .filter((p) => p.team_id && p.seat_index !== null)
      .map((p) => {
        const chain = entries
          .filter((e) => e.essay_owner_id === p.id)
          .sort((a, b) => a.round - b.round)
          .map((e) => ({
            round: e.round,
            move: moveForRound(e.round),
            text: e.text,
            authorName: playerById.get(e.author_id)?.display_name ?? "—",
          }));
        return {
          essayOwnerId: p.id,
          ownerName: p.display_name,
          teamId: p.team_id,
          chain,
          score: scoreByOwner.get(p.id) ?? null,
        };
      });

    const leaderboard = publicTeams
      .map((t) => {
        const mine = essays.filter((e) => e.teamId === t.id);
        const total = mine.reduce((s, e) => s + (e.score?.total ?? 0), 0);
        const possible = mine.reduce((s, e) => s + (e.score?.possible ?? 0), 0);
        return {
          teamId: t.id,
          crest: t.crest,
          members: t.members,
          total,
          possible,
          perfectCount: mine.filter((e) => e.score?.perfect).length,
        };
      })
      .sort((a, b) => b.total - a.total || b.perfectCount - a.perfectCount);

    results = { essays, leaderboard };
  }

  return NextResponse.json({
    code: session.code,
    prompt: session.prompt,
    essayType: session.essay_type,
    status: session.status,
    round,
    totalRounds: RELAY_ROUNDS,
    move: session.status === "writing" ? moveForRound(round) : null,
    roundSeconds: session.round_seconds,
    roundStartedAt: session.round_started_at,
    playerCount: players.length,
    teams: publicTeams,
    lobbyPlayers: players.map((p) => ({ id: p.id, name: p.display_name })),
    writtenThisRound,
    essayCount: players.filter((p) => p.team_id).length,
    me,
    results,
  });
}
