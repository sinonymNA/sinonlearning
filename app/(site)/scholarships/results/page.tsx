"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { scholarships } from "@/data/scholarships";
import { matchScholarships } from "@/lib/scholarshipMatch";
import type { MatchedScholarship, StudentProfile } from "@/lib/scholarshipMatch";
import ScholarshipCard from "@/components/scholarships/ScholarshipCard";
import FadeIn from "@/components/FadeIn";

const PROFILE_KEY = "sinon:scholarship_profile";

type SortKey = "winProb" | "amount" | "deadline";
type ScopeFilter = "all" | "city" | "county" | "state" | "regional" | "national";
type WinFilter = "all" | "green" | "teal" | "amber";
type AmountFilter = "all" | "500" | "1000" | "2500";

function deadlineMs(s: MatchedScholarship): number {
  if (!s.deadline) return Number.MAX_SAFE_INTEGER;
  return new Date(s.deadline).getTime();
}

function amountValue(s: MatchedScholarship): number {
  return s.amount ?? 0;
}

function winOrder(color: string): number {
  const order: Record<string, number> = { green: 0, teal: 1, amber: 2, slate: 3 };
  return order[color] ?? 4;
}

export default function ScholarshipResultsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [sort, setSort] = useState<SortKey>("winProb");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [winFilter, setWinFilter] = useState<WinFilter>("all");
  const [amountFilter, setAmountFilter] = useState<AmountFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) {
        router.replace("/scholarships");
        return;
      }
      setProfile(JSON.parse(raw) as StudentProfile);
    } catch {
      router.replace("/scholarships");
    }
  }, [router]);

  const matched = useMemo(() => {
    if (!profile) return [];
    return matchScholarships(profile, scholarships);
  }, [profile]);

  const filtered = useMemo(() => {
    let results = matched;

    if (scopeFilter !== "all") {
      results = results.filter((s) => s.scope === scopeFilter);
    }

    if (winFilter !== "all") {
      results = results.filter((s) => s.winColor === winFilter);
    }

    if (amountFilter !== "all") {
      const min = parseInt(amountFilter, 10);
      results = results.filter((s) => s.amount !== null && s.amount >= min);
    }

    const sorted = [...results];
    if (sort === "amount") {
      sorted.sort((a, b) => amountValue(b) - amountValue(a));
    } else if (sort === "deadline") {
      sorted.sort((a, b) => deadlineMs(a) - deadlineMs(b));
    } else {
      sorted.sort((a, b) => winOrder(a.winColor) - winOrder(b.winColor) || b.matchScore - a.matchScore);
    }
    return sorted;
  }, [matched, scopeFilter, winFilter, amountFilter, sort]);

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  // Build profile summary chips
  const summaryParts: string[] = [];
  if (profile.state) summaryParts.push(profile.state);
  if (profile.gradeLevel) {
    const gl: Record<string, string> = {
      "9": "9th", "10": "10th", "11": "11th", "12": "Senior",
      "college-1": "College 1st yr", "college-2": "College 2nd yr",
      "college-3": "College 3rd yr", "college-4": "College 4th yr",
    };
    summaryParts.push(gl[profile.gradeLevel] ?? profile.gradeLevel);
  }
  if (profile.heritage && profile.heritage.length > 0) {
    summaryParts.push(profile.heritage.slice(0, 2).join(", ") + " heritage");
  }
  if (profile.intendedMajor) summaryParts.push(profile.intendedMajor.replace("_", " "));

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Top bar */}
      <div className="sticky top-16 z-30 border-b border-navy-900/8 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-navy-900/50">Results for:</span>
            {summaryParts.map((p) => (
              <span
                key={p}
                className="rounded-full bg-navy-900/6 px-2.5 py-0.5 text-xs font-medium text-navy-800"
              >
                {p}
              </span>
            ))}
            <Link
              href="/scholarships"
              className="ml-1 text-xs text-teal-700 hover:underline"
            >
              Edit profile
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-navy-800/60">
            <span className="font-medium text-navy-900">{filtered.length}</span> scholarships
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Sort + filter controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-navy-900/10 bg-white p-1">
            <ArrowUpDown size={14} className="ml-2 text-navy-900/40" />
            {(
              [
                ["winProb", "Win Probability"],
                ["amount", "Amount"],
                ["deadline", "Deadline"],
              ] as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  sort === key
                    ? "bg-navy-900 text-cream-50"
                    : "text-navy-700 hover:bg-navy-900/6"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
              showFilters
                ? "border-teal-500 bg-teal-50 text-teal-800"
                : "border-navy-900/10 bg-white text-navy-700 hover:border-navy-900/20"
            }`}
          >
            <SlidersHorizontal size={13} />
            Filters
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-6 rounded-2xl border border-navy-900/8 bg-white p-5">
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-900/50">Scope</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["all", "city", "county", "state", "regional", "national"] as ScopeFilter[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setScopeFilter(v)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        scopeFilter === v
                          ? "border-navy-900 bg-navy-900 text-cream-50"
                          : "border-navy-900/12 bg-cream-50 text-navy-700 hover:border-navy-900/25"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-900/50">Odds</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ["all", "All"],
                    ["green", "Very High"],
                    ["teal", "High"],
                    ["amber", "Medium"],
                  ] as [WinFilter, string][]).map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setWinFilter(v)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        winFilter === v
                          ? "border-navy-900 bg-navy-900 text-cream-50"
                          : "border-navy-900/12 bg-cream-50 text-navy-700 hover:border-navy-900/25"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-900/50">Amount</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ["all", "Any amount"],
                    ["500", "$500+"],
                    ["1000", "$1,000+"],
                    ["2500", "$2,500+"],
                  ] as [AmountFilter, string][]).map(([v, label]) => (
                    <button
                      key={v}
                      onClick={() => setAmountFilter(v)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        amountFilter === v
                          ? "border-navy-900 bg-navy-900 text-cream-50"
                          : "border-navy-900/12 bg-cream-50 text-navy-700 hover:border-navy-900/25"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results grid */}
        {filtered.length === 0 ? (
          <FadeIn>
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-navy-900/8 bg-white py-16 text-center">
              <p className="text-lg font-semibold text-navy-900">No matches found</p>
              <p className="max-w-sm text-sm text-navy-800/60">
                Try adjusting your filters or{" "}
                <Link href="/scholarships" className="text-teal-700 hover:underline">
                  updating your profile
                </Link>{" "}
                to see more results.
              </p>
            </div>
          </FadeIn>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s, i) => (
              <FadeIn key={s.id} delay={Math.min(i * 0.04, 0.4)}>
                <ScholarshipCard s={s} />
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
