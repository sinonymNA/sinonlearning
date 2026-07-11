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
const ACCENT = "#059669";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  grossMonthly: string;
  federalTax: string;
  stateTax: string;
  fica: string;
  healthInsurance: string;
  retirement401k: string;
  otherDeductions: string;
  netMonthly: string;
  gapAmount: string;
  paycheckReflection: string;
  notes: string;
}

const EMPTY: FormData = {
  grossMonthly: "",
  federalTax: "",
  stateTax: "",
  fica: "",
  healthInsurance: "",
  retirement401k: "",
  otherDeductions: "",
  netMonthly: "",
  gapAmount: "",
  paycheckReflection: "",
  notes: "",
};

const REQUIRED: (keyof FormData)[] = [
  "grossMonthly",
  "federalTax",
  "stateTax",
  "fica",
  "netMonthly",
  "paycheckReflection",
];

// ── Shared styles ─────────────────────────────────────────────────────────────

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

// ── Live Pay Stub ─────────────────────────────────────────────────────────────

function PayStub({ d }: { d: FormData }) {
  const gross = parseFloat(d.grossMonthly) || 0;
  const fed = parseFloat(d.federalTax) || 0;
  const state = parseFloat(d.stateTax) || 0;
  const fica = parseFloat(d.fica) || (gross * 0.0765);
  const health = parseFloat(d.healthInsurance) || 0;
  const ret = parseFloat(d.retirement401k) || 0;
  const other = parseFloat(d.otherDeductions) || 0;
  const totalDed = fed + state + fica + health + ret + other;
  const net = gross - totalDed;
  const pct = gross > 0 ? Math.round((totalDed / gross) * 100) : 0;

  const $ = (n: number) => n > 0 ? `-$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
  const $pos = (n: number) => n > 0 ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

  const DedRow = ({ label, val, color }: { label: string; val: number; color: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{$(val)}</span>
    </div>
  );

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: INK, padding: "20px 24px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>Monthly Pay Statement</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          {net > 0 ? `$${net.toFixed(2)}` : "—"}
        </p>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>net take-home</p>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `2px solid ${BORDER}`, marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>EARNINGS</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: GREEN, fontVariantNumeric: "tabular-nums" }}>{$pos(gross)}</span>
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", margin: "12px 0 6px" }}>DEDUCTIONS</p>

        <DedRow label="Federal income tax" val={fed} color="#dc2626" />
        <DedRow label="State income tax" val={state} color="#ea580c" />
        <DedRow label="FICA (SS + Medicare)" val={fica} color="#d97706" />
        {health > 0 && <DedRow label="Health insurance" val={health} color="#7c3aed" />}
        {ret > 0 && <DedRow label="401(k)" val={ret} color="#0891b2" />}
        {other > 0 && <DedRow label="Other" val={other} color={MUTED} />}

        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `2px solid ${BORDER}`, marginTop: 4, fontSize: 12, fontWeight: 700 }}>
          <span style={{ color: INK }}>TOTAL DEDUCTIONS</span>
          <span style={{ color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>{$(totalDed)}</span>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
          {[
            { label: "Gross", val: $pos(gross), color: GREEN },
            { label: `${pct}% gone`, val: $(totalDed), color: "#dc2626" },
            { label: "Take-home", val: $pos(net), color: ACCENT },
          ].map(item => (
            <div key={item.label} style={{ background: BG, borderRadius: 8, padding: "10px 10px", textAlign: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: item.color, fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>{item.val}</p>
              <p style={{ fontSize: 9, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</p>
            </div>
          ))}
        </div>

        {gross > 0 && net > 0 && (
          <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>
              Gap: ${(gross - net).toFixed(0)}/month you never see
            </p>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>That&apos;s ${((gross - net) * 12).toFixed(0)}/year in taxes + deductions</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tax bracket reference ─────────────────────────────────────────────────────

const BRACKETS_2025 = [
  { rate: "10%", single: "$0 – $11,925", married: "$0 – $23,850" },
  { rate: "12%", single: "$11,926 – $48,475", married: "$23,851 – $96,950" },
  { rate: "22%", single: "$48,476 – $103,350", married: "$96,951 – $206,700" },
  { rate: "24%", single: "$103,351 – $197,300", married: "$206,701 – $394,600" },
  { rate: "32%", single: "$197,301 – $250,525", married: "$394,601 – $501,050" },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function PaycheckPage() {
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
        if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/paycheck"); return null; }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "paycheck");
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); }
        else {
          // Pre-populate gross from career
          const career = json.progress?.find((p: { module_slug: string }) => p.module_slug === "career");
          if (career?.data?.grossMonthly) setD((prev) => ({ ...prev, grossMonthly: String(career.data.grossMonthly) }));
        }
        if (m?.completed_at) setIsComplete(true);
      })
      .catch(() => {});
  }, [router]);

  // Auto-calculate FICA and net
  useEffect(() => {
    const gross = parseFloat(d.grossMonthly) || 0;
    const ficaCalc = (gross * 0.0765).toFixed(0);
    const updates: Partial<FormData> = {};
    if (gross > 0 && !d.fica) updates.fica = ficaCalc;
    setD((prev) => {
      const next = { ...prev, ...updates };
      const fed = parseFloat(next.federalTax) || 0;
      const state = parseFloat(next.stateTax) || 0;
      const fica = parseFloat(next.fica) || (gross * 0.0765);
      const health = parseFloat(next.healthInsurance) || 0;
      const ret = parseFloat(next.retirement401k) || 0;
      const other = parseFloat(next.otherDeductions) || 0;
      const totalDed = fed + state + fica + health + ret + other;
      const net = gross - totalDed;
      const gap = gross - net;
      return { ...next, netMonthly: net > 0 ? net.toFixed(0) : "", gapAmount: gap > 0 ? gap.toFixed(0) : "" };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.grossMonthly, d.federalTax, d.stateTax, d.fica, d.healthInsurance, d.retirement401k, d.otherDeductions]);

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleSlug: "paycheck", data: next }),
      })
        .then(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); })
        .catch(() => setSaving(false));
    }, 1500);
  }, []);

  const up = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      body: JSON.stringify({ moduleSlug: "paycheck", data: d, completed: true }),
    });
    setIsComplete(true);
    setCompleting(false);
  };

  const gross = parseFloat(d.grossMonthly) || 0;

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif", color: INK }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: CARD, borderBottom: `1px solid ${BORDER}`,
        padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>← Life Budget</Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>MODULE 02 · FIRST PAYCHECK</span>
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
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 4 }}>First Paycheck</h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
              Gross isn't what you get. Use a paycheck calculator to find every deduction, then fill them in here.
              The gap between what you earn and what you take home is usually $800–$1,400/month.
            </p>
          </div>

          {/* Form card */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

            {/* Group 1: Gross */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Your gross pay</p>

            <Field>
              <Lbl req>Gross Monthly Pay</Lbl>
              <input value={d.grossMonthly} onChange={up("grossMonthly")} placeholder="e.g. 5167"
                type="number" style={inp(!!d.grossMonthly)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>
                {gross > 0 ? `$${(gross * 12).toLocaleString()}/year before taxes` : "From your career module — your annual salary ÷ 12"}
              </p>
            </Field>

            <Divider />

            {/* Group 2: Taxes */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Taxes</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              Use the SmartAsset paycheck calculator or the IRS withholding estimator to find your real monthly tax amounts.
            </p>

            <Row>
              <Field>
                <Lbl req>Federal Income Tax</Lbl>
                <input value={d.federalTax} onChange={up("federalTax")} placeholder="e.g. 620" type="number" style={inp(!!d.federalTax)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>12–22% bracket for most starting salaries</p>
              </Field>
              <Field>
                <Lbl req>State Income Tax</Lbl>
                <input value={d.stateTax} onChange={up("stateTax")} placeholder="e.g. 155" type="number" style={inp(!!d.stateTax)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>0% in TX, FL, TN — varies by state</p>
              </Field>
            </Row>

            <Field>
              <Lbl req>FICA (Social Security + Medicare)</Lbl>
              <input value={d.fica} onChange={up("fica")}
                placeholder={gross > 0 ? `${(gross * 0.0765).toFixed(0)} (auto-calculated at 7.65%)` : "e.g. 395"}
                type="number" style={inp(!!d.fica)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>
                Always 7.65% of gross — {gross > 0 ? `your estimate: $${(gross * 0.0765).toFixed(0)}/mo` : "6.2% Social Security + 1.45% Medicare"}
              </p>
            </Field>

            {/* 2025 bracket reference */}
            <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 18px", marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: INK, marginBottom: 10 }}>2025 Federal Tax Brackets (reference)</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {["Rate", "Single", "Married Filing Jointly"].map(h => (
                        <th key={h} style={{ padding: "4px 8px", textAlign: "left", color: MUTED, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BRACKETS_2025.map((b) => (
                      <tr key={b.rate} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: "5px 8px", fontWeight: 700, color: ACCENT }}>{b.rate}</td>
                        <td style={{ padding: "5px 8px", color: MUTED }}>{b.single}</td>
                        <td style={{ padding: "5px 8px", color: MUTED }}>{b.married}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 10, color: FAINT, marginTop: 8 }}>These are marginal rates — you pay each rate only on the income in that bracket.</p>
            </div>

            <Divider />

            {/* Group 3: Benefits deductions */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Benefits deductions (optional)</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              These come out before taxes in most cases, reducing your taxable income. Leave blank if you don&apos;t know yet.
            </p>

            <Row>
              <Field>
                <Lbl>Health Insurance Premium</Lbl>
                <input value={d.healthInsurance} onChange={up("healthInsurance")} placeholder="e.g. 180" type="number" style={inp(!!d.healthInsurance)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Your share of employer plan — varies widely</p>
              </Field>
              <Field>
                <Lbl>401(k) Contribution</Lbl>
                <input value={d.retirement401k} onChange={up("retirement401k")} placeholder="e.g. 260 (5%)" type="number" style={inp(!!d.retirement401k)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Typical: 3–6% of gross; pre-tax</p>
              </Field>
            </Row>

            <Field>
              <Lbl>Other Deductions</Lbl>
              <input value={d.otherDeductions} onChange={up("otherDeductions")} placeholder="Dental, vision, FSA, life insurance…" type="number" style={inp(!!d.otherDeductions)} />
            </Field>

            <Divider />

            {/* Group 4: Net + reflection */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Your take-home</p>

            <Row>
              <Field>
                <Lbl req>Net Monthly Take-Home</Lbl>
                <input value={d.netMonthly} onChange={up("netMonthly")}
                  style={{ ...inp(!!d.netMonthly), background: "#f8fafc", color: ACCENT, fontWeight: 700 }}
                  placeholder="auto-calculated above" readOnly />
              </Field>
              <Field>
                <Lbl>Monthly Gap (gross − net)</Lbl>
                <input value={d.gapAmount} readOnly
                  style={{ ...inp(!!d.gapAmount), background: "#fef2f2", color: "#dc2626", fontWeight: 700 }}
                  placeholder="auto-calculated" />
              </Field>
            </Row>

            <Field>
              <Lbl req>Reflection</Lbl>
              <textarea value={d.paycheckReflection} onChange={up("paycheckReflection")}
                placeholder="What surprised you about the difference between gross and net? How does this change what you thought you'd have to spend? What does this number mean for your budget?"
                style={{ ...ta(!!d.paycheckReflection), minHeight: 110 }} />
            </Field>

            <Field>
              <Lbl>Notes</Lbl>
              <textarea value={d.notes} onChange={up("notes")} placeholder="Anything else…" style={ta(!!d.notes)} />
            </Field>

          </div>

          {/* Complete */}
          {!isComplete && (
            <div style={{ marginTop: 24 }}>
              <button onClick={markComplete} disabled={!allFilled || completing}
                style={{
                  width: "100%", fontSize: 14, fontWeight: 700, borderRadius: 10, padding: "13px 0", border: "none",
                  cursor: allFilled ? "pointer" : "not-allowed",
                  background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED,
                }}>
                {completing ? "Saving…" : allFilled ? "Mark Module 2 Complete →" : `Fill required fields (${filledRequired} / ${REQUIRED.length} done)`}
              </button>
            </div>
          )}

          {isComplete && (
            <div style={{ marginTop: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 6 }}>✓ Module 2 Complete</p>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Your paycheck data is saved. Head to Module 3: Housing.</p>
              <Link href="/simulations/life-budget/housing"
                style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: "#fff", background: GREEN, borderRadius: 8, padding: "9px 22px", textDecoration: "none" }}>
                Module 3: Housing →
              </Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 64 }}>

          {/* Live pay stub */}
          <PayStub d={d} />

          {/* Research links */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Calculators</p>
            <ResearchLink href="https://smartasset.com/taxes/paycheck-calculator" label="SmartAsset Paycheck Calc" sub="Enter your salary and state to see exact take-home amounts" />
            <ResearchLink href="https://apps.irs.gov/app/withholdingcalculator/" label="IRS Withholding Estimator" sub="Official IRS tool — very accurate for federal taxes" />
            <ResearchLink href="https://taxfoundation.org/research/all/state/state-income-tax-rates/" label="State Tax Rates by State" sub="Find your state's income tax rate and brackets" />
          </div>

        </div>
      </div>
    </main>
  );
}
