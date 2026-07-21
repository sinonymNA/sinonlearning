import type { Scholarship } from "@/data/scholarships";

export interface StudentProfile {
  state?: string;
  city?: string;
  gradeLevel?: string;
  gpa?: number;
  citizenship?: string;
  heritage: string[];
  intendedMajor?: string;
  interests: string[];
  extracurriculars: string[];
  firstGen?: boolean;
  financialNeed?: boolean;
}

export interface MatchedScholarship extends Scholarship {
  matchScore: number;
  matchReasons: string[];
  winLabel: "Very High" | "High" | "Medium" | "Low";
  winColor: "green" | "teal" | "amber" | "slate";
}

export function winProbLabel(estimatedApplicants: number): {
  label: "Very High" | "High" | "Medium" | "Low";
  color: "green" | "teal" | "amber" | "slate";
} {
  if (estimatedApplicants < 50) return { label: "Very High", color: "green" };
  if (estimatedApplicants < 250) return { label: "High", color: "teal" };
  if (estimatedApplicants < 1000) return { label: "Medium", color: "amber" };
  return { label: "Low", color: "slate" };
}

export function scoreScholarship(
  profile: StudentProfile,
  s: Scholarship,
): { score: number; reasons: string[] } | null {
  const reasons: string[] = [];

  // Hard disqualifiers
  if (s.eligibleGpaMin !== undefined && profile.gpa !== undefined && profile.gpa < s.eligibleGpaMin) {
    return null;
  }

  if (s.eligibleGrades.length > 0 && profile.gradeLevel && !s.eligibleGrades.includes(profile.gradeLevel)) {
    return null;
  }

  if (s.eligibleCitizenship && s.eligibleCitizenship.length > 0 && profile.citizenship) {
    if (!s.eligibleCitizenship.includes(profile.citizenship as never)) {
      return null;
    }
  }

  if (s.eligibleStates && s.eligibleStates.length > 0 && profile.state) {
    if (!s.eligibleStates.includes(profile.state)) {
      return null;
    }
  }

  let score = 0;

  // Local scope bonus
  if (s.scope === "city" || s.scope === "county") {
    score += 35;
    reasons.push(`${s.scope === "city" ? "City" : "County"}-level (very low competition)`);
  }

  // Heritage match
  if (s.eligibleHeritage && s.eligibleHeritage.length > 0 && profile.heritage.length > 0) {
    const matched = s.eligibleHeritage.some((h) => profile.heritage.includes(h));
    if (matched) {
      const matchedHeritage = s.eligibleHeritage.find((h) => profile.heritage.includes(h));
      score += 20;
      reasons.push(`${matchedHeritage} heritage ✓`);
    } else {
      // Heritage required but not matching — soft filter (not hard disqualifier unless it's the sole criteria)
      // Return null only if heritage is clearly required
      return null;
    }
  }

  // State match
  if (s.eligibleStates && s.eligibleStates.length > 0 && profile.state) {
    if (s.eligibleStates.includes(profile.state)) {
      score += 10;
      reasons.push(`${profile.state} resident ✓`);
    }
  }

  // Major match
  if (s.eligibleMajors && s.eligibleMajors.length > 0 && profile.intendedMajor) {
    const matched = s.eligibleMajors.some(
      (m) =>
        profile.intendedMajor!.toLowerCase().includes(m.toLowerCase()) ||
        m.toLowerCase().includes(profile.intendedMajor!.toLowerCase()),
    );
    if (matched) {
      score += 15;
      reasons.push(`${profile.intendedMajor} major ✓`);
    } else {
      return null;
    }
  }

  // Interest tag matches (capped at +20)
  if (s.eligibleInterests && profile.interests.length > 0) {
    let interestBonus = 0;
    const matchedInterests: string[] = [];
    for (const interest of profile.interests) {
      if (s.eligibleInterests.includes(interest)) {
        interestBonus += 10;
        matchedInterests.push(interest);
      }
    }
    const cappedBonus = Math.min(interestBonus, 20);
    if (cappedBonus > 0) {
      score += cappedBonus;
      reasons.push(`${matchedInterests.join(", ")} interest ✓`);
    }
  }

  // First-gen bonus
  if (s.eligibleFirstGen && profile.firstGen) {
    score += 10;
    reasons.push("First-generation student ✓");
  } else if (s.eligibleFirstGen && !profile.firstGen) {
    return null;
  }

  // Financial need bonus
  if (s.eligibleFinancialNeed && profile.financialNeed) {
    score += 10;
    reasons.push("Financial need ✓");
  } else if (s.eligibleFinancialNeed && !profile.financialNeed) {
    return null;
  }

  // Extracurricular matches (capped at +10)
  if (s.eligibleExtracurriculars && profile.extracurriculars.length > 0) {
    let ecBonus = 0;
    const matchedEc: string[] = [];
    for (const ec of profile.extracurriculars) {
      if (s.eligibleExtracurriculars.includes(ec)) {
        ecBonus += 5;
        matchedEc.push(ec);
      }
    }
    const cappedBonus = Math.min(ecBonus, 10);
    if (cappedBonus > 0) {
      score += cappedBonus;
      reasons.push(`${matchedEc.join(", ")} ✓`);
    } else if (s.eligibleExtracurriculars.length > 0) {
      return null;
    }
  }

  // Grade level shown as reason if matched
  if (profile.gradeLevel && s.eligibleGrades.includes(profile.gradeLevel)) {
    const gradeLabels: Record<string, string> = {
      "9": "9th grade",
      "10": "10th grade",
      "11": "11th grade",
      "12": "12th grade (senior)",
      "college-1": "College freshman",
      "college-2": "College sophomore",
      "college-3": "College junior",
      "college-4": "College senior",
    };
    const label = gradeLabels[profile.gradeLevel] ?? profile.gradeLevel;
    if (!reasons.some((r) => r.includes("grade") || r.includes("College"))) {
      reasons.push(`${label} ✓`);
    }
  }

  // GPA shown as reason
  if (s.eligibleGpaMin !== undefined && profile.gpa !== undefined && profile.gpa >= s.eligibleGpaMin) {
    reasons.push(`GPA ${profile.gpa.toFixed(1)} meets ${s.eligibleGpaMin.toFixed(1)} min ✓`);
  }

  // Base score for broad national scholarships with no restrictions
  if (
    !s.eligibleHeritage &&
    !s.eligibleMajors &&
    !s.eligibleExtracurriculars &&
    !s.eligibleFirstGen &&
    !s.eligibleFinancialNeed &&
    s.scope === "national" &&
    score === 0
  ) {
    score = 5;
  }

  return { score, reasons };
}

function competitionBonus(estimatedApplicants: number): number {
  if (estimatedApplicants < 50) return 40;
  if (estimatedApplicants < 250) return 30;
  if (estimatedApplicants < 1000) return 15;
  return 0;
}

export function matchScholarships(
  profile: StudentProfile,
  all: Scholarship[],
): MatchedScholarship[] {
  const results: MatchedScholarship[] = [];

  for (const s of all) {
    const scored = scoreScholarship(profile, s);
    if (scored === null) continue;

    const { label: winLabel, color: winColor } = winProbLabel(s.estimatedApplicants);
    const compBonus = competitionBonus(s.estimatedApplicants);
    const finalScore = scored.score * 0.6 + compBonus * 0.4;

    results.push({
      ...s,
      matchScore: finalScore,
      matchReasons: scored.reasons,
      winLabel,
      winColor,
    });
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}
