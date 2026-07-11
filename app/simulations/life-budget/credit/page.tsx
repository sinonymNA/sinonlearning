"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleShell from "@/components/life-budget/ModuleShell";
import SectionStep from "@/components/life-budget/SectionStep";
import CreditHook from "@/components/life-budget/hooks/CreditHook";

const BG = "#f8fafc", CARD = "#ffffff", BORDER = "#e2e8f0";
const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const GREEN = "#16a34a", ACCENT = "#dc2626";

interface FormData {
  estimatedScore: string;
  scoreFactors: string;
  studentLoanBalance: string;
  repaymentPlan: string;
  studentLoanPayment: string;
  creditCardBalance: string;
  minPayment: string;
  monthsToPayoff: string;
  creditCardGoal: string;
  scoreGoal: string;
  creditReflection: string;
  creditBuildPlan: string;
  notes: string;
}

const EMPTY: FormData = {
  estimatedScore: "", scoreFactors: "", studentLoanBalance: "", repaymentPlan: "",
  studentLoanPayment: "", creditCardBalance: "", minPayment: "", monthsToPayoff: "",
  creditCardGoal: "", scoreGoal: "",
  creditReflection: "", creditBuildPlan: "", notes: "",
};

const REQUIRED: (keyof FormData)[] = ["estimatedScore", "studentLoanBalance", "repaymentPlan", "studentLoanPayment", "creditReflection"];

const inp = (filled: boolean): React.CSSProperties => ({
  width: "100%", padding: "10px 14px", border: `1px solid ${filled ? ACCENT + "88" : BORDER}`,
  borderRadius: 8, background: "#fff", fontSize: 14, color: INK, outline: "none",
  fontFamily: "system-ui, sans-serif", boxSizing: "border-box",
});
const ta = (filled: boolean): React.CSSProperties => ({ ...inp(filled), resize: "vertical", minHeight: 84, lineHeight: 1.55 });

function Lbl({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
    {children}{req && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
  </label>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>{children}</div>;
}
function Field({ children }: { children: React.ReactNode }) { return <div style={{ marginBottom: 20 }}>{children}</div>; }

const SCORE_BANDS = [
  { label: "Exceptional", range: "800–850", color: GREEN },
  { label: "Very Good", range: "740–799", color: "#059669" },
  { label: "Good", range: "670–739", color: "#d97706" },
  { label: "Fair", range: "580–669", color: "#ea580c" },
  { label: "Poor", range: "300–579", color: ACCENT },
];

function CreditPanel({ d }: { d: FormData }) {
  const score = parseInt(d.estimatedScore) || 0;
  const balance = parseFloat(d.creditCardBalance) || 0;
  const min = balance * 0.02;
  const apr = 0.2499;
  const monthsMin = balance > 0 ? Math.ceil(Math.log(min / (min - balance * (apr / 12))) / Math.log(1 + apr / 12)) : 0;
  const totalInterest = monthsMin > 0 ? (min * monthsMin - balance) : 0;
  const band = score > 0 ? SCORE_BANDS.find(b => {
    const [lo, hi] = b.range.split("–").map(Number);
    return score >= lo && score <= hi;
  }) : null;

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: INK, padding: "20px 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Starting Credit Score</p>
        <p style={{ fontSize: 32, fontWeight: 800, color: band?.color || "#fff" }}>{score || "—"}</p>
        {band && <p style={{ fontSize: 12, color: band.color, marginTop: 2, fontWeight: 600 }}>{band.label}</p>}
      </div>
      <div style={{ padding: "16px 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Score ranges</p>
        {SCORE_BANDS.map(b => (
          <div key={b.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ color: b.color, fontWeight: 600 }}>{b.label}</span>
            <span style={{ color: MUTED }}>{b.range}</span>
          </div>
        ))}
        {balance > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `2px solid ${BORDER}` }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Min payment warning</p>
            <p style={{ fontSize: 13, color: INK, marginBottom: 4 }}>On a <strong>${balance.toFixed(0)}</strong> balance at 24.99% APR:</p>
            {[
              { label: "Minimum payment", val: `$${min.toFixed(0)}/mo` },
              { label: "Time to pay off", val: monthsMin > 0 ? `${monthsMin} months` : "—" },
              { label: "Interest paid", val: totalInterest > 0 ? `$${totalInterest.toFixed(0)}` : "—" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: `1px solid ${BORDER}`, color: MUTED }}>
                <span>{r.label}</span><span style={{ fontWeight: 600, color: r.label === "Interest paid" ? ACCENT : INK }}>{r.val}</span>
              </div>
            ))}
            <p style={{ fontSize: 10, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>Paying $50 extra/month would cut this to {balance > 0 ? `~${Math.ceil(balance / (min + 50))} months` : "—"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreditPage() {
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
      .then(r => { if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/credit"); return null; } return r.json(); })
      .then(json => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "credit");
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); setPhase("work"); if (m.completed_at) setIsComplete(true); }
      })
      .catch(() => {});
  }, [router]);

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "credit", data: next }) })
        .then(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); })
        .catch(() => setSaving(false));
    }, 1500);
  }, []);

  const up = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...d, [key]: e.target.value } as FormData;
    setD(next);
    autoSave(next);
  };

  const filledRequired = REQUIRED.filter(k => d[k]?.trim()).length;
  const allFilled = filledRequired === REQUIRED.length;

  const markComplete = async () => {
    if (!allFilled || isComplete) return;
    setCompleting(true);
    await fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "credit", data: d, completed: true }) });
    setIsComplete(true);
    setCompleting(false);
  };

  const step2Unlocked = !!d.estimatedScore.trim();
  const step3Unlocked = step2Unlocked && !!(d.studentLoanBalance.trim() && d.repaymentPlan.trim() && d.studentLoanPayment.trim());
  const step4Unlocked = step3Unlocked;

  const sidebar = (
    <>
      <CreditPanel d={d} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Credit resources</p>
        {[
          { href: "https://www.annualcreditreport.com", label: "AnnualCreditReport.com", sub: "Free official credit report — one from each bureau per year" },
          { href: "https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/", label: "CFPB Credit Guide", sub: "Understanding your score and how to improve it" },
        ].map(r => (
          <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER}`, textDecoration: "none" }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: `${ACCENT}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11 }}>↗</div>
            <div><p style={{ fontSize: 12, fontWeight: 600, color: ACCENT, marginBottom: 1 }}>{r.label}</p><p style={{ fontSize: 10, color: MUTED }}>{r.sub}</p></div>
          </a>
        ))}
      </div>
    </>
  );

  return (
    <ModuleShell
      moduleLabel="MODULE 07 · CREDIT"
      accent={ACCENT}
      filledRequired={filledRequired}
      totalRequired={REQUIRED.length}
      isComplete={isComplete}
      onMarkComplete={markComplete}
      completing={completing}
      saving={saving}
      saved={saved}
      phase={phase}
      hookContent={<CreditHook onReady={() => { window.scrollTo(0, 0); setPhase("work"); }} />}
      sidebarContent={sidebar}
      nextHref="/simulations/life-budget/insurance"
      nextLabel="Module 8: Insurance"
    >
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

        <SectionStep number={1} total={4} title="Your credit score" subtitle="If you've never had credit, your score is basically zero. That's normal — and fixable." isUnlocked={true} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl req>What&apos;s your estimated credit score?</Lbl>
              <input value={d.estimatedScore} onChange={up("estimatedScore")} placeholder="e.g. 650" type="number" style={inp(!!d.estimatedScore)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Check Credit Karma (free) or your bank app</p>
            </Field>
            <Field>
              <Lbl>Where do you want your score to be in 2 years?</Lbl>
              <input value={d.scoreGoal} onChange={up("scoreGoal")} placeholder="e.g. 750" type="number" style={inp(!!d.scoreGoal)} />
            </Field>
          </Row>
          <Field>
            <Lbl>What factors are hurting (or helping) your score?</Lbl>
            <input value={d.scoreFactors} onChange={up("scoreFactors")} placeholder="e.g. Short history, no missed payments, high utilization" style={inp(!!d.scoreFactors)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Payment history (35%), utilization (30%), length (15%), mix (10%), inquiries (10%)</p>
          </Field>
        </SectionStep>

        <SectionStep number={2} total={4} title="Student loans" subtitle="This is likely your biggest debt. Know the numbers — don't just make the minimum payment on autopilot." isUnlocked={step2Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl req>Total student loan balance</Lbl>
              <input value={d.studentLoanBalance} onChange={up("studentLoanBalance")} placeholder="e.g. 28000 (or 0)" type="number" style={inp(!!d.studentLoanBalance)} />
            </Field>
            <Field>
              <Lbl req>Monthly minimum payment</Lbl>
              <input value={d.studentLoanPayment} onChange={up("studentLoanPayment")} placeholder="e.g. 285" type="number" style={inp(!!d.studentLoanPayment)} />
            </Field>
          </Row>
          <Field>
            <Lbl req>Which repayment plan are you on?</Lbl>
            <select value={d.repaymentPlan} onChange={up("repaymentPlan")} style={inp(!!d.repaymentPlan)}>
              <option value="">Select…</option>
              <option>Standard (10 years, fixed payments)</option>
              <option>Graduated (lower now, higher later)</option>
              <option>Income-Driven Repayment (IDR)</option>
              <option>SAVE Plan</option>
              <option>Pay As You Earn (PAYE)</option>
              <option>No loans</option>
            </select>
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>studentaid.gov — income-driven plans can lower payments significantly</p>
          </Field>
        </SectionStep>

        <SectionStep number={3} total={4} title="Credit cards" subtitle="One card with a small limit, paid in full every month = good credit. A balance = expensive debt." isUnlocked={step3Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl>Current credit card balance (if any)</Lbl>
              <input value={d.creditCardBalance} onChange={up("creditCardBalance")} placeholder="e.g. 0 or 1200" type="number" style={inp(!!d.creditCardBalance)} />
            </Field>
            <Field>
              <Lbl>Minimum monthly payment</Lbl>
              <input value={d.minPayment} onChange={up("minPayment")} placeholder="e.g. 25" type="number" style={inp(!!d.minPayment)} />
            </Field>
          </Row>
          <Field>
            <Lbl>Your credit card goal</Lbl>
            <input value={d.creditCardGoal} onChange={up("creditCardGoal")} placeholder="e.g. Pay off in 6 months, get first rewards card, avoid any balance" style={inp(!!d.creditCardGoal)} />
          </Field>
        </SectionStep>

        <SectionStep number={4} total={4} title="Reflect" subtitle="What did the minimum payment calculator show you — and what&apos;s your plan?" isUnlocked={step4Unlocked} accent={ACCENT}>
          <Field>
            <Lbl req>What was your reaction to the minimum payment calculation?</Lbl>
            <textarea value={d.creditReflection} onChange={up("creditReflection")}
              placeholder="What did you learn from the minimum payment trap? How does your debt picture change your budget? What surprised you?"
              style={{ ...ta(!!d.creditReflection), minHeight: 110 }} />
          </Field>
          <Field>
            <Lbl>What&apos;s your plan for building credit in year 1?</Lbl>
            <textarea value={d.creditBuildPlan} onChange={up("creditBuildPlan")}
              placeholder="Get a secured card? Keep utilization under 10%? Set autopay? What's your specific move?"
              style={ta(!!d.creditBuildPlan)} />
          </Field>
          <Field>
            <Lbl>Notes</Lbl>
            <textarea value={d.notes} onChange={up("notes")} placeholder="Anything else…" style={ta(!!d.notes)} />
          </Field>
        </SectionStep>

      </div>
    </ModuleShell>
  );
}
