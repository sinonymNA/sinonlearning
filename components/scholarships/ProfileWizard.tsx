"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StudentProfile } from "@/lib/scholarshipMatch";

const PROFILE_KEY = "sinon:scholarship_profile";

const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;

const GRADE_OPTIONS = [
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
  { value: "11", label: "11th Grade (Junior)" },
  { value: "12", label: "12th Grade (Senior)" },
  { value: "college-1", label: "College — 1st Year" },
  { value: "college-2", label: "College — 2nd Year" },
  { value: "college-3", label: "College — 3rd Year" },
  { value: "college-4", label: "College — 4th Year" },
];

const CITIZENSHIP_OPTIONS = [
  { value: "us_citizen", label: "U.S. Citizen" },
  { value: "permanent_resident", label: "Permanent Resident (Green Card)" },
  { value: "daca", label: "DACA / Dreamer" },
  { value: "other", label: "Other / International" },
];

const HERITAGE_OPTIONS = [
  "african_american", "armenian", "chinese", "filipino", "greek", "hispanic_latino",
  "irish", "italian", "japanese", "jewish", "korean", "native_american", "norwegian",
  "polish", "portuguese", "scandinavian", "vietnamese",
];

const HERITAGE_LABELS: Record<string, string> = {
  african_american: "African American / Black",
  armenian: "Armenian",
  chinese: "Chinese",
  filipino: "Filipino",
  greek: "Greek",
  hispanic_latino: "Hispanic / Latino",
  irish: "Irish",
  italian: "Italian",
  japanese: "Japanese",
  jewish: "Jewish",
  korean: "Korean",
  native_american: "Native American / Alaska Native",
  norwegian: "Norwegian",
  polish: "Polish",
  portuguese: "Portuguese",
  scandinavian: "Scandinavian",
  vietnamese: "Vietnamese",
};

const MAJOR_OPTIONS = [
  "agriculture", "architecture", "art", "biology", "business", "chemistry",
  "computer_science", "culinary", "education", "engineering", "environmental",
  "healthcare", "history", "journalism", "law", "math", "music", "nursing",
  "political_science", "psychology", "social_work", "skilled_trades",
];

const MAJOR_LABELS: Record<string, string> = {
  agriculture: "Agriculture / Farming",
  architecture: "Architecture",
  art: "Art / Fine Arts",
  biology: "Biology / Life Sciences",
  business: "Business / Finance",
  chemistry: "Chemistry",
  computer_science: "Computer Science / Tech",
  culinary: "Culinary Arts / Food Service",
  education: "Education / Teaching",
  engineering: "Engineering",
  environmental: "Environmental Science",
  healthcare: "Healthcare (general)",
  history: "History / Humanities",
  journalism: "Journalism / Communications",
  law: "Law / Pre-law",
  math: "Mathematics / Statistics",
  music: "Music / Performing Arts",
  nursing: "Nursing",
  political_science: "Political Science",
  psychology: "Psychology",
  social_work: "Social Work",
  skilled_trades: "Skilled Trades / Vocational",
};

const EXTRACURRICULAR_OPTIONS = [
  { value: "4h", label: "4-H" },
  { value: "ffa", label: "FFA (Future Farmers of America)" },
  { value: "scouting", label: "Boy Scouts / Girl Scouts" },
  { value: "golf", label: "Golf (esp. caddie)" },
  { value: "bowling", label: "Bowling" },
  { value: "ham_radio", label: "Ham Radio / Amateur Radio" },
  { value: "community_service", label: "Community Service / Volunteering" },
  { value: "arts", label: "Visual / Performing Arts" },
  { value: "sports", label: "Sports (general)" },
];

const INTEREST_OPTIONS = [
  { value: "stem", label: "STEM" },
  { value: "writing", label: "Writing / English" },
  { value: "environment", label: "Environment / Conservation" },
  { value: "community", label: "Community Service" },
  { value: "music", label: "Music" },
  { value: "leadership", label: "Leadership" },
  { value: "entrepreneurship", label: "Entrepreneurship" },
  { value: "public_safety", label: "Public Safety / Fire / EMS" },
  { value: "culinary", label: "Food / Culinary" },
];

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ["Location", "Academics", "Background", "Interests"];

export default function ProfileWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<Partial<StudentProfile>>({
    heritage: [],
    interests: [],
    extracurriculars: [],
  });

  function update<K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function toggleArray(
    key: "heritage" | "interests" | "extracurriculars",
    value: string,
  ) {
    setProfile((p) => {
      const arr = (p[key] ?? []) as string[];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...p, [key]: next };
    });
  }

  async function handleSubmit() {
    const finalProfile: StudentProfile = {
      heritage: profile.heritage ?? [],
      interests: profile.interests ?? [],
      extracurriculars: profile.extracurriculars ?? [],
      state: profile.state,
      city: profile.city,
      gradeLevel: profile.gradeLevel,
      gpa: profile.gpa,
      citizenship: profile.citizenship,
      intendedMajor: profile.intendedMajor,
      firstGen: profile.firstGen,
      financialNeed: profile.financialNeed,
    };

    localStorage.setItem(PROFILE_KEY, JSON.stringify(finalProfile));

    // Optionally save to server if logged in
    try {
      const check = await fetch("/api/scholarships/profile");
      if (check.status !== 401) {
        await fetch("/api/scholarships/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalProfile),
        });
      }
    } catch {
      // ignore — localStorage is the primary store
    }

    router.push("/scholarships/results");
  }

  const chip = (
    active: boolean,
    label: string,
    onClick: () => void,
    key: string,
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
        active
          ? "border-teal-500 bg-teal-50 text-teal-800"
          : "border-navy-900/12 bg-white text-navy-700 hover:border-navy-900/25"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  i + 1 < step
                    ? "bg-teal-600 text-white"
                    : i + 1 === step
                      ? "bg-navy-900 text-cream-50"
                      : "bg-navy-900/10 text-navy-900/40"
                }`}
              >
                {i + 1 < step ? "✓" : i + 1}
              </div>
              <span
                className={`hidden text-xs sm:block ${
                  i + 1 === step ? "font-semibold text-navy-900" : "text-navy-900/40"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-900/8">
          <div
            className="h-full rounded-full bg-teal-600 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-navy-900/8 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-xl font-semibold text-navy-900">Where are you located?</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800">
                State <span className="text-navy-900/40">(required for state scholarships)</span>
              </label>
              <select
                value={profile.state ?? ""}
                onChange={(e) => update("state", e.target.value || undefined)}
                className="w-full rounded-xl border border-navy-900/15 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Select your state…</option>
                {US_STATES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800">
                City <span className="text-navy-900/40">(optional — helps find city-level scholarships)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chicago"
                value={profile.city ?? ""}
                onChange={(e) => update("city", e.target.value || undefined)}
                className="w-full rounded-xl border border-navy-900/15 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-900/30 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-xl font-semibold text-navy-900">Tell us about your academics</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800">Grade / Year</label>
              <div className="flex flex-wrap gap-2">
                {GRADE_OPTIONS.map((g) =>
                  chip(
                    profile.gradeLevel === g.value,
                    g.label,
                    () => update("gradeLevel", g.value),
                    g.value,
                  ),
                )}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800">
                GPA <span className="text-navy-900/40">(optional)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="4.0"
                placeholder="e.g. 3.5"
                value={profile.gpa ?? ""}
                onChange={(e) =>
                  update("gpa", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="w-48 rounded-xl border border-navy-900/15 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-900/30 focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800">Citizenship status</label>
              <div className="flex flex-wrap gap-2">
                {CITIZENSHIP_OPTIONS.map((c) =>
                  chip(
                    profile.citizenship === c.value,
                    c.label,
                    () => update("citizenship", c.value),
                    c.value,
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-xl font-semibold text-navy-900">Your background</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800">
                Heritage / ethnicity{" "}
                <span className="text-navy-900/40">(select all that apply — unlocks heritage scholarships)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {HERITAGE_OPTIONS.map((h) =>
                  chip(
                    ((profile.heritage ?? []) as string[]).includes(h),
                    HERITAGE_LABELS[h] ?? h,
                    () => toggleArray("heritage", h),
                    h,
                  ),
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-navy-800">Additional qualifiers</label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={profile.firstGen ?? false}
                  onChange={(e) => update("firstGen", e.target.checked || undefined)}
                  className="h-4 w-4 rounded border-navy-900/20 accent-teal-600"
                />
                <div>
                  <span className="text-sm font-medium text-navy-900">First-generation college student</span>
                  <p className="text-xs text-navy-900/50">
                    Neither parent attended a 4-year college
                  </p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={profile.financialNeed ?? false}
                  onChange={(e) => update("financialNeed", e.target.checked || undefined)}
                  className="h-4 w-4 rounded border-navy-900/20 accent-teal-600"
                />
                <div>
                  <span className="text-sm font-medium text-navy-900">Demonstrated financial need</span>
                  <p className="text-xs text-navy-900/50">Filed FAFSA or qualify for need-based aid</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-xl font-semibold text-navy-900">Interests & activities</h2>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800">Intended major / field of study</label>
              <select
                value={profile.intendedMajor ?? ""}
                onChange={(e) => update("intendedMajor", e.target.value || undefined)}
                className="w-full rounded-xl border border-navy-900/15 bg-white px-4 py-2.5 text-sm text-navy-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="">Undecided / Not sure yet</option>
                {MAJOR_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {MAJOR_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800">
                Extracurricular activities <span className="text-navy-900/40">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {EXTRACURRICULAR_OPTIONS.map(({ value, label }) =>
                  chip(
                    ((profile.extracurriculars ?? []) as string[]).includes(value),
                    label,
                    () => toggleArray("extracurriculars", value),
                    value,
                  ),
                )}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-800">
                General interests <span className="text-navy-900/40">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(({ value, label }) =>
                  chip(
                    ((profile.interests ?? []) as string[]).includes(value),
                    label,
                    () => toggleArray("interests", value),
                    value,
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="rounded-full border border-navy-900/15 px-5 py-2 text-sm font-medium text-navy-700 transition-colors hover:border-navy-900/25 hover:text-navy-900"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as Step)}
              className="rounded-full bg-teal-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full bg-teal-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Find My Scholarships →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
