import { getVerifiedScrapedScholarships } from "@/lib/scholarshipDb";
import type { Scholarship } from "@/data/scholarships";
import ScholarshipResults from "./ScholarshipResults";

export const dynamic = "force-dynamic";

export default async function ScholarshipResultsPage() {
  let scraped: Scholarship[] = [];
  try {
    scraped = await getVerifiedScrapedScholarships();
  } catch {
    // DB unavailable — fall back to static data only
  }

  return <ScholarshipResults initialScraped={scraped} />;
}
