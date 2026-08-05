import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/marginsAuth";
import {
  consumeApwhRateLimit,
  recordApwhAudit,
  resetApwhStudentPassword,
  resetApwhTeacherPassword,
} from "@/lib/apwhDb";
import { requestIsSameOrigin } from "@/lib/apwhSecurity";

const inputSchema = z
  .object({
    recoveryKey: z.string().min(20).max(256),
    role: z.enum(["teacher", "student"]),
    identifier: z.string().trim().min(3).max(254),
    classId: z.string().uuid().optional(),
    newPassword: z.string().min(12).max(128),
  })
  .superRefine((value, context) => {
    if (value.role === "student" && !value.classId) {
      context.addIssue({ code: "custom", path: ["classId"], message: "Choose the student's class." });
    }
  });

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function recoveryKeyMatches(candidate: string): boolean {
  const expected = process.env.APWH_RECOVERY_KEY;
  if (!expected || expected.length < 20) return false;
  const candidateDigest = createHash("sha256").update(candidate).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

export async function POST(request: NextRequest) {
  if (!requestIsSameOrigin(request)) {
    return NextResponse.json({ error: "Request blocked." }, { status: 403 });
  }
  if (!process.env.APWH_RECOVERY_KEY) {
    return NextResponse.json({ error: "Owner recovery is not configured." }, { status: 503 });
  }

  const limited = await consumeApwhRateLimit(`recovery:${clientKey(request)}`, 60, 10);
  if (limited) {
    return NextResponse.json({ error: "Too many recovery attempts. Try again later." }, { status: 429 });
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the account information and use a password of at least 12 characters." }, { status: 400 });
  }
  if (!recoveryKeyMatches(parsed.data.recoveryKey)) {
    return NextResponse.json({ error: "The owner recovery key is incorrect." }, { status: 401 });
  }

  const passwordHash = hashPassword(parsed.data.newPassword);
  const target = parsed.data.role === "teacher"
    ? await resetApwhTeacherPassword(parsed.data.identifier, passwordHash)
    : await resetApwhStudentPassword(parsed.data.classId!, parsed.data.identifier, passwordHash);
  if (!target) {
    return NextResponse.json({ error: "No matching account was found." }, { status: 404 });
  }

  const classId = parsed.data.role === "student" ? parsed.data.classId! : null;
  await recordApwhAudit(null, classId, "password.owner_reset", parsed.data.role, target.id);
  return NextResponse.json({ ok: true, name: target.name, role: parsed.data.role });
}
