import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getUserByEmail } from "@/lib/marginsDb";
import { verifyPassword, createSessionCookie } from "@/lib/marginsAuth";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`margins-login:${ip}`, 15 * 60 * 1000, 15)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  await createSessionCookie(user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  });
}
