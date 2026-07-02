import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import type { KoraConcept } from "@/lib/koraDemoConcepts";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 60;

export type ConversationTurn = { role: "kora" | "student"; content: string };

export type MentalModel = {
  overall_level: "Not Yet Shown" | "Emerging" | "Solid" | "Strong";
  strengths: string[];
  gaps: string[];
  misconceptions: string[];
  summary: string;
  path_to_mastery: string;
};

interface DemoRequestBody {
  phase: "question" | "analyze" | "remediate";
  concept: KoraConcept;
  assessment_history: ConversationTurn[];
  mental_model?: MentalModel;
  remediation_history?: ConversationTurn[];
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

function formatHistory(turns: ConversationTurn[]): string {
  if (!turns.length) return "No prior exchanges.";
  return turns.map((t) => `${t.role === "kora" ? "KORA" : "Student"}: ${t.content}`).join("\n");
}

function buildQuestionPrompt(concept: KoraConcept, history: ConversationTurn[]): string {
  const studentResponses = history.filter((t) => t.role === "student").length;
  const readyNote =
    studentResponses >= 4
      ? "You likely have enough evidence to analyze. Set ready_to_analyze to true UNLESS the most recent response reveals a critical gap that ONE more targeted question would clarify."
      : `You have ${studentResponses} student response(s). Aim for 4–6 short focused exchanges before analyzing.`;

  return `You are KORA, Sinon Learning's pedagogical understanding engine. Your job is to reveal what a student understands through short, targeted probes — not to teach.

CONCEPT: ${concept.name} (${concept.subject})
SOURCE KNOWLEDGE:
${concept.source_content}

CONVERSATION SO FAR:
${formatHistory(history)}

YOUR TASK: Generate ONE short, focused probe. Requirements:
- The student must be able to answer in 1–2 sentences — not a paragraph
- Target ONE thing: a definition, an example, a comparison, a cause, a prediction, or a scenario
- Make it concrete and specific, not "explain the concept"
- Vary the format: "What does X mean when Y happens?", "Give me one example of Z", "What's the key difference between A and B?", "If [scenario], what does that tell you?"
- Never compound — one idea per question

BAD: "Can you explain what [concept] means and give examples of how it works in real life?"
GOOD: "Give me one real-world example of [concept] happening."
GOOD: "What happens to [X] when [Y]? Just one sentence."

Priority order for dimensions not yet probed: accuracy → causality → application → transfer.

${readyNote}

Return ONLY valid JSON:
{
  "question": "short focused probe — one sentence if possible",
  "dimension": "accuracy|causality|application|transfer",
  "ready_to_analyze": false
}`;
}

function buildAnalyzePrompt(concept: KoraConcept, history: ConversationTurn[]): string {
  return `You are KORA, Sinon Learning's pedagogical understanding engine. Build a precise mental model of this student's understanding based solely on evidence in their responses.

CONCEPT: ${concept.name} (${concept.subject})
SOURCE KNOWLEDGE:
${concept.source_content}

FULL CONVERSATION:
${formatHistory(history)}

Understanding levels:
- "Not Yet Shown": Off-target, empty, or entirely incorrect responses
- "Emerging": Surface understanding; misses causal mechanisms or has significant misconceptions
- "Solid": Accurate core understanding with minor gaps
- "Strong": Accurate explanation of concept and mechanism; can apply or transfer it

Be specific — cite what the student actually said. Do not infer understanding that wasn't demonstrated.

Return ONLY valid JSON:
{
  "overall_level": "Not Yet Shown|Emerging|Solid|Strong",
  "strengths": ["specific things evidenced by the student's responses"],
  "gaps": ["specific things not demonstrated or incorrect"],
  "misconceptions": ["incorrect beliefs evident in responses — empty array if none"],
  "summary": "2–3 sentence synthesis of understanding and what is missing",
  "path_to_mastery": "the specific conceptual shift needed to reach Strong — concrete, not generic"
}`;
}

function buildRemediatePrompt(
  concept: KoraConcept,
  assessmentHistory: ConversationTurn[],
  mentalModel: MentalModel,
  remediationHistory: ConversationTurn[]
): string {
  const exchangeCount = remediationHistory.filter((t) => t.role === "student").length;
  const masteryNote =
    exchangeCount >= 5
      ? "After this many exchanges, if the student has shown meaningful movement toward the key insight — even imperfectly — set mastery_unlocked: true. Look for genuine engagement with the idea, not perfect articulation."
      : exchangeCount >= 3
      ? "If the student has demonstrated the core mechanism in their own words and can apply or extend it, set mastery_unlocked: true."
      : "Continue guiding — they need more exchanges to reach the insight.";

  return `You are KORA operating in Socratic remediation mode. Your ONLY tool is questions. You NEVER give answers or explanations. You guide the student to discover the understanding themselves.

CONCEPT: ${concept.name} (${concept.subject})
SOURCE KNOWLEDGE:
${concept.source_content}

STUDENT MENTAL MODEL (from assessment):
Level: ${mentalModel.overall_level}
Gaps: ${mentalModel.gaps.join("; ") || "none"}
Misconceptions: ${mentalModel.misconceptions.join("; ") || "none"}
Path to Mastery: ${mentalModel.path_to_mastery}

ASSESSMENT CONVERSATION:
${formatHistory(assessmentHistory)}

SOCRATIC EXCHANGES SO FAR (${exchangeCount} student responses):
${formatHistory(remediationHistory)}

RULES:
1. NEVER state the answer or give an explanation
2. NEVER evaluate as correct or incorrect — just acknowledge and ask
3. Keep each question short — one idea, one sentence if possible
4. Target the most critical gap first, then build outward
5. Questions should help them reason ONE step forward, not multiple

${masteryNote}

Return ONLY valid JSON:
{
  "acknowledgment": "1–2 sentences noticing what they said — no evaluation",
  "question": "one short Socratic question",
  "understanding_signal": "what you're trying to surface",
  "mastery_unlocked": false
}`;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`kora-demo:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a little while." },
      { status: 429 }
    );
  }

  let body: DemoRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { phase, concept, assessment_history, mental_model, remediation_history } = body;

  if (!phase || !concept || !Array.isArray(assessment_history)) {
    return NextResponse.json(
      { error: "phase, concept, and assessment_history are required." },
      { status: 400 }
    );
  }

  let prompt: string;
  if (phase === "question") {
    prompt = buildQuestionPrompt(concept, assessment_history);
  } else if (phase === "analyze") {
    prompt = buildAnalyzePrompt(concept, assessment_history);
  } else if (phase === "remediate") {
    if (!mental_model) {
      return NextResponse.json({ error: "mental_model is required for remediate phase." }, { status: 400 });
    }
    prompt = buildRemediatePrompt(
      concept,
      assessment_history,
      mental_model,
      remediation_history ?? []
    );
  } else {
    return NextResponse.json({ error: "Invalid phase." }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    const jsonStr = extractJson(raw);
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[KORA Demo API]", err);
    return NextResponse.json(
      { error: "KORA could not generate a response. Please try again." },
      { status: 502 }
    );
  }
}
