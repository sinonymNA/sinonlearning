import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionCookie, verifyPassword } from "@/lib/marginsAuth";
import { getClassByJoinCode } from "@/lib/marginsDb";
import { consumeApwhRateLimit, getApwhStudentForLogin, recordApwhAudit } from "@/lib/apwhDb";
import { requestIsSameOrigin } from "@/lib/apwhSecurity";

const inputSchema = z.object({
  code: z.string().trim().min(4).max(12),
  username: z.string().trim().min(3).max(30),
  password: z.string().min(1).max(128),
});

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  if (!requestIsSameOrigin(request)) {
    return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  }
  const limited = await consumeApwhRateLimit(`login:${clientKey(request)}`, 15, 15);
  if (limited) {
    return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your class code, username, and password." }, { status: 400 });
  }
  const cls = await getClassByJoinCode(parsed.data.code);
  const user = cls ? await getApwhStudentForLogin(cls.id, parsed.data.username) : undefined;
  if (!cls || !user || !verifyPassword(parsed.data.password, user.password_hash)) {
    return NextResponse.json({ error: "Those sign-in details do not match." }, { status: 401 });
  }

  await createSessionCookie(user.id);
  await recordApwhAudit(user.id, cls.id, "session.login", "user", user.id);
  return NextResponse.json({ ok: true, classId: cls.id });
}
