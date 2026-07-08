import PptxGenJS from "pptxgenjs";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getDeckById, getSliderImage, resolveDeckTheme } from "@/lib/sliderDb";
import { renderSlideToPptx } from "@/lib/sliderPptxRenderer";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ deckId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { deckId } = await params;
  const deck = await getDeckById(deckId);
  if (!deck) {
    return NextResponse.json({ error: "Deck not found." }, { status: 404 });
  }
  if (deck.teacher_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const theme = await resolveDeckTheme(deck.theme_id, user.id);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  for (const slide of deck.slides) {
    let imageDataUri: string | null = null;
    if (slide.image?.id) {
      const image = await getSliderImage(slide.image.id);
      if (image) {
        imageDataUri = `data:${image.mime_type};base64,${image.data.toString("base64")}`;
      }
    }
    renderSlideToPptx(pptx, slide, theme, imageDataUri);
  }

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  const fileName = `${(deck.title || "deck").replace(/[^a-z0-9\- ]/gi, "").trim() || "deck"}.pptx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
