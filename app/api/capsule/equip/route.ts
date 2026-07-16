import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/capsuleAuth";
import { equipCap, getUserCaps } from "@/lib/capsuleDb";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { capId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  const capId = body.capId ?? "";
  const owned = await getUserCaps(user.id);
  if (!owned.includes(capId)) return NextResponse.json({ error: "You don't own this cap." }, { status: 403 });

  await equipCap(user.id, capId);
  return NextResponse.json({ ok: true });
}
