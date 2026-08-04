import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionCookie, verifyPassword } from "@/lib/marginsAuth";
import { getUserByEmail } from "@/lib/marginsDb";
import { consumeApwhRateLimit, getApwhStudentsForLogin, recordApwhAudit } from "@/lib/apwhDb";
import { requestIsSameOrigin } from "@/lib/apwhSecurity";

const inputSchema = z.object({
  role: z.enum(["student", "teacher"]),
  identifier: z.string().trim().min(3).max(254),
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
    return NextResponse.json({ error: "Enter your account details and password." }, { status: 400 });
  }

  const { role, identifier, password } = parsed.data;
  if (role === "teacher") {
    const user = await getUserByEmail(identifier);
    if (!user || user.role !== "teacher" || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Those teacher sign-in details do not match." }, { status: 401 });
    }
    await createSessionCookie(user.id);
    await recordApwhAudit(user.id, null, "session.login", "teacher", user.id);
    return NextResponse.json({ ok: true, destination: "/apwh/teacher" });
  }

  const candidates = await getApwhStudentsForLogin(identifier);
  const matches = candidates.filter((candidate) => verifyPassword(password, candidate.password_hash));
  if (matches.length !== 1) {
    return NextResponse.json(
      {
        error:
          matches.length > 1
            ? "More than one account matches. Ask your teacher to help identify your account."
            : "Those student sign-in details do not match.",
      },
      { status: 401 }
    );
  }

  const user = matches[0];
  await createSessionCookie(user.id);
  await recordApwhAudit(user.id, user.home_class_id, "session.login", "user", user.id);
  return NextResponse.json({ ok: true, destination: `/apwh/classes/${user.home_class_id}` });
}
