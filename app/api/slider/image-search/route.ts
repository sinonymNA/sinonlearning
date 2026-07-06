import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/marginsAuth";

export const dynamic = "force-dynamic";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 30;
const RESULT_COUNT = 3;
const CACHE_TTL_MS = 10 * 60 * 1000;

interface ImageResult {
  url: string;
  thumbnailUrl: string;
  sourcePage: string;
  title: string;
}

// The free Google Custom Search JSON API tier is only 100 queries/day total
// across the whole app, so identical repeated searches (a teacher re-opening
// the same slide, or two teachers searching the same common topic) are served
// from this short-lived cache instead of burning quota.
const searchCache = new Map<string, { results: ImageResult[]; expiresAt: number }>();

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !searchEngineId) {
    return NextResponse.json({ error: "Image search is not configured yet." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(`slider-image-search:${ip}`, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)) {
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

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ results: cached.results });
  }

  const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("cx", searchEngineId);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("searchType", "image");
  searchUrl.searchParams.set("safe", "active");
  searchUrl.searchParams.set("num", String(RESULT_COUNT));

  let data: {
    items?: {
      link: string;
      title?: string;
      image?: { thumbnailLink?: string; contextLink?: string };
    }[];
  };
  try {
    const res = await fetch(searchUrl.toString());
    if (!res.ok) {
      console.error("[slider/image-search] Google API error:", res.status, await res.text());
      return NextResponse.json({ error: "Image search is unavailable right now." }, { status: 502 });
    }
    data = await res.json();
  } catch (err) {
    console.error("[slider/image-search] fetch failed:", err);
    return NextResponse.json({ error: "Image search is unavailable right now." }, { status: 502 });
  }

  const results: ImageResult[] = (data.items ?? []).slice(0, RESULT_COUNT).map((item) => ({
    url: item.link,
    thumbnailUrl: item.image?.thumbnailLink ?? item.link,
    sourcePage: item.image?.contextLink ?? item.link,
    title: item.title ?? query,
  }));

  searchCache.set(cacheKey, { results, expiresAt: Date.now() + CACHE_TTL_MS });

  return NextResponse.json({ results });
}
