import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminRequest } from "@/lib/adminAuth";
import {
  ensureBlogSchema,
  getAllPostsForAdmin,
  getPublishedPosts,
  uniqueSlugFromTitle,
  type BlogPost,
} from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const wantsAll = request.nextUrl.searchParams.get("all") === "1";

  if (wantsAll && (await isAdminRequest())) {
    const posts = await getAllPostsForAdmin();
    return NextResponse.json({ posts });
  }

  const posts = await getPublishedPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const coverImageUrl =
    typeof body.coverImageUrl === "string" && body.coverImageUrl.trim()
      ? body.coverImageUrl.trim()
      : null;
  const published = typeof body.published === "boolean" ? body.published : true;

  if (!title || !excerpt || !content) {
    return NextResponse.json(
      { error: "Title, excerpt, and content are required" },
      { status: 400 }
    );
  }

  await ensureBlogSchema();
  const slug = await uniqueSlugFromTitle(title);

  const { rows } = await query<BlogPost>(
    `INSERT INTO blog_posts (title, slug, excerpt, content, cover_image_url, published)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, slug, excerpt, content, cover_image_url, published, created_at, updated_at`,
    [title, slug, excerpt, content, coverImageUrl, published]
  );

  return NextResponse.json({ post: rows[0] }, { status: 201 });
}
