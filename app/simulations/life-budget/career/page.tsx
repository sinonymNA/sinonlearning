"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Design tokens ─────────────────────────────────────────────────────────────

const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "#e2e8f0";
const INK    = "#0f172a";
const MUTED  = "#64748b";
const FAINT  = "#94a3b8";
const GREEN  = "#16a34a";
const ACCENT = "#2563eb";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  jobTitle: string;
  industry: string;
  city: string;
  education: string;
  blsMedianAnnual: string;
  blsOutlook: string;
  path1Name: string;
  path1Cost: string;
  path2Name: string;
  path2Cost: string;
  chosenPath: string;
  startingSalary: string;
  grossMonthly: string;
  medianAt10: string;
  whyThisCareer: string;
  notes: string;
}

const EMPTY: FormData = {
  jobTitle: "",
  industry: "",
  city: "",
  education: "",
  blsMedianAnnual: "",
  blsOutlook: "",
  path1Name: "",
  path1Cost: "",
  path2Name: "",
  path2Cost: "",
  chosenPath: "",
  startingSalary: "",
  grossMonthly: "",
  medianAt10: "",
  whyThisCareer: "",
  notes: "",
};

const REQUIRED: (keyof FormData)[] = [
  "jobTitle",
  "blsMedianAnnual",
  "blsOutlook",
  "path1Name",
  "path1Cost",
  "chosenPath",
  "startingSalary",
  "grossMonthly",
  "whyThisCareer",
];

// ── Shared input styles ────────────────────────────────────────────────────────

const inp = (filled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${filled ? ACCENT + "88" : BORDER}`,
  borderRadius: 8,
  background: "#fff",
  fontSize: 14,
  color: INK,
  outline: "none",
  fontFamily: "system-ui, -apple-system, sans-serif",
  boxSizing: "border-box",
});

const ta = (filled: boolean): React.CSSProperties => ({
  ...inp(filled),
  resize: "vertical",
  minHeight: 84,
  lineHeight: 1.55,
});

function Lbl({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
      {children}{req && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>{children}</div>;
}

function Field({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 20 }}>{children}</div>;
}

function Divider() {
  return <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "28px 0" }} />;
}

function ResearchLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, textDecoration: "none" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, background: `${ACCENT}12`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12,
      }}>↗</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: ACCENT, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{sub}</p>
      </div>
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CareerPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then((r) => {
        if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/career"); return null; }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "career");
        if (m?.data) setD({ ...EMPTY, ...(m.data as Partial<FormData>) });
        if (m?.completed_at) setIsComplete(true);
      })
      .catch(() => {});
  }, [router]);

  // Auto-calculate gross monthly from starting salary
  useEffect(() => {
    const annual = parseFloat(d.startingSalary.replace(/[^0-9.]/g, ""));
    if (annual > 0) {
      setD((prev) => ({ ...prev, grossMonthly: (annual / 12).toFixed(0) }));
    }
  }, [d.startingSalary]);

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleSlug: "career", data: next }),
      })
        .then(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); })
        .catch(() => setSaving(false));
    }, 1500);
  }, []);

  const up = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...d, [key]: e.target.value } as FormData;
    setD(next);
    autoSave(next);
  };

  const filledRequired = REQUIRED.filter((k) => d[k]?.trim()).length;
  const allFilled = filledRequired === REQUIRED.length;

  const markComplete = async () => {
    if (!allFilled || isComplete) return;
    setCompleting(true);
    await fetch("/api/life-budget/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleSlug: "career", data: d, completed: true }),
    });
    setIsComplete(true);
    setCompleting(false);
  };

  const annual = parseFloat(d.startingSalary.replace(/[^0-9.]/g, "")) || 0;
  const gross = annual / 12;
  const blsNum = parseFloat(d.blsMedianAnnual.replace(/[^0-9.]/g, "")) || 0;

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif", color: INK }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: CARD, borderBottom: `1px solid ${BORDER}`,
        padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>← Life Budget</Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>MODULE 01 · CAREER</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saving && <span style={{ fontSize: 11, color: FAINT }}>Saving…</span>}
          {saved && !saving && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>✓ Saved</span>}
          {isComplete
            ? <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px" }}>✓ Complete</span>
            : (
              <button onClick={markComplete} disabled={!allFilled || completing}
                style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "5px 16px", border: "none",
                  cursor: allFilled ? "pointer" : "not-allowed",
                  background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED,
                }}>
                {completing ? "Saving…" : `Complete (${filledRequired}/${REQUIRED.length})`}
              </button>
            )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 24px 80px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

        {/* Main form */}
        <div>
          {/* Page title */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 4 }}>Career</h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
              Research your job on the Bureau of Labor Statistics, then fill in what you find.
              Your starting salary drives every other number in this portfolio.
            </p>
          </div>

          {/* Form card */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

            {/* Group 1: About the job */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>About the job</p>

            <Field>
              <Lbl req>Job Title</Lbl>
              <input value={d.jobTitle} onChange={up("jobTitle")} placeholder="e.g. Registered Nurse" style={inp(!!d.jobTitle)} />
            </Field>

            <Row>
              <Field>
                <Lbl>Industry / Employer Type</Lbl>
                <input value={d.industry} onChange={up("industry")} placeholder="e.g. Healthcare, hospital" style={inp(!!d.industry)} />
              </Field>
              <Field>
                <Lbl>City & State</Lbl>
                <input value={d.city} onChange={up("city")} placeholder="e.g. Atlanta, GA" style={inp(!!d.city)} />
              </Field>
            </Row>

            <Row>
              <Field>
                <Lbl req>BLS Median Annual Salary</Lbl>
                <input value={d.blsMedianAnnual} onChange={up("blsMedianAnnual")} placeholder="e.g. 77,600" style={inp(!!d.blsMedianAnnual)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>From bls.gov/ooh — the national median</p>
              </Field>
              <Field>
                <Lbl req>10-Year Job Outlook</Lbl>
                <input value={d.blsOutlook} onChange={up("blsOutlook")} placeholder="e.g. +6% (faster than avg)" style={inp(!!d.blsOutlook)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>BLS projected growth 2023–2033</p>
              </Field>
            </Row>

            <Divider />

            {/* Group 2: Education path */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Education path</p>

            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              Research at least two different routes to this career (e.g. 4-year degree vs. community college + certification).
            </p>

            <Row>
              <Field>
                <Lbl req>Path A — Name</Lbl>
                <input value={d.path1Name} onChange={up("path1Name")} placeholder="e.g. BSN at UGA (4 years)" style={inp(!!d.path1Name)} />
              </Field>
              <Field>
                <Lbl req>Path A — Total Cost</Lbl>
                <input value={d.path1Cost} onChange={up("path1Cost")} placeholder="e.g. $48,000" style={inp(!!d.path1Cost)} />
              </Field>
            </Row>

            <Row>
              <Field>
                <Lbl>Path B — Name</Lbl>
                <input value={d.path2Name} onChange={up("path2Name")} placeholder="e.g. ADN at Georgia Perimeter (2 years)" style={inp(!!d.path2Name)} />
              </Field>
              <Field>
                <Lbl>Path B — Total Cost</Lbl>
                <input value={d.path2Cost} onChange={up("path2Cost")} placeholder="e.g. $14,000" style={inp(!!d.path2Cost)} />
              </Field>
            </Row>

            <Field>
              <Lbl req>Which path are you choosing — and why?</Lbl>
              <textarea value={d.chosenPath} onChange={up("chosenPath")}
                placeholder="I'm choosing Path A because… The cost difference matters because…"
                style={ta(!!d.chosenPath)} />
            </Field>

            <Divider />

            {/* Group 3: Your salary */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Your salary</p>

            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              BLS gives national medians. Your actual starting salary depends on city, employer, and experience.
              Use the BLS metro area data or a job posting in your target city to get a realistic starting number.
            </p>

            <Row>
              <Field>
                <Lbl req>Your Starting Salary (Year 1 estimate)</Lbl>
                <input value={d.startingSalary} onChange={up("startingSalary")} placeholder="e.g. 62000" type="number" style={inp(!!d.startingSalary)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Annual, before taxes</p>
              </Field>
              <Field>
                <Lbl req>Gross Monthly (auto-calculated)</Lbl>
                <input value={d.grossMonthly} onChange={up("grossMonthly")}
                  placeholder={gross > 0 ? gross.toFixed(0) : "fills from salary above"}
                  style={{ ...inp(!!d.grossMonthly), background: "#f8fafc", color: annual > 0 ? ACCENT : MUTED, fontWeight: annual > 0 ? 700 : 400 }}
                  readOnly={annual > 0}
                />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Salary ÷ 12 — this flows to your paycheck module</p>
              </Field>
            </Row>

            <Row>
              <Field>
                <Lbl>Median Salary at 10 Years</Lbl>
                <input value={d.medianAt10} onChange={up("medianAt10")} placeholder="e.g. 85,000" style={inp(!!d.medianAt10)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>From BLS or salary survey — optional but useful</p>
              </Field>
              <Field>
                <Lbl>Education Required</Lbl>
                <select value={d.education} onChange={up("education")} style={inp(!!d.education)}>
                  <option value="">Select…</option>
                  <option>High school diploma / GED</option>
                  <option>Certificate / vocational training</option>
                  <option>Associate degree (2 years)</option>
                  <option>Bachelor&apos;s degree (4 years)</option>
                  <option>Master&apos;s degree</option>
                  <option>Doctoral / professional degree</option>
                </select>
              </Field>
            </Row>

            <Divider />

            {/* Group 4: Reflection */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Your take</p>

            <Field>
              <Lbl req>Why this career?</Lbl>
              <textarea value={d.whyThisCareer} onChange={up("whyThisCareer")}
                placeholder="What drew you to this career? Does the salary support the life you want? What surprised you about the research?"
                style={{ ...ta(!!d.whyThisCareer), minHeight: 110 }} />
            </Field>

            <Field>
              <Lbl>Additional notes</Lbl>
              <textarea value={d.notes} onChange={up("notes")} placeholder="Anything else worth remembering…" style={ta(!!d.notes)} />
            </Field>

          </div>

          {/* Complete */}
          {!isComplete && (
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <button onClick={markComplete} disabled={!allFilled || completing}
                style={{
                  fontSize: 14, fontWeight: 700, borderRadius: 10, padding: "13px 40px", border: "none",
                  cursor: allFilled ? "pointer" : "not-allowed",
                  background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED,
                  width: "100%",
                }}>
                {completing ? "Saving…" : allFilled ? "Mark Module 1 Complete →" : `Fill required fields (${filledRequired} / ${REQUIRED.length} done)`}
              </button>
            </div>
          )}

          {isComplete && (
            <div style={{ marginTop: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 6 }}>✓ Module 1 Complete</p>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Your career data is saved. Head to Module 2: First Paycheck.</p>
              <Link href="/simulations/life-budget/paycheck"
                style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: "#fff", background: GREEN, borderRadius: 8, padding: "9px 22px", textDecoration: "none" }}>
                Module 2: First Paycheck →
              </Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 64 }}>

          {/* Live stats */}
          {(annual > 0 || blsNum > 0) && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 20px", overflow: "hidden" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Your numbers</p>

              {annual > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Starting salary</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: INK, fontVariantNumeric: "tabular-nums" }}>${annual.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: MUTED }}>= ${gross.toFixed(0)}/month gross</p>
                </div>
              )}

              {blsNum > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>BLS national median</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: INK }}>${blsNum.toLocaleString()}</p>
                </div>
              )}

              {annual > 0 && blsNum > 0 && (
                <div style={{
                  background: annual < blsNum ? "#fef2f2" : "#f0fdf4",
                  border: `1px solid ${annual < blsNum ? "#fecaca" : "#bbf7d0"}`,
                  borderRadius: 8, padding: "10px 12px", marginTop: 4,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: annual < blsNum ? "#dc2626" : GREEN }}>
                    {annual < blsNum
                      ? `$${(blsNum - annual).toLocaleString()} below median`
                      : annual === blsNum
                      ? "At the national median"
                      : `$${(annual - blsNum).toLocaleString()} above median`}
                  </p>
                  <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Starting vs. BLS median</p>
                </div>
              )}
            </div>
          )}

          {/* Research links */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Where to research</p>
            <ResearchLink href="https://www.bls.gov/ooh/" label="BLS Occupational Outlook" sub="Official salary data, outlook, and education requirements by career" />
            <ResearchLink href="https://www.onetonline.org" label="O*NET OnLine" sub="Detailed skill profiles and local salary data by metro area" />
            <ResearchLink href="https://collegescorecard.ed.gov" label="College Scorecard" sub="Real earnings after graduation for every college program" />
            <ResearchLink href="https://www.bls.gov/oes/current/oessrcma.htm" label="BLS Metro Area Salaries" sub="Same job title, filtered to your specific city" />
          </div>

        </div>
      </div>
    </main>
  );
}
