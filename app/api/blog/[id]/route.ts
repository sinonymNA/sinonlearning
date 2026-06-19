import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import { ensureBlogSchema, getPostById, uniqueSlugFromTitle, type BlogPost } from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await ensureBlogSchema();
  const existing = await getPostById(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const coverImageUrl =
    typeof body.coverImageUrl === "string" && body.coverImageUrl.trim()
      ? body.coverImageUrl.trim()
      : null;
  const published = typeof body.published === "boolean" ? body.published : existing.published;

  if (!title || !excerpt || !content) {
    return NextResponse.json(
      { error: "Title, excerpt, and content are required" },
      { status: 400 }
    );
  }

  const slug =
    title === existing.title
      ? existing.slug
      : await uniqueSlugFromTitle(title, existing.id);

  const { rows } = await query<BlogPost>(
    `UPDATE blog_posts
     SET title = $1, slug = $2, excerpt = $3, content = $4, cover_image_url = $5, published = $6, updated_at = now()
     WHERE id = $7
     RETURNING id, title, slug, excerpt, content, cover_image_url, published, created_at, updated_at`,
    [title, slug, excerpt, content, coverImageUrl, published, existing.id]
  );

  return NextResponse.json({ post: rows[0] });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await ensureBlogSchema();
  await query("DELETE FROM blog_posts WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
