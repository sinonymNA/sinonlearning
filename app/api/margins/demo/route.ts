import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import {
  getUserByEmail,
  createUser,
  getClassesByTeacher,
  createClass,
  getAssignmentsByClass,
  createAssignment,
  joinClass,
  type MarginsUser,
} from "@/lib/marginsDb";
import { hashPassword, createSessionCookie } from "@/lib/marginsAuth";
import { RUBRIC_TEMPLATES } from "@/lib/marginsRubrics";

// Fixed demo accounts so "Teacher test" / "Student test" always land in the
// same demo class with a demo assignment already set up — lets anyone try
// the rubric/assignment generators and the grader without signing up.
const DEMO_TEACHER_EMAIL = "demo-teacher@margins.test";
const DEMO_STUDENT_EMAIL = "demo-student@margins.test";
const DEMO_CLASS_NAME = "Demo Class";
const DEMO_ASSIGNMENT_TITLE = "Demo LEQ — Comparative Empires";
const DEMO_PROMPT =
  "Compare the methods used by TWO land-based empires to maintain control over their diverse populations in the period 1450 to 1750.";

async function getOrCreateDemoUser(email: string, role: "teacher" | "student", name: string): Promise<MarginsUser> {
  const existing = await getUserByEmail(email);
  if (existing) return existing;
  const randomPassword = randomBytes(24).toString("hex");
  return createUser(email, hashPassword(randomPassword), role, name);
}

async function ensureDemoClassAndAssignment(teacherId: string) {
  const classes = await getClassesByTeacher(teacherId);
  let demoClass = classes.find((c) => c.name === DEMO_CLASS_NAME);
  if (!demoClass) {
    demoClass = await createClass(teacherId, DEMO_CLASS_NAME);
  }

  const assignments = await getAssignmentsByClass(demoClass.id);
  if (assignments.length === 0) {
    await createAssignment({
      classId: demoClass.id,
      essayType: "LEQ",
      title: DEMO_ASSIGNMENT_TITLE,
      promptText: DEMO_PROMPT,
      rubric: RUBRIC_TEMPLATES.LEQ,
    });
  }

  return demoClass;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`margins-demo:${ip}`, 60 * 60 * 1000, 30)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.role === "teacher") {
    const teacher = await getOrCreateDemoUser(DEMO_TEACHER_EMAIL, "teacher", "Demo Teacher");
    await ensureDemoClassAndAssignment(teacher.id);
    await createSessionCookie(teacher.id);
    return NextResponse.json({ ok: true, role: "teacher" });
  }

  if (body.role === "student") {
    const teacher = await getOrCreateDemoUser(DEMO_TEACHER_EMAIL, "teacher", "Demo Teacher");
    const demoClass = await ensureDemoClassAndAssignment(teacher.id);
    const student = await getOrCreateDemoUser(DEMO_STUDENT_EMAIL, "student", "Demo Student");
    await joinClass(demoClass.id, student.id);
    await createSessionCookie(student.id);
    return NextResponse.json({ ok: true, role: "student" });
  }

  return NextResponse.json({ error: "role must be teacher or student." }, { status: 400 });
}
