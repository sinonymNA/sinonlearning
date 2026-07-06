import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";
import {
  searchImages,
  ImageSearchNotConfiguredError,
  ImageSearchUnavailableError,
} from "@/lib/imageSearch";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 30;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`reel-image-search:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
    return NextResponse.json({ error: "Too many searches. Try again in an hour." }, { status: 429 });
  }

  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "A search query is required." }, { status: 400 });
  }

  try {
    const results = await searchImages(query);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof ImageSearchNotConfiguredError) {
      return NextResponse.json({ error: "Image search is not configured yet." }, { status: 503 });
    }
    if (err instanceof ImageSearchUnavailableError) {
      return NextResponse.json({ error: "Image search is unavailable right now." }, { status: 502 });
    }
    console.error("[reel/image-search] unexpected error:", err);
    return NextResponse.json({ error: "Image search is unavailable right now." }, { status: 502 });
  }
}
