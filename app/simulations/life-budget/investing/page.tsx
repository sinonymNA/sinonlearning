"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleShell from "@/components/life-budget/ModuleShell";
import SectionStep from "@/components/life-budget/SectionStep";
import InvestingHook from "@/components/life-budget/hooks/InvestingHook";

const BG = "#f8fafc", CARD = "#ffffff", BORDER = "#e2e8f0";
const INK = "#0f172a", MUTED = "#64748b", FAINT = "#94a3b8";
const GREEN = "#16a34a", ACCENT = "#65a30d";

interface FormData {
  contribution401k: string;
  employerMatch: string;
  rothMonthly: string;
  totalInvesting: string;
  projectedAt40: string;
  projectedAt65: string;
  strategy: string;
  investingReflection: string;
  rothVs401k: string;
  notes: string;
}

const EMPTY: FormData = {
  contribution401k: "", employerMatch: "", rothMonthly: "", totalInvesting: "",
  projectedAt40: "", projectedAt65: "", strategy: "", investingReflection: "", rothVs401k: "", notes: "",
};

const REQUIRED: (keyof FormData)[] = ["contribution401k", "employerMatch", "rothMonthly", "investingReflection"];

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

function compound(monthly: number, years: number, rate = 0.07): number {
  if (monthly <= 0) return 0;
  return monthly * ((Math.pow(1 + rate / 12, years * 12) - 1) / (rate / 12));
}

function InvestingPanel({ d, grossMonthly }: { d: FormData; grossMonthly: number }) {
  const contrib401k = parseFloat(d.contribution401k) || 0;
  const match = parseFloat(d.employerMatch) || 0;
  const roth = parseFloat(d.rothMonthly) || 0;
  const monthly401k = grossMonthly > 0 ? (grossMonthly * contrib401k / 100) : 0;
  const employerMonthly = grossMonthly > 0 ? (grossMonthly * Math.min(match, contrib401k) / 100) : 0;
  const totalMonthly = monthly401k + employerMonthly + roth;

  const at40 = compound(totalMonthly, 18);
  const at65 = compound(totalMonthly, 43);

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: INK, padding: "20px 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Monthly Invested</p>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{totalMonthly > 0 ? `$${totalMonthly.toFixed(0)}/mo` : "—"}</p>
        {employerMonthly > 0 && <p style={{ fontSize: 11, color: "#86efac", marginTop: 3 }}>incl. ${employerMonthly.toFixed(0)}/mo employer match (free money)</p>}
      </div>
      <div style={{ padding: "16px 20px" }}>
        {totalMonthly > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>At 7% avg annual return</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: GREEN, marginBottom: 2 }}>${(at40 / 1000).toFixed(0)}k</p>
                <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>at age 40</p>
              </div>
              <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: "12px 10px", textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: ACCENT, marginBottom: 2 }}>${(at65 / 1000).toFixed(0)}k</p>
                <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600 }}>at age 65</p>
              </div>
            </div>
            <div style={{ padding: "10px 12px", background: BG, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
                Contributions total: <strong>${(totalMonthly * 12 * 43).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> over 43 years.<br />
                Growth accounts for the rest.
              </p>
            </div>
          </>
        )}
        {totalMonthly === 0 && <p style={{ fontSize: 11, color: FAINT, textAlign: "center", padding: "8px 0" }}>Fill in your contributions to see projections</p>}
        {grossMonthly === 0 && contrib401k > 0 && <p style={{ fontSize: 10, color: FAINT, textAlign: "center" }}>Complete Module 1 to calculate exact 401k amounts</p>}
      </div>
    </div>
  );
}

export default function InvestingPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
  const [phase, setPhase] = useState<"hook" | "work">("hook");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [grossMonthly, setGrossMonthly] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then(r => { if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/investing"); return null; } return r.json(); })
      .then(json => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "investing");
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); setPhase("work"); if (m.completed_at) setIsComplete(true); }
        const career = json.progress?.find((p: { module_slug: string }) => p.module_slug === "career");
        if (career?.data?.grossMonthly) setGrossMonthly(parseFloat(String(career.data.grossMonthly)) || 0);
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    const contrib = parseFloat(d.contribution401k) || 0;
    const match = parseFloat(d.employerMatch) || 0;
    const roth = parseFloat(d.rothMonthly) || 0;
    if (grossMonthly > 0 && (contrib > 0 || roth > 0)) {
      const monthly401k = grossMonthly * contrib / 100;
      const employerMonthly = grossMonthly * Math.min(match, contrib) / 100;
      const total = monthly401k + employerMonthly + roth;
      const at40 = compound(total, 18);
      const at65 = compound(total, 43);
      setD(prev => ({
        ...prev,
        totalInvesting: total.toFixed(0),
        projectedAt40: at40.toFixed(0),
        projectedAt65: at65.toFixed(0),
      }));
    }
  }, [d.contribution401k, d.employerMatch, d.rothMonthly, grossMonthly]); // eslint-disable-line

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "investing", data: next }) })
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
    await fetch("/api/life-budget/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ moduleSlug: "investing", data: d, completed: true }) });
    setIsComplete(true);
    setCompleting(false);
  };

  const contrib401k = parseFloat(d.contribution401k) || 0;
  const monthly401kAmt = grossMonthly > 0 ? (grossMonthly * contrib401k / 100) : 0;

  const step2Unlocked = !!(d.contribution401k.trim() && d.employerMatch.trim());
  const step3Unlocked = step2Unlocked && !!d.rothMonthly.trim();
  const step4Unlocked = step3Unlocked;

  const sidebar = (
    <>
      <InvestingPanel d={d} grossMonthly={grossMonthly} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Calculators</p>
        {[
          { href: "https://investor.gov/financial-tools-calculators/calculators/compound-interest-calculator", label: "Investor.gov Compound Calc", sub: "Official SEC tool — model any compound interest scenario" },
          { href: "https://www.nerdwallet.com/investing/roth-ira-calculator", label: "NerdWallet Roth IRA Calc", sub: "Project your Roth IRA balance to retirement" },
          { href: "https://www.vanguard.com/investor-resources-education/retirement/roth-vs-traditional-ira", label: "Roth vs. Traditional IRA", sub: "Vanguard explains the tax tradeoff clearly" },
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
      moduleLabel="MODULE 09 · INVESTING"
      accent={ACCENT}
      filledRequired={filledRequired}
      totalRequired={REQUIRED.length}
      isComplete={isComplete}
      onMarkComplete={markComplete}
      completing={completing}
      saving={saving}
      saved={saved}
      phase={phase}
      hookContent={<InvestingHook onReady={() => { window.scrollTo(0, 0); setPhase("work"); }} />}
      sidebarContent={sidebar}
      nextHref="/simulations/life-budget/net-worth"
      nextLabel="Module 10: Net Worth"
      completionHighlights={[
        { label: "401(k) contribution", value: d.contribution401k ? `${d.contribution401k}% of gross` : "", sub: d.employerMatch ? `${d.employerMatch}% employer match` : "" },
        { label: "Roth IRA", value: d.rothMonthly ? `$${Math.round(parseFloat(d.rothMonthly)).toLocaleString()}/mo` : "", sub: d.projectedAt65 ? `~$${Math.round(parseFloat(d.projectedAt65) / 1000)}k projected at 65` : "" },
      ]}
    >
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

        <SectionStep number={1} total={4} title="Your 401(k)" subtitle="At minimum, contribute enough to get the full employer match. That's an instant 50–100% return." isUnlocked={true} accent={ACCENT}>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
            A 401(k) lowers your taxable income now — the government is literally helping you save. Don&apos;t leave employer match money on the table.
            {grossMonthly > 0 && ` Your gross monthly is $${grossMonthly.toLocaleString()}.`}
          </p>
          <Row>
            <Field>
              <Lbl req>Your 401(k) contribution rate</Lbl>
              <input value={d.contribution401k} onChange={up("contribution401k")} placeholder="e.g. 5" type="number" style={inp(!!d.contribution401k)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>
                {monthly401kAmt > 0 ? `= $${monthly401kAmt.toFixed(0)}/mo from your paycheck` : "% of gross salary per paycheck"}
              </p>
            </Field>
            <Field>
              <Lbl req>Employer match rate</Lbl>
              <input value={d.employerMatch} onChange={up("employerMatch")} placeholder="e.g. 3 or 0" type="number" style={inp(!!d.employerMatch)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Common: match 50% of first 6%, or 100% of first 3%. Enter 0 if none.</p>
            </Field>
          </Row>
        </SectionStep>

        <SectionStep number={2} total={4} title="Roth IRA — your personal account" subtitle="Tax-free growth forever. Most young adults should prioritize this after getting the full 401k match." isUnlocked={step2Unlocked} accent={ACCENT}>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
            A Roth IRA grows tax-free — you pay taxes now, but all the growth and withdrawals in retirement are 100% tax-free. The 2025 limit is $7,000/year ($583/month).
          </p>
          <Field>
            <Lbl req>Monthly Roth IRA contribution</Lbl>
            <input value={d.rothMonthly} onChange={up("rothMonthly")} placeholder="e.g. 200 or 0" type="number" style={inp(!!d.rothMonthly)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Even $100/month makes a significant long-run difference. Enter $0 if you can&apos;t start yet.</p>
          </Field>
        </SectionStep>

        <SectionStep number={3} total={4} title="Your investment strategy" subtitle="Index funds beat actively managed funds over any 20-year window. Keep it simple." isUnlocked={step3Unlocked} accent={ACCENT}>
          <Field>
            <Lbl>What will you actually invest in?</Lbl>
            <input value={d.strategy} onChange={up("strategy")} placeholder="e.g. Target date 2065 fund in my 401k, S&P 500 index (FXAIX) in my Roth IRA" style={inp(!!d.strategy)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Target-date funds are the simplest good option — pick the year you plan to retire</p>
          </Field>
          <div style={{ padding: "14px 16px", background: `${ACCENT}08`, border: `1px solid ${ACCENT}22`, borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: INK, lineHeight: 1.6, fontWeight: 600, marginBottom: 4 }}>The index fund rule</p>
            <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6 }}>Low-cost index funds (expense ratio &lt; 0.10%) outperform 85–90% of actively managed funds over 20 years. Boring wins.</p>
          </div>
        </SectionStep>

        <SectionStep number={4} total={4} title="Reflect" subtitle="Compound interest doesn't care about your intentions. It only cares about what you actually do." isUnlocked={step4Unlocked} accent={ACCENT}>
          <Field>
            <Lbl req>What does the 10-year delay cost you in your projection?</Lbl>
            <textarea value={d.investingReflection} onChange={up("investingReflection")}
              placeholder="Look at the sidebar: what's the difference between starting at 22 vs 32? Does your career offer a good 401k match? What would it mean to delay investing for 10 years?"
              style={{ ...ta(!!d.investingReflection), minHeight: 110 }} />
          </Field>
          <Field>
            <Lbl>If you could only do one — get the full 401k match or max your Roth — which would you prioritize and why?</Lbl>
            <textarea value={d.rothVs401k} onChange={up("rothVs401k")}
              placeholder="Think about tax rates now vs. in retirement, employer match as 'free money,' and your timeline. What&apos;s your specific reasoning?"
              style={ta(!!d.rothVs401k)} />
          </Field>
          <Field>
            <Lbl>Notes</Lbl>
            <textarea value={d.notes} onChange={up("notes")} placeholder="Other accounts, brokerage notes…" style={ta(!!d.notes)} />
          </Field>
        </SectionStep>

      </div>
    </ModuleShell>
  );
}
