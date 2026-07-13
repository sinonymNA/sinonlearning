import { NextRequest, NextResponse } from "next/server";
import { createVaultSet, validateVaultSet } from "@/lib/vaultSets";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid question set." }, { status: 400 });
  }

  const parsed = validateVaultSet(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "This set needs a title and 3–100 complete questions." }, { status: 400 });
  }

  const vaultSet = await createVaultSet(parsed.data);
  return NextResponse.json({ vaultSet }, { status: 201 });
}
