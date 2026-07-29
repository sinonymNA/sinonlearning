import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/standardSortDb";
import { parseStandardsText } from "@/lib/standardSort";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { title?: string; units?: string[]; standardsText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const units = (body.units ?? []).map((u) => u.trim()).filter(Boolean).slice(0, 16);
  const standards = parseStandardsText(body.standardsText ?? "");

  if (!title) return NextResponse.json({ error: "Give the session a title." }, { status: 400 });
  if (units.length < 2) return NextResponse.json({ error: "Add at least two units." }, { status: 400 });
  if (standards.length === 0) {
    return NextResponse.json({ error: "Paste at least one standard." }, { status: 400 });
  }

  try {
    const { code, hostToken } = await createSession({ title, units, standards });
    return NextResponse.json({ code, hostToken });
  } catch (err) {
    console.error("[standard-sort/sessions] create failed:", err);
    return NextResponse.json({ error: "Could not create the session." }, { status: 500 });
  }
}
