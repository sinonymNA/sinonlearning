import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";
import { parseGoogleMaterialUrl } from "@/lib/googleMaterial";
import { isAdminRequest } from "@/lib/adminAuth";
import type { Material } from "@/lib/material";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await ensureSchema();
  const course = request.nextUrl.searchParams.get("course");

  const { rows } = course
    ? await query<Material>(
        "SELECT id, title, url, kind, file_id, course_slug, position, created_at FROM materials WHERE course_slug = $1 ORDER BY position ASC, created_at ASC",
        [course]
      )
    : await query<Material>(
        "SELECT id, title, url, kind, file_id, course_slug, position, created_at FROM materials ORDER BY created_at DESC"
      );

  return NextResponse.json({ materials: rows });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const course = typeof body.course === "string" ? body.course.trim() : "";

  if (!title || !url || !course) {
    return NextResponse.json({ error: "Title and link are required" }, { status: 400 });
  }

  const parsed = parseGoogleMaterialUrl(url);
  if (!parsed) {
    return NextResponse.json(
      { error: "That doesn't look like a Google Docs or Slides link" },
      { status: 400 }
    );
  }

  await ensureSchema();
  const { rows: maxRows } = await query<{ next: number }>(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next FROM materials WHERE course_slug = $1",
    [course]
  );
  const position = maxRows[0]?.next ?? 0;

  const { rows } = await query<Material>(
    "INSERT INTO materials (title, url, kind, file_id, course_slug, position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, url, kind, file_id, course_slug, position, created_at",
    [title, url, parsed.kind, parsed.fileId, course, position]
  );
  return NextResponse.json({ material: rows[0] }, { status: 201 });
}
