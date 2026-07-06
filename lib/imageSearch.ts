// Shared Google Custom Search image lookup, used by both Slider and Reel.
// Auth and rate limiting stay at the route level; this owns the CSE call plus a
// short in-memory cache (the free tier is only ~100 queries/day for the whole
// app, so identical repeated searches must not each burn quota).

const RESULT_COUNT = 3;
const CACHE_TTL_MS = 10 * 60 * 1000;

export interface ImageResult {
  url: string;
  thumbnailUrl: string;
  sourcePage: string;
  title: string;
}

export class ImageSearchNotConfiguredError extends Error {}
export class ImageSearchUnavailableError extends Error {}

const searchCache = new Map<string, { results: ImageResult[]; expiresAt: number }>();

export async function searchImages(query: string): Promise<ImageResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !searchEngineId) {
    throw new ImageSearchNotConfiguredError();
  }

  const cacheKey = query.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.results;
  }

  const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("cx", searchEngineId);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("searchType", "image");
  searchUrl.searchParams.set("safe", "active");
  searchUrl.searchParams.set("num", String(RESULT_COUNT));

  let data: {
    items?: { link: string; title?: string; image?: { thumbnailLink?: string; contextLink?: string } }[];
  };
  try {
    const res = await fetch(searchUrl.toString());
    if (!res.ok) {
      console.error("[imageSearch] Google API error:", res.status, await res.text());
      throw new ImageSearchUnavailableError();
    }
    data = await res.json();
  } catch (err) {
    if (err instanceof ImageSearchUnavailableError) throw err;
    console.error("[imageSearch] fetch failed:", err);
    throw new ImageSearchUnavailableError();
  }

  const results: ImageResult[] = (data.items ?? []).slice(0, RESULT_COUNT).map((item) => ({
    url: item.link,
    thumbnailUrl: item.image?.thumbnailLink ?? item.link,
    sourcePage: item.image?.contextLink ?? item.link,
    title: item.title ?? query,
  }));

  searchCache.set(cacheKey, { results, expiresAt: Date.now() + CACHE_TTL_MS });
  return results;
}
