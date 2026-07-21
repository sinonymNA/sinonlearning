"use client";

import { useState, useTransition } from "react";
import { RefreshCw, CheckCircle, XCircle, ExternalLink } from "lucide-react";

type ScrapedRow = {
  id: string;
  externalId: string;
  name: string;
  provider: string;
  url: string;
  verified: boolean;
  sourceTarget: string;
  scrapedAt: string;
};

async function runScrape(): Promise<{ results: { target: string; found: number; inserted: number; errors: string[] }[] }> {
  const res = await fetch("/api/scholarships/scrape", { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function setVerified(id: string, verified: boolean): Promise<void> {
  const res = await fetch("/api/scholarships/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, verified }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export default function ScrapedScholarshipManager({
  initialScholarships,
}: {
  initialScholarships: ScrapedRow[];
}) {
  const [scholarships, setScholarships] = useState<ScrapedRow[]>(initialScholarships);
  const [scrapeLog, setScrapeLog] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleScrape() {
    startTransition(async () => {
      setScrapeLog(["Running scrape…"]);
      try {
        const { results } = await runScrape();
        const lines = results.map(
          (r) =>
            `${r.target}: found ${r.found}, inserted ${r.inserted}${r.errors.length ? ` — ⚠ ${r.errors.join("; ")}` : ""}`,
        );
        setScrapeLog(lines);
        // Refresh list
        const res = await fetch("/api/scholarships/verify");
        if (res.ok) {
          const data = (await res.json()) as { scholarships: ScrapedRow[] };
          setScholarships(data.scholarships);
        }
      } catch (e) {
        setScrapeLog([`Error: ${e instanceof Error ? e.message : String(e)}`]);
      }
    });
  }

  function handleToggle(id: string, currentVerified: boolean) {
    startTransition(async () => {
      await setVerified(id, !currentVerified);
      setScholarships((prev) =>
        prev.map((s) => (s.id === id ? { ...s, verified: !currentVerified } : s)),
      );
    });
  }

  const pending = scholarships.filter((s) => !s.verified);
  const approved = scholarships.filter((s) => s.verified);

  return (
    <div className="flex flex-col gap-8">
      {/* Run scrape */}
      <div className="rounded-2xl border border-navy-900/8 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-navy-900">Run Scraper</h2>
            <p className="mt-0.5 text-sm text-navy-800/55">
              Fetches Gwinnett County / Dacula scholarship pages and stores new entries for review.
            </p>
          </div>
          <button
            onClick={handleScrape}
            disabled={isPending}
            className="flex items-center gap-2 rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          >
            <RefreshCw size={15} className={isPending ? "animate-spin" : ""} />
            {isPending ? "Scraping…" : "Run Scrape Now"}
          </button>
        </div>

        {scrapeLog.length > 0 && (
          <div className="mt-4 rounded-xl bg-navy-950 px-4 py-3 font-mono text-xs text-cream-50/80">
            {scrapeLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>

      {/* Pending approval */}
      <div>
        <h2 className="mb-3 font-semibold text-navy-900">
          Pending Review{" "}
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            {pending.length}
          </span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-navy-800/45">No scholarships pending review.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((s) => (
              <ScholarshipRow
                key={s.id}
                s={s}
                onToggle={() => handleToggle(s.id, s.verified)}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      {approved.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold text-navy-900">
            Approved — Showing to Students{" "}
            <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
              {approved.length}
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {approved.map((s) => (
              <ScholarshipRow
                key={s.id}
                s={s}
                onToggle={() => handleToggle(s.id, s.verified)}
                isPending={isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScholarshipRow({
  s,
  onToggle,
  isPending,
}: {
  s: ScrapedRow;
  onToggle: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
        s.verified
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-navy-900/8 bg-white"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-medium text-navy-900 truncate">{s.name}</div>
        <div className="text-xs text-navy-800/50 mt-0.5">
          {s.provider} · <span className="font-mono">{s.sourceTarget}</span>
        </div>
      </div>

      <a
        href={s.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-navy-900/30 hover:text-teal-700"
      >
        <ExternalLink size={14} />
      </a>

      <button
        onClick={onToggle}
        disabled={isPending}
        title={s.verified ? "Revoke approval" : "Approve for students"}
        className={`shrink-0 transition-colors disabled:opacity-40 ${
          s.verified ? "text-emerald-600 hover:text-rose-500" : "text-navy-900/25 hover:text-emerald-600"
        }`}
      >
        {s.verified ? <CheckCircle size={20} /> : <XCircle size={20} />}
      </button>
    </div>
  );
}
