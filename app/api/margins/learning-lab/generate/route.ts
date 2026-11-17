import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { callKoraStructured, KoraConfigError, KoraValidationError } from "@/lib/koraServer";

const QuestionSchema = z.object({
  id: z.string().min(1),
  questionText: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2).max(6),
  correctAnswer: z.string().min(1),
  pointValue: z.number().positive(),
  standard: z.string().nullable(),
  skill: z.string().min(1),
  explanation: z.string().min(1),
  distractorExplanations: z.record(z.string(), z.string()),
  prerequisiteSkills: z.array(z.string()),
  materialRefs: z.array(z.string()),
  freshPractice: z.object({
    questionText: z.string().min(1),
    choices: z.array(z.string().min(1)).min(2),
    correctAnswer: z.string().min(1),
  }).optional(),
});

const LearningLabGenerateSchema = z.object({
  title: z.string().min(1),
  questions: z.array(QuestionSchema).min(1).max(50),
  context: z.object({
    vocabulary: z.array(z.string()),
    priorInstruction: z.array(z.string()),
    workedExamples: z.array(z.string()),
    prerequisiteKnowledge: z.array(z.string()),
    teacherMethods: z.array(z.string()),
  }),
});

const SYSTEM_PROMPT = `You help a teacher turn their notes, test, or study guide into a Practice & Relearn assignment.
Extract only the questions and facts supported by the teacher's material. Preserve answer keys when visible.
For each question, explain the correct answer, identify the measured skill, and create one fresh practice question testing the same skill in a different situation.
If an answer key is missing or ambiguous, make your best suggestion but clearly encode the uncertainty in the explanation and do not invent a confident fact.
Use short, age-appropriate wording. Never include student names, emails, or account identifiers in the output.`;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (isRateLimited(`margins-learning-lab-generate:${getClientIp(request)}`, 60 * 60 * 1000, 10)) {
    return NextResponse.json({ error: "Too many generation requests. Try again later." }, { status: 429 });
  }

  let formData: FormData;
  try { formData = await request.formData(); } catch {
    return NextResponse.json({ error: "Add notes or upload a test first." }, { status: 400 });
  }
  const notes = String(formData.get("notes") ?? "").trim();
  const file = formData.get("file");
  if (!notes && !(file instanceof File)) return NextResponse.json({ error: "Add notes or upload a test first." }, { status: 400 });
  if (file instanceof File && file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 15 MB." }, { status: 413 });

  const content: Array<Record<string, unknown>> = [];
  if (file instanceof File) {
    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    if (file.type === "application/pdf") {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
    } else if (file.type.startsWith("image/")) {
      content.push({ type: "image", source: { type: "base64", media_type: file.type, data } });
    }
  }
  content.push({ type: "text", text: notes || "Read the attached teacher material and build the assignment." });

  try {
    const { data } = await callKoraStructured({
      model: "claude-opus-4-8",
      maxTokens: 12000,
      system: SYSTEM_PROMPT,
      cacheSystemPrompt: true,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: content as never }],
      schema: LearningLabGenerateSchema,
    });
    return NextResponse.json({ assignment: data });
  } catch (error) {
    if (error instanceof KoraConfigError) return NextResponse.json({ error: "AI generation is not configured. Add ANTHROPIC_API_KEY." }, { status: 503 });
    if (error instanceof KoraValidationError) return NextResponse.json({ error: "AI returned an incomplete assignment. Try a clearer test or notes." }, { status: 422 });
    console.error("[learning-lab/generate]", error);
    return NextResponse.json({ error: "AI generation failed. Try again." }, { status: 502 });
  }
}
