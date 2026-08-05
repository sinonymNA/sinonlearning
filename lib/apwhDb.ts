import { randomUUID } from "crypto";
import { getPool, query } from "./db";
import { ensureMarginsSchema, type MarginsClass, type MarginsUser } from "./marginsDb";

export interface ApwhClassProfile {
  class_id: string;
  course_title: string;
  period_label: string;
  current_unit: string;
  school_year: string;
  exam_date: string | null;
  archived_at: string | null;
}

export interface ApwhDispatch {
  id: string;
  class_id: string;
  school_date: string;
  eyebrow: string;
  title: string;
  objective: string;
  agenda: string[];
  announcement: string;
  start_label: string;
  start_href: string;
  updated_at: string;
}

export interface ApwhClassContext {
  class: MarginsClass;
  profile: ApwhClassProfile;
  dispatch: ApwhDispatch | null;
}

export const APWH_PILOT_CLASS_NAMES = [
  "Sinon APWH 2nd Period",
  "Sinon APWH 3rd Period",
  "Nelson APWH 2nd Period",
  "Nelson APWH 4th Period",
  "Nelson APWH 6th Period",
] as const;

const PAUL_NELSON_EMAIL = "paul.nelson@sinonlearning.local";
const PAUL_NELSON_PASSWORD_HASH =
  "35faa34538234fbaeb8f685eb3e3aff0:7300c10aaee230040cfcf624cebf05945354015d5508d308ed21a1c810bab1e1e9ecf02a440d67149f0ab5d4ccf314c325164a761c0e84e510fe57e47fe40c2e";

const PILOT_CLASS_CODES: Record<(typeof APWH_PILOT_CLASS_NAMES)[number], string> = {
  "Sinon APWH 2nd Period": "SIN2ND",
  "Sinon APWH 3rd Period": "SIN3RD",
  "Nelson APWH 2nd Period": "NEL2ND",
  "Nelson APWH 4th Period": "NEL4TH",
  "Nelson APWH 6th Period": "NEL6TH",
};

const PILOT_CLASS_PERIODS: Record<(typeof APWH_PILOT_CLASS_NAMES)[number], string> = {
  "Sinon APWH 2nd Period": "2nd Period",
  "Sinon APWH 3rd Period": "3rd Period",
  "Nelson APWH 2nd Period": "2nd Period",
  "Nelson APWH 4th Period": "4th Period",
  "Nelson APWH 6th Period": "6th Period",
};

let schemaReady: Promise<void> | null = null;

export function ensureApwhSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = ensureMarginsSchema()
      .then(() => query(`CREATE TABLE IF NOT EXISTS apwh_class_profiles (
        class_id UUID PRIMARY KEY REFERENCES margins_classes(id) ON DELETE CASCADE,
        course_title TEXT NOT NULL DEFAULT 'AP World History: Modern',
        period_label TEXT NOT NULL DEFAULT '',
        current_unit TEXT NOT NULL DEFAULT 'Unit 1 · The Global Tapestry',
        school_year TEXT NOT NULL DEFAULT '2026–27',
        exam_date DATE,
        archived_at TIMESTAMPTZ
      )`))
      .then(() => query(`CREATE TABLE IF NOT EXISTS apwh_daily_dispatches (
        id UUID PRIMARY KEY,
        class_id UUID NOT NULL REFERENCES margins_classes(id) ON DELETE CASCADE,
        school_date DATE NOT NULL,
        eyebrow TEXT NOT NULL DEFAULT 'TODAY IN AP WORLD',
        title TEXT NOT NULL,
        objective TEXT NOT NULL DEFAULT '',
        agenda JSONB NOT NULL DEFAULT '[]',
        announcement TEXT NOT NULL DEFAULT '',
        start_label TEXT NOT NULL DEFAULT 'Begin today''s work',
        start_href TEXT NOT NULL DEFAULT '/margins/student',
        created_by UUID NOT NULL REFERENCES margins_users(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (class_id, school_date)
      )`))
      .then(() => query(`CREATE TABLE IF NOT EXISTS apwh_student_credentials (
        user_id UUID PRIMARY KEY REFERENCES margins_users(id) ON DELETE CASCADE,
        home_class_id UUID NOT NULL REFERENCES margins_classes(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        username_normalized TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (home_class_id, username_normalized)
      )`))
      .then(() => query(`CREATE TABLE IF NOT EXISTS apwh_audit_events (
        id UUID PRIMARY KEY,
        actor_id UUID REFERENCES margins_users(id) ON DELETE SET NULL,
        class_id UUID REFERENCES margins_classes(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`))
      .then(() => query(`CREATE TABLE IF NOT EXISTS apwh_rate_limits (
        bucket_key TEXT PRIMARY KEY,
        window_started_at TIMESTAMPTZ NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 1
      )`))
      .then(() => provisionApwhPilot())
      .then(() => undefined);
  }
  return schemaReady;
}

async function provisionApwhPilot(): Promise<void> {
  const { rows: paulRows } = await query<{ id: string }>(
    `INSERT INTO margins_users (id, email, password_hash, role, name)
     VALUES ($1, $2, $3, 'teacher', 'Paul Nelson')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = 'teacher'
     RETURNING id`,
    [randomUUID(), PAUL_NELSON_EMAIL, PAUL_NELSON_PASSWORD_HASH]
  );
  const paulId = paulRows[0].id;

  const { rows: primaryRows } = await query<{ id: string }>(
    `SELECT id FROM margins_users
     WHERE role = 'teacher' AND id <> $1
     ORDER BY CASE
       WHEN lower(name) LIKE '%sinon%' OR lower(email) LIKE '%sinon%' THEN 0
       ELSE 1
     END, created_at ASC
     LIMIT 1`,
    [paulId]
  );
  const sinonTeacherId = primaryRows[0]?.id ?? paulId;

  for (const className of APWH_PILOT_CLASS_NAMES) {
    const teacherId = className.startsWith("Nelson") ? paulId : sinonTeacherId;
    await query(
      `INSERT INTO margins_classes (id, teacher_id, name, join_code)
       SELECT $1, $2, $3, $4
       WHERE NOT EXISTS (SELECT 1 FROM margins_classes WHERE name = $3)
       ON CONFLICT (join_code) DO NOTHING`,
      [randomUUID(), teacherId, className, PILOT_CLASS_CODES[className]]
    );
    await query(
      `INSERT INTO apwh_class_profiles (class_id, course_title, period_label)
       SELECT id, 'AP World History: Modern', $2
       FROM margins_classes WHERE name = $1
       ON CONFLICT (class_id) DO NOTHING`,
      [className, PILOT_CLASS_PERIODS[className]]
    );
  }
}

export async function getApwhPilotClasses(): Promise<MarginsClass[]> {
  await ensureApwhSchema();
  const { rows } = await query<MarginsClass>(
    `SELECT id, teacher_id, name, join_code, created_at
     FROM margins_classes
     WHERE name = ANY($1::text[])
     ORDER BY array_position($1::text[], name)`,
    [[...APWH_PILOT_CLASS_NAMES]]
  );
  return rows;
}

export async function resetApwhTeacherPassword(
  email: string,
  passwordHash: string
): Promise<{ id: string; name: string } | undefined> {
  await ensureApwhSchema();
  const { rows } = await query<{ id: string; name: string }>(
    `UPDATE margins_users
     SET password_hash = $2
     WHERE id = (
       SELECT id FROM margins_users
       WHERE role = 'teacher'
         AND (lower(email) = lower($1) OR lower(name) = lower($1))
       ORDER BY CASE WHEN lower(email) = lower($1) THEN 0 ELSE 1 END, created_at ASC
       LIMIT 1
     )
     RETURNING id, name`,
    [email.trim(), passwordHash]
  );
  const user = rows[0];
  if (user) await query(`DELETE FROM margins_sessions WHERE user_id = $1`, [user.id]);
  return user;
}

export async function resetApwhStudentPassword(
  classId: string,
  username: string,
  passwordHash: string
): Promise<{ id: string; name: string } | undefined> {
  await ensureApwhSchema();
  const { rows } = await query<{ id: string; name: string }>(
    `UPDATE margins_users u
     SET password_hash = $3
     FROM apwh_student_credentials c
     WHERE u.id = c.user_id
       AND u.role = 'student'
       AND c.home_class_id = $1
       AND c.username_normalized = $2
     RETURNING u.id, u.name`,
    [classId, normalizeApwhUsername(username), passwordHash]
  );
  const user = rows[0];
  if (user) await query(`DELETE FROM margins_sessions WHERE user_id = $1`, [user.id]);
  return user;
}

export function normalizeApwhUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

export async function consumeApwhRateLimit(
  bucketKey: string,
  windowMinutes: number,
  maxAttempts: number
): Promise<boolean> {
  await ensureApwhSchema();
  const { rows } = await query<{ attempts: number }>(
    `INSERT INTO apwh_rate_limits (bucket_key, window_started_at, attempts)
     VALUES ($1, now(), 1)
     ON CONFLICT (bucket_key) DO UPDATE SET
       window_started_at = CASE
         WHEN apwh_rate_limits.window_started_at < now() - ($2 * interval '1 minute') THEN now()
         ELSE apwh_rate_limits.window_started_at
       END,
       attempts = CASE
         WHEN apwh_rate_limits.window_started_at < now() - ($2 * interval '1 minute') THEN 1
         ELSE apwh_rate_limits.attempts + 1
       END
     RETURNING attempts`,
    [bucketKey, windowMinutes]
  );
  return (rows[0]?.attempts ?? maxAttempts + 1) > maxAttempts;
}

export async function createApwhStudent(params: {
  classId: string;
  name: string;
  username: string;
  passwordHash: string;
}): Promise<MarginsUser> {
  await ensureApwhSchema();
  const normalized = normalizeApwhUsername(params.username);
  const userId = randomUUID();
  // margins_users predates APWH and requires an email. This non-routable,
  // random address satisfies that legacy constraint without collecting a
  // student's real email address.
  const privateAlias = `apwh-${userId}@accounts.invalid`;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<MarginsUser>(
      `INSERT INTO margins_users (id, email, password_hash, role, name)
       VALUES ($1, $2, $3, 'student', $4)
       RETURNING id, email, password_hash, role, name, created_at`,
      [userId, privateAlias, params.passwordHash, params.name.trim()]
    );
    await client.query(
      `INSERT INTO apwh_student_credentials
       (user_id, home_class_id, username, username_normalized)
       VALUES ($1, $2, $3, $4)`,
      [userId, params.classId, params.username.trim(), normalized]
    );
    await client.query(
      `INSERT INTO margins_class_memberships (class_id, student_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [params.classId, userId]
    );
    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getApwhStudentForLogin(
  classId: string,
  username: string
): Promise<MarginsUser | undefined> {
  await ensureApwhSchema();
  const { rows } = await query<MarginsUser>(
    `SELECT u.id, u.email, u.password_hash, u.role, u.name, u.created_at
     FROM apwh_student_credentials c
     JOIN margins_users u ON u.id = c.user_id
     WHERE c.home_class_id = $1 AND c.username_normalized = $2`,
    [classId, normalizeApwhUsername(username)]
  );
  return rows[0];
}

export interface ApwhStudentLoginCandidate extends MarginsUser {
  home_class_id: string;
}

export async function getApwhStudentsForLogin(username: string): Promise<ApwhStudentLoginCandidate[]> {
  await ensureApwhSchema();
  const { rows } = await query<ApwhStudentLoginCandidate>(
    `SELECT u.id, u.email, u.password_hash, u.role, u.name, u.created_at,
       c.home_class_id
     FROM apwh_student_credentials c
     JOIN margins_users u ON u.id = c.user_id
     WHERE c.username_normalized = $1
     ORDER BY c.created_at ASC`,
    [normalizeApwhUsername(username)]
  );
  return rows;
}

export async function ensureApwhProfile(classId: string): Promise<ApwhClassProfile> {
  await ensureApwhSchema();
  const { rows } = await query<ApwhClassProfile>(
    `INSERT INTO apwh_class_profiles (class_id) VALUES ($1)
     ON CONFLICT (class_id) DO UPDATE SET class_id = EXCLUDED.class_id
     RETURNING class_id, course_title, period_label, current_unit, school_year,
       exam_date::text, archived_at`,
    [classId]
  );
  return rows[0];
}

export async function getDispatch(classId: string, schoolDate: string): Promise<ApwhDispatch | null> {
  await ensureApwhSchema();
  const { rows } = await query<ApwhDispatch>(
    `SELECT id, class_id, school_date::text, eyebrow, title, objective, agenda,
       announcement, start_label, start_href, updated_at
     FROM apwh_daily_dispatches
     WHERE class_id = $1 AND school_date = $2`,
    [classId, schoolDate]
  );
  return rows[0] ?? null;
}

export async function getLatestDispatch(classId: string): Promise<ApwhDispatch | null> {
  await ensureApwhSchema();
  const { rows } = await query<ApwhDispatch>(
    `SELECT id, class_id, school_date::text, eyebrow, title, objective, agenda,
       announcement, start_label, start_href, updated_at
     FROM apwh_daily_dispatches
     WHERE class_id = $1 AND school_date <= CURRENT_DATE
     ORDER BY school_date DESC LIMIT 1`,
    [classId]
  );
  return rows[0] ?? null;
}

export async function upsertDispatch(params: {
  classId: string;
  schoolDate: string;
  eyebrow: string;
  title: string;
  objective: string;
  agenda: string[];
  announcement: string;
  startLabel: string;
  startHref: string;
  teacherId: string;
}): Promise<ApwhDispatch> {
  await ensureApwhSchema();
  const id = randomUUID();
  const { rows } = await query<ApwhDispatch>(
    `INSERT INTO apwh_daily_dispatches
       (id, class_id, school_date, eyebrow, title, objective, agenda,
        announcement, start_label, start_href, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (class_id, school_date) DO UPDATE SET
       eyebrow = EXCLUDED.eyebrow,
       title = EXCLUDED.title,
       objective = EXCLUDED.objective,
       agenda = EXCLUDED.agenda,
       announcement = EXCLUDED.announcement,
       start_label = EXCLUDED.start_label,
       start_href = EXCLUDED.start_href,
       updated_at = now()
     RETURNING id, class_id, school_date::text, eyebrow, title, objective,
       agenda, announcement, start_label, start_href, updated_at`,
    [
      id, params.classId, params.schoolDate, params.eyebrow, params.title,
      params.objective, JSON.stringify(params.agenda), params.announcement,
      params.startLabel, params.startHref, params.teacherId,
    ]
  );
  await recordApwhAudit(params.teacherId, params.classId, "dispatch.upsert", "dispatch", rows[0].id);
  return rows[0];
}

export async function updateApwhProfile(params: {
  classId: string;
  courseTitle: string;
  periodLabel: string;
  currentUnit: string;
  schoolYear: string;
  examDate: string | null;
  teacherId: string;
}): Promise<ApwhClassProfile> {
  await ensureApwhSchema();
  const { rows } = await query<ApwhClassProfile>(
    `INSERT INTO apwh_class_profiles
       (class_id, course_title, period_label, current_unit, school_year, exam_date)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (class_id) DO UPDATE SET
       course_title = EXCLUDED.course_title,
       period_label = EXCLUDED.period_label,
       current_unit = EXCLUDED.current_unit,
       school_year = EXCLUDED.school_year,
       exam_date = EXCLUDED.exam_date
     RETURNING class_id, course_title, period_label, current_unit, school_year,
       exam_date::text, archived_at`,
    [params.classId, params.courseTitle, params.periodLabel, params.currentUnit, params.schoolYear, params.examDate]
  );
  await recordApwhAudit(params.teacherId, params.classId, "profile.update", "class", params.classId);
  return rows[0];
}

export async function recordApwhAudit(
  actorId: string | null,
  classId: string | null,
  action: string,
  targetType: string,
  targetId?: string
): Promise<void> {
  await ensureApwhSchema();
  await query(
    `INSERT INTO apwh_audit_events
       (id, actor_id, class_id, action, target_type, target_id)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [randomUUID(), actorId, classId, action, targetType, targetId ?? null]
  );
}
