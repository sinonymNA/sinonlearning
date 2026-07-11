import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getLeaderboard } from "@/lib/stockMarketDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const board = await getLeaderboard(25);
  return NextResponse.json({ board });
}
