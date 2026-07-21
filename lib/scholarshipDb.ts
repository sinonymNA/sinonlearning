import { query } from "./db";
import type { StudentProfile } from "./scholarshipMatch";
import type { Scholarship } from "@/data/scholarships";
import type { ScrapedEntry } from "./scraperTargets";

// ─── Profiles ─────────────────────────────────────────────────────────────────

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS scholarship_profiles (
          user_id    UUID PRIMARY KEY REFERENCES margins_users(id) ON DELETE CASCADE,
          profile    JSONB NOT NULL DEFAULT '{}',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS scraped_scholarships (
          id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          external_id         TEXT UNIQUE NOT NULL,
          name                TEXT NOT NULL,
          provider            TEXT NOT NULL,
          amount              INTEGER,
          amount_label        TEXT NOT NULL,
          deadline            DATE,
          deadline_label      TEXT NOT NULL,
          url                 TEXT NOT NULL,
          description         TEXT NOT NULL,
          scope               TEXT NOT NULL DEFAULT 'state',
          eligible_states     TEXT[] NOT NULL DEFAULT '{GA}',
          eligible_grades     TEXT[] NOT NULL DEFAULT '{"12","college-1","college-2","college-3","college-4"}',
          tags                TEXT[] NOT NULL DEFAULT '{}',
          estimated_applicants INTEGER NOT NULL DEFAULT 25,
          verified            BOOLEAN NOT NULL DEFAULT false,
          source_target       TEXT NOT NULL,
          scraped_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);
    })();
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

// ─── Scraped Scholarships ──────────────────────────────────────────────────────

function makeExternalId(targetId: string, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/-$/, "");
  return `${targetId}:${slug}`;
}

interface UpsertOptions {
  scope: string;
  estimatedApplicants: number;
}

export async function upsertScrapedScholarships(
  entries: ScrapedEntry[],
  targetId: string,
  opts: UpsertOptions,
): Promise<{ inserted: number }> {
  await ensureSchema();
  let inserted = 0;

  for (const e of entries) {
    const externalId = makeExternalId(targetId, e.name);
    const result = await query(
      `INSERT INTO scraped_scholarships (
         external_id, name, provider, amount, amount_label,
         deadline, deadline_label, url, description,
         scope, eligible_grades, tags, estimated_applicants,
         source_target, scraped_at, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,now(),now())
       ON CONFLICT (external_id) DO UPDATE SET
         name            = EXCLUDED.name,
         provider        = EXCLUDED.provider,
         amount          = EXCLUDED.amount,
         amount_label    = EXCLUDED.amount_label,
         deadline        = EXCLUDED.deadline,
         deadline_label  = EXCLUDED.deadline_label,
         url             = EXCLUDED.url,
         description     = EXCLUDED.description,
         eligible_grades = EXCLUDED.eligible_grades,
         tags            = EXCLUDED.tags,
         updated_at      = now()
       RETURNING (xmax = 0) AS is_new`,
      [
        externalId,
        e.name,
        e.provider,
        e.amount ?? null,
        e.amountLabel,
        e.deadline ?? null,
        e.deadlineLabel,
        e.url,
        e.description,
        opts.scope,
        e.eligibleGrades,
        e.tags,
        opts.estimatedApplicants,
        targetId,
      ],
    );
    if (result.rows[0]?.is_new) inserted++;
  }

  return { inserted };
}

export async function getVerifiedScrapedScholarships(): Promise<Scholarship[]> {
  await ensureSchema();
  const result = await query(
    `SELECT * FROM scraped_scholarships WHERE verified = true ORDER BY estimated_applicants ASC`,
  );

  return result.rows.map((row) => ({
    id: `scraped-${row.external_id}`,
    name: row.name as string,
    provider: row.provider as string,
    amount: row.amount as number | null,
    amountLabel: row.amount_label as string,
    deadline: row.deadline ? String(row.deadline).split("T")[0] : null,
    deadlineLabel: row.deadline_label as string,
    url: row.url as string,
    description: row.description as string,
    scope: row.scope as Scholarship["scope"],
    eligibleStates: (row.eligible_states as string[]) ?? ["GA"],
    eligibleGrades: (row.eligible_grades as string[]) ?? [],
    tags: (row.tags as string[]) ?? [],
    estimatedApplicants: row.estimated_applicants as number,
  }));
}

export async function getAllScrapedScholarships(): Promise<
  Array<{ id: string; externalId: string; name: string; provider: string; url: string; verified: boolean; sourceTarget: string; scrapedAt: string }>
> {
  await ensureSchema();
  const result = await query(
    `SELECT id, external_id, name, provider, url, verified, source_target, scraped_at
     FROM scraped_scholarships ORDER BY scraped_at DESC`,
  );
  return result.rows.map((r) => ({
    id: r.id as string,
    externalId: r.external_id as string,
    name: r.name as string,
    provider: r.provider as string,
    url: r.url as string,
    verified: r.verified as boolean,
    sourceTarget: r.source_target as string,
    scrapedAt: String(r.scraped_at),
  }));
}

export async function setScrapedScholarshipVerified(
  id: string,
  verified: boolean,
): Promise<void> {
  await ensureSchema();
  await query(`UPDATE scraped_scholarships SET verified = $1, updated_at = now() WHERE id = $2`, [
    verified,
    id,
  ]);
}
