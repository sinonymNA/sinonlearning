import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/capsuleAuth";
import { spendCoins, grantCap, getCapsuleUserById } from "@/lib/capsuleDb";
import { rollCap, CAPSULE_COST } from "@/lib/capsuleData";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const spent = await spendCoins(user.id, CAPSULE_COST);
  if (!spent) return NextResponse.json({ error: "Not enough coins." }, { status: 402 });

  const cap = rollCap();
  await grantCap(user.id, cap.id);

  const updated = await getCapsuleUserById(user.id);

  return NextResponse.json({ cap, coins: updated?.coins ?? 0 });
}
