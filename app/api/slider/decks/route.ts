import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { createDeck, getDecksByTeacher } from "@/lib/sliderDb";
import { SLIDER_THEMES, DEFAULT_THEME_ID } from "@/lib/sliderThemes";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const decks = await getDecksByTeacher(user.id);
  return NextResponse.json({ decks });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: { title?: string; themeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const themeId =
    body.themeId && SLIDER_THEMES.some((t) => t.id === body.themeId) ? body.themeId : DEFAULT_THEME_ID;

  const deck = await createDeck({ teacherId: user.id, title: body.title, themeId });
  return NextResponse.json({ deck });
}
