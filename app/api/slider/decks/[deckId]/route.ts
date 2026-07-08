import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getDeckById, updateDeck, deleteDeck, isOwnedThemeId } from "@/lib/sliderDb";
import { SLIDE_LAYOUTS, type Slide } from "@/lib/sliderTypes";

export const dynamic = "force-dynamic";

const LAYOUT_VALUES = new Set(SLIDE_LAYOUTS.map((l) => l.value));

function isValidSlides(value: unknown): value is Slide[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (s) =>
      s &&
      typeof s === "object" &&
      typeof (s as Slide).id === "string" &&
      LAYOUT_VALUES.has((s as Slide).layout)
  );
}

async function getOwnedDeck(deckId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") return { error: NextResponse.json({ error: "Not authorized." }, { status: 401 }) };
  const deck = await getDeckById(deckId);
  if (!deck) return { error: NextResponse.json({ error: "Deck not found." }, { status: 404 }) };
  if (deck.teacher_id !== user.id) return { error: NextResponse.json({ error: "Not authorized." }, { status: 403 }) };
  return { deck };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const { deck, error } = await getOwnedDeck(deckId);
  if (error) return error;
  return NextResponse.json({ deck });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const { deck, error } = await getOwnedDeck(deckId);
  if (error) return error;

  let body: { title?: string; themeId?: string; slides?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.themeId !== undefined && !(await isOwnedThemeId(body.themeId, deck!.teacher_id))) {
    return NextResponse.json({ error: "Unknown themeId." }, { status: 400 });
  }
  if (body.slides !== undefined && !isValidSlides(body.slides)) {
    return NextResponse.json({ error: "Invalid slides payload." }, { status: 400 });
  }

  const updated = await updateDeck(deckId, {
    title: body.title,
    themeId: body.themeId,
    slides: body.slides as Slide[] | undefined,
  });
  return NextResponse.json({ deck: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = await params;
  const { error } = await getOwnedDeck(deckId);
  if (error) return error;
  await deleteDeck(deckId);
  return NextResponse.json({ ok: true });
}
