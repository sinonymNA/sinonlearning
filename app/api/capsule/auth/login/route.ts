import { NextRequest, NextResponse } from "next/server";
import { getCapsuleUserByEmail } from "@/lib/capsuleDb";
import { verifyPassword, createSessionCookie } from "@/lib/capsuleAuth";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  const user = await getCapsuleUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createSessionCookie(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role, equippedCapId: user.equipped_cap_id } });
}
