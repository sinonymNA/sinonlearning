"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleShell from "@/components/life-budget/ModuleShell";
import SectionStep from "@/components/life-budget/SectionStep";
import BankingHook from "@/components/life-budget/hooks/BankingHook";

const BG = "#f8fafc", CARD = "#ffffff", BORDER = "#e2e8f0";
const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const GREEN = "#16a34a", ACCENT = "#0891b2";

interface FormData {
  checkingBank: string;
  checkingFeatures: string;
  savingsBank: string;
  savingsAPY: string;
  emergencyFundGoal: string;
  monthlyEmergency: string;
  monthsToFund: string;
  threeMonthTarget: string;
  sixMonthTarget: string;
  bankingReflection: string;
  emergencyScenario: string;
  notes: string;
}

const EMPTY: FormData = {
  checkingBank: "", checkingFeatures: "", savingsBank: "", savingsAPY: "",
  emergencyFundGoal: "", monthlyEmergency: "", monthsToFund: "",
  threeMonthTarget: "", sixMonthTarget: "",
  bankingReflection: "", emergencyScenario: "", notes: "",
};

const REQUIRED: (keyof FormData)[] = ["checkingBank", "savingsBank", "savingsAPY", "monthlyEmergency", "bankingReflection"];

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

function EmergencyPanel({ d, monthlyExpenses }: { d: FormData; monthlyExpenses: number }) {
  const monthly = parseFloat(d.monthlyEmergency) || 0;
  const target3 = monthlyExpenses * 3;
  const target6 = monthlyExpenses * 6;
  const months3 = monthly > 0 ? Math.ceil(target3 / monthly) : 0;
  const months6 = monthly > 0 ? Math.ceil(target6 / monthly) : 0;
  const apy = parseFloat(d.savingsAPY) || 0;

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: INK, padding: "20px 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Emergency Fund</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{monthly > 0 ? `$${monthly.toFixed(0)}/mo` : "—"}</p>
        {apy > 0 && <p style={{ fontSize: 11, color: "#86efac", marginTop: 3 }}>Earning {apy}% APY while you build</p>}
      </div>
      <div style={{ padding: "16px 20px" }}>
        {monthlyExpenses > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px", textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: GREEN, marginBottom: 2 }}>${target3.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>3-month target</p>
                {months3 > 0 && <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{months3} months to reach</p>}
              </div>
              <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px", textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: ACCENT, marginBottom: 2 }}>${target6.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>6-month target</p>
                {months6 > 0 && <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{months6} months to reach</p>}
              </div>
            </div>
          </div>
        )}
        {monthly === 0 && <p style={{ fontSize: 11, color: FAINT, textAlign: "center", padding: "8px 0" }}>Fill in monthly savings to see your timeline</p>}
        {monthlyExpenses === 0 && monthly > 0 && <p style={{ fontSize: 11, color: FAINT, textAlign: "center", padding: "8px 0" }}>Complete Module 5 to see your fund targets</p>}
        <div style={{ paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: 10, color: MUTED, lineHeight: 1.5 }}>
            An emergency fund covers job loss, medical bills, and surprise repairs without going into debt. 3 months minimum; 6 months if self-employed or in a volatile field.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BankingPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
  const [phase, setPhase] = useState<"hook" | "work">("hook");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then(r => { if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/banking"); return null; } return r.json(); })
      .then(json => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "banking");
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); setPhase("work"); if (m.completed_at) setIsComplete(true); }
        const budget = json.progress?.find((p: { module_slug: string }) => p.module_slug === "budget");
        if (budget?.data) {
          const bdata = budget.data as Record<string, string>;
          const total = ["housing", "transportation", "food", "utilities", "health", "studentLoan", "entertainment", "clothing", "diningOut", "personalCare"]
            .reduce((s, k) => s + (parseFloat(bdata[k]) || 0), 0);
          setMonthlyExpenses(total);
        }
      })
      .catch(() => {});
  }, [router]);

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "banking", data: next }) })
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
    await fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "banking", data: d, completed: true }) });
    setIsComplete(true);
    setCompleting(false);
  };

  const step2Unlocked = !!(d.checkingBank.trim() && d.savingsBank.trim() && d.savingsAPY.trim());
  const step3Unlocked = step2Unlocked && !!d.monthlyEmergency.trim();

  const sidebar = (
    <>
      <EmergencyPanel d={d} monthlyExpenses={monthlyExpenses} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Find a HYSA</p>
        {[
          { href: "https://www.bankrate.com/banking/savings/best-high-yield-interests-savings-accounts/", label: "Bankrate HYSA Rankings", sub: "Up-to-date APY rates for the top high-yield accounts" },
          { href: "https://www.nerdwallet.com/best/banking/high-yield-online-savings-accounts", label: "NerdWallet HYSA Guide", sub: "Comparison with no-fee picks for new graduates" },
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
      moduleLabel="MODULE 06 · BANKING"
      accent={ACCENT}
      filledRequired={filledRequired}
      totalRequired={REQUIRED.length}
      isComplete={isComplete}
      onMarkComplete={markComplete}
      completing={completing}
      saving={saving}
      saved={saved}
      phase={phase}
      hookContent={<BankingHook onReady={() => { window.scrollTo(0, 0); setPhase("work"); }} />}
      sidebarContent={sidebar}
      nextHref="/simulations/life-budget/credit"
      nextLabel="Module 7: Credit"
    >
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

        <SectionStep number={1} total={3} title="Pick your accounts" subtitle="Two accounts. One for spending, one for saving. They should not be at the same bank." isUnlocked={true} accent={ACCENT}>
          <Field>
            <Lbl req>Which bank or credit union for checking?</Lbl>
            <input value={d.checkingBank} onChange={up("checkingBank")} placeholder="e.g. Ally Bank, local credit union, Chase" style={inp(!!d.checkingBank)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Look for $0 fees and no minimum balance — bankrate.com/banking/checking</p>
          </Field>
          <Field>
            <Lbl>What features matter to you?</Lbl>
            <input value={d.checkingFeatures} onChange={up("checkingFeatures")} placeholder="e.g. No monthly fee, 55,000 ATMs, mobile deposit, Zelle" style={inp(!!d.checkingFeatures)} />
          </Field>
          <Row>
            <Field>
              <Lbl req>Which HYSA are you using for savings?</Lbl>
              <input value={d.savingsBank} onChange={up("savingsBank")} placeholder="e.g. Marcus by Goldman, SoFi, Ally" style={inp(!!d.savingsBank)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>A regular savings account earns almost nothing</p>
            </Field>
            <Field>
              <Lbl req>What&apos;s the APY?</Lbl>
              <input value={d.savingsAPY} onChange={up("savingsAPY")} placeholder="e.g. 4.75" type="number" step="0.01" style={inp(!!d.savingsAPY)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Look for 4%+ right now</p>
            </Field>
          </Row>
        </SectionStep>

        <SectionStep number={2} total={3} title="Build your emergency fund" subtitle="This is the most important savings goal you have. It's not optional." isUnlocked={step2Unlocked} accent={ACCENT}>
          <Field>
            <Lbl>Your emergency fund goal</Lbl>
            <input value={d.emergencyFundGoal} onChange={up("emergencyFundGoal")} placeholder="e.g. $9,000 (3 months of expenses)" style={inp(!!d.emergencyFundGoal)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>3–6× your monthly expenses. Sidebar calculates this from Module 5.</p>
          </Field>
          <Row>
            <Field>
              <Lbl req>Monthly contribution to emergency fund</Lbl>
              <input value={d.monthlyEmergency} onChange={up("monthlyEmergency")} placeholder="e.g. 200" type="number" style={inp(!!d.monthlyEmergency)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Even $100/month matters — don&apos;t skip this</p>
            </Field>
            <Field>
              <Lbl>Months to fully funded</Lbl>
              <input value={d.monthsToFund} onChange={up("monthsToFund")} placeholder="e.g. 18" type="number" style={inp(!!d.monthsToFund)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Optional — sidebar auto-calculates from your goal</p>
            </Field>
          </Row>
        </SectionStep>

        <SectionStep number={3} total={3} title="Reflect" subtitle="Why does it matter which bank holds your emergency fund?" isUnlocked={step3Unlocked} accent={ACCENT}>
          <Field>
            <Lbl req>Why does it matter which bank holds your emergency fund?</Lbl>
            <textarea value={d.bankingReflection} onChange={up("bankingReflection")}
              placeholder="What's the difference between a HYSA and a regular savings account? Why does your emergency fund need to be liquid? How long will it take you to build it?"
              style={{ ...ta(!!d.bankingReflection), minHeight: 110 }} />
          </Field>
          <Field>
            <Lbl>What specific scenario are you building this fund for?</Lbl>
            <textarea value={d.emergencyScenario} onChange={up("emergencyScenario")}
              placeholder="Car breakdown, medical bill, job loss, unexpected move… what's the realistic emergency for you?"
              style={ta(!!d.emergencyScenario)} />
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
