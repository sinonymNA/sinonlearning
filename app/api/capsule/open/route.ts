import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/capsuleAuth";
import { spendCoins, grantCap, getCapsuleUserById } from "@/lib/capsuleDb";
import { rollCap, CAPSULE_COST, CAPSULE_SETS } from "@/lib/capsuleData";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { set?: string } = {};
  try { body = await req.json(); } catch { /* no body is fine */ }

  const setId = body.set ?? "classic";
  const capsuleSet = CAPSULE_SETS.find(s => s.id === setId);
  if (!capsuleSet || !capsuleSet.available) {
    return NextResponse.json({ error: "Invalid capsule set." }, { status: 400 });
  }

  const isDemo = user.email?.endsWith("@capsule.demo");
  if (!isDemo) {
    const spent = await spendCoins(user.id, capsuleSet.cost);
    if (!spent) return NextResponse.json({ error: "Not enough coins." }, { status: 402 });
  }

  const cap = rollCap(setId);
  await grantCap(user.id, cap.id);

  const updated = await getCapsuleUserById(user.id);

  return NextResponse.json({ cap, coins: updated?.coins ?? 0 });
}
