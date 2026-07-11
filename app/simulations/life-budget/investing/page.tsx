"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  notes: string;
}

const EMPTY: FormData = {
  contribution401k: "", employerMatch: "", rothMonthly: "", totalInvesting: "",
  projectedAt40: "", projectedAt65: "", strategy: "", investingReflection: "", notes: "",
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
function Divider() { return <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "28px 0" }} />; }

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

  const at40 = compound(totalMonthly, 18); // ~22 + 18 = 40
  const at65 = compound(totalMonthly, 43); // ~22 + 43 = 65

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
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); if (m.completed_at) setIsComplete(true); }
        const career = json.progress?.find((p: { module_slug: string }) => p.module_slug === "career");
        if (career?.data?.grossMonthly) setGrossMonthly(parseFloat(String(career.data.grossMonthly)) || 0);
      })
      .catch(() => {});
  }, [router]);

  // Auto-compute total investing
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

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, sans-serif", color: INK }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>← Life Budget</Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>MODULE 09 · INVESTING</span>
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
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 4 }}>Investing</h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>Compound interest is patient. $200/month at 22 becomes over $800,000 by 65. $200/month starting at 32 becomes $400,000. The decade costs you half your retirement.</p>
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>401(k) — the employer account</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              At minimum, contribute enough to capture your full employer match — that&apos;s an instant 50–100% return on that money.
              {grossMonthly > 0 && ` Your gross monthly is $${grossMonthly.toLocaleString()}.`}
            </p>

            <Row>
              <Field>
                <Lbl req>Your 401(k) Contribution %</Lbl>
                <input value={d.contribution401k} onChange={up("contribution401k")} placeholder="e.g. 5" type="number" style={inp(!!d.contribution401k)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>
                  {monthly401kAmt > 0 ? `= $${monthly401kAmt.toFixed(0)}/mo from your paycheck` : "% of gross salary per paycheck"}
                </p>
              </Field>
              <Field>
                <Lbl req>Employer Match %</Lbl>
                <input value={d.employerMatch} onChange={up("employerMatch")} placeholder="e.g. 3 or 0" type="number" style={inp(!!d.employerMatch)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Common: match 50% of first 6%, or 100% of first 3%</p>
              </Field>
            </Row>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Roth IRA — your personal account</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              A Roth IRA grows tax-free — you pay taxes now on contributions, but all the growth and withdrawals in retirement are 100% tax-free.
              2025 limit: $7,000/year ($583/month). Most young adults should max this before extra 401k.
            </p>

            <Field>
              <Lbl req>Monthly Roth IRA Contribution</Lbl>
              <input value={d.rothMonthly} onChange={up("rothMonthly")} placeholder="e.g. 200 or 0" type="number" style={inp(!!d.rothMonthly)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Even $100/month makes a significant long-run difference. Enter $0 if not starting yet.</p>
            </Field>

            <Divider />

            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Strategy & notes</p>

            <Field>
              <Lbl>Investment strategy / fund choice</Lbl>
              <input value={d.strategy} onChange={up("strategy")} placeholder="e.g. Index funds — S&P 500 via Fidelity FXAIX, target date 2065 fund" style={inp(!!d.strategy)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Target-date funds are the simplest good option — pick the one matching your retirement year</p>
            </Field>

            <Field>
              <Lbl req>Reflection</Lbl>
              <textarea value={d.investingReflection} onChange={up("investingReflection")}
                placeholder="What does the 10-year delay cost you in your projection? Does your career offer a good 401k match? What would you do differently with the money if you started at 30 instead of 22?"
                style={{ ...ta(!!d.investingReflection), minHeight: 110 }} />
            </Field>
            <Field>
              <Lbl>Notes</Lbl>
              <textarea value={d.notes} onChange={up("notes")} placeholder="Other accounts, brokerage notes…" style={ta(!!d.notes)} />
            </Field>
          </div>

          {!isComplete && (
            <div style={{ marginTop: 24 }}>
              <button onClick={markComplete} disabled={!allFilled || completing} style={{ width: "100%", fontSize: 14, fontWeight: 700, borderRadius: 10, padding: "13px 0", border: "none", cursor: allFilled ? "pointer" : "not-allowed", background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED }}>
                {completing ? "Saving…" : allFilled ? "Mark Module 9 Complete →" : `Fill required fields (${filledRequired} / ${REQUIRED.length} done)`}
              </button>
            </div>
          )}
          {isComplete && (
            <div style={{ marginTop: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 6 }}>✓ Module 9 Complete</p>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Investing saved. Final module: Net Worth & Future Self.</p>
              <Link href="/simulations/life-budget/net-worth" style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: "#fff", background: GREEN, borderRadius: 8, padding: "9px 22px", textDecoration: "none" }}>Module 10: Net Worth →</Link>
            </div>
          )}
        </div>

        <div style={{ position: "sticky", top: 64, display: "flex", flexDirection: "column", gap: 16 }}>
          <InvestingPanel d={d} grossMonthly={grossMonthly} />
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Calculators</p>
            {[
              { href: "https://investor.gov/financial-tools-calculators/calculators/compound-interest-calculator", label: "Investor.gov Compound Calculator", sub: "Official SEC compound interest tool — model any scenario" },
              { href: "https://www.nerdwallet.com/investing/roth-ira-calculator", label: "NerdWallet Roth IRA Calc", sub: "Project your Roth IRA balance to retirement" },
              { href: "https://www.vanguard.com/investor-resources-education/retirement/roth-vs-traditional-ira", label: "Roth vs. Traditional IRA", sub: "Vanguard explains the tax tradeoff clearly" },
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
