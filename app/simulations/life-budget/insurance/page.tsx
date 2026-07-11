"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleShell from "@/components/life-budget/ModuleShell";
import SectionStep from "@/components/life-budget/SectionStep";
import InsuranceHook from "@/components/life-budget/hooks/InsuranceHook";

const BG = "#f8fafc", CARD = "#ffffff", BORDER = "#e2e8f0";
const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const GREEN = "#16a34a", ACCENT = "#be185d";

interface FormData {
  healthPlan: string;
  monthlyPremium: string;
  annualDeductible: string;
  oopMax: string;
  chosenTierReason: string;
  rentersInsurance: string;
  autoInsurance: string;
  lifeInsurance: string;
  totalInsurance: string;
  insuranceReflection: string;
  oopAffordable: string;
  notes: string;
}

const EMPTY: FormData = {
  healthPlan: "", monthlyPremium: "", annualDeductible: "", oopMax: "", chosenTierReason: "",
  rentersInsurance: "", autoInsurance: "", lifeInsurance: "", totalInsurance: "",
  insuranceReflection: "", oopAffordable: "", notes: "",
};

const REQUIRED: (keyof FormData)[] = ["healthPlan", "monthlyPremium", "annualDeductible", "oopMax", "insuranceReflection"];

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

const PLAN_TIERS = [
  { tier: "Bronze", premium: "Lowest", deductible: "$5,000–$7,000", oop: "~$9,450", best: "Healthy, rarely use care" },
  { tier: "Silver", premium: "Medium", deductible: "$1,500–$4,000", oop: "~$7,000", best: "Balance of cost and coverage" },
  { tier: "Gold", premium: "Higher", deductible: "$500–$1,500", oop: "~$4,000", best: "Frequent care or prescriptions" },
];

function InsurancePanel({ d }: { d: FormData }) {
  const monthly = parseFloat(d.monthlyPremium) || 0;
  const deductible = parseFloat(d.annualDeductible) || 0;
  const oop = parseFloat(d.oopMax) || 0;
  const renters = parseFloat(d.rentersInsurance) || 0;
  const auto = parseFloat(d.autoInsurance) || 0;
  const life = parseFloat(d.lifeInsurance) || 0;
  const total = monthly + renters + auto + life;
  const annualPremium = monthly * 12;
  const worstCase = annualPremium + oop;

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: INK, padding: "20px 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Total Monthly Insurance</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{total > 0 ? `$${total.toFixed(0)}/mo` : "—"}</p>
        {annualPremium > 0 && <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>${(total * 12).toFixed(0)}/year in premiums</p>}
      </div>
      <div style={{ padding: "16px 20px" }}>
        {[
          { label: "Health premium", val: monthly, color: ACCENT },
          { label: "Renters insurance", val: renters, color: MUTED },
          { label: "Auto insurance", val: auto, color: MUTED },
          { label: "Life insurance", val: life, color: MUTED },
        ].filter(r => r.val > 0).map(r => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${BORDER}`, color: MUTED }}>
            <span>{r.label}</span><span style={{ fontWeight: 600, color: r.color }}>${r.val.toFixed(0)}/mo</span>
          </div>
        ))}

        {worstCase > 0 && (
          <div style={{ marginTop: 14, padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 3 }}>Worst-case year</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>${worstCase.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>${annualPremium.toFixed(0)} premiums + ${oop.toFixed(0)} out-of-pocket max</p>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>This is what you&apos;d pay in a serious medical year</p>
          </div>
        )}

        {deductible > 0 && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: BG, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
              You pay the first <strong>${deductible.toLocaleString()}</strong> of medical costs before insurance covers anything.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InsurancePage() {
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
      .then(r => { if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/insurance"); return null; } return r.json(); })
      .then(json => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "insurance");
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); setPhase("work"); if (m.completed_at) setIsComplete(true); }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const total = ["monthlyPremium", "rentersInsurance", "autoInsurance", "lifeInsurance"]
      .reduce((s, k) => s + (parseFloat(d[k as keyof FormData]) || 0), 0);
    if (total > 0) setD(prev => ({ ...prev, totalInsurance: total.toFixed(0) }));
  }, [d.monthlyPremium, d.rentersInsurance, d.autoInsurance, d.lifeInsurance]); // eslint-disable-line

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "insurance", data: next }) })
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
    await fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "insurance", data: d, completed: true }) });
    setIsComplete(true);
    setCompleting(false);
  };

  const step2Unlocked = !!(d.healthPlan.trim() && d.monthlyPremium.trim() && d.annualDeductible.trim() && d.oopMax.trim());
  const step3Unlocked = step2Unlocked;

  const sidebar = (
    <>
      <InsurancePanel d={d} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Find your plan</p>
        {[
          { href: "https://www.healthcare.gov/", label: "healthcare.gov", sub: "Compare real plan options and subsidies for your income" },
          { href: "https://www.progressive.com/auto/coverage-options/", label: "Progressive Auto Quote", sub: "Quick quote to estimate auto insurance cost" },
          { href: "https://www.naic.org/", label: "NAIC Insurance Guide", sub: "National regulator — explains every type of insurance" },
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
      moduleLabel="MODULE 08 · INSURANCE"
      accent={ACCENT}
      filledRequired={filledRequired}
      totalRequired={REQUIRED.length}
      isComplete={isComplete}
      onMarkComplete={markComplete}
      completing={completing}
      saving={saving}
      saved={saved}
      phase={phase}
      hookContent={<InsuranceHook onReady={() => { window.scrollTo(0, 0); setPhase("work"); }} />}
      sidebarContent={sidebar}
      nextHref="/simulations/life-budget/investing"
      nextLabel="Module 9: Investing"
    >
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

        <SectionStep number={1} total={3} title="Your health plan" subtitle="The wrong plan can cost you thousands. Understand what you're buying before you pick." isUnlocked={true} accent={ACCENT}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 12 }}>Compare the tiers before you choose</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {PLAN_TIERS.map(t => (
                <div key={t.tier} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "12px 12px" }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: INK, marginBottom: 6 }}>{t.tier}</p>
                  <div style={{ fontSize: 10, color: MUTED, lineHeight: 1.8 }}>
                    <p>Premium: <strong style={{ color: INK }}>{t.premium}</strong></p>
                    <p>Deductible: <strong style={{ color: INK }}>{t.deductible}</strong></p>
                    <p>OOP Max: <strong style={{ color: INK }}>{t.oop}</strong></p>
                  </div>
                  <p style={{ fontSize: 9, color: MUTED, marginTop: 6, fontStyle: "italic" }}>Best for: {t.best}</p>
                </div>
              ))}
            </div>
          </div>
          <Row>
            <Field>
              <Lbl req>Which plan tier are you choosing?</Lbl>
              <select value={d.healthPlan} onChange={up("healthPlan")} style={inp(!!d.healthPlan)}>
                <option value="">Select…</option>
                <option>Bronze</option>
                <option>Silver</option>
                <option>Gold</option>
                <option>Platinum</option>
                <option>Employer plan (not marketplace)</option>
                <option>Parent&apos;s plan (under 26)</option>
                <option>Medicaid / CHIP</option>
              </select>
            </Field>
            <Field>
              <Lbl req>What&apos;s the monthly premium?</Lbl>
              <input value={d.monthlyPremium} onChange={up("monthlyPremium")} placeholder="e.g. 210" type="number" style={inp(!!d.monthlyPremium)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Your share after any employer contribution</p>
            </Field>
          </Row>
          <Row>
            <Field>
              <Lbl req>Annual deductible</Lbl>
              <input value={d.annualDeductible} onChange={up("annualDeductible")} placeholder="e.g. 3500" type="number" style={inp(!!d.annualDeductible)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>You pay this before insurance covers anything</p>
            </Field>
            <Field>
              <Lbl req>Out-of-pocket maximum</Lbl>
              <input value={d.oopMax} onChange={up("oopMax")} placeholder="e.g. 7500" type="number" style={inp(!!d.oopMax)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Most you pay in a year, no matter what happens</p>
            </Field>
          </Row>
          <Field>
            <Lbl>Why did you pick this tier?</Lbl>
            <input value={d.chosenTierReason} onChange={up("chosenTierReason")} placeholder="e.g. I'm healthy so lower premium makes sense — I'll risk the high deductible" style={inp(!!d.chosenTierReason)} />
          </Field>
        </SectionStep>

        <SectionStep number={2} total={3} title="Other insurance" subtitle="Two you probably need right now. One you almost certainly don't." isUnlocked={step2Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl>Renters insurance (monthly)</Lbl>
              <input value={d.rentersInsurance} onChange={up("rentersInsurance")} placeholder="e.g. 15" type="number" style={inp(!!d.rentersInsurance)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Covers your belongings — ~$12–$25/month. Get it.</p>
            </Field>
            <Field>
              <Lbl>Auto insurance (monthly)</Lbl>
              <input value={d.autoInsurance} onChange={up("autoInsurance")} placeholder="e.g. 130" type="number" style={inp(!!d.autoInsurance)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>State-required; varies hugely by age and record</p>
            </Field>
          </Row>
          <Field>
            <Lbl>Life insurance (monthly)</Lbl>
            <input value={d.lifeInsurance} onChange={up("lifeInsurance")} placeholder="e.g. 0" type="number" style={inp(!!d.lifeInsurance)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Most 22-year-olds with no dependents need $0 life insurance. Enter 0 unless you have people depending on your income.</p>
          </Field>
        </SectionStep>

        <SectionStep number={3} total={3} title="Reflect" subtitle="Insurance is a bet against yourself. Make sure you know what you're betting." isUnlocked={step3Unlocked} accent={ACCENT}>
          <Field>
            <Lbl req>What would an appendectomy cost you under your plan?</Lbl>
            <textarea value={d.insuranceReflection} onChange={up("insuranceReflection")}
              placeholder="Look at your deductible and OOP max. If you needed an appendectomy ($15,000 bill), what would you actually pay? Does your plan make sense given your income? What surprised you?"
              style={{ ...ta(!!d.insuranceReflection), minHeight: 110 }} />
          </Field>
          <Field>
            <Lbl>Could you pay your out-of-pocket maximum in a single year?</Lbl>
            <textarea value={d.oopAffordable} onChange={up("oopAffordable")}
              placeholder="Your OOP max is the worst-case scenario. Is that amount sitting in your emergency fund? If not, what's the plan?"
              style={ta(!!d.oopAffordable)} />
          </Field>
          <Field>
            <Lbl>Notes</Lbl>
            <textarea value={d.notes} onChange={up("notes")} placeholder="Other notes…" style={ta(!!d.notes)} />
          </Field>
        </SectionStep>

      </div>
    </ModuleShell>
  );
}
