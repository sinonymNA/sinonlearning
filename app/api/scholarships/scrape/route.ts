import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { scrapeAll } from "@/lib/scholarshipScraper";
import { getAllScrapedScholarships } from "@/lib/scholarshipDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const all = await getAllScrapedScholarships();
  const verified = all.filter((s) => s.verified).length;
  const unverified = all.filter((s) => !s.verified).length;
  return NextResponse.json({ total: all.length, verified, unverified });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const results = await scrapeAll();
  return NextResponse.json({ results });
}
