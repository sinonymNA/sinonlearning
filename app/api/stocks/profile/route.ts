import { NextRequest, NextResponse } from "next/server";
import { getCompanyProfile } from "@/lib/finnhubClient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.toUpperCase();
  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }
  if (!process.env.FINNHUB_API_KEY) {
    return NextResponse.json({ error: "Stock data API not configured." }, { status: 503 });
  }
  try {
    const profile = await getCompanyProfile(ticker);
    if (!profile) return NextResponse.json({ profile: null });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ profile: null });
  }
}
