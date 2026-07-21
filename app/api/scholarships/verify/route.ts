import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  getAllScrapedScholarships,
  setScrapedScholarshipVerified,
} from "@/lib/scholarshipDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const scholarships = await getAllScrapedScholarships();
  return NextResponse.json({ scholarships });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || typeof body.verified !== "boolean") {
    return NextResponse.json({ error: "Invalid body — expected { id, verified }." }, { status: 400 });
  }

  await setScrapedScholarshipVerified(body.id, body.verified);
  return NextResponse.json({ ok: true });
}
