import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionCookie, hashPassword } from "@/lib/marginsAuth";
import { getClassById } from "@/lib/marginsDb";
import {
  APWH_PILOT_CLASS_NAMES,
  consumeApwhRateLimit,
  createApwhStudent,
  normalizeApwhUsername,
  recordApwhAudit,
} from "@/lib/apwhDb";
import { requestIsSameOrigin } from "@/lib/apwhSecurity";

const inputSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  username: z.string().trim().min(3).max(30),
  password: z.string().min(10).max(128),
});

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  if (!requestIsSameOrigin(request)) {
    return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  }

  const limited = await consumeApwhRateLimit(`join:${clientKey(request)}`, 60, 12);
  if (limited) {
    return NextResponse.json({ error: "Too many attempts. Ask your teacher for help." }, { status: 429 });
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check your name, username, password, and class selection." }, { status: 400 });
  }

  const { classId, name, username, password } = parsed.data;
  const normalizedUsername = normalizeApwhUsername(username);
  if (normalizedUsername.length < 3 || normalizedUsername !== username.toLowerCase()) {
    return NextResponse.json(
      { error: "Username may use lowercase letters, numbers, dots, dashes, and underscores." },
      { status: 400 }
    );
  }

  const cls = await getClassById(classId);
  if (!cls || !APWH_PILOT_CLASS_NAMES.includes(cls.name as (typeof APWH_PILOT_CLASS_NAMES)[number])) {
    return NextResponse.json({ error: "Choose one of the APWH pilot classes." }, { status: 404 });
  }

  try {
    const user = await createApwhStudent({
      classId: cls.id,
      name,
      username,
      passwordHash: hashPassword(password),
    });
    await createSessionCookie(user.id);
    await recordApwhAudit(user.id, cls.id, "student.join", "membership", user.id);
    return NextResponse.json({ ok: true, classId: cls.id });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "That username is already used in this class." }, { status: 409 });
    }
    console.error("[apwh/join] account creation failed");
    return NextResponse.json({ error: "Account creation failed. Please try again." }, { status: 500 });
  }
}
