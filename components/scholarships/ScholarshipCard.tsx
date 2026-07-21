"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Heart, MapPin, Calendar, DollarSign } from "lucide-react";
import type { MatchedScholarship } from "@/lib/scholarshipMatch";

const winBadgeClasses: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  teal: "bg-teal-50 text-teal-800 border border-teal-200",
  amber: "bg-amber-50 text-amber-800 border border-amber-200",
  slate: "bg-slate-100 text-slate-700 border border-slate-200",
};

const winDotClasses: Record<string, string> = {
  green: "bg-emerald-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
};

const SAVES_KEY = "sinon:scholarship_saves";

function getSavedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SAVES_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function toggleSave(id: string): boolean {
  const current = getSavedIds();
  const idx = current.indexOf(id);
  if (idx >= 0) {
    current.splice(idx, 1);
    localStorage.setItem(SAVES_KEY, JSON.stringify(current));
    return false;
  } else {
    current.push(id);
    localStorage.setItem(SAVES_KEY, JSON.stringify(current));
    return true;
  }
}

const scopeLabel: Record<string, string> = {
  city: "City",
  county: "County",
  state: "State",
  regional: "Regional",
  national: "National",
};

export default function ScholarshipCard({ s }: { s: MatchedScholarship }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(getSavedIds().includes(s.id));
  }, [s.id]);

  function handleSave() {
    const nowSaved = toggleSave(s.id);
    setSaved(nowSaved);
  }

  return (
    <div className="flex flex-col rounded-2xl border border-navy-900/8 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Win probability header */}
      <div className="flex items-center gap-2 rounded-t-2xl border-b border-navy-900/6 bg-cream-50/60 px-5 py-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${winBadgeClasses[s.winColor]}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${winDotClasses[s.winColor]}`} />
          {s.winLabel.toUpperCase()} ODDS
        </span>
        <span className="text-xs text-navy-900/40">~{s.estimatedApplicants.toLocaleString()} est. applicants</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Title + provider */}
        <div>
          <h3 className="text-base font-semibold leading-snug text-navy-900">{s.name}</h3>
          <p className="mt-0.5 text-sm text-navy-700/60">{s.provider}</p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-900/50">
          <span className="flex items-center gap-1">
            <DollarSign size={12} />
            {s.amountLabel}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {s.deadlineLabel}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {scopeLabel[s.scope]}
          </span>
        </div>

        {/* Description */}
        <p className="line-clamp-3 text-sm leading-relaxed text-navy-800/70">{s.description}</p>

        {/* Quirky fact */}
        {s.quirkyFact && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span className="font-semibold">Notable:</span> {s.quirkyFact}
          </p>
        )}

        {/* Why low competition */}
        {(s.scope === "city" || s.scope === "county" || s.estimatedApplicants < 100) && (
          <p className="text-xs text-emerald-700">
            Why low competition:{" "}
            {s.scope === "city" || s.scope === "county"
              ? `${scopeLabel[s.scope]}-level only`
              : s.eligibleHeritage
                ? "Heritage requirement narrows the pool"
                : s.eligibleMajors
                  ? "Major-specific"
                  : "Niche criteria"}
          </p>
        )}

        {/* Match reasons */}
        {s.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {s.matchReasons.map((reason) => (
              <span
                key={reason}
                className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* Action row */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <a
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            Apply Now
            <ExternalLink size={13} />
          </a>

          <button
            onClick={handleSave}
            aria-label={saved ? "Remove from saved" : "Save scholarship"}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              saved
                ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "border-navy-900/12 bg-white text-navy-600 hover:border-navy-900/20 hover:text-navy-900"
            }`}
          >
            <Heart size={13} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
