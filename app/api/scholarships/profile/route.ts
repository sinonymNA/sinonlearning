import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { loadScholarshipProfile, saveScholarshipProfile } from "@/lib/scholarshipDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const profile = await loadScholarshipProfile(user.id);
  if (!profile) return NextResponse.json({ error: "No profile found." }, { status: 404 });

  return NextResponse.json({ profile });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  await saveScholarshipProfile(user.id, body);
  return NextResponse.json({ ok: true });
}
