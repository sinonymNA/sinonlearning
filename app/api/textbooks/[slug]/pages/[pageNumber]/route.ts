import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { deleteTextbookPage, getTextbookBySlug, updateTextbookPage } from "@/lib/textbooks";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; pageNumber: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, pageNumber } = await params;
  const textbook = await getTextbookBySlug(slug);
  if (!textbook) {
    return NextResponse.json({ error: "Textbook not found" }, { status: 404 });
  }

  const body = await request.json();
  const content = typeof body.content === "string" ? body.content : "";

  const page = await updateTextbookPage(textbook.id, Number(pageNumber), content);
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  return NextResponse.json({ page });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; pageNumber: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, pageNumber } = await params;
  const textbook = await getTextbookBySlug(slug);
  if (!textbook) {
    return NextResponse.json({ error: "Textbook not found" }, { status: 404 });
  }

  await deleteTextbookPage(textbook.id, Number(pageNumber));
  return NextResponse.json({ ok: true });
}
