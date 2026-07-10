import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAllProgress, saveModuleProgress } from "@/lib/lifeBudgetDb";
import { LIFE_BUDGET_MODULES } from "@/lib/lifeBudgetModules";

export const dynamic = "force-dynamic";

const VALID_SLUGS = new Set(LIFE_BUDGET_MODULES.map((m) => m.slug));

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const progress = await getAllProgress(user.id);
  return NextResponse.json({ progress, userId: user.id, name: user.name, role: user.role });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const { moduleSlug, data, completed } = body;

  if (typeof moduleSlug !== "string" || !VALID_SLUGS.has(moduleSlug)) {
    return NextResponse.json({ error: "Invalid moduleSlug." }, { status: 400 });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "Missing or invalid data object." }, { status: 400 });
  }

  await saveModuleProgress(user.id, moduleSlug, data as Record<string, unknown>, completed === true);
  return NextResponse.json({ ok: true });
}
