import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/finnhubClient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }
  if (!process.env.FINNHUB_API_KEY) {
    return NextResponse.json({ error: "Stock data API not configured." }, { status: 503 });
  }
  try {
    const results = await searchSymbols(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
