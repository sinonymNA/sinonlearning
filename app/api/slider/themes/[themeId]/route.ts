import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { deleteCustomTheme } from "@/lib/sliderDb";

export const dynamic = "force-dynamic";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ themeId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const { themeId } = await params;
  await deleteCustomTheme(themeId, user.id);
  return NextResponse.json({ ok: true });
}
