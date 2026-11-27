import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { listBooks, getState, usage } from "@/lib/pacerDb";
import { LIMITS } from "@/lib/pacer/validate.mjs";
import { noStore } from "@/lib/pacerHttp";

export const dynamic = "force-dynamic";

/** Who am I, my books (without their text), my settings and session history. Signed out is a normal answer, not an error. */
export async function GET(_req: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ user: null, sync: false }, { headers: noStore });
  const user = await getCurrentUser().catch(() => undefined);
  if (!user) return NextResponse.json({ user: null, sync: true }, { headers: noStore });
  const [books, state, use] = await Promise.all([listBooks(user.id), getState(user.id), usage(user.id)]);
  return NextResponse.json({ user: { name: user.name, role: user.role }, sync: true, books, settings: state.settings, sessions: state.sessions, settingsAt: state.at, usage: { ...use, maxBooks: LIMITS.maxBooks, maxBytes: LIMITS.maxTotalBytes } }, { headers: noStore });
}
