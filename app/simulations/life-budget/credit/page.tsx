"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  notes: string;
}

const EMPTY: FormData = {
  estimatedScore: "", scoreFactors: "", studentLoanBalance: "", repaymentPlan: "",
  studentLoanPayment: "", creditCardBalance: "", minPayment: "", monthsToPayoff: "",
  creditCardGoal: "", scoreGoal: "", creditReflection: "", notes: "",
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
function Divider() { return <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "28px 0" }} />; }

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
  const min = balance * 0.02; // 2% minimum payment
  const apr = 0.2499; // 24.99% typical
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
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

export default function CreditPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
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
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); if (m.completed_at) setIsComplete(true); }
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

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, sans-serif", color: INK }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>← Life Budget</Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>MODULE 07 · CREDIT & DEBT</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {saving && <span style={{ fontSize: 11, color: FAINT }}>Saving…</span>}
          {saved && !saving && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>✓ Saved</span>}
          {isComplete
            ? <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px" }}>✓ Complete</span>
            : <button onClick={markComplete} disabled={!allFilled || completing} style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "5px 16px", border: "none", cursor: allFilled ? "pointer" : "not-allowed", background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED }}>
                {completing ? "Saving…" : `Complete (${filledRequired}/${REQUIRED.length})`}
              </button>}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 24px 80px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 4 }}>Credit & Debt</h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>Your credit score follows you everywhere — it affects your rent, your car loan, and your mortgage. Understand where you&apos;ll start, what you owe, and how to build from zero.</p>
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Credit score</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              Most students starting out have no credit history — which gives you a score around 580–670, or sometimes none at all.
              Use the annualcreditreport.com tool or the CFPB guide to estimate where you&apos;ll likely land.
            </p>

            <Row>
              <Field>
                <Lbl req>Estimated Starting Credit Score</Lbl>
                <input value={d.estimatedScore} onChange={up("estimatedScore")} placeholder="e.g. 650" type="number" style={inp(!!d.estimatedScore)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>No credit = ~580; authorized user on parent card = 650–700</p>
              </Field>
              <Field>
                <Lbl>Target Score at Year 2</Lbl>
                <input value={d.scoreGoal} onChange={up("scoreGoal")} placeholder="e.g. 720" type="number" style={inp(!!d.scoreGoal)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>720+ unlocks the best loan rates</p>
              </Field>
            </Row>

            <Field>
              <Lbl>What factors will most affect your score early on?</Lbl>
              <input value={d.scoreFactors} onChange={up("scoreFactors")} placeholder="e.g. Payment history, thin file, no missed payments" style={inp(!!d.scoreFactors)} />
            </Field>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Student loans</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              Use the federal loan simulator at studentaid.gov to find your actual loan balance and compare repayment plans.
            </p>

            <Row>
              <Field>
                <Lbl req>Total Student Loan Balance</Lbl>
                <input value={d.studentLoanBalance} onChange={up("studentLoanBalance")} placeholder="e.g. 32000 or 0" type="number" style={inp(!!d.studentLoanBalance)} />
              </Field>
              <Field>
                <Lbl req>Repayment Plan</Lbl>
                <select value={d.repaymentPlan} onChange={up("repaymentPlan")} style={inp(!!d.repaymentPlan)}>
                  <option value="">Select…</option>
                  <option>No loans</option>
                  <option>Standard (10 years)</option>
                  <option>Income-Driven (IBR / SAVE)</option>
                  <option>Extended (25 years)</option>
                  <option>Graduated</option>
                  <option>PSLF (Public Service)</option>
                </select>
              </Field>
            </Row>

            <Field>
              <Lbl req>Monthly Student Loan Payment</Lbl>
              <input value={d.studentLoanPayment} onChange={up("studentLoanPayment")} placeholder="e.g. 320 or 0" type="number" style={inp(!!d.studentLoanPayment)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>From the loan simulator — enters your budget in Module 5</p>
            </Field>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Credit cards</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              A credit card used responsibly (pay in full every month, never carry a balance) is one of the fastest ways to build credit.
              The panel on the right shows what happens if you only pay the minimum.
            </p>

            <Row>
              <Field>
                <Lbl>Hypothetical Credit Card Balance (for modeling)</Lbl>
                <input value={d.creditCardBalance} onChange={up("creditCardBalance")} placeholder="e.g. 3000" type="number" style={inp(!!d.creditCardBalance)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Enter $3,000 to see how minimum payments work</p>
              </Field>
              <Field>
                <Lbl>First Credit Card Goal</Lbl>
                <input value={d.creditCardGoal} onChange={up("creditCardGoal")} placeholder="e.g. Discover It Secured, $500 limit" style={inp(!!d.creditCardGoal)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Secured cards are easiest to get with no/thin credit</p>
              </Field>
            </Row>

            <Divider />

            <Field>
              <Lbl req>Reflection</Lbl>
              <textarea value={d.creditReflection} onChange={up("creditReflection")}
                placeholder="What surprised you about minimum payments? How do you plan to build credit responsibly? How does your student loan payment affect your monthly budget from Module 5?"
                style={{ ...ta(!!d.creditReflection), minHeight: 110 }} />
            </Field>
            <Field>
              <Lbl>Notes</Lbl>
              <textarea value={d.notes} onChange={up("notes")} placeholder="Other debt, notes…" style={ta(!!d.notes)} />
            </Field>
          </div>

          {!isComplete && (
            <div style={{ marginTop: 24 }}>
              <button onClick={markComplete} disabled={!allFilled || completing} style={{ width: "100%", fontSize: 14, fontWeight: 700, borderRadius: 10, padding: "13px 0", border: "none", cursor: allFilled ? "pointer" : "not-allowed", background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED }}>
                {completing ? "Saving…" : allFilled ? "Mark Module 7 Complete →" : `Fill required fields (${filledRequired} / ${REQUIRED.length} done)`}
              </button>
            </div>
          )}
          {isComplete && (
            <div style={{ marginTop: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 6 }}>✓ Module 7 Complete</p>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Credit data saved. Next: Module 8 — Insurance.</p>
              <Link href="/simulations/life-budget/insurance" style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: "#fff", background: GREEN, borderRadius: 8, padding: "9px 22px", textDecoration: "none" }}>Module 8: Insurance →</Link>
            </div>
          )}
        </div>

        <div style={{ position: "sticky", top: 64, display: "flex", flexDirection: "column", gap: 16 }}>
          <CreditPanel d={d} />
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Research</p>
            {[
              { href: "https://www.annualcreditreport.com", label: "Annual Credit Report", sub: "Free official report — see your real credit history" },
              { href: "https://studentaid.gov/loan-simulator/", label: "Federal Loan Simulator", sub: "Model every repayment plan on your actual balance" },
              { href: "https://www.consumerfinance.gov/consumer-tools/credit-reports/", label: "CFPB Credit Guide", sub: "What builds and tanks your score, explained simply" },
            ].map(r => (
              <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER}`, textDecoration: "none" }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: `${ACCENT}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11 }}>↗</div>
                <div><p style={{ fontSize: 12, fontWeight: 600, color: ACCENT, marginBottom: 1 }}>{r.label}</p><p style={{ fontSize: 10, color: MUTED }}>{r.sub}</p></div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
