import { NextRequest, NextResponse } from "next/server";
import { getVaultSetById } from "@/lib/vaultSets";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vaultSet = await getVaultSetById(id);
  if (!vaultSet) return NextResponse.json({ error: "Question set not found." }, { status: 404 });
  return NextResponse.json({ vaultSet });
}
