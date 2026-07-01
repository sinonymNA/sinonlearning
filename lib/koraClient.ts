import type { KoraEvidenceEventsOutput, KoraNotesOutput } from "@/lib/koraTypes";

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
