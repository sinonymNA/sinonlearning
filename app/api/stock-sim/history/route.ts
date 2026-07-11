import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getOrCreatePortfolio, getTransactionHistory } from "@/lib/stockMarketDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const portfolio = await getOrCreatePortfolio(user.id);
  const history = await getTransactionHistory(portfolio.id, 100);

  return NextResponse.json({ history });
}
