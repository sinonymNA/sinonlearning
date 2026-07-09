import { randomUUID } from "crypto";
import { query } from "./db";
import type { Slide } from "./sliderTypes";
import { DEFAULT_THEME_ID, SLIDER_THEMES, type SliderTheme } from "./sliderThemes";

export interface SliderDeckRow {
  id: string;
  teacher_id: string;
  title: string;
  theme_id: string;
  slides: Slide[];
  kora_gap_statement: string | null;
  created_at: string;
  updated_at: string;
}

export interface SliderImageRow {
  id: string;
  uploaded_by: string;
  mime_type: string;
  data: Buffer;
  byte_size: number;
  source_url: string | null;
  attribution: string | null;
  created_at: string;
}

let schemaReady: Promise<void> | null = null;

export function ensureSliderSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS slider_decks (
        id UUID PRIMARY KEY,
        teacher_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'Untitled deck',
        theme_id TEXT NOT NULL,
        slides JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS slider_images (
          id UUID PRIMARY KEY,
          uploaded_by UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          mime_type TEXT NOT NULL,
          data BYTEA NOT NULL,
          byte_size INTEGER NOT NULL,
          source_url TEXT,
          attribution TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() =>
        query(`CREATE TABLE IF NOT EXISTS slider_custom_themes (
          id UUID PRIMARY KEY,
          teacher_id UUID NOT NULL REFERENCES margins_users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          colors JSONB NOT NULL,
          fonts JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`)
      )
      .then(() => query(`ALTER TABLE slider_decks ADD COLUMN IF NOT EXISTS kora_gap_statement TEXT`))
      .then(() => undefined);
  }
  return schemaReady;
}

const DECK_COLUMNS = "id, teacher_id, title, theme_id, slides, kora_gap_statement, created_at, updated_at";

export async function createDeck(params: {
  teacherId: string;
  title?: string;
  themeId?: string;
  slides?: Slide[];
  koraGapStatement?: string | null;
}): Promise<SliderDeckRow> {
  await ensureSliderSchema();
  const id = randomUUID();
  const { rows } = await query<SliderDeckRow>(
    `INSERT INTO slider_decks (id, teacher_id, title, theme_id, slides, kora_gap_statement)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${DECK_COLUMNS}`,
    [
      id,
      params.teacherId,
      params.title?.trim() || "Untitled deck",
      params.themeId ?? DEFAULT_THEME_ID,
      JSON.stringify(params.slides ?? []),
      params.koraGapStatement ?? null,
    ]
  );
  return rows[0];
}

export async function getDeckById(id: string): Promise<SliderDeckRow | undefined> {
  await ensureSliderSchema();
  const { rows } = await query<SliderDeckRow>(`SELECT ${DECK_COLUMNS} FROM slider_decks WHERE id = $1`, [id]);
  return rows[0];
}

export async function getDecksByTeacher(teacherId: string): Promise<SliderDeckRow[]> {
  await ensureSliderSchema();
  const { rows } = await query<SliderDeckRow>(
    `SELECT ${DECK_COLUMNS} FROM slider_decks WHERE teacher_id = $1 ORDER BY updated_at DESC`,
    [teacherId]
  );
  return rows;
}

export async function updateDeck(
  id: string,
  patch: { title?: string; themeId?: string; slides?: Slide[] }
): Promise<SliderDeckRow | undefined> {
  await ensureSliderSchema();
  const { rows } = await query<SliderDeckRow>(
    `UPDATE slider_decks SET
       title = COALESCE($2, title),
       theme_id = COALESCE($3, theme_id),
       slides = COALESCE($4, slides),
       updated_at = now()
     WHERE id = $1
     RETURNING ${DECK_COLUMNS}`,
    [
      id,
      patch.title?.trim() || null,
      patch.themeId ?? null,
      patch.slides ? JSON.stringify(patch.slides) : null,
    ]
  );
  return rows[0];
}

export async function deleteDeck(id: string): Promise<void> {
  await ensureSliderSchema();
  await query(`DELETE FROM slider_decks WHERE id = $1`, [id]);
}

// ── Images ──

export async function createSliderImage(params: {
  uploadedBy: string;
  mimeType: string;
  data: Buffer;
  sourceUrl?: string | null;
  attribution?: string | null;
}): Promise<SliderImageRow> {
  await ensureSliderSchema();
  const id = randomUUID();
  const { rows } = await query<SliderImageRow>(
    `INSERT INTO slider_images (id, uploaded_by, mime_type, data, byte_size, source_url, attribution)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, uploaded_by, mime_type, data, byte_size, source_url, attribution, created_at`,
    [
      id,
      params.uploadedBy,
      params.mimeType,
      params.data,
      params.data.length,
      params.sourceUrl ?? null,
      params.attribution ?? null,
    ]
  );
  return rows[0];
}

export async function getSliderImage(id: string): Promise<SliderImageRow | undefined> {
  await ensureSliderSchema();
  const { rows } = await query<SliderImageRow>(
    `SELECT id, uploaded_by, mime_type, data, byte_size, source_url, attribution, created_at
     FROM slider_images WHERE id = $1`,
    [id]
  );
  return rows[0];
}

// ── Custom themes ──

interface SliderCustomThemeRow {
  id: string;
  teacher_id: string;
  name: string;
  colors: SliderTheme["colors"];
  fonts: SliderTheme["fonts"];
  created_at: string;
}

function toSliderTheme(row: SliderCustomThemeRow): SliderTheme {
  return { id: row.id, name: row.name, colors: row.colors, fonts: row.fonts, custom: true };
}

export async function createCustomTheme(params: {
  teacherId: string;
  name: string;
  colors: SliderTheme["colors"];
  fonts: SliderTheme["fonts"];
}): Promise<SliderTheme> {
  await ensureSliderSchema();
  const id = randomUUID();
  const { rows } = await query<SliderCustomThemeRow>(
    `INSERT INTO slider_custom_themes (id, teacher_id, name, colors, fonts)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, teacher_id, name, colors, fonts, created_at`,
    [id, params.teacherId, params.name.trim() || "Untitled theme", JSON.stringify(params.colors), JSON.stringify(params.fonts)]
  );
  return toSliderTheme(rows[0]);
}

export async function getCustomThemesByTeacher(teacherId: string): Promise<SliderTheme[]> {
  await ensureSliderSchema();
  const { rows } = await query<SliderCustomThemeRow>(
    `SELECT id, teacher_id, name, colors, fonts, created_at
     FROM slider_custom_themes WHERE teacher_id = $1 ORDER BY created_at DESC`,
    [teacherId]
  );
  return rows.map(toSliderTheme);
}

export async function getCustomTheme(id: string, teacherId: string): Promise<SliderTheme | undefined> {
  await ensureSliderSchema();
  const { rows } = await query<SliderCustomThemeRow>(
    `SELECT id, teacher_id, name, colors, fonts, created_at
     FROM slider_custom_themes WHERE id = $1 AND teacher_id = $2`,
    [id, teacherId]
  );
  return rows[0] ? toSliderTheme(rows[0]) : undefined;
}

export async function deleteCustomTheme(id: string, teacherId: string): Promise<void> {
  await ensureSliderSchema();
  await query(`DELETE FROM slider_custom_themes WHERE id = $1 AND teacher_id = $2`, [id, teacherId]);
}

// True if themeId is a built-in preset, or a custom theme owned by teacherId.
export async function isOwnedThemeId(themeId: string, teacherId: string): Promise<boolean> {
  if (SLIDER_THEMES.some((t) => t.id === themeId)) return true;
  return !!(await getCustomTheme(themeId, teacherId));
}

// Resolves a deck's theme_id to a full SliderTheme, checking custom themes
// (scoped to teacherId) when the id isn't one of the built-in presets.
export async function resolveDeckTheme(themeId: string, teacherId: string): Promise<SliderTheme> {
  const builtin = SLIDER_THEMES.find((t) => t.id === themeId);
  if (builtin) return builtin;
  const custom = await getCustomTheme(themeId, teacherId);
  return custom ?? SLIDER_THEMES[0];
}
