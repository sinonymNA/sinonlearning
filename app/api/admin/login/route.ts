import { NextRequest, NextResponse } from "next/server";
import { isValidAdminPassword, createAdminSessionCookie } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const password = typeof body.password === "string" ? body.password : "";

  if (!isValidAdminPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await createAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
