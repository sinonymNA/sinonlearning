import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getKoraLabPairById, setKoraLabPairReference } from "@/lib/koraLabDb";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  let body: { useAsReference?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (typeof body.useAsReference !== "boolean") {
    return NextResponse.json({ error: "useAsReference must be a boolean." }, { status: 400 });
  }

  const existing = await getKoraLabPairById(id);
  if (!existing) {
    return NextResponse.json({ error: "Pair not found." }, { status: 404 });
  }
  if (body.useAsReference && existing.winner !== "a" && existing.winner !== "b") {
    return NextResponse.json(
      { error: "Only a pair with a clear winner (not tie/both_bad) can be used as a reference example." },
      { status: 400 }
    );
  }

  const pair = await setKoraLabPairReference(id, body.useAsReference);
  return NextResponse.json({ pair });
}
