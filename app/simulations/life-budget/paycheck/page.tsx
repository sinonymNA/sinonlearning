"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleShell from "@/components/life-budget/ModuleShell";
import SectionStep from "@/components/life-budget/SectionStep";
import PaycheckHook from "@/components/life-budget/hooks/PaycheckHook";

const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "#e2e8f0";
const INK    = "#0f172a";
const MUTED  = "#64748b";
const FAINT  = "#94a3b8";
const GREEN  = "#16a34a";
const ACCENT = "#059669";

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
  cutFirst: string;
  notes: string;
}

const EMPTY: FormData = {
  grossMonthly: "", federalTax: "", stateTax: "", fica: "",
  healthInsurance: "", retirement401k: "", otherDeductions: "",
  netMonthly: "", gapAmount: "",
  paycheckReflection: "", cutFirst: "", notes: "",
};

const REQUIRED: (keyof FormData)[] = [
  "grossMonthly", "federalTax", "stateTax", "fica", "netMonthly", "paycheckReflection",
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

  const $neg = (n: number) => n > 0 ? `-$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
  const $pos = (n: number) => n > 0 ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

  const DedRow = ({ label, val, color }: { label: string; val: number; color: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 13 }}>
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{$neg(val)}</span>
    </div>
  );

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: INK, padding: "20px 24px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>Monthly Pay Statement</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{net > 0 ? `$${net.toFixed(2)}` : "—"}</p>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>net take-home</p>
      </div>
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
          <span style={{ color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>{$neg(totalDed)}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
          {[
            { label: "Gross", val: $pos(gross), color: GREEN },
            { label: `${pct}% gone`, val: $neg(totalDed), color: "#dc2626" },
            { label: "Take-home", val: $pos(net), color: ACCENT },
          ].map(item => (
            <div key={item.label} style={{ background: BG, borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: item.color, fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>{item.val}</p>
              <p style={{ fontSize: 9, color: MUTED, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</p>
            </div>
          ))}
        </div>
        {gross > 0 && net > 0 && (
          <>
            <div style={{ marginTop: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>Gap: ${(gross - net).toFixed(0)}/month you never see</p>
              <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>That&apos;s ${((gross - net) * 12).toFixed(0)}/year in taxes + deductions</p>
            </div>
            {(health > 0 || ret > 0) && (
              <div style={{ marginTop: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px" }}>
                <p style={{ fontSize: 11, color: GREEN, lineHeight: 1.5 }}>
                  The health + 401(k) rows are actually working for you — that&apos;s your future self getting paid.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const BRACKETS_2025 = [
  { rate: "10%", single: "$0 – $11,925", married: "$0 – $23,850" },
  { rate: "12%", single: "$11,926 – $48,475", married: "$23,851 – $96,950" },
  { rate: "22%", single: "$48,476 – $103,350", married: "$96,951 – $206,700" },
  { rate: "24%", single: "$103,351 – $197,300", married: "$206,701 – $394,600" },
  { rate: "32%", single: "$197,301 – $250,525", married: "$394,601 – $501,050" },
];

export default function PaycheckPage() {
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
        if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/paycheck"); return null; }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "paycheck");
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); setPhase("work"); }
        else {
          const career = json.progress?.find((p: { module_slug: string }) => p.module_slug === "career");
          if (career?.data?.grossMonthly) setD((prev) => ({ ...prev, grossMonthly: String(career.data.grossMonthly) }));
        }
        if (m?.completed_at) setIsComplete(true);
      })
      .catch(() => {});
  }, [router]);

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
        method: "POST", headers: { "Content-Type": "application/json" },
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleSlug: "paycheck", data: d, completed: true }),
    });
    setIsComplete(true);
    setCompleting(false);
  };

  const gross = parseFloat(d.grossMonthly) || 0;

  const step2Unlocked = !!d.grossMonthly.trim();
  const step3Unlocked = step2Unlocked && !!(d.federalTax.trim() && d.stateTax.trim() && d.fica.trim());
  const step4Unlocked = step3Unlocked;

  const sidebar = (
    <>
      <PayStub d={d} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Calculators</p>
        <ResearchLink href="https://smartasset.com/taxes/paycheck-calculator" label="SmartAsset Paycheck Calc" sub="Enter your salary and state to see exact take-home amounts" />
        <ResearchLink href="https://apps.irs.gov/app/withholdingcalculator/" label="IRS Withholding Estimator" sub="Official IRS tool — very accurate for federal taxes" />
        <ResearchLink href="https://taxfoundation.org/research/all/state/state-income-tax-rates/" label="State Tax Rates by State" sub="Find your state's income tax rate and brackets" />
      </div>
    </>
  );

  return (
    <ModuleShell
      moduleLabel="MODULE 02 · FIRST PAYCHECK"
      accent={ACCENT}
      filledRequired={filledRequired}
      totalRequired={REQUIRED.length}
      isComplete={isComplete}
      onMarkComplete={markComplete}
      completing={completing}
      saving={saving}
      saved={saved}
      phase={phase}
      hookContent={<PaycheckHook onReady={() => { window.scrollTo(0, 0); setPhase("work"); }} />}
      sidebarContent={sidebar}
      nextHref="/simulations/life-budget/housing"
      nextLabel="Module 3: Housing"
      completionHighlights={[
        { label: "Gross pay", value: d.grossMonthly ? `$${Math.round(parseFloat(d.grossMonthly)).toLocaleString()}/mo` : "" },
        { label: "Net take-home", value: d.netMonthly ? `$${Math.round(parseFloat(d.netMonthly)).toLocaleString()}/mo` : "", sub: d.gapAmount ? `$${Math.round(parseFloat(d.gapAmount)).toLocaleString()}/mo in deductions` : "" },
      ]}
    >
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

        <SectionStep number={1} total={4} title="Your gross pay" subtitle="This is the number before anything comes out." isUnlocked={true} accent={ACCENT}>
          <Field>
            <Lbl req>What&apos;s your monthly gross pay?</Lbl>
            <input value={d.grossMonthly} onChange={up("grossMonthly")} placeholder="e.g. 5167" type="number" style={inp(!!d.grossMonthly)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>
              {gross > 0 ? `$${(gross * 12).toLocaleString()}/year before taxes` : "From your career module — annual salary ÷ 12"}
            </p>
          </Field>
        </SectionStep>

        <SectionStep number={2} total={4} title="Taxes" subtitle="Use a paycheck calculator to find the actual amounts — don't guess." isUnlocked={step2Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl req>Federal income tax</Lbl>
              <input value={d.federalTax} onChange={up("federalTax")} placeholder="e.g. 620" type="number" style={inp(!!d.federalTax)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>12–22% bracket for most starting salaries</p>
            </Field>
            <Field>
              <Lbl req>State income tax</Lbl>
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
          <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 18px" }}>
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
            <p style={{ fontSize: 10, color: FAINT, marginTop: 8 }}>These are marginal rates — you pay each rate only on income in that bracket.</p>
          </div>
        </SectionStep>

        <SectionStep number={3} total={4} title="Benefits deductions" subtitle="These come out pre-tax in most cases — they reduce what the IRS can tax." isUnlocked={step3Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl>Health insurance premium</Lbl>
              <input value={d.healthInsurance} onChange={up("healthInsurance")} placeholder="e.g. 180" type="number" style={inp(!!d.healthInsurance)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Your share of employer plan — varies widely</p>
            </Field>
            <Field>
              <Lbl>401(k) contribution</Lbl>
              <input value={d.retirement401k} onChange={up("retirement401k")} placeholder="e.g. 260 (5%)" type="number" style={inp(!!d.retirement401k)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Typical: 3–6% of gross; pre-tax</p>
            </Field>
          </Row>
          <Field>
            <Lbl>Other deductions</Lbl>
            <input value={d.otherDeductions} onChange={up("otherDeductions")} placeholder="Dental, vision, FSA, life insurance…" type="number" style={inp(!!d.otherDeductions)} />
          </Field>
        </SectionStep>

        <SectionStep number={4} total={4} title="Your take-home reality" subtitle="The number that actually hits your account — and what you do with it." isUnlocked={step4Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl req>Net monthly take-home</Lbl>
              <input value={d.netMonthly} onChange={up("netMonthly")}
                style={{ ...inp(!!d.netMonthly), background: "#f8fafc", color: ACCENT, fontWeight: 700 }}
                placeholder="auto-calculated above" readOnly />
            </Field>
            <Field>
              <Lbl>Monthly gap (gross − net)</Lbl>
              <input value={d.gapAmount} readOnly
                style={{ ...inp(!!d.gapAmount), background: "#fef2f2", color: "#dc2626", fontWeight: 700 }}
                placeholder="auto-calculated" />
            </Field>
          </Row>
          <Field>
            <Lbl req>What surprised you most about your take-home?</Lbl>
            <textarea value={d.paycheckReflection} onChange={up("paycheckReflection")}
              placeholder="What surprised you about the difference between gross and net? How does this change what you thought you'd have to spend?"
              style={{ ...ta(!!d.paycheckReflection), minHeight: 110 }} />
          </Field>
          <Field>
            <Lbl>If your paycheck was $200/month less, what&apos;s the first thing you&apos;d cut?</Lbl>
            <textarea value={d.cutFirst} onChange={up("cutFirst")}
              placeholder="Think through your budget — what's negotiable first?"
              style={ta(!!d.cutFirst)} />
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
