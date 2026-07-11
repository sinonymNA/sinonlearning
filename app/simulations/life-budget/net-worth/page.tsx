"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleShell from "@/components/life-budget/ModuleShell";
import SectionStep from "@/components/life-budget/SectionStep";
import NetWorthHook from "@/components/life-budget/hooks/NetWorthHook";

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
  reflection: string;
  letterTo35: string;
  doOver: string;
}

const EMPTY: FormData = {
  savingsY1: "", investmentsY1: "", vehicleValue: "", otherAssets: "", assetsY1: "",
  studentLoanBalance: "", carLoan: "", creditCardDebt: "", otherDebts: "", liabilitiesY1: "",
  netWorthY1: "", netWorthY5: "", netWorthY10: "",
  biggestDecision: "", reflection: "", letterTo35: "", doOver: "",
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
  const [phase, setPhase] = useState<"hook" | "work">("hook");
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
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); setPhase("work"); if (m.completed_at) setIsComplete(true); return; }
        const updates: Partial<FormData> = {};
        const credit = json.progress?.find((p: { module_slug: string }) => p.module_slug === "credit");
        if (credit?.data?.studentLoanBalance) updates.studentLoanBalance = String(credit.data.studentLoanBalance);
        const transport = json.progress?.find((p: { module_slug: string }) => p.module_slug === "transportation");
        if (transport?.data?.totalCost) updates.carLoan = String(transport.data.totalCost).replace(/[^0-9.]/g, "");
        if (Object.keys(updates).length) setD(prev => ({ ...prev, ...updates }));
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const assetKeys: (keyof FormData)[] = ["savingsY1", "investmentsY1", "vehicleValue", "otherAssets"];
    const liabKeys: (keyof FormData)[] = ["studentLoanBalance", "carLoan", "creditCardDebt", "otherDebts"];
    const anyAsset = assetKeys.some(k => d[k] !== "");
    const anyLiab = liabKeys.some(k => d[k] !== "");
    const assets = assetKeys.reduce((s, k) => s + (parseFloat(d[k]) || 0), 0);
    const liabilities = liabKeys.reduce((s, k) => s + (parseFloat(d[k]) || 0), 0);
    const nw = assets - liabilities;
    setD(prev => ({
      ...prev,
      assetsY1: anyAsset ? assets.toFixed(0) : prev.assetsY1,
      liabilitiesY1: anyLiab ? liabilities.toFixed(0) : prev.liabilitiesY1,
      netWorthY1: (anyAsset || anyLiab) ? nw.toFixed(0) : prev.netWorthY1,
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

  const hasAnyAsset = !!(d.savingsY1 || d.investmentsY1 || d.vehicleValue || d.otherAssets);
  const hasAnyLiab = !!(d.studentLoanBalance || d.carLoan || d.creditCardDebt || d.otherDebts);
  const step2Unlocked = hasAnyAsset;
  const step3Unlocked = step2Unlocked && hasAnyLiab;
  const step4Unlocked = step3Unlocked;

  const sidebar = (
    <>
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
    </>
  );

  return (
    <ModuleShell
      moduleLabel="MODULE 10 · NET WORTH"
      accent={ACCENT}
      filledRequired={filledRequired}
      totalRequired={REQUIRED.length}
      isComplete={isComplete}
      onMarkComplete={markComplete}
      completing={completing}
      saving={saving}
      saved={saved}
      phase={phase}
      hookContent={<NetWorthHook onReady={() => { window.scrollTo(0, 0); setPhase("work"); }} />}
      sidebarContent={sidebar}
      nextHref="/simulations/life-budget/portfolio"
      nextLabel="View Your Portfolio"
    >
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

        <SectionStep number={1} total={4} title="What you own" subtitle="Be conservative. Count things at what you could realistically sell them for today." isUnlocked={true} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl>Emergency / savings fund</Lbl>
              <input value={d.savingsY1} onChange={up("savingsY1")} placeholder="e.g. 3000" type="number" style={inp(!!d.savingsY1)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>What you&apos;ll have saved by end of Year 1</p>
            </Field>
            <Field>
              <Lbl>Retirement investments (401k + Roth)</Lbl>
              <input value={d.investmentsY1} onChange={up("investmentsY1")} placeholder="e.g. 4200" type="number" style={inp(!!d.investmentsY1)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>12 months × your monthly investing total</p>
            </Field>
          </Row>
          <Row>
            <Field>
              <Lbl>Vehicle value (if you own one)</Lbl>
              <input value={d.vehicleValue} onChange={up("vehicleValue")} placeholder="e.g. 18000 or 0" type="number" style={inp(!!d.vehicleValue)} />
            </Field>
            <Field>
              <Lbl>Other assets</Lbl>
              <input value={d.otherAssets} onChange={up("otherAssets")} placeholder="e.g. 0" type="number" style={inp(!!d.otherAssets)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Electronics, valuables — be conservative</p>
            </Field>
          </Row>
          {d.assetsY1 && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                <span style={{ color: INK }}>Total assets</span>
                <span style={{ color: GREEN }}>${(parseFloat(d.assetsY1) || 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </SectionStep>

        <SectionStep number={2} total={4} title="What you owe" subtitle="Student loans are pre-filled from Module 7. List everything." isUnlocked={step2Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl>Student loan balance</Lbl>
              <input value={d.studentLoanBalance} onChange={up("studentLoanBalance")} placeholder="e.g. 32000 or 0" type="number" style={inp(!!d.studentLoanBalance)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Pre-filled from Module 7</p>
            </Field>
            <Field>
              <Lbl>Car loan remaining</Lbl>
              <input value={d.carLoan} onChange={up("carLoan")} placeholder="e.g. 18000 or 0" type="number" style={inp(!!d.carLoan)} />
            </Field>
          </Row>
          <Row>
            <Field>
              <Lbl>Credit card debt</Lbl>
              <input value={d.creditCardDebt} onChange={up("creditCardDebt")} placeholder="e.g. 0" type="number" style={inp(!!d.creditCardDebt)} />
            </Field>
            <Field>
              <Lbl>Other debts</Lbl>
              <input value={d.otherDebts} onChange={up("otherDebts")} placeholder="e.g. 0" type="number" style={inp(!!d.otherDebts)} />
            </Field>
          </Row>
          {d.liabilitiesY1 && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                <span style={{ color: INK }}>Total liabilities</span>
                <span style={{ color: "#dc2626" }}>${(parseFloat(d.liabilitiesY1) || 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </SectionStep>

        <SectionStep number={3} total={4} title="Your net worth + projections" subtitle="Assets minus liabilities. Negative at 22 is normal — direction matters more than starting point." isUnlocked={step3Unlocked} accent={ACCENT}>
          {d.netWorthY1 && (
            <div style={{ padding: "20px 24px", background: parseFloat(d.netWorthY1) >= 0 ? "#f0fdf4" : "#fef2f2", border: `1px solid ${parseFloat(d.netWorthY1) >= 0 ? "#bbf7d0" : "#fecaca"}`, borderRadius: 10, marginBottom: 20, textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Your net worth today</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: parseFloat(d.netWorthY1) >= 0 ? GREEN : "#dc2626" }}>
                {parseFloat(d.netWorthY1) < 0 ? "−" : ""}${Math.abs(parseFloat(d.netWorthY1) || 0).toLocaleString()}
              </p>
              {parseFloat(d.netWorthY1) < 0 && <p style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Average 22-year-old is at −$26,000. You&apos;re not behind.</p>}
            </div>
          )}
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
            Use your Module 9 investing projection and expected savings rate to estimate where you&apos;ll be in 5 and 10 years.
          </p>
          <Row>
            <Field>
              <Lbl>Net worth at Year 5 (estimate)</Lbl>
              <input value={d.netWorthY5} onChange={up("netWorthY5")} placeholder="e.g. 45000" type="number" style={inp(!!d.netWorthY5)} />
            </Field>
            <Field>
              <Lbl>Net worth at Year 10 (estimate)</Lbl>
              <input value={d.netWorthY10} onChange={up("netWorthY10")} placeholder="e.g. 180000" type="number" style={inp(!!d.netWorthY10)} />
            </Field>
          </Row>
        </SectionStep>

        <SectionStep number={4} total={4} title="Final reflection — your capstone" subtitle="Ten modules. Thousands of decisions. What did you actually learn?" isUnlocked={step4Unlocked} accent={ACCENT}>
          <Field>
            <Lbl req>Which single decision in this portfolio will have the biggest long-term financial impact — and why?</Lbl>
            <textarea value={d.biggestDecision} onChange={up("biggestDecision")}
              placeholder="Your career choice, housing decision, investing early, education debt, emergency fund? Think about compounding effects over 20 years."
              style={{ ...ta(!!d.biggestDecision), minHeight: 100 }} />
          </Field>
          <Field>
            <Lbl req>Write a short note to your 35-year-old self about money</Lbl>
            <textarea value={d.reflection} onChange={up("reflection")}
              placeholder="What do you want your 35-year-old self to know about the financial decisions you're making at 22? What habits are you building? What are you most worried about? What are you most hopeful about?"
              style={{ ...ta(!!d.reflection), minHeight: 120 }} />
          </Field>
          <Field>
            <Lbl>What would you do differently if you could redesign this portfolio?</Lbl>
            <textarea value={d.doOver} onChange={up("doOver")}
              placeholder="If you could change one decision — career, housing, education path, anything — what would it be and why?"
              style={ta(!!d.doOver)} />
          </Field>
          <Field>
            <Lbl>Anything else you want to record</Lbl>
            <textarea value={d.letterTo35} onChange={up("letterTo35")}
              placeholder="Additional goals, commitments, things you want to revisit in 5 years…"
              style={ta(!!d.letterTo35)} />
          </Field>
        </SectionStep>

      </div>
    </ModuleShell>
  );
}
