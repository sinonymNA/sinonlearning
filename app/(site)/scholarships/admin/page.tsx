import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/marginsAuth";
import { getAllScrapedScholarships } from "@/lib/scholarshipDb";
import ScrapedScholarshipManager from "./ScrapedScholarshipManager";

export const dynamic = "force-dynamic";

export default async function ScholarshipAdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "teacher") redirect("/margins/login");

  const scholarships = await getAllScrapedScholarships();
  const verified = scholarships.filter((s) => s.verified);
  const pending = scholarships.filter((s) => !s.verified);

  return (
    <div className="min-h-screen bg-cream-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-navy-900">
              Scholarship Scraper Admin
            </h1>
            <p className="mt-1 text-sm text-navy-800/60">
              Approve scraped scholarships before they appear to students.
            </p>
          </div>
          <div className="flex gap-4 text-center text-sm">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2">
              <div className="font-semibold text-emerald-800">{verified.length}</div>
              <div className="text-emerald-700/70">Approved</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
              <div className="font-semibold text-amber-800">{pending.length}</div>
              <div className="text-amber-700/70">Pending</div>
            </div>
          </div>
        </div>

        <ScrapedScholarshipManager
          initialScholarships={scholarships}
        />
      </div>
    </div>
  );
}
