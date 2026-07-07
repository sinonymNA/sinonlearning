import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getKoraLabStats } from "@/lib/koraLabDb";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const stats = await getKoraLabStats();
  return NextResponse.json({ stats });
}
