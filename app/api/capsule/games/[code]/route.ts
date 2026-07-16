import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/capsuleAuth";
import { getGame, getPlayers, getAnswersForQuestion } from "@/lib/capsuleDb";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const user = await getCurrentUser();
  // Anonymous players (e.g. demo students) pass their playerId as a query param
  const pidParam = req.nextUrl.searchParams.get("pid");

  const game = await getGame(code);
  if (!game) return NextResponse.json({ error: "Game not found." }, { status: 404 });

  const players = await getPlayers(code);

  // Logged-in users are matched by user_id; anonymous players by explicit pid param
  const myPlayer = user
    ? (players.find(p => p.user_id === user.id) ?? null)
    : pidParam
    ? (players.find(p => p.id === pidParam) ?? null)
    : null;

  // Get answers for current question (to tell players if they've answered)
  const answers = game.status === "active"
    ? await getAnswersForQuestion(code, game.current_question)
    : [];

  const answeredIds = new Set(answers.map(a => a.player_id));
  const myAnswer = myPlayer ? answers.find(a => a.player_id === myPlayer.id) ?? null : null;

  return NextResponse.json({
    code: game.code,
    title: game.title,
    status: game.status,
    hostId: game.host_id,
    currentQuestion: game.current_question,
    totalQuestions: (game.questions as unknown[]).length,
    questionStartedAt: game.question_started_at,
    // Only reveal question data when game is active
    currentQuestionData: game.status === "active"
      ? (game.questions as { prompt: string; choices: string[]; timeLimit: number }[])[game.current_question]
      : null,
    players: players.map(p => ({
      id: p.id,
      displayName: p.display_name,
      capId: p.cap_id,
      gold: p.gold,
      hasAnswered: answeredIds.has(p.id),
    })),
    myPlayerId: myPlayer?.id ?? null,
    myAnswer: myAnswer
      ? { answerIndex: myAnswer.answer_index, isCorrect: myAnswer.is_correct, chestResult: myAnswer.chest_result }
      : null,
    answerCount: answers.length,
    playerCount: players.length,
    isHost: user?.id === game.host_id,
  });
}
