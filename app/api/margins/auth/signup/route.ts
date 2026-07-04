import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { createUser, getUserByEmail, type MarginsRole } from "@/lib/marginsDb";
import { hashPassword, createSessionCookie } from "@/lib/marginsAuth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`margins-signup:${ip}`, 60 * 60 * 1000, 10)) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: { email?: string; password?: string; name?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim();
  const role = body.role as MarginsRole;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (role !== "teacher" && role !== "student") {
    return NextResponse.json({ error: "Role must be teacher or student." }, { status: 400 });
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = await createUser(email, hashPassword(password), role, name);
  await createSessionCookie(user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role, name: user.name },
  });
}
