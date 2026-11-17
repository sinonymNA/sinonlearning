import { randomUUID } from "crypto";
import { query } from "./db";
import type {
  LearningLabAssignmentType,
  LearningLabQuestion,
  PublishedAssignmentSnapshot,
  RemediationState,
  LearningStatus,
} from "./marginsLearningLab";

let ready: Promise<void> | null = null;

export function ensureLearningLabSchema(): Promise<void> {
  if (!ready) {
    ready = query(`CREATE TABLE IF NOT EXISTS margins_learning_assignments (
      id UUID PRIMARY KEY,
      class_id UUID NOT NULL REFERENCES margins_classes(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('writing_lab','practice_relearn')),
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      current_version INTEGER NOT NULL DEFAULT 0,
      created_by UUID NOT NULL REFERENCES margins_users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`)
      .then(() => query(`CREATE TABLE IF NOT EXISTS margins_learning_assignment_versions (
        id UUID PRIMARY KEY,
        assignment_id UUID NOT NULL REFERENCES margins_learning_assignments(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        snapshot JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (assignment_id, version)
      `))
      .then(() => query(`CREATE TABLE IF NOT EXISTS margins_learning_assessment_attempts (
        id UUID PRIMARY KEY,
        assignment_id UUID NOT NULL REFERENCES margins_learning_assignments(id) ON DELETE CASCADE,
        assignment_version INTEGER NOT NULL,
        student_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
        answers JSONB NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted')),
        score NUMERIC,
        max_score NUMERIC,
        missed_question_ids JSONB NOT NULL DEFAULT '[]',
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        submitted_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      `))
      .then(() => query(`CREATE TABLE IF NOT EXISTS margins_learning_remediation (
        id UUID PRIMARY KEY,
        assessment_attempt_id UUID NOT NULL UNIQUE REFERENCES margins_learning_assessment_attempts(id) ON DELETE CASCADE,
        state JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      `))
      .then(() => query(`CREATE TABLE IF NOT EXISTS margins_learning_evidence (
        id UUID PRIMARY KEY,
        remediation_id UUID NOT NULL REFERENCES margins_learning_remediation(id) ON DELETE CASCADE,
        question_id TEXT NOT NULL,
        stage TEXT NOT NULL,
        evidence JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      `))
      .then(() => undefined);
  }
  return ready;
}

export async function createLearningAssignment(params: {
  classId: string;
  createdBy: string;
  type: LearningLabAssignmentType;
  title: string;
  questions: LearningLabQuestion[];
  context: PublishedAssignmentSnapshot["context"];
}): Promise<PublishedAssignmentSnapshot> {
  await ensureLearningLabSchema();
  const assignmentId = randomUUID();
  const version = 1;
  const snapshot: PublishedAssignmentSnapshot = {
    assignmentId,
    version,
    type: params.type,
    classId: params.classId,
    title: params.title,
    questions: params.questions,
    context: params.context,
    publishedAt: new Date().toISOString(),
  };
  await query(
    `INSERT INTO margins_learning_assignments
      (id, class_id, type, title, status, current_version, created_by)
     VALUES ($1, $2, $3, $4, 'published', $5, $6)`,
    [assignmentId, params.classId, params.type, params.title, version, params.createdBy]
  );
  const versionId = randomUUID();
  await query(
    `INSERT INTO margins_learning_assignment_versions (id, assignment_id, version, snapshot)
     VALUES ($1, $2, $3, $4)`,
    [versionId, assignmentId, version, JSON.stringify(snapshot)]
  );
  return snapshot;
}

export async function getPublishedLearningAssignment(
  assignmentId: string
): Promise<PublishedAssignmentSnapshot | undefined> {
  await ensureLearningLabSchema();
  const { rows } = await query<{ snapshot: PublishedAssignmentSnapshot }>(
    `SELECT v.snapshot
     FROM margins_learning_assignment_versions v
     JOIN margins_learning_assignments a ON a.id = v.assignment_id
     WHERE a.id = $1 AND v.version = a.current_version AND a.status = 'published'`,
    [assignmentId]
  );
  return rows[0]?.snapshot;
}

export async function publishLearningAssignmentVersion(params: {
  assignment: PublishedAssignmentSnapshot;
  title: string;
  questions: LearningLabQuestion[];
  context: PublishedAssignmentSnapshot["context"];
}): Promise<PublishedAssignmentSnapshot> {
  await ensureLearningLabSchema();
  const snapshot: PublishedAssignmentSnapshot = {
    ...params.assignment,
    version: params.assignment.version + 1,
    title: params.title,
    questions: params.questions,
    context: params.context,
    publishedAt: new Date().toISOString(),
  };
  const { rows } = await query<{ snapshot: PublishedAssignmentSnapshot }>(
    `WITH locked AS (
       SELECT current_version FROM margins_learning_assignments
       WHERE id = $1 FOR UPDATE
     ), inserted AS (
       INSERT INTO margins_learning_assignment_versions (id, assignment_id, version, snapshot)
       SELECT $2, $1, current_version + 1, $3 FROM locked
       RETURNING version
     )
     UPDATE margins_learning_assignments a
     SET title = $4, current_version = inserted.version, status = 'published'
     FROM inserted
     WHERE a.id = $1
     RETURNING $3::jsonb AS snapshot`,
    [params.assignment.assignmentId, randomUUID(), JSON.stringify(snapshot), params.title]
  );
  if (!rows[0]) throw new Error("Assignment version could not be published.");
  return rows[0].snapshot;
}

export async function getOrCreateAssessmentAttempt(
  assignment: PublishedAssignmentSnapshot,
  studentId: string
) {
  await ensureLearningLabSchema();
  const existing = await query(
    `SELECT id, assignment_id, assignment_version, student_id, answers, status, score, max_score,
            missed_question_ids, started_at, submitted_at, updated_at
     FROM margins_learning_assessment_attempts
     WHERE assignment_id = $1 AND assignment_version = $2 AND student_id = $3
     ORDER BY started_at DESC LIMIT 1`,
    [assignment.assignmentId, assignment.version, studentId]
  );
  if (existing.rows[0]) return existing.rows[0];
  const id = randomUUID();
  const { rows } = await query(
    `INSERT INTO margins_learning_assessment_attempts
      (id, assignment_id, assignment_version, student_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, assignment_id, assignment_version, student_id, answers, status, score, max_score,
               missed_question_ids, started_at, submitted_at, updated_at`,
    [id, assignment.assignmentId, assignment.version, studentId]
  );
  return rows[0];
}

export async function saveAssessmentAnswers(
  attemptId: string,
  studentId: string,
  answers: Record<string, string>
) {
  await ensureLearningLabSchema();
  const { rows } = await query(
    `UPDATE margins_learning_assessment_attempts
     SET answers = $3, updated_at = now()
     WHERE id = $1 AND student_id = $2 AND status = 'in_progress'
     RETURNING id, answers, status, updated_at`,
    [attemptId, studentId, JSON.stringify(answers)]
  );
  return rows[0];
}

export async function submitAssessment(
  attemptId: string,
  studentId: string,
  result: { score: number; maxScore: number; missedQuestionIds: string[] }
) {
  await ensureLearningLabSchema();
  const { rows } = await query(
    `UPDATE margins_learning_assessment_attempts
     SET status = 'submitted', score = $3, max_score = $4,
         missed_question_ids = $5, submitted_at = COALESCE(submitted_at, now()), updated_at = now()
     WHERE id = $1 AND student_id = $2 AND status = 'in_progress'
     RETURNING id, assignment_id, assignment_version, answers, status, score, max_score,
               missed_question_ids, submitted_at, updated_at`,
    [attemptId, studentId, result.score, result.maxScore, JSON.stringify(result.missedQuestionIds)]
  );
  return rows[0];
}

export async function createRemediation(
  attemptId: string,
  state: RemediationState
) {
  await ensureLearningLabSchema();
  const id = randomUUID();
  const { rows } = await query(
    `INSERT INTO margins_learning_remediation (id, assessment_attempt_id, state)
     VALUES ($1, $2, $3)
     ON CONFLICT (assessment_attempt_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()
     RETURNING id, assessment_attempt_id, state, updated_at`,
    [id, attemptId, JSON.stringify(state)]
  );
  return rows[0];
}

export async function getRemediationByAttempt(attemptId: string) {
  await ensureLearningLabSchema();
  const { rows } = await query(
    `SELECT id, assessment_attempt_id, state, updated_at
     FROM margins_learning_remediation WHERE assessment_attempt_id = $1`,
    [attemptId]
  );
  return rows[0];
}

export async function updateRemediation(
  remediationId: string,
  studentId: string,
  state: RemediationState
) {
  await ensureLearningLabSchema();
  const { rows } = await query(
    `UPDATE margins_learning_remediation r
     SET state = $3, updated_at = now()
     FROM margins_learning_assessment_attempts a
     WHERE r.id = $1 AND a.id = r.assessment_attempt_id AND a.student_id = $2
     RETURNING r.id, r.assessment_attempt_id, r.state, r.updated_at`,
    [remediationId, studentId, JSON.stringify(state)]
  );
  return rows[0];
}

export async function recordLearningEvidence(
  remediationId: string,
  questionId: string,
  stage: string,
  evidence: Record<string, unknown>
) {
  await ensureLearningLabSchema();
  const { rows } = await query(
    `INSERT INTO margins_learning_evidence (id, remediation_id, question_id, stage, evidence)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, question_id, stage, evidence, created_at`,
    [randomUUID(), remediationId, questionId, stage, JSON.stringify(evidence)]
  );
  return rows[0];
}

export async function getLearningEvidenceForClass(classId: string) {
  await ensureLearningLabSchema();
  const { rows } = await query(
    `SELECT r.id AS remediation_id, a.title, e.question_id, e.stage, e.evidence, e.created_at
     FROM margins_learning_evidence e
     JOIN margins_learning_remediation r ON r.id = e.remediation_id
     JOIN margins_learning_assessment_attempts at ON at.id = r.assessment_attempt_id
     JOIN margins_learning_assignments a ON a.id = at.assignment_id
     WHERE a.class_id = $1 ORDER BY e.created_at DESC`,
    [classId]
  );
  return rows;
}

export type { LearningStatus };

