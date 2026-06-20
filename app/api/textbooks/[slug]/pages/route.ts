import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { addTextbookPage, getTextbookBySlug } from "@/lib/textbooks";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const textbook = await getTextbookBySlug(slug);
  if (!textbook) {
    return NextResponse.json({ error: "Textbook not found" }, { status: 404 });
  }

  const page = await addTextbookPage(textbook.id);
  return NextResponse.json({ page }, { status: 201 });
}
