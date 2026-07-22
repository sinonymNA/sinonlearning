import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callKoraStructured } from "@/lib/koraServer";
import { getSession, getStudentResponses } from "@/lib/sourceRoomDb";

export const dynamic = "force-dynamic";

const QuestionGradeSchema = z.object({
  question_id: z.string(),
  score: z.number().int().min(0).max(3),
  label: z.enum(["Strong", "Developing", "Needs Work", "No Response"]),
  feedback: z.string(),
});

const GradeOutputSchema = z.object({
  grades: z.array(QuestionGradeSchema),
  overall_feedback: z.string(),
});

const SYSTEM_PROMPT = `You are an AP World History teacher grading primary source analysis responses.

Your job is to give brief, encouraging, actionable feedback for each HAPP question the student answered.

Scoring rubric (0–3 per question):
- 3 (Strong): Directly addresses the prompt using specific details from or about the source
- 2 (Developing): Partially addresses the prompt — has the right idea but is vague or missing evidence
- 1 (Needs Work): Minimal engagement; too general or doesn't connect back to the source
- 0 (No Response): Blank or essentially no attempt

Feedback guidelines:
- 1–2 sentences maximum
- Name one thing done well AND one specific improvement
- Use the student's actual words/ideas when affirming
- Be encouraging — these are timed, in-class responses`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const body = await request.json().catch(() => null);
  if (!body || typeof body.studentToken !== "string") {
    return NextResponse.json({ error: "studentToken required." }, { status: 400 });
  }

  const session = await getSession(code);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const responses = await getStudentResponses(code, body.studentToken);

  // Build the user message with source + all Q&A pairs
  const sourceBlock = [
    `Source Label: ${session.source_label}`,
    session.source_text ? `Source Text:\n${session.source_text}` : "",
    session.source_citation ? `Citation: ${session.source_citation}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const qaBlock = session.questions
    .map((q) => {
      const r = responses.find((x) => x.question_id === q.id);
      return `Question (${q.id}): ${q.prompt}\nStudent Response: ${r?.response_text?.trim() || "(no response)"}`;
    })
    .join("\n\n");

  const userMessage = `${sourceBlock}\n\n---\n\n${qaBlock}\n\n---\n\nPlease grade each question response. Use the exact question_id values shown above.`;

  try {
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 1024,
      system: SYSTEM_PROMPT,
      cacheSystemPrompt: true,
      messages: [{ role: "user", content: userMessage }],
      schema: GradeOutputSchema,
    });

    return NextResponse.json(data);
  } catch (e) {
    console.error("Source Room grade error:", e);
    return NextResponse.json({ error: "Grading unavailable." }, { status: 503 });
  }
}
