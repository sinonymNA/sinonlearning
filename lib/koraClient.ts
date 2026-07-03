import type {
  KoraAnchorOutput,
  KoraDiagnosisOutput,
  KoraEvidenceEventsOutput,
  KoraEvaluateOutput,
  KoraGameEvalOutput,
  KoraGraphOutput,
  KoraMisconceptionSimOutput,
  KoraNextProbeOutput,
  KoraNotesOutput,
} from "@/lib/koraTypes";

async function callKora<T>(task_type: string, user_message: string): Promise<T> {
  const res = await fetch("/api/kora", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task_type, user_message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error?: string }).error ?? `KORA request failed (${res.status})`);
  }
  const { data } = await res.json();
  return data as T;
}

export function generateKoraNotes(params: {
  concept: string;
  subject: string;
  gradeLevel: string;
  sourceContent: string;
  standard?: string;
  teacherGoal?: string;
}): Promise<KoraNotesOutput> {
  const { concept, subject, gradeLevel, sourceContent, standard, teacherGoal } = params;
  const lines = [
    `Concept: ${concept}`,
    `Subject: ${subject} | Grade Band: ${gradeLevel}`,
  ];
  if (standard) lines.push(`Standard: ${standard}`);
  if (teacherGoal) lines.push(`Teacher Goal: ${teacherGoal}`);
  lines.push(`Source Content:\n${sourceContent}`);
  lines.push(`\nTask: Generate a KORA notes sheet for "${concept}" designed to maximize learner understanding, not just content coverage.`);
  return callKora<KoraNotesOutput>("notes_generation", lines.join("\n"));
}

export function generateGameProbes(params: {
  concept: string;
  subject: string;
  gradeLevel: string;
  sourceContent: string;
}): Promise<KoraEvidenceEventsOutput> {
  const { concept, subject, gradeLevel, sourceContent } = params;
  const message = [
    `Concept: ${concept}`,
    `Subject: ${subject} | Grade Band: ${gradeLevel}`,
    `Source Content:\n${sourceContent}`,
    `\nTask: Generate evidence-gathering events for "${concept}" that a teacher can use to make student understanding visible. Include 5 to 6 events spanning recognition, explanation, application, and transfer.`,
  ].join("\n");
  return callKora<KoraEvidenceEventsOutput>("evidence_events", message);
}

export function generateAnchor(params: {
  concept: string;
  sourceContent: string;
}): Promise<KoraAnchorOutput> {
  const { concept, sourceContent } = params;
  const message = [
    `Concept: ${concept}`,
    `Source Content:\n${sourceContent}`,
    `\nTask: Generate an anchor for "${concept}" that gives students a memorable entry point — a concrete analogy, a clear anchor statement, and the prerequisite concepts they need.`,
  ].join("\n");
  return callKora<KoraAnchorOutput>("anchor", message);
}

export function generateGraph(params: {
  concept: string;
  sourceContent: string;
}): Promise<KoraGraphOutput> {
  const { concept, sourceContent } = params;
  const message = [
    `Concept: ${concept}`,
    `Source Content:\n${sourceContent}`,
    `\nTask: Generate a concept graph for "${concept}" showing how sub-concepts, examples, and common misconceptions relate to the central idea.`,
  ].join("\n");
  return callKora<KoraGraphOutput>("graph", message);
}

export function evaluateResponse(params: {
  concept: string;
  sourceContent: string;
  probe: string;
  studentResponse: string;
}): Promise<KoraEvaluateOutput> {
  const { concept, sourceContent, probe, studentResponse } = params;
  const message = [
    `Concept: ${concept}`,
    `Source Content:\n${sourceContent}`,
    `Probe Question: ${probe}`,
    `Student Response: ${studentResponse}`,
    `\nTask: Evaluate this student response for "${concept}". Identify the evidence level, any misconceptions, and the best next instructional move.`,
  ].join("\n");
  return callKora<KoraEvaluateOutput>("evaluate", message);
}

export function diagnoseMisconception(params: {
  concept: string;
  studentResponse: string;
}): Promise<KoraDiagnosisOutput> {
  const { concept, studentResponse } = params;
  const message = [
    `Concept: ${concept}`,
    `Student Response: ${studentResponse}`,
    `\nTask: Diagnose the primary misconception in this student response about "${concept}". Identify the misconception category and suggest an intervention.`,
  ].join("\n");
  return callKora<KoraDiagnosisOutput>("diagnosis", message);
}

export function simulateMisconception(params: {
  concept: string;
  misconceptionLabel: string;
}): Promise<KoraMisconceptionSimOutput> {
  const { concept, misconceptionLabel } = params;
  const message = [
    `Concept: ${concept}`,
    `Misconception: ${misconceptionLabel}`,
    `\nTask: Simulate what a student response looks like when holding this misconception about "${concept}". Show why it sounds plausible and what the key error is.`,
  ].join("\n");
  return callKora<KoraMisconceptionSimOutput>("misconception_sim", message);
}

export function generateNextProbe(params: {
  concept: string;
  sourceContent: string;
  evidenceLevel: string;
}): Promise<KoraNextProbeOutput> {
  const { concept, sourceContent, evidenceLevel } = params;
  const message = [
    `Concept: ${concept}`,
    `Source Content:\n${sourceContent}`,
    `Current Evidence Level: ${evidenceLevel}`,
    `\nTask: Generate the best next probe question for a student at the "${evidenceLevel}" level of understanding of "${concept}".`,
  ].join("\n");
  return callKora<KoraNextProbeOutput>("next_probe", message);
}

export function evaluateGameResponse(params: {
  concept: string;
  sourceContent: string;
  probe: string;
  studentResponse: string;
}): Promise<KoraGameEvalOutput> {
  const { concept, sourceContent, probe, studentResponse } = params;
  const message = [
    `Concept: ${concept}`,
    `Source Content:\n${sourceContent}`,
    `Probe Question: ${probe}`,
    `Student Response: ${studentResponse}`,
    `\nTask: Evaluate this game response for "${concept}". Return points (0-100), understanding level, misconception detection, and brief motivating feedback.`,
  ].join("\n");
  return callKora<KoraGameEvalOutput>("game_response_eval", message);
}
