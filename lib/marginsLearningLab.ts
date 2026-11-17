/**
 * Learning Lab domain contracts.
 *
 * This module is intentionally framework-agnostic. API routes own authorization,
 * persistence, and model calls; this file owns the allowed tutoring stages and
 * transitions so the model cannot advance a student outside the current stage.
 */

export type LearningLabAssignmentType = "writing_lab" | "practice_relearn";

export type RemediationStage =
  | "revisit"
  | "ask_why"
  | "diagnose"
  | "teach"
  | "practice"
  | "verify"
  | "continue";

export type LearningStatus =
  | "needs_practice"
  | "improving"
  | "demonstrated_with_support"
  | "demonstrated_independently";

export type StudentReason =
  | "i_guessed"
  | "i_was_stuck"
  | "selected_because"
  | "other";

export interface LearningLabQuestion {
  id: string;
  questionText: string;
  choices: string[];
  correctAnswer: string;
  pointValue: number;
  standard: string | null;
  skill: string;
  explanation: string;
  distractorExplanations: Record<string, string>;
  prerequisiteSkills: string[];
  materialRefs: string[];
  freshPractice?: {
    questionText: string;
    choices: string[];
    correctAnswer: string;
  };
}

export interface PublishedAssignmentSnapshot {
  assignmentId: string;
  version: number;
  type: LearningLabAssignmentType;
  classId: string;
  title: string;
  questions: LearningLabQuestion[];
  context: {
    vocabulary: string[];
    priorInstruction: string[];
    workedExamples: string[];
    prerequisiteKnowledge: string[];
    teacherMethods: string[];
  };
  publishedAt: string;
}

export interface RemediationState {
  assignmentId: string;
  assignmentVersion: number;
  studentId: string;
  stage: RemediationStage;
  missedQuestionIds: string[];
  currentQuestionId: string | null;
  originalAnswers: Record<string, string>;
  explanations: Record<string, string>;
  tentativeDiagnoses: Record<string, string>;
  supportsUsed: string[];
  practiceResults: Array<{
    questionId: string;
    correct: boolean;
    requiredSupport: boolean;
  }>;
  statuses: Record<string, LearningStatus>;
  updatedAt: string;
}

export interface TutorProposal {
  message: string;
  nextStage: RemediationStage;
  evidence: string[];
  supportUsed?: string;
  status?: LearningStatus;
}

const STAGE_ORDER: RemediationStage[] = [
  "revisit",
  "ask_why",
  "diagnose",
  "teach",
  "practice",
  "verify",
  "continue",
];

const ALLOWED_TRANSITIONS: Record<RemediationStage, RemediationStage[]> = {
  revisit: ["ask_why"],
  ask_why: ["diagnose"],
  diagnose: ["teach", "practice"],
  teach: ["practice"],
  practice: ["verify", "teach"],
  verify: ["continue", "teach", "practice"],
  continue: ["revisit", "practice"],
};

export function isValidRemediationTransition(
  currentStage: RemediationStage,
  proposedStage: RemediationStage
): boolean {
  return ALLOWED_TRANSITIONS[currentStage].includes(proposedStage);
}

export function validateTutorProposal(
  currentStage: RemediationStage,
  proposal: TutorProposal
): TutorProposal {
  if (!proposal.message.trim()) {
    throw new Error("Tutor proposal must include a message.");
  }
  if (!proposal.evidence.length) {
    throw new Error("Tutor proposal must include evidence for its next action.");
  }
  if (!isValidRemediationTransition(currentStage, proposal.nextStage)) {
    throw new Error(
      `Invalid tutoring transition: ${currentStage} -> ${proposal.nextStage}.`
    );
  }
  return proposal;
}

export function createInitialRemediationState(params: {
  assignment: PublishedAssignmentSnapshot;
  studentId: string;
  originalAnswers: Record<string, string>;
}): RemediationState {
  const missedQuestionIds = params.assignment.questions
    .filter((question) => params.originalAnswers[question.id] !== question.correctAnswer)
    .map((question) => question.id);

  return {
    assignmentId: params.assignment.assignmentId,
    assignmentVersion: params.assignment.version,
    studentId: params.studentId,
    stage: "revisit",
    missedQuestionIds,
    currentQuestionId: missedQuestionIds[0] ?? null,
    originalAnswers: { ...params.originalAnswers },
    explanations: {},
    tentativeDiagnoses: {},
    supportsUsed: [],
    practiceResults: [],
    statuses: Object.fromEntries(
      missedQuestionIds.map((questionId) => [questionId, "needs_practice"])
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function scoreAssessment(
  assignment: PublishedAssignmentSnapshot,
  answers: Record<string, string>
): { score: number; maxScore: number; missedQuestionIds: string[] } {
  return assignment.questions.reduce(
    (result, question) => {
      result.maxScore += question.pointValue;
      if (answers[question.id] === question.correctAnswer) {
        result.score += question.pointValue;
      } else {
        result.missedQuestionIds.push(question.id);
      }
      return result;
    },
    { score: 0, maxScore: 0, missedQuestionIds: [] as string[] }
  );
}

/** Keep provider payloads free of names, emails, class names, and account IDs. */
export function buildTutorContext(params: {
  question: LearningLabQuestion;
  state: RemediationState;
  studentMessage?: string;
}) {
  const { question, state, studentMessage } = params;
  return {
    question: {
      text: question.questionText,
      choices: question.choices,
      selectedAnswer: state.originalAnswers[question.id] ?? null,
      skill: question.skill,
      standard: question.standard,
      explanation: question.explanation,
      distractorExplanation:
        state.originalAnswers[question.id]
          ? question.distractorExplanations[state.originalAnswers[question.id]]
          : null,
    },
    stage: state.stage,
    priorExplanation: state.explanations[question.id] ?? null,
    tentativeDiagnosis: state.tentativeDiagnoses[question.id] ?? null,
    supportsUsed: state.supportsUsed,
    studentMessage: studentMessage ?? null,
  };
}

export function getStageNumber(stage: RemediationStage): number {
  return STAGE_ORDER.indexOf(stage) + 1;
}

