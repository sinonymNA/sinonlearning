import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { createCustomTheme, getCustomThemesByTeacher } from "@/lib/sliderDb";
import { SLIDER_FONTS, getFont } from "@/lib/sliderFonts";
import type { SliderTheme } from "@/lib/sliderThemes";

export const dynamic = "force-dynamic";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const FONT_IDS = new Set(SLIDER_FONTS.map((f) => f.id));
const COLOR_KEYS = ["background", "surface", "heading", "body", "accent"] as const;

function isValidColors(value: unknown): value is SliderTheme["colors"] {
  if (!value || typeof value !== "object") return false;
  return COLOR_KEYS.every((k) => HEX_RE.test((value as Record<string, unknown>)[k] as string));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const themes = await getCustomThemesByTeacher(user.id);
  return NextResponse.json({ themes });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: {
    name?: string;
    colors?: unknown;
    headingFontId?: string;
    bodyFontId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Theme name is required." }, { status: 400 });
  }
  if (!isValidColors(body.colors)) {
    return NextResponse.json({ error: "colors must include background, surface, heading, body, and accent as hex codes." }, { status: 400 });
  }
  if (!body.headingFontId || !FONT_IDS.has(body.headingFontId) || !body.bodyFontId || !FONT_IDS.has(body.bodyFontId)) {
    return NextResponse.json({ error: "Unknown headingFontId or bodyFontId." }, { status: 400 });
  }

  const headingFont = getFont(body.headingFontId);
  const bodyFont = getFont(body.bodyFontId);

  const theme = await createCustomTheme({
    teacherId: user.id,
    name,
    colors: body.colors as SliderTheme["colors"],
    fonts: {
      heading: { css: headingFont.cssStack, pptx: headingFont.pptxFace },
      body: { css: bodyFont.cssStack, pptx: bodyFont.pptxFace },
    },
  });
  return NextResponse.json({ theme });
}
