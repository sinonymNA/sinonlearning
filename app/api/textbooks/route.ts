import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { createTextbook, getAllTextbooksForAdmin, getPublishedTextbooks, uniqueSlugFromTitle } from "@/lib/textbooks";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const wantsAll = request.nextUrl.searchParams.get("all") === "1";

  if (wantsAll && (await isAdminRequest())) {
    const textbooks = await getAllTextbooksForAdmin();
    return NextResponse.json({ textbooks });
  }

  const textbooks = await getPublishedTextbooks();
  return NextResponse.json({ textbooks });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const coverImageUrl =
    typeof body.coverImageUrl === "string" && body.coverImageUrl.trim() ? body.coverImageUrl.trim() : null;
  const published = typeof body.published === "boolean" ? body.published : true;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const slug = await uniqueSlugFromTitle(title);
  const textbook = await createTextbook({ title, slug, subject, coverImageUrl, published });

  return NextResponse.json({ textbook }, { status: 201 });
}
