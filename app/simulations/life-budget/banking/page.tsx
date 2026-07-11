"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  notes: string;
}

const EMPTY: FormData = {
  checkingBank: "", checkingFeatures: "", savingsBank: "", savingsAPY: "",
  emergencyFundGoal: "", monthlyEmergency: "", monthsToFund: "",
  threeMonthTarget: "", sixMonthTarget: "", bankingReflection: "", notes: "",
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
function Divider() { return <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "28px 0" }} />; }

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
        <p style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>
          {monthly > 0 ? `$${monthly.toFixed(0)}/mo` : "—"}
        </p>
        {apy > 0 && <p style={{ fontSize: 11, color: "#86efac", marginTop: 3 }}>Earning {apy}% APY while you build</p>}
      </div>
      <div style={{ padding: "16px 20px" }}>
        {monthlyExpenses > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 12px", textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: GREEN, marginBottom: 2 }}>${target3.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>3-month target</p>
                {months3 > 0 && <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{months3} months to reach</p>}
              </div>
              <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 12px", textAlign: "center" }}>
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
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); if (m.completed_at) setIsComplete(true); }
        // Compute total monthly expenses from budget module
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

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, sans-serif", color: INK }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>← Life Budget</Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>MODULE 06 · BANKING</span>
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
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 4 }}>Banking & Emergency Fund</h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>Boring and absolutely essential. Pick the right accounts, find a real HYSA rate, and build your emergency fund plan.</p>
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Checking account</p>

            <Field>
              <Lbl req>Which bank / credit union?</Lbl>
              <input value={d.checkingBank} onChange={up("checkingBank")} placeholder="e.g. Ally Bank, local credit union, Chase" style={inp(!!d.checkingBank)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Compare at bankrate.com/banking/checking — look for $0 fees and no minimum balance</p>
            </Field>

            <Field>
              <Lbl>Key features that matter to you</Lbl>
              <input value={d.checkingFeatures} onChange={up("checkingFeatures")} placeholder="e.g. No monthly fee, 55,000 ATMs, mobile deposit, Zelle" style={inp(!!d.checkingFeatures)} />
            </Field>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>High-yield savings account (HYSA)</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              A regular savings account earns ~0.01% APY. A high-yield savings account earns 4–5% on the same money with zero risk. This is where your emergency fund lives.
            </p>

            <Row>
              <Field>
                <Lbl req>Which HYSA?</Lbl>
                <input value={d.savingsBank} onChange={up("savingsBank")} placeholder="e.g. Marcus by Goldman Sachs, SoFi, Ally" style={inp(!!d.savingsBank)} />
              </Field>
              <Field>
                <Lbl req>Current APY</Lbl>
                <input value={d.savingsAPY} onChange={up("savingsAPY")} placeholder="e.g. 4.75" type="number" style={inp(!!d.savingsAPY)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Look up the live rate at nerdwallet.com/banking/savings</p>
              </Field>
            </Row>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Emergency fund plan</p>

            <Row>
              <Field>
                <Lbl req>Monthly Contribution to Emergency Fund</Lbl>
                <input value={d.monthlyEmergency} onChange={up("monthlyEmergency")} placeholder="e.g. 200" type="number" style={inp(!!d.monthlyEmergency)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>How much you&apos;ll put in each month until fully funded</p>
              </Field>
              <Field>
                <Lbl>Emergency Fund Goal</Lbl>
                <input value={d.emergencyFundGoal} onChange={up("emergencyFundGoal")} placeholder="3 months or 6 months" style={inp(!!d.emergencyFundGoal)} />
              </Field>
            </Row>

            <Divider />

            <Field>
              <Lbl req>Reflection</Lbl>
              <textarea value={d.bankingReflection} onChange={up("bankingReflection")}
                placeholder="Why did you pick these accounts? How long will it take to build 3 months of expenses? Does the HYSA rate change your opinion of keeping money in savings vs. investing it?"
                style={{ ...ta(!!d.bankingReflection), minHeight: 100 }} />
            </Field>
            <Field>
              <Lbl>Notes</Lbl>
              <textarea value={d.notes} onChange={up("notes")} placeholder="Other account options you considered, account numbers, anything else…" style={ta(!!d.notes)} />
            </Field>
          </div>

          {!isComplete && (
            <div style={{ marginTop: 24 }}>
              <button onClick={markComplete} disabled={!allFilled || completing} style={{ width: "100%", fontSize: 14, fontWeight: 700, borderRadius: 10, padding: "13px 0", border: "none", cursor: allFilled ? "pointer" : "not-allowed", background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED }}>
                {completing ? "Saving…" : allFilled ? "Mark Module 6 Complete →" : `Fill required fields (${filledRequired} / ${REQUIRED.length} done)`}
              </button>
            </div>
          )}
          {isComplete && (
            <div style={{ marginTop: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 6 }}>✓ Module 6 Complete</p>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Banking saved. Next: Module 7 — Credit & Debt.</p>
              <Link href="/simulations/life-budget/credit" style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: "#fff", background: GREEN, borderRadius: 8, padding: "9px 22px", textDecoration: "none" }}>Module 7: Credit →</Link>
            </div>
          )}
        </div>

        <div style={{ position: "sticky", top: 64, display: "flex", flexDirection: "column", gap: 16 }}>
          <EmergencyPanel d={d} monthlyExpenses={monthlyExpenses} />
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Compare accounts</p>
            {[
              { href: "https://www.bankrate.com/banking/savings/best-high-yield-interests-savings-accounts/", label: "Bankrate: Best HYSAs", sub: "Live rates updated daily — filter by no minimum balance" },
              { href: "https://www.nerdwallet.com/best/banking/checking-accounts", label: "NerdWallet: Best Checking", sub: "Fee comparison and features side by side" },
              { href: "https://www.mycreditunion.gov/", label: "Find a Credit Union", sub: "Often better rates than big banks — NCUA official locator" },
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
