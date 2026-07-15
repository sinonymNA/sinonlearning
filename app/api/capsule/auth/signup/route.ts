import { NextRequest, NextResponse } from "next/server";
import { createCapsuleUser, getCapsuleUserByEmail, getCapsuleUserByUsername } from "@/lib/capsuleDb";
import { hashPassword, createSessionCookie } from "@/lib/capsuleAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; username?: string; role?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const username = (body.username ?? "").trim();
  const role = body.role === "teacher" ? "teacher" : "student";

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  if (!USERNAME_RE.test(username)) return NextResponse.json({ error: "Username must be 3–20 characters (letters, numbers, underscores only)." }, { status: 400 });

  if (await getCapsuleUserByEmail(email)) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  if (await getCapsuleUserByUsername(username)) return NextResponse.json({ error: "That username is taken." }, { status: 409 });

  const user = await createCapsuleUser(email, hashPassword(password), username, role);
  await createSessionCookie(user.id);

  return NextResponse.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role, equippedCapId: user.equipped_cap_id } });
}
