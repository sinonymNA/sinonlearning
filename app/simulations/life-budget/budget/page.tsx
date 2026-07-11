"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleShell from "@/components/life-budget/ModuleShell";
import SectionStep from "@/components/life-budget/SectionStep";
import BudgetHook from "@/components/life-budget/hooks/BudgetHook";

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
  overspendPlan: string;
}

const EMPTY: FormData = {
  netIncome: "", housing: "", transportation: "", food: "", utilities: "",
  health: "", studentLoan: "", entertainment: "", clothing: "", diningOut: "",
  personalCare: "", emergencySavings: "", retirementExtra: "", otherSavings: "",
  budgetNotes: "", budgetReflection: "", overspendPlan: "",
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
    const targetAmt = net * (target / 100);
    const delta = amount - targetAmt;
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: INK, fontWeight: 600 }}>{label}</span>
          <span style={{ color: isOver ? "#dc2626" : MUTED }}>{actual.toFixed(0)}% <span style={{ color: FAINT }}>/ {target}%</span></span>
        </div>
        <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(actual, 100)}%`, background: isOver ? "#dc2626" : color, borderRadius: 3 }} />
        </div>
        {amount > 0 && net > 0 && (
          <p style={{ fontSize: 10, color: isOver ? "#dc2626" : GREEN, marginTop: 3 }}>
            {isOver
              ? `$${Math.abs(delta).toFixed(0)} over budget`
              : `$${Math.abs(delta).toFixed(0)} under budget ✓`}
          </p>
        )}
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
            <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "12px 0" }} />
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
          <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: over ? "#fef2f2" : "#f0fdf4", border: `1px solid ${over ? "#fecaca" : "#bbf7d0"}` }}>
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
  const [phase, setPhase] = useState<"hook" | "work">("hook");
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
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); setPhase("work"); if (m.completed_at) setIsComplete(true); return; }
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

  const step2Unlocked = !!d.netIncome.trim();
  const step3Unlocked = step2Unlocked && !!d.food.trim();
  const step4Unlocked = step3Unlocked && !!d.entertainment.trim();
  const step5Unlocked = step4Unlocked;

  const budgetSurplus = (() => {
    const net = parseFloat(d.netIncome) || 0;
    if (!net) return "";
    const spent = [d.housing, d.transportation, d.food, d.utilities, d.health, d.studentLoan, d.entertainment, d.clothing, d.diningOut, d.personalCare, d.emergencySavings, d.retirementExtra, d.otherSavings]
      .reduce((s, v) => s + (parseFloat(v) || 0), 0);
    const diff = net - spent;
    return `${diff >= 0 ? "+" : "−"}$${Math.abs(diff).toFixed(0)}/mo`;
  })();

  const sidebar = (
    <>
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
    </>
  );

  return (
    <ModuleShell
      moduleLabel="MODULE 05 · MONTHLY BUDGET"
      accent={ACCENT}
      filledRequired={filledRequired}
      totalRequired={REQUIRED.length}
      isComplete={isComplete}
      onMarkComplete={markComplete}
      completing={completing}
      saving={saving}
      saved={saved}
      phase={phase}
      hookContent={<BudgetHook onReady={() => { window.scrollTo(0, 0); setPhase("work"); }} />}
      sidebarContent={sidebar}
      nextHref="/simulations/life-budget/banking"
      nextLabel="Module 6: Banking"
      completionHighlights={[
        { label: "Monthly income", value: d.netIncome ? `$${Math.round(parseFloat(d.netIncome)).toLocaleString()}/mo` : "" },
        { label: "Budget balance", value: budgetSurplus },
      ]}
    >
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

        <SectionStep number={1} total={5} title="Your take-home income" subtitle="This is the number everything else has to fit inside." isUnlocked={true} accent={ACCENT}>
          <Field>
            <Lbl req>Monthly net take-home</Lbl>
            <input value={d.netIncome} onChange={up("netIncome")} placeholder="From your paycheck module" type="number" style={inp(!!d.netIncome)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Pre-populated from Module 2 if complete</p>
          </Field>
        </SectionStep>

        <SectionStep number={2} total={5} title="Needs — the non-negotiables" subtitle="Target: 50% of your net. Housing and transportation pre-fill from your previous modules." isUnlocked={step2Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl>Housing (rent + utilities + insurance)</Lbl>
              <input value={d.housing} onChange={up("housing")} placeholder="From Module 3" type="number" style={inp(!!d.housing)} />
            </Field>
            <Field>
              <Lbl>Transportation (car + gas + insurance)</Lbl>
              <input value={d.transportation} onChange={up("transportation")} placeholder="From Module 4" type="number" style={inp(!!d.transportation)} />
            </Field>
          </Row>
          <Row>
            <Field>
              <Lbl req>Food & groceries</Lbl>
              <input value={d.food} onChange={up("food")} placeholder="e.g. 350" type="number" style={inp(!!d.food)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>USDA estimate: $200–$400/mo for one person</p>
            </Field>
            <Field>
              <Lbl>Utilities (if not in housing)</Lbl>
              <input value={d.utilities} onChange={up("utilities")} placeholder="e.g. 0" type="number" style={inp(!!d.utilities)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Leave $0 if already in housing total</p>
            </Field>
          </Row>
          <Row>
            <Field>
              <Lbl>Health & personal care</Lbl>
              <input value={d.health} onChange={up("health")} placeholder="e.g. 50" type="number" style={inp(!!d.health)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Copays, prescriptions, hygiene</p>
            </Field>
            <Field>
              <Lbl>Student loan minimum payment</Lbl>
              <input value={d.studentLoan} onChange={up("studentLoan")} placeholder="e.g. 200" type="number" style={inp(!!d.studentLoan)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>$0 if no loans; from Module 7</p>
            </Field>
          </Row>
        </SectionStep>

        <SectionStep number={3} total={5} title="Wants — the good stuff" subtitle="Target: 30% of your net. Things that make life enjoyable but aren't survival." isUnlocked={step3Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl req>Entertainment & subscriptions</Lbl>
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
              <Lbl>Dining out</Lbl>
              <input value={d.diningOut} onChange={up("diningOut")} placeholder="e.g. 120" type="number" style={inp(!!d.diningOut)} />
            </Field>
            <Field>
              <Lbl>Personal care & misc.</Lbl>
              <input value={d.personalCare} onChange={up("personalCare")} placeholder="e.g. 40" type="number" style={inp(!!d.personalCare)} />
            </Field>
          </Row>
        </SectionStep>

        <SectionStep number={4} total={5} title="Savings — future you" subtitle="Target: 20% of your net. This is the category most people skip first." isUnlocked={step4Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl>Emergency fund contribution</Lbl>
              <input value={d.emergencySavings} onChange={up("emergencySavings")} placeholder="e.g. 200" type="number" style={inp(!!d.emergencySavings)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Goal: 3–6 months of expenses saved</p>
            </Field>
            <Field>
              <Lbl>Extra retirement (beyond 401k)</Lbl>
              <input value={d.retirementExtra} onChange={up("retirementExtra")} placeholder="e.g. 100" type="number" style={inp(!!d.retirementExtra)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Roth IRA or additional savings</p>
            </Field>
          </Row>
          <Field>
            <Lbl>Other savings goals</Lbl>
            <input value={d.otherSavings} onChange={up("otherSavings")} placeholder="e.g. 50" type="number" style={inp(!!d.otherSavings)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Vacation, down payment, car repair fund</p>
          </Field>
        </SectionStep>

        <SectionStep number={5} total={5} title="Reflect" subtitle="Does 50/30/20 fit your life — or do you need to adjust it?" isUnlocked={step5Unlocked} accent={ACCENT}>
          <Field>
            <Lbl req>How does your budget look — in the black or red?</Lbl>
            <textarea value={d.budgetReflection} onChange={up("budgetReflection")}
              placeholder="Are you in the black or red? Which category surprised you most? Does the 50/30/20 rule fit your life, or do you need to adjust it?"
              style={{ ...ta(!!d.budgetReflection), minHeight: 110 }} />
          </Field>
          <Field>
            <Lbl>Where are you most likely to overspend — and what&apos;s your plan?</Lbl>
            <textarea value={d.overspendPlan} onChange={up("overspendPlan")}
              placeholder="I tend to overspend on… My plan to stay on budget is…"
              style={ta(!!d.overspendPlan)} />
          </Field>
          <Field>
            <Lbl>Notes</Lbl>
            <textarea value={d.budgetNotes} onChange={up("budgetNotes")} placeholder="Anything else…" style={ta(!!d.budgetNotes)} />
          </Field>
        </SectionStep>

      </div>
    </ModuleShell>
  );
}
