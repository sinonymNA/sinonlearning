import { NextRequest, NextResponse } from "next/server";
import { getCapsuleUserByEmail, createCapsuleUser } from "@/lib/capsuleDb";
import { hashPassword, createSessionCookie } from "@/lib/capsuleAuth";

const DEMO_ACCOUNTS = {
  student: { email: "demo_student@capsule.demo", username: "DemoStudent", role: "student" as const },
  teacher: { email: "demo_teacher@capsule.demo", username: "DemoTeacher", role: "teacher" as const },
};

const DEMO_PASSWORD = "capsule-demo-2024";

export async function POST(req: NextRequest) {
  let body: { role?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body." }, { status: 400 }); }

  const role = body.role === "teacher" ? "teacher" : "student";
  const account = DEMO_ACCOUNTS[role];

  let user = await getCapsuleUserByEmail(account.email);
  if (!user) {
    user = await createCapsuleUser(account.email, hashPassword(DEMO_PASSWORD), account.username, account.role);
  }

  await createSessionCookie(user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email, username: user.username, role: user.role, equippedCapId: user.equipped_cap_id },
  });
}
