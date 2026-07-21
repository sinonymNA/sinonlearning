import { SCRAPE_TARGETS } from "./scraperTargets";
import type { ScrapedEntry, ScrapeTarget } from "./scraperTargets";
import { upsertScrapedScholarships } from "./scholarshipDb";

export interface ScrapeResult {
  target: string;
  found: number;
  inserted: number;
  errors: string[];
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; SinonLearning-ScholarshipBot/1.0; +https://sinonlearning.com)";
const FETCH_TIMEOUT_MS = 12_000;

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function playwrightHtml(url: string): Promise<string> {
  // Dynamic import so the module can still be imported in environments without Chromium
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium/chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ "User-Agent": USER_AGENT });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    // Wait a moment for any deferred JS renders
    await page.waitForTimeout(1500);
    return await page.content();
  } finally {
    await browser.close();
  }
}

export async function scrapeTarget(target: ScrapeTarget): Promise<ScrapedEntry[]> {
  const html =
    target.method === "playwright"
      ? await playwrightHtml(target.url)
      : await fetchHtml(target.url);
  return target.parser(html, target.url);
}

export async function scrapeAll(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const target of SCRAPE_TARGETS) {
    const result: ScrapeResult = {
      target: target.id,
      found: 0,
      inserted: 0,
      errors: [],
    };

    try {
      const entries = await scrapeTarget(target);
      result.found = entries.length;

      if (entries.length > 0) {
        const { inserted } = await upsertScrapedScholarships(entries, target.id, {
          scope: target.scope,
          estimatedApplicants: target.defaultEstimatedApplicants,
        });
        result.inserted = inserted;
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }

    results.push(result);
  }

  return results;
}
