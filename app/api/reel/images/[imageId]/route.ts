import { NextRequest, NextResponse } from "next/server";
import { getReelImage } from "@/lib/reelDb";

export const dynamic = "force-dynamic";

// Served publicly by opaque UUID (same trust model as Slider/Margins image
// serving) so plain <img src> tags and the Manim worker can fetch without auth.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ imageId: string }> }) {
  const { imageId } = await params;
  const image = await getReelImage(imageId);
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
