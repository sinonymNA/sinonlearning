"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BG = "#f8fafc", CARD = "#ffffff", BORDER = "#e2e8f0";
const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const GREEN = "#16a34a", ACCENT = "#b45309";

interface FormData {
  savingsY1: string;
  investmentsY1: string;
  vehicleValue: string;
  otherAssets: string;
  assetsY1: string;
  studentLoanBalance: string;
  carLoan: string;
  creditCardDebt: string;
  otherDebts: string;
  liabilitiesY1: string;
  netWorthY1: string;
  netWorthY5: string;
  netWorthY10: string;
  biggestDecision: string;
  doOver: string;
  reflection: string;
}

const EMPTY: FormData = {
  savingsY1: "", investmentsY1: "", vehicleValue: "", otherAssets: "", assetsY1: "",
  studentLoanBalance: "", carLoan: "", creditCardDebt: "", otherDebts: "", liabilitiesY1: "",
  netWorthY1: "", netWorthY5: "", netWorthY10: "",
  biggestDecision: "", doOver: "", reflection: "",
};

const REQUIRED: (keyof FormData)[] = ["assetsY1", "liabilitiesY1", "netWorthY1", "biggestDecision", "reflection"];

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

function NetWorthPanel({ d }: { d: FormData }) {
  const assets = parseFloat(d.assetsY1) || 0;
  const liabilities = parseFloat(d.liabilitiesY1) || 0;
  const nw = assets - liabilities;
  const nw5 = parseFloat(d.netWorthY5) || 0;
  const nw10 = parseFloat(d.netWorthY10) || 0;
  const positive = nw >= 0;

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: INK, padding: "20px 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Net Worth — Year 1</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: positive ? "#86efac" : "#fca5a5" }}>
          {assets > 0 || liabilities > 0 ? `${!positive ? "−" : ""}$${Math.abs(nw).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
        </p>
        {!positive && nw !== 0 && <p style={{ fontSize: 11, color: "#fca5a5", marginTop: 3 }}>Negative net worth is normal at 22 — it gets better</p>}
      </div>
      <div style={{ padding: "16px 20px" }}>
        {[
          { label: "Total assets", val: assets, color: GREEN },
          { label: "Total liabilities", val: liabilities, color: "#dc2626" },
          { label: "Net worth (Y1)", val: nw, color: positive ? GREEN : "#dc2626" },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${BORDER}`, color: MUTED }}>
            <span>{r.label}</span>
            <span style={{ fontWeight: 700, color: r.color, fontVariantNumeric: "tabular-nums" }}>
              {r.val !== 0 ? `${r.val < 0 ? "−" : ""}$${Math.abs(r.val).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
            </span>
          </div>
        ))}

        {(nw5 !== 0 || nw10 !== 0) && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Projections</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Year 5", val: nw5 },
                { label: "Year 10", val: nw10 },
              ].map(r => (
                <div key={r.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 10px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: r.val >= 0 ? GREEN : "#dc2626", fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>
                    {r.val !== 0 ? `$${Math.abs(r.val).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </p>
                  <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>{r.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NetWorthPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then(r => { if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/net-worth"); return null; } return r.json(); })
      .then(json => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "net-worth");
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); if (m.completed_at) setIsComplete(true); return; }
        // Pre-populate from other modules
        const updates: Partial<FormData> = {};
        const credit = json.progress?.find((p: { module_slug: string }) => p.module_slug === "credit");
        if (credit?.data?.studentLoanBalance) updates.studentLoanBalance = String(credit.data.studentLoanBalance);
        const transport = json.progress?.find((p: { module_slug: string }) => p.module_slug === "transportation");
        if (transport?.data?.totalCost) updates.carLoan = String(transport.data.totalCost).replace(/[^0-9.]/g, "");
        if (Object.keys(updates).length) setD(prev => ({ ...prev, ...updates }));
      })
      .catch(() => {});
  }, [router]);

  // Auto-calculate totals
  useEffect(() => {
    const assets = ["savingsY1", "investmentsY1", "vehicleValue", "otherAssets"]
      .reduce((s, k) => s + (parseFloat(d[k as keyof FormData]) || 0), 0);
    const liabilities = ["studentLoanBalance", "carLoan", "creditCardDebt", "otherDebts"]
      .reduce((s, k) => s + (parseFloat(d[k as keyof FormData]) || 0), 0);
    const nw = assets - liabilities;
    setD(prev => ({
      ...prev,
      assetsY1: assets > 0 ? assets.toFixed(0) : prev.assetsY1,
      liabilitiesY1: liabilities > 0 ? liabilities.toFixed(0) : prev.liabilitiesY1,
      netWorthY1: (assets > 0 || liabilities > 0) ? nw.toFixed(0) : prev.netWorthY1,
    }));
  }, [d.savingsY1, d.investmentsY1, d.vehicleValue, d.otherAssets, d.studentLoanBalance, d.carLoan, d.creditCardDebt, d.otherDebts]); // eslint-disable-line

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "net-worth", data: next }) })
        .then(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); })
        .catch(() => setSaving(false));
    }, 1500);
  }, []);

  const up = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...d, [key]: e.target.value } as FormData;
    setD(next);
    autoSave(next);
  };

  const filledRequired = REQUIRED.filter(k => d[k]?.trim()).length;
  const allFilled = filledRequired === REQUIRED.length;

  const markComplete = async () => {
    if (!allFilled || isComplete) return;
    setCompleting(true);
    await fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "net-worth", data: d, completed: true }) });
    setIsComplete(true);
    setCompleting(false);
  };

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, sans-serif", color: INK }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>← Life Budget</Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>MODULE 10 · NET WORTH</span>
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
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 4 }}>Net Worth & Future Self</h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
              The final calculation. Everything you own minus everything you owe. At 22, most people are negative — that&apos;s normal.
              What matters is the direction and the rate of change.
            </p>
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Assets (what you own)</p>

            <Row>
              <Field>
                <Lbl>Emergency / Savings Fund</Lbl>
                <input value={d.savingsY1} onChange={up("savingsY1")} placeholder="e.g. 3000" type="number" style={inp(!!d.savingsY1)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>What you&apos;ll have saved by end of Year 1</p>
              </Field>
              <Field>
                <Lbl>Retirement Investments (401k + Roth)</Lbl>
                <input value={d.investmentsY1} onChange={up("investmentsY1")} placeholder="e.g. 4200" type="number" style={inp(!!d.investmentsY1)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>12 months × your monthly investing total</p>
              </Field>
            </Row>

            <Row>
              <Field>
                <Lbl>Vehicle Value (if you own one)</Lbl>
                <input value={d.vehicleValue} onChange={up("vehicleValue")} placeholder="e.g. 18000 or 0" type="number" style={inp(!!d.vehicleValue)} />
              </Field>
              <Field>
                <Lbl>Other Assets</Lbl>
                <input value={d.otherAssets} onChange={up("otherAssets")} placeholder="e.g. 0" type="number" style={inp(!!d.otherAssets)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Electronics, valuables, etc. — be conservative</p>
              </Field>
            </Row>

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                <span style={{ color: INK }}>Total Assets</span>
                <span style={{ color: GREEN }}>${parseFloat(d.assetsY1) > 0 ? parseFloat(d.assetsY1).toLocaleString() : "0"}</span>
              </div>
            </div>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Liabilities (what you owe)</p>

            <Row>
              <Field>
                <Lbl>Student Loan Balance</Lbl>
                <input value={d.studentLoanBalance} onChange={up("studentLoanBalance")} placeholder="e.g. 32000 or 0" type="number" style={inp(!!d.studentLoanBalance)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Pre-populated from Module 7</p>
              </Field>
              <Field>
                <Lbl>Car Loan Remaining</Lbl>
                <input value={d.carLoan} onChange={up("carLoan")} placeholder="e.g. 18000 or 0" type="number" style={inp(!!d.carLoan)} />
              </Field>
            </Row>

            <Row>
              <Field>
                <Lbl>Credit Card Debt</Lbl>
                <input value={d.creditCardDebt} onChange={up("creditCardDebt")} placeholder="e.g. 0" type="number" style={inp(!!d.creditCardDebt)} />
              </Field>
              <Field>
                <Lbl>Other Debts</Lbl>
                <input value={d.otherDebts} onChange={up("otherDebts")} placeholder="e.g. 0" type="number" style={inp(!!d.otherDebts)} />
              </Field>
            </Row>

            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                <span style={{ color: INK }}>Total Liabilities</span>
                <span style={{ color: "#dc2626" }}>${parseFloat(d.liabilitiesY1) > 0 ? parseFloat(d.liabilitiesY1).toLocaleString() : "0"}</span>
              </div>
            </div>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Projections</p>

            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              Use the investing projection from Module 9 and your expected savings rate to estimate where you&apos;ll be in 5 and 10 years.
            </p>

            <Row>
              <Field>
                <Lbl>Net Worth at Year 5 (estimate)</Lbl>
                <input value={d.netWorthY5} onChange={up("netWorthY5")} placeholder="e.g. 45000" type="number" style={inp(!!d.netWorthY5)} />
              </Field>
              <Field>
                <Lbl>Net Worth at Year 10 (estimate)</Lbl>
                <input value={d.netWorthY10} onChange={up("netWorthY10")} placeholder="e.g. 180000" type="number" style={inp(!!d.netWorthY10)} />
              </Field>
            </Row>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Final reflection</p>

            <Field>
              <Lbl req>Biggest financial decision in this portfolio</Lbl>
              <textarea value={d.biggestDecision} onChange={up("biggestDecision")}
                placeholder="Which single decision in this portfolio will have the biggest long-term financial impact — your career choice, housing decision, investing early, education debt? Why?"
                style={{ ...ta(!!d.biggestDecision), minHeight: 90 }} />
            </Field>

            <Field>
              <Lbl>What would you do differently?</Lbl>
              <textarea value={d.doOver} onChange={up("doOver")}
                placeholder="If you could change one decision in this portfolio, what would it be and why?"
                style={ta(!!d.doOver)} />
            </Field>

            <Field>
              <Lbl req>Generational wealth reflection</Lbl>
              <textarea value={d.reflection} onChange={up("reflection")}
                placeholder="What does financial independence mean to you? What financial habits do you want to build from day one? What would it mean — for your family, your future — to build real wealth over time?"
                style={{ ...ta(!!d.reflection), minHeight: 120 }} />
            </Field>
          </div>

          {!isComplete && (
            <div style={{ marginTop: 24 }}>
              <button onClick={markComplete} disabled={!allFilled || completing} style={{ width: "100%", fontSize: 14, fontWeight: 700, borderRadius: 10, padding: "13px 0", border: "none", cursor: allFilled ? "pointer" : "not-allowed", background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED }}>
                {completing ? "Saving…" : allFilled ? "Complete Portfolio — Download →" : `Fill required fields (${filledRequired} / ${REQUIRED.length} done)`}
              </button>
            </div>
          )}

          {isComplete && (
            <div style={{ marginTop: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 14, padding: "28px 32px", textAlign: "center" }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: GREEN, marginBottom: 6 }}>Portfolio Complete</p>
              <p style={{ fontSize: 14, color: MUTED, marginBottom: 24, lineHeight: 1.5 }}>
                All 10 modules done. Your personal finance portfolio is ready to download.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/simulations/life-budget/portfolio" style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: "#fff", background: GREEN, borderRadius: 8, padding: "11px 28px", textDecoration: "none" }}>
                  Download Portfolio →
                </Link>
                <Link href="/simulations/life-budget" style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: MUTED, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "11px 28px", textDecoration: "none" }}>
                  Back to Hub
                </Link>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: "sticky", top: 64, display: "flex", flexDirection: "column", gap: 16 }}>
          <NetWorthPanel d={d} />
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Reference</p>
            {[
              { href: "https://www.consumerfinance.gov/", label: "CFPB Financial Tools", sub: "Official federal financial education resources" },
              { href: "https://www.nerdwallet.com/article/finance/net-worth-calculator", label: "NerdWallet Net Worth Calc", sub: "Cross-check your calculation" },
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
