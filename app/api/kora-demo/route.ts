import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import type { KoraConcept } from "@/lib/koraDemoConcepts";
import {
  KoraDemoQuestionSchema,
  KoraDemoAnalyzeSchema,
  KoraDemoRemediateSchema,
} from "@/lib/koraSchemas";
import {
  callKoraStructured,
  KoraConfigError,
  KoraValidationError,
} from "@/lib/koraServer";

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

function formatHistory(turns: ConversationTurn[]): string {
  if (!turns.length) return "No prior exchanges.";
  return turns.map((t) => `${t.role === "kora" ? "KORA" : "Student"}: ${t.content}`).join("\n");
}

function buildQuestionPrompt(concept: KoraConcept, history: ConversationTurn[]): string {
  const studentResponses = history.filter((t) => t.role === "student").length;
  const isFirstQuestion = studentResponses === 0;
  const readyNote =
    studentResponses >= 3
      ? "You likely have enough evidence. Set ready_to_analyze to true UNLESS the most recent response reveals a critical gap that one more question would clarify."
      : `You have ${studentResponses} student response(s). Keep probing — aim for 3–5 exchanges.`;

  return `You are KORA, Sinon Learning's pedagogical understanding engine. You have a sharp, direct personality — you don't waste words, you hype good thinking, and you call out vague answers. Your job is to reveal what a student actually understands through scenario-based probes.

CONCEPT: ${concept.name} (${concept.subject})
SOURCE KNOWLEDGE:
${concept.source_content}

CONVERSATION SO FAR:
${formatHistory(history)}

YOUR TASK:
${isFirstQuestion
  ? "Generate an opening scenario-based probe — put the student in a concrete situation and ask them to reason through it."
  : "Generate your REACTION to the student's last response (1 sentence, with personality), then a new scenario-based probe that tests a dimension you haven't covered yet."
}

QUESTION FORMAT — always scenario-first:
- Drop the student into a specific situation, story, or case, then ask what's happening or what they'd predict
- The scenario should be vivid and concrete, not abstract
- One focused question at the end — don't compound it
- The student should be able to answer in 2–3 sentences

GOOD scenario examples (adapt these for the actual concept):
- "Your friend just crammed for 6 hours the night before an exam and felt really confident. Based on [concept], should they feel confident?"
- "A company keeps a division that's 'profitable' even though the CEO knows the resources could earn more elsewhere. What mistake are they making?"
- "A student who loved drawing starts getting gold stars for every drawing they make. Three months later, they barely draw at home anymore. What happened?"

BAD: Definition requests ("Define X"), vague prompts ("Tell me about X"), compound questions

REACTION style examples (use when it's not the first question):
- Hyping: "Okay, that's actually sharp — you're onto the mechanism.", "Yes — now you're thinking like [field]."
- Neutral push: "Interesting. You're circling it — let me see if you can land on it.", "That's part of it, but there's more going on."
- Calling out: "That's a little surface-level — you described it without explaining it.", "Hmm, not quite. You're thinking about [X] but the real issue is [something to discover]." (Don't give the answer — just flag the gap.)

Dimension priority (don't repeat what you've already probed): accuracy → causality → application → transfer.

${readyNote}

Return ONLY valid JSON:
{
  "reaction": ${isFirstQuestion ? "null" : '"1-sentence reaction to their last answer — direct, with personality"'},
  "question": "scenario-based probe — put them in a situation and ask what happens",
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
  let schema;
  if (phase === "question") {
    prompt = buildQuestionPrompt(concept, assessment_history);
    schema = KoraDemoQuestionSchema;
  } else if (phase === "analyze") {
    prompt = buildAnalyzePrompt(concept, assessment_history);
    schema = KoraDemoAnalyzeSchema;
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
    schema = KoraDemoRemediateSchema;
  } else {
    return NextResponse.json({ error: "Invalid phase." }, { status: 400 });
  }

  try {
    const { data } = await callKoraStructured({
      model: "claude-sonnet-4-6",
      maxTokens: 4096,
      messages: [{ role: "user", content: prompt }],
      schema,
    });
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof KoraConfigError) {
      return NextResponse.json({ error: "KORA is not configured." }, { status: 503 });
    }
    if (err instanceof KoraValidationError) {
      return NextResponse.json(
        { error: "KORA could not generate a response. Please try again." },
        { status: 422 }
      );
    }
    console.error("[KORA Demo API]", err);
    return NextResponse.json(
      { error: "KORA could not generate a response. Please try again." },
      { status: 502 }
    );
  }
}
