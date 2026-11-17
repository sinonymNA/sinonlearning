import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callKoraStructured, KoraConfigError, KoraUpstreamError, KoraValidationError } from "@/lib/koraServer";

const turnSchema = z.object({
  role: z.enum(["student", "tutor"]),
  text: z.string().min(1).max(2000),
});

const requestSchema = z.object({
  concept: z.string().min(1).max(160),
  question: z.string().min(1).max(2000),
  correctAnswer: z.string().min(1).max(1000),
  stage: z.enum(["revisit", "diagnose", "teach", "practice", "verify"]),
  turns: z.array(turnSchema).max(12),
  studentMessage: z.string().min(1).max(2000),
});

const responseSchema = z.object({
  tutorMessage: z.string().min(1).max(1200),
  stage: z.enum(["revisit", "diagnose", "teach", "practice", "verify"]),
  evidence: z.object({
    understandingSignal: z.enum(["none", "partial", "strong"]),
    explanation: z.string().max(500),
  }),
  isReadyToAdvance: z.boolean(),
  nextAction: z.enum(["ask_follow_up", "give_hint", "teach_with_example", "give_fresh_question", "celebrate_and_advance"]),
});

const tutorSystem = `You are Margins Learning Lab, a warm, lightly playful AI tutor. You are transparent that you are an AI.
Have a real conversation: remember what the student said earlier and refer back to it. Ask one manageable question at a time.
Never shame, insult, mock, threaten, or call an answer lousy. If the student says "I don't know", respond with encouraging firmness such as:
"I don't think you're stuck yet—let's try one tiny clue together." Then give a small hint or ask a simpler question.
Do not reveal the answer immediately during diagnosis. Use the teacher-provided answer and concept as hidden grading context.
A student is only ready to advance when they independently explain the key idea in their own words and apply it to a new situation. A guess, repeating the tutor, or selecting the right choice without reasoning is not enough.
When ready, set isReadyToAdvance true and nextAction celebrate_and_advance. Otherwise keep isReadyToAdvance false.
Keep replies concise and conversational. Provide a small explanation or example only when the current stage calls for teaching.`;

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const compactTurns = body.turns.slice(-8);
    const { data } = await callKoraStructured({
      model: "claude-haiku-4-5",
      maxTokens: 500,
      system: tutorSystem,
      messages: [{
        role: "user",
        content: `Concept: ${body.concept}
Original question: ${body.question}
Correct answer (private grading context): ${body.correctAnswer}
Current stage: ${body.stage}
Conversation so far:
${compactTurns.map((turn) => `${turn.role}: ${turn.text}`).join("\n")}

New student message:
${body.studentMessage}`,
      }],
      schema: responseSchema,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid tutoring request." }, { status: 400 });
    if (error instanceof KoraConfigError) return NextResponse.json({ error: "AI tutoring is not configured. Add ANTHROPIC_API_KEY." }, { status: 503 });
    if (error instanceof KoraUpstreamError || error instanceof KoraValidationError) return NextResponse.json({ error: "The tutor is temporarily unavailable. Please try again." }, { status: 502 });
    return NextResponse.json({ error: "Unable to continue the tutoring conversation." }, { status: 500 });
  }
}
