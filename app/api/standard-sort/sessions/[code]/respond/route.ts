import { NextRequest, NextResponse } from "next/server";
import { getSession, saveResponse } from "@/lib/standardSortDb";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  let body: { participantToken?: string; standardId?: string; units?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const participantToken = (body.participantToken ?? "").trim();
  const standardId = (body.standardId ?? "").trim();
  const units = (body.units ?? []).filter((u) => typeof u === "string");
  if (!participantToken) return NextResponse.json({ error: "Missing token." }, { status: 401 });
  if (!standardId) return NextResponse.json({ error: "Missing standard." }, { status: 400 });
  if (units.length === 0) return NextResponse.json({ error: "Pick at least one unit." }, { status: 400 });

  const session = await getSession(code);
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  // Validate against the session's own lists rather than trusting the client —
  // a stray unit name would otherwise silently pollute every future tally.
  const validStandard = session.standards.some((s) => s.id === standardId);
  const validUnits = units.every((u) => session.units.includes(u));
  if (!validStandard || !validUnits) {
    return NextResponse.json({ error: "That doesn't match this session." }, { status: 400 });
  }

  await saveResponse({ code, participantToken, standardId, units });
  return NextResponse.json({ ok: true });
}
