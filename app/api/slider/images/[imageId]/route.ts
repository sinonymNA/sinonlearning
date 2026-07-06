import { NextRequest, NextResponse } from "next/server";
import { getSliderImage } from "@/lib/sliderDb";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params;
  const image = await getSliderImage(imageId);
  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.data), {
    status: 200,
    headers: {
      "Content-Type": image.mime_type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
