import { query } from "./db";
import type { StudentProfile } from "./scholarshipMatch";

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(`
      CREATE TABLE IF NOT EXISTS scholarship_profiles (
        user_id    UUID PRIMARY KEY REFERENCES margins_users(id) ON DELETE CASCADE,
        profile    JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `).then(() => undefined);
  }
  return schemaReady;
}

export async function saveScholarshipProfile(
  userId: string,
  profile: StudentProfile,
): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO scholarship_profiles (user_id, profile, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (user_id) DO UPDATE
       SET profile = $2, updated_at = now()`,
    [userId, JSON.stringify(profile)],
  );
}

export async function loadScholarshipProfile(
  userId: string,
): Promise<StudentProfile | null> {
  await ensureSchema();
  const result = await query(
    `SELECT profile FROM scholarship_profiles WHERE user_id = $1`,
    [userId],
  );
  if (result.rows.length === 0) return null;
  return result.rows[0].profile as StudentProfile;
}
