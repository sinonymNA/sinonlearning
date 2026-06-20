import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { deleteTextbook, getTextbookBySlug, updateTextbook, uniqueSlugFromTitle } from "@/lib/textbooks";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const existing = await getTextbookBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Textbook not found" }, { status: 404 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const coverImageUrl =
    typeof body.coverImageUrl === "string" && body.coverImageUrl.trim() ? body.coverImageUrl.trim() : null;
  const published = typeof body.published === "boolean" ? body.published : existing.published;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const newSlug = title === existing.title ? existing.slug : await uniqueSlugFromTitle(title, existing.id);

  const textbook = await updateTextbook(existing.id, {
    title,
    slug: newSlug,
    subject,
    coverImageUrl,
    published,
  });

  return NextResponse.json({ textbook });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const existing = await getTextbookBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Textbook not found" }, { status: 404 });
  }

  await deleteTextbook(existing.id);
  return NextResponse.json({ ok: true });
}
