import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getClassByJoinCode, joinClass } from "@/lib/marginsDb";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`margins-join:${ip}`, 60 * 60 * 1000, 30)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "Class code is required." }, { status: 400 });
  }

  const cls = await getClassByJoinCode(code);
  if (!cls) {
    return NextResponse.json({ error: "No class found with that code." }, { status: 404 });
  }

  await joinClass(cls.id, user.id);
  return NextResponse.json({ class: cls });
}
