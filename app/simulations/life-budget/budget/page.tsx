"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BG = "#f8fafc", CARD = "#ffffff", BORDER = "#e2e8f0";
const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const GREEN = "#16a34a", ACCENT = "#ea580c";

interface FormData {
  netIncome: string;
  housing: string;
  transportation: string;
  food: string;
  utilities: string;
  health: string;
  studentLoan: string;
  entertainment: string;
  clothing: string;
  diningOut: string;
  personalCare: string;
  emergencySavings: string;
  retirementExtra: string;
  otherSavings: string;
  budgetNotes: string;
  budgetReflection: string;
}

const EMPTY: FormData = {
  netIncome: "", housing: "", transportation: "", food: "", utilities: "",
  health: "", studentLoan: "", entertainment: "", clothing: "", diningOut: "",
  personalCare: "", emergencySavings: "", retirementExtra: "", otherSavings: "",
  budgetNotes: "", budgetReflection: "",
};

const REQUIRED: (keyof FormData)[] = ["netIncome", "food", "entertainment", "budgetReflection"];

const inp = (filled: boolean): React.CSSProperties => ({
  width: "100%", padding: "10px 14px",
  border: `1px solid ${filled ? ACCENT + "88" : BORDER}`,
  borderRadius: 8, background: "#fff", fontSize: 14, color: INK,
  outline: "none", fontFamily: "system-ui, sans-serif", boxSizing: "border-box",
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
function Field({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 20 }}>{children}</div>;
}
function Divider() {
  return <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "28px 0" }} />;
}

function BudgetStatement({ d }: { d: FormData }) {
  const net = parseFloat(d.netIncome) || 0;
  const needs = [d.housing, d.transportation, d.food, d.utilities, d.health, d.studentLoan]
    .reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const wants = [d.entertainment, d.clothing, d.diningOut, d.personalCare]
    .reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const savings = [d.emergencySavings, d.retirementExtra, d.otherSavings]
    .reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const total = needs + wants + savings;
  const surplus = net - total;
  const over = surplus < 0;

  const pctOf = (n: number) => net > 0 ? ((n / net) * 100).toFixed(0) : "0";

  const BarRow = ({ label, amount, target, color }: { label: string; amount: number; target: number; color: string }) => {
    const actual = net > 0 ? (amount / net) * 100 : 0;
    const isOver = actual > target;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: INK, fontWeight: 600 }}>{label}</span>
          <span style={{ color: isOver ? "#dc2626" : MUTED }}>{actual.toFixed(0)}% <span style={{ color: FAINT }}>/ {target}% target</span></span>
        </div>
        <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(actual, 100)}%`, background: isOver ? "#dc2626" : color, borderRadius: 3 }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: over ? "#7f1d1d" : INK, padding: "20px 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
          Monthly {over ? "Deficit" : "Surplus"}
        </p>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          {net > 0 ? `${over ? "-" : "+"}$${Math.abs(surplus).toFixed(0)}` : "—"}
        </p>
        {net > 0 && (
          <p style={{ fontSize: 11, color: over ? "#fca5a5" : "#86efac", marginTop: 3 }}>
            ${net.toLocaleString()} income − ${total.toLocaleString()} expenses
          </p>
        )}
      </div>

      <div style={{ padding: "16px 20px" }}>
        {net > 0 && total > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>50/30/20 Rule</p>
            <BarRow label="Needs" amount={needs} target={50} color={ACCENT} />
            <BarRow label="Wants" amount={wants} target={30} color="#8b5cf6" />
            <BarRow label="Savings" amount={savings} target={20} color={GREEN} />
            <Divider />
          </>
        )}

        {[
          { label: "Net income", val: net, color: GREEN },
          { label: `Needs (${pctOf(needs)}%)`, val: needs, color: ACCENT },
          { label: `Wants (${pctOf(wants)}%)`, val: wants, color: "#8b5cf6" },
          { label: `Savings (${pctOf(savings)}%)`, val: savings, color: GREEN },
          { label: "Total expenses", val: total, color: INK },
        ].map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ color: MUTED }}>{r.label}</span>
            <span style={{ fontWeight: 600, color: r.color, fontVariantNumeric: "tabular-nums" }}>{r.val > 0 ? `$${r.val.toFixed(0)}` : "—"}</span>
          </div>
        ))}

        {surplus !== 0 && net > 0 && (
          <div style={{
            marginTop: 10, padding: "10px 12px", borderRadius: 8,
            background: over ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${over ? "#fecaca" : "#bbf7d0"}`,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: over ? "#dc2626" : GREEN }}>
              {over ? `$${Math.abs(surplus).toFixed(0)} over budget` : `$${surplus.toFixed(0)} unallocated`}
            </p>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
              {over ? "Cut expenses or find more income" : "Add to savings or specific goals"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then(r => { if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/budget"); return null; } return r.json(); })
      .then(json => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "budget");
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); if (m.completed_at) setIsComplete(true); return; }
        // Pre-populate from prior modules
        const updates: Partial<FormData> = {};
        const paycheck = json.progress?.find((p: { module_slug: string }) => p.module_slug === "paycheck");
        if (paycheck?.data?.netMonthly) updates.netIncome = String(paycheck.data.netMonthly);
        const housing = json.progress?.find((p: { module_slug: string }) => p.module_slug === "housing");
        if (housing?.data?.totalHousing) updates.housing = String(housing.data.totalHousing);
        const transport = json.progress?.find((p: { module_slug: string }) => p.module_slug === "transportation");
        if (transport?.data?.monthlyPayment) updates.transportation = String(transport.data.monthlyPayment).replace(/[^0-9.]/g, "");
        if (Object.keys(updates).length) setD(prev => ({ ...prev, ...updates }));
      })
      .catch(() => {});
  }, [router]);

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "budget", data: next }) })
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
    await fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "budget", data: d, completed: true }) });
    setIsComplete(true);
    setCompleting(false);
  };

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, sans-serif", color: INK }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>← Life Budget</Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>MODULE 05 · MONTHLY BUDGET</span>
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
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 4 }}>Monthly Budget</h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
              This is the first time you see your whole life on one page. Pull numbers from every prior module and fill in what&apos;s left. The panel on the right shows whether you&apos;re in the black.
            </p>
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Income</p>
            <Field>
              <Lbl req>Net Monthly Take-Home</Lbl>
              <input value={d.netIncome} onChange={up("netIncome")} placeholder="From your paycheck module" type="number" style={inp(!!d.netIncome)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Pre-populated from Module 2 if complete</p>
            </Field>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Needs (target: 50% of net)</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Housing and transportation should be pre-populated from your previous modules. Fill in the rest.</p>

            <Row>
              <Field>
                <Lbl>Housing (rent + utilities + insurance)</Lbl>
                <input value={d.housing} onChange={up("housing")} placeholder="From Module 3" type="number" style={inp(!!d.housing)} />
              </Field>
              <Field>
                <Lbl>Transportation (car payment + gas + insurance)</Lbl>
                <input value={d.transportation} onChange={up("transportation")} placeholder="From Module 4" type="number" style={inp(!!d.transportation)} />
              </Field>
            </Row>

            <Row>
              <Field>
                <Lbl req>Food & Groceries</Lbl>
                <input value={d.food} onChange={up("food")} placeholder="e.g. 350" type="number" style={inp(!!d.food)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>USDA estimate: $200–$400/mo for one person</p>
              </Field>
              <Field>
                <Lbl>Utilities (if not in housing)</Lbl>
                <input value={d.utilities} onChange={up("utilities")} placeholder="e.g. 0" type="number" style={inp(!!d.utilities)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Leave $0 if included in your housing total</p>
              </Field>
            </Row>

            <Row>
              <Field>
                <Lbl>Health & Personal Care</Lbl>
                <input value={d.health} onChange={up("health")} placeholder="e.g. 50" type="number" style={inp(!!d.health)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Copays, prescriptions, hygiene products</p>
              </Field>
              <Field>
                <Lbl>Student Loan Minimum Payment</Lbl>
                <input value={d.studentLoan} onChange={up("studentLoan")} placeholder="e.g. 200" type="number" style={inp(!!d.studentLoan)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>$0 if no loans; from Module 7</p>
              </Field>
            </Row>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Wants (target: 30% of net)</p>

            <Row>
              <Field>
                <Lbl req>Entertainment & Subscriptions</Lbl>
                <input value={d.entertainment} onChange={up("entertainment")} placeholder="e.g. 80" type="number" style={inp(!!d.entertainment)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Netflix, Spotify, going out, hobbies</p>
              </Field>
              <Field>
                <Lbl>Clothing</Lbl>
                <input value={d.clothing} onChange={up("clothing")} placeholder="e.g. 60" type="number" style={inp(!!d.clothing)} />
              </Field>
            </Row>

            <Row>
              <Field>
                <Lbl>Dining Out</Lbl>
                <input value={d.diningOut} onChange={up("diningOut")} placeholder="e.g. 120" type="number" style={inp(!!d.diningOut)} />
              </Field>
              <Field>
                <Lbl>Personal Care & Misc.</Lbl>
                <input value={d.personalCare} onChange={up("personalCare")} placeholder="e.g. 40" type="number" style={inp(!!d.personalCare)} />
              </Field>
            </Row>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Savings (target: 20% of net)</p>

            <Row>
              <Field>
                <Lbl>Emergency Fund Contribution</Lbl>
                <input value={d.emergencySavings} onChange={up("emergencySavings")} placeholder="e.g. 200" type="number" style={inp(!!d.emergencySavings)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Goal: 3–6 months of expenses saved</p>
              </Field>
              <Field>
                <Lbl>Extra Retirement (beyond 401k)</Lbl>
                <input value={d.retirementExtra} onChange={up("retirementExtra")} placeholder="e.g. 100" type="number" style={inp(!!d.retirementExtra)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Roth IRA or additional savings</p>
              </Field>
            </Row>

            <Field>
              <Lbl>Other Savings Goals</Lbl>
              <input value={d.otherSavings} onChange={up("otherSavings")} placeholder="e.g. 50" type="number" style={inp(!!d.otherSavings)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Vacation, down payment, car repair fund</p>
            </Field>

            <Divider />

            <Field>
              <Lbl req>Reflection</Lbl>
              <textarea value={d.budgetReflection} onChange={up("budgetReflection")}
                placeholder="Are you in the black or red? Which category surprised you most? What would you cut first if you had to? Does the 50/30/20 rule fit your life — or do you need to adjust it?"
                style={{ ...ta(!!d.budgetReflection), minHeight: 110 }} />
            </Field>

            <Field>
              <Lbl>Notes</Lbl>
              <textarea value={d.budgetNotes} onChange={up("budgetNotes")} placeholder="Anything else…" style={ta(!!d.budgetNotes)} />
            </Field>
          </div>

          {!isComplete && (
            <div style={{ marginTop: 24 }}>
              <button onClick={markComplete} disabled={!allFilled || completing} style={{ width: "100%", fontSize: 14, fontWeight: 700, borderRadius: 10, padding: "13px 0", border: "none", cursor: allFilled ? "pointer" : "not-allowed", background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED }}>
                {completing ? "Saving…" : allFilled ? "Mark Module 5 Complete →" : `Fill required fields (${filledRequired} / ${REQUIRED.length} done)`}
              </button>
            </div>
          )}
          {isComplete && (
            <div style={{ marginTop: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 6 }}>✓ Module 5 Complete</p>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Budget saved. Next: Module 6 — Banking & Emergency Fund.</p>
              <Link href="/simulations/life-budget/banking" style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: "#fff", background: GREEN, borderRadius: 8, padding: "9px 22px", textDecoration: "none" }}>Module 6: Banking →</Link>
            </div>
          )}
        </div>

        <div style={{ position: "sticky", top: 64, display: "flex", flexDirection: "column", gap: 16 }}>
          <BudgetStatement d={d} />
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Reference</p>
            {[
              { href: "https://www.consumerfinance.gov/consumer-tools/budget/", label: "CFPB Budget Tool", sub: "Interactive tool from the federal consumer bureau" },
              { href: "https://www.nerdwallet.com/article/finance/what-is-the-50-30-20-rule", label: "50/30/20 Explained", sub: "NerdWallet breakdown of the budgeting rule" },
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
