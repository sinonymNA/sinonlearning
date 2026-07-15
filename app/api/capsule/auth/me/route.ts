import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/capsuleAuth";
import { getUserCaps } from "@/lib/capsuleDb";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  const caps = await getUserCaps(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, username: user.username, role: user.role, coins: user.coins, equippedCapId: user.equipped_cap_id, caps },
  });
}
