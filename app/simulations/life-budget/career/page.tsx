"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleShell from "@/components/life-budget/ModuleShell";
import SectionStep from "@/components/life-budget/SectionStep";
import CareerHook from "@/components/life-budget/hooks/CareerHook";

const BORDER = "#e2e8f0";
const INK    = "#0f172a";
const MUTED  = "#64748b";
const FAINT  = "#94a3b8";
const GREEN  = "#16a34a";
const ACCENT = "#2563eb";
const CARD   = "#ffffff";
const BG     = "#f8fafc";

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
  careerRisk: string;
  notes: string;
}

const EMPTY: FormData = {
  jobTitle: "", industry: "", city: "", education: "",
  blsMedianAnnual: "", blsOutlook: "",
  path1Name: "", path1Cost: "", path2Name: "", path2Cost: "", chosenPath: "",
  startingSalary: "", grossMonthly: "", medianAt10: "",
  whyThisCareer: "", careerRisk: "", notes: "",
};

const REQUIRED: (keyof FormData)[] = [
  "jobTitle", "blsMedianAnnual", "blsOutlook",
  "path1Name", "path1Cost", "chosenPath",
  "startingSalary", "grossMonthly", "whyThisCareer",
];

const inp = (filled: boolean): React.CSSProperties => ({
  width: "100%", padding: "10px 14px",
  border: `1px solid ${filled ? ACCENT + "88" : BORDER}`,
  borderRadius: 8, background: "#fff", fontSize: 14, color: INK,
  outline: "none", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box",
});
const ta = (filled: boolean): React.CSSProperties => ({ ...inp(filled), resize: "vertical", minHeight: 84, lineHeight: 1.55 });

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

function ResearchLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, textDecoration: "none" }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${ACCENT}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12 }}>↗</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: ACCENT, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{sub}</p>
      </div>
    </a>
  );
}

export default function CareerPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
  const [phase, setPhase] = useState<"hook" | "work">("hook");
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
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); setPhase("work"); }
        if (m?.completed_at) setIsComplete(true);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const annual = parseFloat(d.startingSalary.replace(/[^0-9.]/g, ""));
    if (annual > 0) setD((prev) => ({ ...prev, grossMonthly: (annual / 12).toFixed(0) }));
  }, [d.startingSalary]);

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleSlug: "career", data: d, completed: true }),
    });
    setIsComplete(true);
    setCompleting(false);
  };

  const annual = parseFloat(d.startingSalary.replace(/[^0-9.]/g, "")) || 0;
  const gross = annual / 12;
  const blsNum = parseFloat(d.blsMedianAnnual.replace(/[^0-9.]/g, "")) || 0;

  // Section unlock conditions
  const step2Unlocked = !!(d.jobTitle.trim() && d.blsMedianAnnual.trim() && d.blsOutlook.trim());
  const step3Unlocked = step2Unlocked && !!(d.path1Name.trim() && d.path1Cost.trim() && d.chosenPath.trim());
  const step4Unlocked = step3Unlocked && !!d.startingSalary.trim();

  const sidebar = (
    <>
      {(annual > 0 || blsNum > 0) && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px", overflow: "hidden" }}>
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
            <div style={{ background: annual < blsNum ? "#fef2f2" : "#f0fdf4", border: `1px solid ${annual < blsNum ? "#fecaca" : "#bbf7d0"}`, borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: annual < blsNum ? "#dc2626" : GREEN }}>
                {annual < blsNum ? `$${(blsNum - annual).toLocaleString()} below median` : annual === blsNum ? "At the national median" : `$${(annual - blsNum).toLocaleString()} above median`}
              </p>
              <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Starting vs. BLS median</p>
            </div>
          )}
          <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
            Entry-level typically runs 15–25% below the published median — that&apos;s expected and normal. The median includes 10-year veterans.
          </p>
        </div>
      )}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Where to research</p>
        <ResearchLink href="https://www.bls.gov/ooh/" label="BLS Occupational Outlook" sub="Official salary data, outlook, and education requirements by career" />
        <ResearchLink href="https://www.onetonline.org" label="O*NET OnLine" sub="Detailed skill profiles and local salary data by metro area" />
        <ResearchLink href="https://collegescorecard.ed.gov" label="College Scorecard" sub="Real earnings after graduation for every college program" />
        <ResearchLink href="https://www.bls.gov/oes/current/oessrcma.htm" label="BLS Metro Area Salaries" sub="Same job title, filtered to your specific city" />
      </div>
    </>
  );

  return (
    <ModuleShell
      moduleLabel="MODULE 01 · CAREER"
      accent={ACCENT}
      filledRequired={filledRequired}
      totalRequired={REQUIRED.length}
      isComplete={isComplete}
      onMarkComplete={markComplete}
      completing={completing}
      saving={saving}
      saved={saved}
      phase={phase}
      hookContent={<CareerHook onReady={() => { window.scrollTo(0, 0); setPhase("work"); }} />}
      sidebarContent={sidebar}
      nextHref="/simulations/life-budget/paycheck"
      nextLabel="Module 2: First Paycheck"
      completionHighlights={[
        { label: "Starting salary", value: d.startingSalary ? `$${Math.round(parseFloat(d.startingSalary)).toLocaleString()}/yr` : "" },
        { label: "Gross monthly", value: d.grossMonthly ? `$${Math.round(parseFloat(d.grossMonthly)).toLocaleString()}/mo` : "", sub: d.blsOutlook || "" },
      ]}
    >
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

        <SectionStep number={1} total={4} title="Research the job" subtitle="What does this career actually pay — and what's it growing at?" isUnlocked={true} accent={ACCENT}>
          <Field>
            <Lbl req>What&apos;s your job title going to be?</Lbl>
            <input value={d.jobTitle} onChange={up("jobTitle")} placeholder="e.g. Registered Nurse" style={inp(!!d.jobTitle)} />
          </Field>
          <Row>
            <Field>
              <Lbl>Industry / employer type</Lbl>
              <input value={d.industry} onChange={up("industry")} placeholder="e.g. Healthcare, hospital" style={inp(!!d.industry)} />
            </Field>
            <Field>
              <Lbl>City & state you&apos;re planning to work in</Lbl>
              <input value={d.city} onChange={up("city")} placeholder="e.g. Atlanta, GA" style={inp(!!d.city)} />
            </Field>
          </Row>
          <Row>
            <Field>
              <Lbl req>What does BLS list as the median salary?</Lbl>
              <input value={d.blsMedianAnnual} onChange={up("blsMedianAnnual")} placeholder="e.g. 77,600" style={inp(!!d.blsMedianAnnual)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>From bls.gov/ooh — the national median</p>
            </Field>
            <Field>
              <Lbl req>10-year job outlook (from BLS)</Lbl>
              <input value={d.blsOutlook} onChange={up("blsOutlook")} placeholder="e.g. +6% (faster than avg)" style={inp(!!d.blsOutlook)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>BLS projected growth 2023–2033</p>
            </Field>
          </Row>
        </SectionStep>

        <SectionStep number={2} total={4} title="Education paths" subtitle="Research at least two routes — community college vs. university, trade school vs. degree." isUnlocked={step2Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl req>Path A — what&apos;s the school and degree?</Lbl>
              <input value={d.path1Name} onChange={up("path1Name")} placeholder="e.g. BSN at UGA (4 years)" style={inp(!!d.path1Name)} />
            </Field>
            <Field>
              <Lbl req>Path A — total cost</Lbl>
              <input value={d.path1Cost} onChange={up("path1Cost")} placeholder="e.g. $48,000" style={inp(!!d.path1Cost)} />
            </Field>
          </Row>
          <Row>
            <Field>
              <Lbl>Path B — alternative route (optional)</Lbl>
              <input value={d.path2Name} onChange={up("path2Name")} placeholder="e.g. ADN at Georgia Perimeter (2 years)" style={inp(!!d.path2Name)} />
            </Field>
            <Field>
              <Lbl>Path B — total cost</Lbl>
              <input value={d.path2Cost} onChange={up("path2Cost")} placeholder="e.g. $14,000" style={inp(!!d.path2Cost)} />
            </Field>
          </Row>
          <Field>
            <Lbl req>Which path are you taking — and why?</Lbl>
            <textarea value={d.chosenPath} onChange={up("chosenPath")}
              placeholder="I'm choosing Path A because… The cost difference matters because…"
              style={ta(!!d.chosenPath)} />
          </Field>
        </SectionStep>

        <SectionStep number={3} total={4} title="Your actual salary" subtitle="BLS gives national averages. Your first-year salary in your city is what actually matters." isUnlocked={step3Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl req>What&apos;s your realistic year-1 salary?</Lbl>
              <input value={d.startingSalary} onChange={up("startingSalary")} placeholder="e.g. 62000" type="number" style={inp(!!d.startingSalary)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Annual, before taxes — use a local job posting to verify</p>
            </Field>
            <Field>
              <Lbl req>Gross monthly (auto-fills)</Lbl>
              <input value={d.grossMonthly} onChange={up("grossMonthly")}
                placeholder={gross > 0 ? gross.toFixed(0) : "fills from salary above"}
                style={{ ...inp(!!d.grossMonthly), background: "#f8fafc", color: annual > 0 ? ACCENT : MUTED, fontWeight: annual > 0 ? 700 : 400 }}
                readOnly={annual > 0}
              />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Salary ÷ 12 — flows to your paycheck module</p>
            </Field>
          </Row>
          <Row>
            <Field>
              <Lbl>Median salary at 10 years (optional)</Lbl>
              <input value={d.medianAt10} onChange={up("medianAt10")} placeholder="e.g. 85,000" style={inp(!!d.medianAt10)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>From BLS or salary survey</p>
            </Field>
            <Field>
              <Lbl>Education level required</Lbl>
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
        </SectionStep>

        <SectionStep number={4} total={4} title="Your take" subtitle="No right answers — just honest ones." isUnlocked={step4Unlocked} accent={ACCENT}>
          <Field>
            <Lbl req>Why this career — and what drew you to it?</Lbl>
            <textarea value={d.whyThisCareer} onChange={up("whyThisCareer")}
              placeholder="What drew you to this career? Does the salary support the life you want? What surprised you about the research?"
              style={{ ...ta(!!d.whyThisCareer), minHeight: 110 }} />
          </Field>
          <Field>
            <Lbl>What&apos;s the biggest risk you&apos;re taking with this choice?</Lbl>
            <textarea value={d.careerRisk} onChange={up("careerRisk")}
              placeholder="Market risk, automation risk, geographic constraints, long education timeline…"
              style={ta(!!d.careerRisk)} />
          </Field>
          <Field>
            <Lbl>Notes</Lbl>
            <textarea value={d.notes} onChange={up("notes")} placeholder="Anything else worth remembering…" style={ta(!!d.notes)} />
          </Field>
        </SectionStep>

      </div>
    </ModuleShell>
  );
}
