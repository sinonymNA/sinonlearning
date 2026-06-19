import { query } from "./db";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

const POST_COLUMNS =
  "id, title, slug, excerpt, content, cover_image_url, published, created_at, updated_at";

let schemaReady: Promise<void> | null = null;

export function ensureBlogSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = query(
      `CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        excerpt TEXT NOT NULL,
        content TEXT NOT NULL,
        cover_image_url TEXT,
        published BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    ).then(() => undefined);
  }
  return schemaReady;
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  await ensureBlogSchema();
  const { rows } = await query<BlogPost>(
    `SELECT ${POST_COLUMNS} FROM blog_posts WHERE published ORDER BY created_at DESC`
  );
  return rows;
}

export async function getAllPostsForAdmin(): Promise<BlogPost[]> {
  await ensureBlogSchema();
  const { rows } = await query<BlogPost>(
    `SELECT ${POST_COLUMNS} FROM blog_posts ORDER BY created_at DESC`
  );
  return rows;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  await ensureBlogSchema();
  const { rows } = await query<BlogPost>(
    `SELECT ${POST_COLUMNS} FROM blog_posts WHERE slug = $1`,
    [slug]
  );
  return rows[0];
}

export async function getPostById(id: number): Promise<BlogPost | undefined> {
  await ensureBlogSchema();
  const { rows } = await query<BlogPost>(
    `SELECT ${POST_COLUMNS} FROM blog_posts WHERE id = $1`,
    [id]
  );
  return rows[0];
}

export async function uniqueSlugFromTitle(title: string, excludeId?: number): Promise<string> {
  const { slugify } = await import("./slug");
  const base = slugify(title) || "post";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const { rows } = await query<{ id: number }>(
      excludeId !== undefined
        ? "SELECT id FROM blog_posts WHERE slug = $1 AND id != $2"
        : "SELECT id FROM blog_posts WHERE slug = $1",
      excludeId !== undefined ? [candidate, excludeId] : [candidate]
    );
    if (rows.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}
