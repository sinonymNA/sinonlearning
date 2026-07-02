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
    studentResponses >= 3
      ? "You have enough evidence to analyze. Set ready_to_analyze to true UNLESS one more question would clarify a critical gap."
      : `You have ${studentResponses} student response(s). Continue gathering evidence — aim for 3–5 exchanges.`;

  return `You are KORA, Sinon Learning's pedagogical understanding engine. Your job is to reveal what a student understands through evidence-gathering questions — not to teach or confirm correct answers.

CONCEPT: ${concept.name} (${concept.subject})
SOURCE KNOWLEDGE:
${concept.source_content}

CONVERSATION SO FAR:
${formatHistory(history)}

YOUR TASK: Generate ONE formative question that probes a dimension of understanding not yet evidenced. Priority order: accuracy → causality → application → transfer. Do not repeat a dimension already well-evidenced.

${readyNote}

Return ONLY valid JSON (no markdown, no extra text):
{
  "question": "open-ended question requiring explanation, not recall",
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
  const masteryCheck =
    remediationHistory.filter((t) => t.role === "student").length >= 3
      ? "You have had several exchanges. If the student has clearly articulated the core mechanism in their own words and can apply it, set mastery_unlocked: true."
      : "Continue building toward the conceptual gap in the path_to_mastery.";

  return `You are KORA operating in Socratic remediation mode. Your ONLY tool is questions. You NEVER give answers, explanations, or tell the student they are correct or incorrect. You guide them to discover the understanding themselves.

CONCEPT: ${concept.name} (${concept.subject})
SOURCE KNOWLEDGE:
${concept.source_content}

STUDENT MENTAL MODEL (from prior assessment):
Overall Level: ${mentalModel.overall_level}
Key Gaps: ${mentalModel.gaps.join("; ") || "none identified"}
Misconceptions: ${mentalModel.misconceptions.join("; ") || "none detected"}
Path to Mastery: ${mentalModel.path_to_mastery}

ASSESSMENT CONVERSATION (for context):
${formatHistory(assessmentHistory)}

SOCRATIC REMEDIATION SO FAR:
${formatHistory(remediationHistory)}

RULES:
1. NEVER state the answer or explanation directly
2. NEVER say "correct!" or "exactly!" — acknowledge what they said and probe deeper
3. Each question should move them one step closer to discovering the core mechanism
4. Target the most critical gap or misconception first, then work outward
5. mastery_unlocked: true ONLY when the student has articulated the core concept in their own words and demonstrated they can apply or extend it

${masteryCheck}

Return ONLY valid JSON:
{
  "acknowledgment": "1–2 sentences noticing what the student said without evaluating it as right or wrong",
  "question": "one focused Socratic question — short, one idea only",
  "understanding_signal": "what this question is trying to surface",
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
