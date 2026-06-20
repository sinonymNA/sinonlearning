import { query } from "./db";

export interface Textbook {
  id: number;
  title: string;
  slug: string;
  subject: string;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface TextbookPage {
  id: number;
  textbook_id: number;
  page_number: number;
  content: string;
  created_at: string;
  updated_at: string;
}

const TEXTBOOK_COLUMNS = "id, title, slug, subject, cover_image_url, published, created_at, updated_at";
const PAGE_COLUMNS = "id, textbook_id, page_number, content, created_at, updated_at";

let schemaReady: Promise<void> | null = null;

export function ensureTextbookSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS textbooks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        subject TEXT NOT NULL DEFAULT '',
        cover_image_url TEXT,
        published BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )
      .then(() =>
        query(
          `CREATE TABLE IF NOT EXISTS textbook_pages (
            id SERIAL PRIMARY KEY,
            textbook_id INTEGER NOT NULL REFERENCES textbooks(id) ON DELETE CASCADE,
            page_number INTEGER NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (textbook_id, page_number)
          )`
        )
      )
      .then(() => undefined);
  }
  return schemaReady;
}

export async function getPublishedTextbooks(): Promise<Textbook[]> {
  await ensureTextbookSchema();
  const { rows } = await query<Textbook>(
    `SELECT ${TEXTBOOK_COLUMNS} FROM textbooks WHERE published ORDER BY created_at DESC`
  );
  return rows;
}

export async function getAllTextbooksForAdmin(): Promise<Textbook[]> {
  await ensureTextbookSchema();
  const { rows } = await query<Textbook>(
    `SELECT ${TEXTBOOK_COLUMNS} FROM textbooks ORDER BY created_at DESC`
  );
  return rows;
}

export async function getTextbookBySlug(slug: string): Promise<Textbook | undefined> {
  await ensureTextbookSchema();
  const { rows } = await query<Textbook>(`SELECT ${TEXTBOOK_COLUMNS} FROM textbooks WHERE slug = $1`, [
    slug,
  ]);
  return rows[0];
}

export async function getTextbookById(id: number): Promise<Textbook | undefined> {
  await ensureTextbookSchema();
  const { rows } = await query<Textbook>(`SELECT ${TEXTBOOK_COLUMNS} FROM textbooks WHERE id = $1`, [id]);
  return rows[0];
}

export async function getTextbookPages(textbookId: number): Promise<TextbookPage[]> {
  await ensureTextbookSchema();
  const { rows } = await query<TextbookPage>(
    `SELECT ${PAGE_COLUMNS} FROM textbook_pages WHERE textbook_id = $1 ORDER BY page_number ASC`,
    [textbookId]
  );
  return rows;
}

export async function uniqueSlugFromTitle(title: string, excludeId?: number): Promise<string> {
  const { slugify } = await import("./slug");
  const base = slugify(title) || "textbook";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { rows } = await query<{ id: number }>(
      excludeId !== undefined
        ? "SELECT id FROM textbooks WHERE slug = $1 AND id != $2"
        : "SELECT id FROM textbooks WHERE slug = $1",
      excludeId !== undefined ? [candidate, excludeId] : [candidate]
    );
    if (rows.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function createTextbook(data: {
  title: string;
  slug: string;
  subject: string;
  coverImageUrl: string | null;
  published: boolean;
}): Promise<Textbook> {
  await ensureTextbookSchema();
  const { rows } = await query<Textbook>(
    `INSERT INTO textbooks (title, slug, subject, cover_image_url, published)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${TEXTBOOK_COLUMNS}`,
    [data.title, data.slug, data.subject, data.coverImageUrl, data.published]
  );
  return rows[0];
}

export async function updateTextbook(
  id: number,
  data: { title: string; slug: string; subject: string; coverImageUrl: string | null; published: boolean }
): Promise<Textbook | undefined> {
  await ensureTextbookSchema();
  const { rows } = await query<Textbook>(
    `UPDATE textbooks
     SET title = $1, slug = $2, subject = $3, cover_image_url = $4, published = $5, updated_at = now()
     WHERE id = $6
     RETURNING ${TEXTBOOK_COLUMNS}`,
    [data.title, data.slug, data.subject, data.coverImageUrl, data.published, id]
  );
  return rows[0];
}

export async function deleteTextbook(id: number): Promise<void> {
  await ensureTextbookSchema();
  await query("DELETE FROM textbooks WHERE id = $1", [id]);
}

export async function addTextbookPage(textbookId: number): Promise<TextbookPage> {
  await ensureTextbookSchema();
  const { rows: maxRows } = await query<{ max: number | null }>(
    "SELECT MAX(page_number) as max FROM textbook_pages WHERE textbook_id = $1",
    [textbookId]
  );
  const nextPageNumber = (maxRows[0]?.max ?? 0) + 1;
  const { rows } = await query<TextbookPage>(
    `INSERT INTO textbook_pages (textbook_id, page_number, content)
     VALUES ($1, $2, '')
     RETURNING ${PAGE_COLUMNS}`,
    [textbookId, nextPageNumber]
  );
  return rows[0];
}

export async function updateTextbookPage(
  textbookId: number,
  pageNumber: number,
  content: string
): Promise<TextbookPage | undefined> {
  await ensureTextbookSchema();
  const { rows } = await query<TextbookPage>(
    `UPDATE textbook_pages SET content = $1, updated_at = now()
     WHERE textbook_id = $2 AND page_number = $3
     RETURNING ${PAGE_COLUMNS}`,
    [content, textbookId, pageNumber]
  );
  return rows[0];
}

export async function deleteTextbookPage(textbookId: number, pageNumber: number): Promise<void> {
  await ensureTextbookSchema();
  await query("DELETE FROM textbook_pages WHERE textbook_id = $1 AND page_number = $2", [
    textbookId,
    pageNumber,
  ]);
  await query(
    `UPDATE textbook_pages
     SET page_number = page_number - 1
     WHERE textbook_id = $1 AND page_number > $2`,
    [textbookId, pageNumber]
  );
}
