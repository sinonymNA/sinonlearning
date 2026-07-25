import { randomUUID, randomBytes } from "crypto";
import { query } from "./db";
import { AP_SKILL_IDS, WRITING_MECHANICS_SKILL_IDS } from "./marginsPracticeCourses";

export type MarginsRole = "teacher" | "student";

export interface MarginsUser {
  id: string;
  email: string;
  password_hash: string;
  role: MarginsRole;
  name: string;
  created_at: string;
}

export interface MarginsSession {
  token: string;
  user_id: string;
  expires_at: string;
}

export interface MarginsClass {
  id: string;
  teacher_id: string;
  name: string;
  join_code: string;
  created_at: string;
}

export type EssayType = "DBQ" | "LEQ" | "SAQ";

export interface AssignmentDocument {
  label: string;
  source_text?: string;
  image_id?: string;
}

export interface RubricCriterionRow {
  category: string;
  points_possible: number;
  description: string;
}

export interface MarginsAssignment {
  id: string;
  class_id: string;
  essay_type: EssayType;
  title: string;
  prompt_text: string;
  rubric: RubricCriterionRow[];
  documents: AssignmentDocument[] | null;
  due_at: string | null;
  max_revisions: number;
  created_at: string;
}

let schemaReady: Promise<void> | null = null;

export function ensureMarginsSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS margins_users (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_sessions (
          token TEXT PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          expires_at TIMESTAMPTZ NOT NULL
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_classes (
          id UUID PRIMARY KEY,
          teacher_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          join_code TEXT NOT NULL UNIQUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_class_memberships (
          class_id UUID NOT NULL REFERENCES margins_classes(id) ON DELETE CASCADE,
          student_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (class_id, student_id)
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_assignments (
          id UUID PRIMARY KEY,
          class_id UUID NOT NULL REFERENCES margins_classes(id) ON DELETE CASCADE,
          essay_type TEXT NOT NULL,
          title TEXT NOT NULL,
          prompt_text TEXT NOT NULL,
          rubric JSONB NOT NULL,
          documents JSONB,
          due_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_submissions (
          id UUID PRIMARY KEY,
          assignment_id UUID NOT NULL REFERENCES margins_assignments(id) ON DELETE CASCADE,
          student_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          essay_text TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          submitted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_essay_gradings (
          id UUID PRIMARY KEY,
          submission_id UUID NOT NULL UNIQUE REFERENCES margins_submissions(id) ON DELETE CASCADE,
          overall_score NUMERIC NOT NULL,
          max_score NUMERIC NOT NULL,
          rubric_breakdown JSONB NOT NULL,
          annotations JSONB NOT NULL,
          overall_feedback TEXT NOT NULL,
          strengths JSONB NOT NULL DEFAULT '[]',
          next_steps JSONB NOT NULL DEFAULT '[]',
          teacher_override_score NUMERIC,
          teacher_notes TEXT,
          graded_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`ALTER TABLE margins_essay_gradings ADD COLUMN IF NOT EXISTS strengths JSONB NOT NULL DEFAULT '[]'`)
      )
      .then(() =>
        query(`ALTER TABLE margins_essay_gradings ADD COLUMN IF NOT EXISTS next_steps JSONB NOT NULL DEFAULT '[]'`)
      )
      .then(() =>
        query(`ALTER TABLE margins_assignments ADD COLUMN IF NOT EXISTS max_revisions INTEGER NOT NULL DEFAULT 1`)
      )
      .then(() =>
        query(
          `ALTER TABLE margins_submissions ADD COLUMN IF NOT EXISTS parent_submission_id UUID REFERENCES margins_submissions(id) ON DELETE SET NULL`
        )
      )
      .then(() =>
        query(`ALTER TABLE margins_submissions ADD COLUMN IF NOT EXISTS attempt_number INTEGER NOT NULL DEFAULT 1`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_revision_plans (
          id UUID PRIMARY KEY,
          submission_id UUID NOT NULL UNIQUE REFERENCES margins_submissions(id) ON DELETE CASCADE,
          steps JSONB NOT NULL,
          current_step INTEGER NOT NULL DEFAULT 0,
          student_responses JSONB NOT NULL DEFAULT '[]',
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_uploaded_images (
          id UUID PRIMARY KEY,
          uploaded_by UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          mime_type TEXT NOT NULL,
          data BYTEA NOT NULL,
          byte_size INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_practice_progress (
          id UUID PRIMARY KEY,
          student_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          course_id TEXT NOT NULL,
          current_module INTEGER NOT NULL DEFAULT 0,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (student_id, course_id)
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_practice_attempts (
          id UUID PRIMARY KEY,
          progress_id UUID NOT NULL REFERENCES margins_practice_progress(id) ON DELETE CASCADE,
          module_id TEXT NOT NULL,
          prompt_id TEXT NOT NULL,
          response_text TEXT NOT NULL,
          passed BOOLEAN NOT NULL,
          feedback JSONB NOT NULL,
          skill TEXT NOT NULL,
          score_label TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS margins_skill_mastery (
          id UUID PRIMARY KEY,
          student_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          skill TEXT NOT NULL,
          level TEXT NOT NULL CHECK (level IN ('not_yet_shown','emerging','solid','strong')),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (student_id, skill)
        )`)
      )
      .then(() =>
        // Modules are now a sequence of pages (lesson pages + a trailing check
        // page) — current_module still marks which module is unlocked, this
        // tracks position within that module's page list.
        query(`ALTER TABLE margins_practice_progress ADD COLUMN IF NOT EXISTS current_page INTEGER NOT NULL DEFAULT 0`)
      )
      .then(() =>
        // Holds a student's own answer to "what's the weakest part of what you
        // just wrote" — captured before feedback is revealed, on pages that
        // opt into the self-diagnosis interstitial.
        query(`ALTER TABLE margins_practice_attempts ADD COLUMN IF NOT EXISTS self_diagnosis TEXT`)
      )
      .then(() => undefined);
  }
  return schemaReady;
}

// ── Users ──

export async function createUser(
  email: string,
  passwordHash: string,
  role: MarginsRole,
  name: string
): Promise<MarginsUser> {
  await ensureMarginsSchema();
  const id = randomUUID();
  const { rows } = await query<MarginsUser>(
    `INSERT INTO margins_users (id, email, password_hash, role, name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, password_hash, role, name, created_at`,
    [id, email.toLowerCase().trim(), passwordHash, role, name]
  );
  return rows[0];
}

export async function getUserByEmail(email: string): Promise<MarginsUser | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsUser>(
    `SELECT id, email, password_hash, role, name, created_at FROM margins_users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  return rows[0];
}

export async function getUserById(id: string): Promise<MarginsUser | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsUser>(
    `SELECT id, email, password_hash, role, name, created_at FROM margins_users WHERE id = $1`,
    [id]
  );
  return rows[0];
}

// ── Sessions ──

export async function createSession(userId: string, expiresAt: Date): Promise<string> {
  await ensureMarginsSchema();
  const token = randomBytes(32).toString("hex");
  await query(
    `INSERT INTO margins_sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expiresAt.toISOString()]
  );
  return token;
}

export async function getSessionUser(token: string): Promise<MarginsUser | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsUser & { expires_at: string }>(
    `SELECT u.id, u.email, u.password_hash, u.role, u.name, u.created_at, s.expires_at
     FROM margins_sessions s
     JOIN margins_users u ON u.id = s.user_id
     WHERE s.token = $1`,
    [token]
  );
  const row = rows[0];
  if (!row) return undefined;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await deleteSession(token);
    return undefined;
  }
  return row;
}

export async function deleteSession(token: string): Promise<void> {
  await ensureMarginsSchema();
  await query(`DELETE FROM margins_sessions WHERE token = $1`, [token]);
}

// ── Classes ──

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateJoinCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += JOIN_CODE_ALPHABET[bytes[i] % JOIN_CODE_ALPHABET.length];
  }
  return code;
}

export async function createClass(teacherId: string, name: string): Promise<MarginsClass> {
  await ensureMarginsSchema();
  const id = randomUUID();
  for (let attempt = 0; attempt < 8; attempt++) {
    const joinCode = generateJoinCode();
    try {
      const { rows } = await query<MarginsClass>(
        `INSERT INTO margins_classes (id, teacher_id, name, join_code)
         VALUES ($1, $2, $3, $4)
         RETURNING id, teacher_id, name, join_code, created_at`,
        [id, teacherId, name, joinCode]
      );
      return rows[0];
    } catch (err) {
      const isUniqueViolation = (err as { code?: string }).code === "23505";
      if (!isUniqueViolation || attempt === 7) throw err;
    }
  }
  throw new Error("Could not generate a unique class join code.");
}

export async function getClassesByTeacher(teacherId: string): Promise<MarginsClass[]> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsClass>(
    `SELECT id, teacher_id, name, join_code, created_at FROM margins_classes
     WHERE teacher_id = $1 ORDER BY created_at DESC`,
    [teacherId]
  );
  return rows;
}

export async function getClassById(id: string): Promise<MarginsClass | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsClass>(
    `SELECT id, teacher_id, name, join_code, created_at FROM margins_classes WHERE id = $1`,
    [id]
  );
  return rows[0];
}

export async function getClassByJoinCode(joinCode: string): Promise<MarginsClass | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsClass>(
    `SELECT id, teacher_id, name, join_code, created_at FROM margins_classes WHERE join_code = $1`,
    [joinCode.toUpperCase().trim()]
  );
  return rows[0];
}

export async function joinClass(classId: string, studentId: string): Promise<void> {
  await ensureMarginsSchema();
  await query(
    `INSERT INTO margins_class_memberships (class_id, student_id)
     VALUES ($1, $2)
     ON CONFLICT (class_id, student_id) DO NOTHING`,
    [classId, studentId]
  );
}

export async function getClassesByStudent(studentId: string): Promise<MarginsClass[]> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsClass>(
    `SELECT c.id, c.teacher_id, c.name, c.join_code, c.created_at
     FROM margins_classes c
     JOIN margins_class_memberships m ON m.class_id = c.id
     WHERE m.student_id = $1
     ORDER BY m.joined_at DESC`,
    [studentId]
  );
  return rows;
}

export async function getClassRoster(classId: string): Promise<MarginsUser[]> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsUser>(
    `SELECT u.id, u.email, u.password_hash, u.role, u.name, u.created_at
     FROM margins_users u
     JOIN margins_class_memberships m ON m.student_id = u.id
     WHERE m.class_id = $1
     ORDER BY u.name ASC`,
    [classId]
  );
  return rows;
}

export async function isStudentInClass(classId: string, studentId: string): Promise<boolean> {
  await ensureMarginsSchema();
  const { rows } = await query(
    `SELECT 1 FROM margins_class_memberships WHERE class_id = $1 AND student_id = $2`,
    [classId, studentId]
  );
  return rows.length > 0;
}

// ── Assignments ──

const ASSIGNMENT_COLUMNS =
  "id, class_id, essay_type, title, prompt_text, rubric, documents, due_at, max_revisions, created_at";

export async function createAssignment(params: {
  classId: string;
  essayType: EssayType;
  title: string;
  promptText: string;
  rubric: RubricCriterionRow[];
  documents?: AssignmentDocument[] | null;
  dueAt?: Date | null;
  maxRevisions?: number;
}): Promise<MarginsAssignment> {
  await ensureMarginsSchema();
  const id = randomUUID();
  const { rows } = await query<MarginsAssignment>(
    `INSERT INTO margins_assignments (id, class_id, essay_type, title, prompt_text, rubric, documents, due_at, max_revisions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${ASSIGNMENT_COLUMNS}`,
    [
      id,
      params.classId,
      params.essayType,
      params.title,
      params.promptText,
      JSON.stringify(params.rubric),
      params.documents ? JSON.stringify(params.documents) : null,
      params.dueAt ? params.dueAt.toISOString() : null,
      params.maxRevisions ?? 1,
    ]
  );
  return rows[0];
}

export async function getAssignmentsByClass(classId: string): Promise<MarginsAssignment[]> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsAssignment>(
    `SELECT ${ASSIGNMENT_COLUMNS} FROM margins_assignments WHERE class_id = $1 ORDER BY created_at DESC`,
    [classId]
  );
  return rows;
}

export async function getAssignmentById(id: string): Promise<MarginsAssignment | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsAssignment>(
    `SELECT ${ASSIGNMENT_COLUMNS} FROM margins_assignments WHERE id = $1`,
    [id]
  );
  return rows[0];
}

// ── Submissions ──

export type SubmissionStatus = "draft" | "submitted" | "graded";

export interface MarginsSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  essay_text: string;
  status: SubmissionStatus;
  submitted_at: string | null;
  parent_submission_id: string | null;
  attempt_number: number;
  created_at: string;
  updated_at: string;
}

const SUBMISSION_COLUMNS =
  "id, assignment_id, student_id, essay_text, status, submitted_at, parent_submission_id, attempt_number, created_at, updated_at";

// Scoped to the ORIGINAL attempt only (parent_submission_id IS NULL) — revisions
// are separate rows created via createRevisionSubmission(), found via the parent
// chain, never through this function.
export async function getOrCreateDraftSubmission(
  assignmentId: string,
  studentId: string
): Promise<MarginsSubmission> {
  await ensureMarginsSchema();
  const existing = await query<MarginsSubmission>(
    `SELECT ${SUBMISSION_COLUMNS} FROM margins_submissions
     WHERE assignment_id = $1 AND student_id = $2 AND parent_submission_id IS NULL`,
    [assignmentId, studentId]
  );
  if (existing.rows[0]) return existing.rows[0];

  const id = randomUUID();
  const { rows } = await query<MarginsSubmission>(
    `INSERT INTO margins_submissions (id, assignment_id, student_id)
     VALUES ($1, $2, $3)
     RETURNING ${SUBMISSION_COLUMNS}`,
    [id, assignmentId, studentId]
  );
  return rows[0];
}

export async function updateSubmissionText(
  submissionId: string,
  essayText: string
): Promise<MarginsSubmission | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsSubmission>(
    `UPDATE margins_submissions SET essay_text = $2, updated_at = now()
     WHERE id = $1 AND status = 'draft'
     RETURNING ${SUBMISSION_COLUMNS}`,
    [submissionId, essayText]
  );
  return rows[0];
}

export async function markSubmissionSubmitted(submissionId: string): Promise<MarginsSubmission | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsSubmission>(
    `UPDATE margins_submissions SET status = 'submitted', submitted_at = now(), updated_at = now()
     WHERE id = $1
     RETURNING ${SUBMISSION_COLUMNS}`,
    [submissionId]
  );
  return rows[0];
}

export async function markSubmissionGraded(submissionId: string): Promise<void> {
  await ensureMarginsSchema();
  await query(`UPDATE margins_submissions SET status = 'graded', updated_at = now() WHERE id = $1`, [submissionId]);
}

export async function getSubmissionById(id: string): Promise<MarginsSubmission | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsSubmission>(
    `SELECT ${SUBMISSION_COLUMNS} FROM margins_submissions WHERE id = $1`,
    [id]
  );
  return rows[0];
}

export async function getAttemptCount(assignmentId: string, studentId: string): Promise<number> {
  await ensureMarginsSchema();
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM margins_submissions WHERE assignment_id = $1 AND student_id = $2`,
    [assignmentId, studentId]
  );
  return parseInt(rows[0]?.count ?? "0", 10);
}

export async function getAttemptChain(assignmentId: string, studentId: string): Promise<MarginsSubmission[]> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsSubmission>(
    `SELECT ${SUBMISSION_COLUMNS} FROM margins_submissions
     WHERE assignment_id = $1 AND student_id = $2
     ORDER BY attempt_number ASC`,
    [assignmentId, studentId]
  );
  return rows;
}

// Creates a new attempt chained to a graded submission, pre-filled with the
// parent's essay text so the student edits forward rather than from blank.
// The graded parent submission is never mutated.
export async function createRevisionSubmission(parentSubmissionId: string): Promise<MarginsSubmission> {
  await ensureMarginsSchema();
  const parent = await getSubmissionById(parentSubmissionId);
  if (!parent) throw new Error("Parent submission not found.");
  if (parent.status !== "graded") throw new Error("Only a graded submission can be revised.");

  const id = randomUUID();
  const { rows } = await query<MarginsSubmission>(
    `INSERT INTO margins_submissions (id, assignment_id, student_id, essay_text, parent_submission_id, attempt_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${SUBMISSION_COLUMNS}`,
    [id, parent.assignment_id, parent.student_id, parent.essay_text, parent.id, parent.attempt_number + 1]
  );
  return rows[0];
}

export interface StudentAssignmentRow extends MarginsAssignment {
  class_name: string;
  submission_id: string | null;
  submission_status: SubmissionStatus | null;
}

export async function getAssignmentsForStudent(studentId: string): Promise<StudentAssignmentRow[]> {
  await ensureMarginsSchema();
  const { rows } = await query<StudentAssignmentRow>(
    `SELECT a.id, a.class_id, a.essay_type, a.title, a.prompt_text, a.rubric, a.documents, a.due_at, a.max_revisions, a.created_at,
            c.name AS class_name,
            s.id AS submission_id, s.status AS submission_status
     FROM margins_assignments a
     JOIN margins_classes c ON c.id = a.class_id
     JOIN margins_class_memberships m ON m.class_id = a.class_id AND m.student_id = $1
     LEFT JOIN LATERAL (
       SELECT * FROM margins_submissions
       WHERE assignment_id = a.id AND student_id = $1
       ORDER BY attempt_number DESC LIMIT 1
     ) s ON true
     ORDER BY a.created_at DESC`,
    [studentId]
  );
  return rows;
}

export async function getSubmissionsByAssignment(
  assignmentId: string
): Promise<(MarginsSubmission & { student_name: string })[]> {
  await ensureMarginsSchema();
  // One row per student — the latest attempt only. DISTINCT ON requires its
  // ORDER BY prefix, so the latest-attempt selection happens in a subquery and
  // the final list is re-sorted by student name (matching getClassRoster's convention).
  const { rows } = await query<MarginsSubmission & { student_name: string }>(
    `SELECT sub.id, sub.assignment_id, sub.student_id, sub.essay_text, sub.status, sub.submitted_at,
            sub.parent_submission_id, sub.attempt_number, sub.created_at, sub.updated_at,
            u.name AS student_name
     FROM (
       SELECT DISTINCT ON (student_id) *
       FROM margins_submissions
       WHERE assignment_id = $1
       ORDER BY student_id, attempt_number DESC
     ) sub
     JOIN margins_users u ON u.id = sub.student_id
     ORDER BY u.name ASC`,
    [assignmentId]
  );
  return rows;
}

// ── Essay gradings ──

export type AnnotationType = "praise" | "growth";

export interface EssayAnnotationRow {
  quote: string;
  category: string;
  type: AnnotationType;
  comment: string;
}

export interface RubricBreakdownRow {
  category: string;
  points_earned: number;
  points_possible: number;
  justification: string;
}

export interface NextStepRow {
  issue: string;
  why_it_matters: string;
  how_to_fix: string;
  skill: string;
}

export interface MarginsGrading {
  id: string;
  submission_id: string;
  overall_score: number;
  max_score: number;
  rubric_breakdown: RubricBreakdownRow[];
  annotations: EssayAnnotationRow[];
  overall_feedback: string;
  strengths: string[];
  next_steps: NextStepRow[];
  teacher_override_score: number | null;
  teacher_notes: string | null;
  graded_at: string;
}

const GRADING_COLUMNS =
  "id, submission_id, overall_score, max_score, rubric_breakdown, annotations, " +
  "overall_feedback, strengths, next_steps, teacher_override_score, teacher_notes, graded_at";

export async function createGrading(params: {
  submissionId: string;
  overallScore: number;
  maxScore: number;
  rubricBreakdown: RubricBreakdownRow[];
  annotations: EssayAnnotationRow[];
  overallFeedback: string;
  strengths: string[];
  nextSteps: NextStepRow[];
}): Promise<MarginsGrading> {
  await ensureMarginsSchema();
  const id = randomUUID();
  const { rows } = await query<MarginsGrading>(
    `INSERT INTO margins_essay_gradings
       (id, submission_id, overall_score, max_score, rubric_breakdown, annotations, overall_feedback, strengths, next_steps)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (submission_id) DO UPDATE SET
       overall_score = EXCLUDED.overall_score,
       max_score = EXCLUDED.max_score,
       rubric_breakdown = EXCLUDED.rubric_breakdown,
       annotations = EXCLUDED.annotations,
       overall_feedback = EXCLUDED.overall_feedback,
       strengths = EXCLUDED.strengths,
       next_steps = EXCLUDED.next_steps,
       graded_at = now()
     RETURNING ${GRADING_COLUMNS}`,
    [
      id,
      params.submissionId,
      params.overallScore,
      params.maxScore,
      JSON.stringify(params.rubricBreakdown),
      JSON.stringify(params.annotations),
      params.overallFeedback,
      JSON.stringify(params.strengths),
      JSON.stringify(params.nextSteps),
    ]
  );
  await markSubmissionGraded(params.submissionId);
  return rows[0];
}

export async function getGradingBySubmission(submissionId: string): Promise<MarginsGrading | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsGrading>(
    `SELECT ${GRADING_COLUMNS} FROM margins_essay_gradings WHERE submission_id = $1`,
    [submissionId]
  );
  return rows[0];
}

export async function overrideGrading(
  submissionId: string,
  overrideScore: number,
  notes: string
): Promise<MarginsGrading | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsGrading>(
    `UPDATE margins_essay_gradings SET teacher_override_score = $2, teacher_notes = $3
     WHERE submission_id = $1
     RETURNING ${GRADING_COLUMNS}`,
    [submissionId, overrideScore, notes]
  );
  return rows[0];
}

// ── Revision plans ──

export interface RevisionStepRow {
  based_on_issue: string;
  restatement: string;
  guiding_question: string;
  scaffold: string;
  hint: string;
}

export interface MarginsRevisionPlan {
  id: string;
  submission_id: string;
  steps: RevisionStepRow[];
  current_step: number;
  student_responses: string[];
  completed_at: string | null;
  created_at: string;
}

const REVISION_PLAN_COLUMNS =
  "id, submission_id, steps, current_step, student_responses, completed_at, created_at";

// submissionId here is the GRADED submission the plan is generated from.
export async function createRevisionPlan(
  submissionId: string,
  steps: RevisionStepRow[]
): Promise<MarginsRevisionPlan> {
  await ensureMarginsSchema();
  const id = randomUUID();
  const { rows } = await query<MarginsRevisionPlan>(
    `INSERT INTO margins_revision_plans (id, submission_id, steps)
     VALUES ($1, $2, $3)
     RETURNING ${REVISION_PLAN_COLUMNS}`,
    [id, submissionId, JSON.stringify(steps)]
  );
  return rows[0];
}

export async function getRevisionPlanBySubmission(submissionId: string): Promise<MarginsRevisionPlan | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsRevisionPlan>(
    `SELECT ${REVISION_PLAN_COLUMNS} FROM margins_revision_plans WHERE submission_id = $1`,
    [submissionId]
  );
  return rows[0];
}

export async function updateRevisionProgress(
  submissionId: string,
  currentStep: number,
  studentResponses: string[]
): Promise<MarginsRevisionPlan | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsRevisionPlan>(
    `UPDATE margins_revision_plans SET current_step = $2, student_responses = $3
     WHERE submission_id = $1
     RETURNING ${REVISION_PLAN_COLUMNS}`,
    [submissionId, currentStep, JSON.stringify(studentResponses)]
  );
  return rows[0];
}

export async function markRevisionPlanCompleted(submissionId: string): Promise<void> {
  await ensureMarginsSchema();
  await query(`UPDATE margins_revision_plans SET completed_at = now() WHERE submission_id = $1`, [submissionId]);
}

// ── Uploaded images ──

export interface MarginsUploadedImage {
  id: string;
  uploaded_by: string;
  mime_type: string;
  data: Buffer;
  byte_size: number;
  created_at: string;
}

export async function createUploadedImage(params: {
  uploadedBy: string;
  mimeType: string;
  data: Buffer;
}): Promise<MarginsUploadedImage> {
  await ensureMarginsSchema();
  const id = randomUUID();
  const { rows } = await query<MarginsUploadedImage>(
    `INSERT INTO margins_uploaded_images (id, uploaded_by, mime_type, data, byte_size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, uploaded_by, mime_type, data, byte_size, created_at`,
    [id, params.uploadedBy, params.mimeType, params.data, params.data.length]
  );
  return rows[0];
}

export async function getUploadedImage(id: string): Promise<MarginsUploadedImage | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsUploadedImage>(
    `SELECT id, uploaded_by, mime_type, data, byte_size, created_at FROM margins_uploaded_images WHERE id = $1`,
    [id]
  );
  return rows[0];
}

// ── Practice courses (Scout) ──

export type MasteryLevel = "not_yet_shown" | "emerging" | "solid" | "strong";

export interface MarginsPracticeProgress {
  id: string;
  student_id: string;
  course_id: string;
  current_module: number;
  current_page: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarginsPracticeAttempt {
  id: string;
  progress_id: string;
  module_id: string;
  prompt_id: string;
  response_text: string;
  passed: boolean;
  feedback: unknown;
  skill: string;
  score_label: MasteryLevel;
  self_diagnosis: string | null;
  created_at: string;
}

export interface MarginsSkillMastery {
  id: string;
  student_id: string;
  skill: string;
  level: MasteryLevel;
  updated_at: string;
}

const PRACTICE_PROGRESS_COLUMNS =
  "id, student_id, course_id, current_module, current_page, completed_at, created_at, updated_at";

// Scoped to (student_id, course_id) — the same student re-entering a course
// always resumes the same progress row instead of starting over.
export async function getOrCreatePracticeProgress(
  studentId: string,
  courseId: string
): Promise<MarginsPracticeProgress> {
  await ensureMarginsSchema();
  const id = randomUUID();
  const { rows } = await query<MarginsPracticeProgress>(
    `INSERT INTO margins_practice_progress (id, student_id, course_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (student_id, course_id) DO UPDATE SET updated_at = margins_practice_progress.updated_at
     RETURNING ${PRACTICE_PROGRESS_COLUMNS}`,
    [id, studentId, courseId]
  );
  return rows[0];
}

export async function advancePracticeProgress(
  progressId: string,
  nextModule: number,
  nextPage: number,
  completed = false
): Promise<MarginsPracticeProgress | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsPracticeProgress>(
    `UPDATE margins_practice_progress
     SET current_module = $2, current_page = $3, completed_at = CASE WHEN $4 THEN now() ELSE completed_at END, updated_at = now()
     WHERE id = $1
     RETURNING ${PRACTICE_PROGRESS_COLUMNS}`,
    [progressId, nextModule, nextPage, completed]
  );
  return rows[0];
}

const PRACTICE_ATTEMPT_COLUMNS =
  "id, progress_id, module_id, prompt_id, response_text, passed, feedback, skill, score_label, self_diagnosis, created_at";

export async function recordPracticeAttempt(params: {
  progressId: string;
  moduleId: string;
  promptId: string;
  responseText: string;
  passed: boolean;
  feedback: unknown;
  skill: string;
  scoreLabel: MasteryLevel;
}): Promise<MarginsPracticeAttempt> {
  await ensureMarginsSchema();
  const id = randomUUID();
  const { rows } = await query<MarginsPracticeAttempt>(
    `INSERT INTO margins_practice_attempts
       (id, progress_id, module_id, prompt_id, response_text, passed, feedback, skill, score_label)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${PRACTICE_ATTEMPT_COLUMNS}`,
    // self_diagnosis is deliberately left out of this INSERT — it's written
    // later via updatePracticeAttemptSelfDiagnosis(), after the student
    // answers the "what's weakest" prompt, and defaults to NULL until then.
    [
      id,
      params.progressId,
      params.moduleId,
      params.promptId,
      params.responseText,
      params.passed,
      JSON.stringify(params.feedback),
      params.skill,
      params.scoreLabel,
    ]
  );
  return rows[0];
}

// Looks up a prior attempt at the exact same prompt within the exact same
// progress row — used to enforce "single attempt" pages (the timed
// capstone): if one already exists, the route returns it instead of
// re-grading, rather than burning another live grading call on a replay.
export async function findPracticeAttempt(
  progressId: string,
  moduleId: string,
  promptId: string
): Promise<MarginsPracticeAttempt | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsPracticeAttempt>(
    `SELECT ${PRACTICE_ATTEMPT_COLUMNS} FROM margins_practice_attempts
     WHERE progress_id = $1 AND module_id = $2 AND prompt_id = $3
     ORDER BY created_at DESC
     LIMIT 1`,
    [progressId, moduleId, promptId]
  );
  return rows[0];
}

// Looks up the most recent attempt recorded anywhere in a module, regardless
// of prompt — used to review a completed check page's result without
// already knowing which of its prompts (or which retry) the student passed
// with. Only meaningful for modules the student has already moved past, so
// the latest row is always the one that actually got them through (full-SAQ
// check pages record one row per rubric part, all sharing the same
// `feedback` JSON, so "latest" is fine there too).
export async function findLatestAttemptForModule(
  progressId: string,
  moduleId: string
): Promise<MarginsPracticeAttempt | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsPracticeAttempt>(
    `SELECT ${PRACTICE_ATTEMPT_COLUMNS} FROM margins_practice_attempts
     WHERE progress_id = $1 AND module_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [progressId, moduleId]
  );
  return rows[0];
}

// Ownership-checked: only writes if the attempt actually belongs to the
// given progress row, so a student can't overwrite another student's attempt
// by guessing an attempt id.
export async function updatePracticeAttemptSelfDiagnosis(
  attemptId: string,
  progressId: string,
  selfDiagnosis: string
): Promise<MarginsPracticeAttempt | undefined> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsPracticeAttempt>(
    `UPDATE margins_practice_attempts
     SET self_diagnosis = $3
     WHERE id = $1 AND progress_id = $2
     RETURNING ${PRACTICE_ATTEMPT_COLUMNS}`,
    [attemptId, progressId, selfDiagnosis]
  );
  return rows[0];
}

const MASTERY_LEVELS: MasteryLevel[] = ["not_yet_shown", "emerging", "solid", "strong"];
const MASTERY_LEVEL_VALUES: Record<MasteryLevel, number> = {
  not_yet_shown: 0,
  emerging: 1,
  solid: 2,
  strong: 3,
};

// Mastery = average of a skill's last 3 attempts (pass or fail — both are
// diagnostic signal), bucketed back into the 4 discrete levels. Recomputed
// on every attempt so one lucky/unlucky rep never fully swings the level.
export async function recomputeAndUpsertSkillMastery(
  studentId: string,
  skill: string
): Promise<MarginsSkillMastery> {
  await ensureMarginsSchema();
  const { rows } = await query<{ score_label: MasteryLevel }>(
    `SELECT a.score_label
     FROM margins_practice_attempts a
     JOIN margins_practice_progress p ON p.id = a.progress_id
     WHERE p.student_id = $1 AND a.skill = $2
     ORDER BY a.created_at DESC
     LIMIT 3`,
    [studentId, skill]
  );
  const values = rows.map((r) => MASTERY_LEVEL_VALUES[r.score_label] ?? 0);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;
  const level = MASTERY_LEVELS[Math.min(3, Math.max(0, Math.round(average)))];

  const id = randomUUID();
  const { rows: upserted } = await query<MarginsSkillMastery>(
    `INSERT INTO margins_skill_mastery (id, student_id, skill, level)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (student_id, skill) DO UPDATE SET level = EXCLUDED.level, updated_at = now()
     RETURNING id, student_id, skill, level, updated_at`,
    [id, studentId, skill, level]
  );
  return upserted[0];
}

// Explicitly filtered to the six official AP historical-thinking skills —
// margins_skill_mastery also holds the separate writing-mechanics dimension
// (see getWritingMechanicsForStudent), and this keeps that boundary a fact
// about the query, not an incidental side effect of what SkillMasteryPanel
// happens to render.
export async function getSkillMasteryForStudent(studentId: string): Promise<MarginsSkillMastery[]> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsSkillMastery>(
    `SELECT id, student_id, skill, level, updated_at FROM margins_skill_mastery
     WHERE student_id = $1 AND skill = ANY($2::text[])`,
    [studentId, AP_SKILL_IDS]
  );
  return rows;
}

// The course-specific "SAQ writing mechanics" dimension (claim / evidence /
// reasoning / identify-vs-explain) — same table, same mastery math, kept
// separate from the six official AP skills above by an explicit filter, not
// a schema split, since both dimensions share identical semantics today.
export async function getWritingMechanicsForStudent(studentId: string): Promise<MarginsSkillMastery[]> {
  await ensureMarginsSchema();
  const { rows } = await query<MarginsSkillMastery>(
    `SELECT id, student_id, skill, level, updated_at FROM margins_skill_mastery
     WHERE student_id = $1 AND skill = ANY($2::text[])`,
    [studentId, WRITING_MECHANICS_SKILL_IDS]
  );
  return rows;
}

// ─── Teacher dashboard ────────────────────────────────────────────────────────
// The dashboard was a bare class list with no sense of what needed attention.
// These two queries give it a state: what's waiting on the teacher, and what
// students have been doing since they last looked.

export interface TeacherClassSummary extends MarginsClass {
  student_count: number;
  assignment_count: number;
  /** Submitted but not yet graded — the number that should pull a teacher in. */
  awaiting_count: number;
}

export async function getClassSummariesByTeacher(teacherId: string): Promise<TeacherClassSummary[]> {
  await ensureMarginsSchema();
  // Aggregated in subqueries rather than joined-and-grouped: a class with 30
  // students and 8 assignments would otherwise fan out to 240 rows before the
  // GROUP BY collapses it, and the two counts would multiply each other.
  const { rows } = await query<TeacherClassSummary>(
    `SELECT c.id, c.teacher_id, c.name, c.join_code, c.created_at,
            (SELECT COUNT(*)::int FROM margins_class_memberships m WHERE m.class_id = c.id) AS student_count,
            (SELECT COUNT(*)::int FROM margins_assignments a WHERE a.class_id = c.id) AS assignment_count,
            (SELECT COUNT(*)::int
               FROM margins_submissions s
               JOIN margins_assignments a2 ON a2.id = s.assignment_id
              WHERE a2.class_id = c.id AND s.status = 'submitted') AS awaiting_count
       FROM margins_classes c
      WHERE c.teacher_id = $1
      ORDER BY c.created_at DESC`,
    [teacherId]
  );
  return rows;
}

export interface TeacherActivityRow {
  submission_id: string;
  student_name: string;
  assignment_id: string;
  assignment_title: string;
  essay_type: string;
  class_name: string;
  status: string;
  happened_at: string;
}

/** Most recent student submissions across all of a teacher's classes. */
export async function getRecentActivityForTeacher(
  teacherId: string,
  limit = 6
): Promise<TeacherActivityRow[]> {
  await ensureMarginsSchema();
  const { rows } = await query<TeacherActivityRow>(
    `SELECT s.id AS submission_id,
            u.name AS student_name,
            a.id AS assignment_id,
            a.title AS assignment_title,
            a.essay_type,
            c.name AS class_name,
            s.status,
            COALESCE(s.submitted_at, s.updated_at) AS happened_at
       FROM margins_submissions s
       JOIN margins_assignments a ON a.id = s.assignment_id
       JOIN margins_classes c ON c.id = a.class_id
       JOIN margins_users u ON u.id = s.student_id
      WHERE c.teacher_id = $1 AND s.status <> 'draft'
      ORDER BY COALESCE(s.submitted_at, s.updated_at) DESC
      LIMIT $2`,
    [teacherId, limit]
  );
  return rows;
}

/**
 * Distinct students a teacher actually teaches.
 *
 * Not the sum of per-class counts: a student enrolled in two of the same
 * teacher's classes is one student, and summing reports them twice.
 */
export async function getDistinctStudentCountForTeacher(teacherId: string): Promise<number> {
  await ensureMarginsSchema();
  const { rows } = await query<{ n: number }>(
    `SELECT COUNT(DISTINCT m.student_id)::int AS n
       FROM margins_class_memberships m
       JOIN margins_classes c ON c.id = m.class_id
      WHERE c.teacher_id = $1`,
    [teacherId]
  );
  return rows[0]?.n ?? 0;
}
