"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── palette — paper on a desk ─────────────────────────────────────────────────

const DESK   = "#ccc0aa";
const PAPER  = "#faf8f3";
const RULE   = "#ddd5c8";
const INK    = "#1c1917";
const MUTED  = "#78716c";
const ACCENT = "#1d4ed8";   // deep blue (Module 1)
const STAMP  = "#15803d";

// ── types ─────────────────────────────────────────────────────────────────────

type D = Record<string, string>;

const REQUIRED = [
  "jobTitle", "blsMedianAnnual", "blsOutlook",
  "path1Name", "path1Cost", "chosenPath",
  "startingSalary", "grossMonthly", "whyThisCareer",
];

// ── helper components ─────────────────────────────────────────────────────────

function RLink({ href, label, note }: { href: string; label: string; note?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition hover:border-[#1d4ed8] hover:shadow-sm"
      style={{ borderColor: RULE, background: PAPER, color: INK, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <span className="mt-0.5 flex-shrink-0 text-base">🔗</span>
      <span className="flex-1">
        <span className="block">{label}</span>
        {note && <span className="block text-xs font-normal mt-0.5" style={{ color: MUTED }}>{note}</span>}
      </span>
      <span className="flex-shrink-0 text-xs mt-1" style={{ color: MUTED }}>↗</span>
    </a>
  );
}

function Field({
  label, sub, k, d, update, type = "text", rows = 4, placeholder,
}: {
  label: string; sub?: string; k: string; d: D; update: (k: string, v: string) => void;
  type?: "text" | "textarea"; rows?: number; placeholder?: string;
}) {
  const isRequired = REQUIRED.includes(k);
  const hasValue = !!d[k];
  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `1px solid ${hasValue ? `${ACCENT}66` : RULE}`,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 500,
    background: "#f5f1ea",
    color: INK,
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div>
      <label className="flex items-center gap-2 mb-1.5" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED }}>
        {label}
        {isRequired && !hasValue && (
          <span style={{ background: `${ACCENT}14`, color: ACCENT, borderRadius: 9999, padding: "1px 6px", fontSize: 8, fontWeight: 700 }}>required</span>
        )}
        {hasValue && <span style={{ color: STAMP, fontSize: 8, fontWeight: 700 }}>✓</span>}
        {sub && <span style={{ color: "#a8a29e", fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: "normal" }}>{sub}</span>}
      </label>
      {type === "textarea" ? (
        <textarea style={inputStyle} value={d[k] ?? ""} rows={rows}
          placeholder={placeholder} onChange={e => update(k, e.target.value)} />
      ) : (
        <input style={inputStyle} type="text" value={d[k] ?? ""}
          placeholder={placeholder} onChange={e => update(k, e.target.value)} />
      )}
    </div>
  );
}

function Callout({ color = ACCENT, icon, title, children }: {
  color?: string; icon: string; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      background: PAPER,
      borderRadius: "0 8px 8px 0",
      padding: "14px 16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      fontSize: 13,
      lineHeight: 1.7,
    }}>
      <p style={{ fontWeight: 700, color, marginBottom: 6 }}>{icon} {title}</p>
      <div style={{ color: MUTED }}>{children}</div>
    </div>
  );
}

function SectionHead({ n, title, time }: { n: number; title: string; time: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: `${ACCENT}18`, color: ACCENT, fontSize: 12, fontWeight: 900,
      }}>{n}</div>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: INK, margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{time}</p>
      </div>
    </div>
  );
}

// ── salary comparison table ──────────────────────────────────────────────────

function SalaryTable() {
  const rows = [
    { salary: 40000, mo: 3333, y5: 200000, y10: 400000, y20: 800000 },
    { salary: 60000, mo: 5000, y5: 300000, y10: 600000, y20: 1200000 },
    { salary: 80000, mo: 6667, y5: 400000, y10: 800000, y20: 1600000 },
    { salary: 100000, mo: 8333, y5: 500000, y10: 1000000, y20: 2000000 },
  ];
  const fmt = (n: number) =>
    n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}k`;

  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${RULE}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <table style={{ width: "100%", fontSize: 12, textAlign: "left", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0ece4", borderBottom: `1px solid ${RULE}` }}>
            {["Starting Salary", "Monthly Gross", "Earned by Year 5", "Earned by Year 10", "Earned by Year 20"].map(h => (
              <th key={h} style={{ padding: "10px 14px", fontWeight: 700, color: MUTED, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 10 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${RULE}`, background: i % 2 === 0 ? PAPER : "#f5f1ea" }}>
              <td style={{ padding: "10px 14px", fontWeight: 900, fontSize: 14, color: ACCENT }}>{fmt(r.salary)}/yr</td>
              <td style={{ padding: "10px 14px", fontWeight: 600, color: INK }}>{fmt(r.mo)}</td>
              <td style={{ padding: "10px 14px", color: INK }}>{fmt(r.y5)}</td>
              <td style={{ padding: "10px 14px", color: INK }}>{fmt(r.y10)}</td>
              <td style={{ padding: "10px 14px", fontWeight: 700, color: STAMP }}>{fmt(r.y20)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function CareerPage() {
  const router = useRouter();
  const [d, setD] = useState<D>({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [completed, setCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then(r => {
        if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/career"); return null; }
        return r.json();
      })
      .then(json => {
        if (!json) return;
        const prog = (json.progress as Array<{ module_slug: string; data: D; completed_at: string | null }>)
          .find(p => p.module_slug === "career");
        if (prog) { setD(prog.data as D); setCompleted(!!prog.completed_at); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const update = (k: string, v: string) => {
    setD(prev => {
      const next = { ...prev, [k]: v };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaveState("saving");
        fetch("/api/life-budget/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleSlug: "career", data: next, completed: false }),
        }).then(() => { setSaveState("saved"); setTimeout(() => setSaveState("idle"), 2000); });
      }, 1500);
      return next;
    });
  };

  const filledRequired = REQUIRED.filter(k => !!d[k]).length;
  const allRequired = filledRequired === REQUIRED.length;

  const markComplete = () => {
    setSaveState("saving");
    fetch("/api/life-budget/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleSlug: "career", data: d, completed: true }),
    }).then(() => {
      setCompleted(true); setJustCompleted(true);
      setSaveState("saved"); setTimeout(() => setSaveState("idle"), 2000);
    });
  };

  if (loading) {
    return (
      <div style={{ background: DESK, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: MUTED, fontSize: 13, letterSpacing: "0.1em" }}>Loading…</span>
      </div>
    );
  }

  const topBar: React.CSSProperties = {
    position: "sticky", top: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderBottom: `1px solid ${RULE}`,
    padding: "12px 32px",
    background: PAPER,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  };

  return (
    <main style={{ background: DESK, color: INK, minHeight: "100vh" }}>

      {/* Sticky top bar — looks like a document header */}
      <div style={topBar}>
        <Link href="/simulations/life-budget"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: MUTED, textDecoration: "none" }}>
          ← LIFE BUDGET
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {REQUIRED.map(k => (
            <div key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: d[k] ? ACCENT : RULE }} />
          ))}
          <span style={{ fontSize: 10, fontWeight: 700, color: d[REQUIRED[0]] ? ACCENT : MUTED }}>
            {filledRequired}/{REQUIRED.length}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saveState === "saving" && <span style={{ fontSize: 10, color: MUTED }}>Saving…</span>}
          {saveState === "saved" && <span style={{ fontSize: 10, color: STAMP }}>✓ Saved</span>}
          {completed ? (
            <Link href="/simulations/life-budget/paycheck"
              style={{ background: ACCENT, color: "#fff", borderRadius: 9999, padding: "6px 16px", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
              Next: Paycheck →
            </Link>
          ) : (
            <button disabled={!allRequired} onClick={markComplete}
              style={{ background: allRequired ? ACCENT : RULE, color: allRequired ? "#fff" : MUTED, borderRadius: 9999, padding: "6px 16px", fontSize: 10, fontWeight: 700, border: "none", cursor: allRequired ? "pointer" : "default", opacity: allRequired ? 1 : 0.5 }}>
              Mark Complete
            </button>
          )}
        </div>
      </div>

      {/* Document */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 96px" }}>

        {/* Cover sheet */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "32px 36px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ background: `${ACCENT}18`, color: ACCENT, borderRadius: 9999, padding: "2px 10px", fontSize: 10, fontWeight: 900, letterSpacing: "0.2em" }}>MODULE 01</span>
            {completed && (
              <span style={{ background: "#f0fdf4", color: STAMP, border: `1px solid #bbf7d0`, borderRadius: 9999, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>✓ COMPLETE</span>
            )}
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.5px", color: INK, margin: "0 0 6px" }}>Career</h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: MUTED, margin: "0 0 12px" }}>Choose your path. Know your worth.</p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: MUTED, margin: "0 0 16px" }}>
            Every number in this portfolio traces back to this module. Your career determines your income, and your income shapes every financial decision you make for the next 40 years.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["~5 hours", "6 sections", "3 research sites", "Your data only"].map(t => (
              <span key={t} style={{ border: `1px solid ${RULE}`, borderRadius: 9999, padding: "3px 12px", fontSize: 10, fontWeight: 600, color: MUTED }}>{t}</span>
            ))}
          </div>

          {justCompleted && (
            <div style={{ marginTop: 20, padding: "16px 20px", background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 10 }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: STAMP, marginBottom: 6 }}>Module 1 complete.</p>
              <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.6, marginBottom: 12 }}>
                Your career data is saved. Next up: First Paycheck — where you see exactly what lands in your account after taxes, FICA, and benefits.
              </p>
              <Link href="/simulations/life-budget/paycheck"
                style={{ display: "inline-block", background: STAMP, color: "#fff", borderRadius: 9999, padding: "8px 20px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                Start Module 2: First Paycheck →
              </Link>
            </div>
          )}
        </div>

        {/* ── SECTION 1 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={1} title="The Foundation" time="Read this first — 15 min" />
          <div style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 20 }}>
            <p style={{ marginBottom: 12 }}>
              Here's the uncomfortable truth about personal finance courses: most of them use made-up numbers. "Assume a salary of $50,000." Those numbers don't help you — they help the textbook look clean.
            </p>
            <p style={{ marginBottom: 12 }}>
              This portfolio uses your numbers. Which means we start with: <strong style={{ color: INK }}>what will you actually earn?</strong>
            </p>
            <p>
              Your career choice is the single biggest financial decision you will ever make. A $20,000/year difference in starting salary compounds into a $500,000+ difference in lifetime wealth by retirement.
            </p>
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED, marginBottom: 10 }}>
            What a $20,000 salary gap actually means over 20 years:
          </p>
          <SalaryTable />
          <div style={{ marginTop: 16 }}>
            <Callout icon="📌" title="Your job for this module">
              Research a real career you're genuinely considering — not a placeholder. Use Bureau of Labor Statistics data, not guesses. Every number you enter here flows into Modules 2 through 10.
            </Callout>
          </div>
        </div>

        {/* ── SECTION 2 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={2} title="Explore Your Field" time="~45 minutes on O*NET and BLS" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 16 }}>
            Start broad, then narrow. Most people have a rough idea of what they want to do but haven't translated that into a specific job title. That translation matters because salary data is attached to specific titles.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <RLink href="https://www.onetonline.org/find/" label="O*NET OnLine — Browse Occupations"
              note='Search by keyword. Find a job title that matches your interest.' />
            <RLink href="https://www.bls.gov/ooh/" label="BLS Occupational Outlook Handbook"
              note="Official source for salary, outlook, and education data by occupation." />
          </div>
          <div style={{ marginBottom: 20 }}>
            <Callout icon="🎯" title="How to use O*NET" color="#7c3aed">
              <ol style={{ paddingLeft: 18, margin: "6px 0 0", lineHeight: 2 }}>
                <li>Go to onetonline.org/find/ and search a word describing what you want to do</li>
                <li>Click through 2–3 results to read their Tasks and Work Activities</li>
                <li>Note the O*NET-SOC code (e.g. 15-1254.00) — used on BLS.gov</li>
              </ol>
            </Callout>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Job Title" sub="(exactly as listed on O*NET or BLS)" k="jobTitle" d={d} update={update}
              placeholder="e.g. Registered Nurse, Software Developer, Electrician" />
            <Field label="Industry / Sector" k="industry" d={d} update={update}
              placeholder="e.g. Healthcare, Tech, Construction" />
            <Field label="Target City & State" k="city" d={d} update={update}
              placeholder="e.g. Atlanta, GA or Houston, TX" />
            <Field label="O*NET-SOC Code" sub="(optional)" k="onetCode" d={d} update={update}
              placeholder="e.g. 29-1141.00" />
          </div>
        </div>

        {/* ── SECTION 3 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={3} title="Research Real Salaries — BLS.gov" time="~90 minutes · the core research" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 16 }}>
            The Bureau of Labor Statistics OOH is the most authoritative salary source in the US — updated with actual employer payroll data. The OOH lists the <strong style={{ color: INK }}>median annual wage</strong> (midpoint). Your starting salary will likely be near the 10th percentile (entry-level range), not the median.
          </p>
          <div style={{ marginBottom: 16 }}>
            <Callout icon="📋" title="Step-by-step: How to find your occupation on BLS.gov">
              <ol style={{ paddingLeft: 18, margin: "6px 0 0", lineHeight: 2.2 }}>
                <li>Go to <strong>bls.gov/ooh/</strong> and search your job title</li>
                <li>Click your occupation → click the <strong>Pay</strong> tab → find "Median annual wage"</li>
                <li>Click <strong>Job Outlook</strong> tab → find the % change over 10 years</li>
                <li>For state-level data: use the BLS OES link below, search your state</li>
              </ol>
            </Callout>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <RLink href="https://www.bls.gov/ooh/" label="BLS OOH — Your Occupation"
              note="Find your occupation → Pay tab → Job Outlook tab" />
            <RLink href="https://www.bls.gov/oes/current/oes_nat.htm" label="BLS OES — National Wage Estimates"
              note="Full tables including 10th/25th/75th/90th percentile wages" />
            <RLink href="https://www.bls.gov/oes/" label="BLS OES — State & Metro Area Data"
              note="Wages for YOUR specific city or state" />
            <RLink href="https://www.onetonline.org/link/summary/" label="O*NET Wages by State"
              note="Cross-check wages by state" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Callout icon="⚠️" title="Entry-level ≠ median" color="#b45309">
              Most students starting out earn somewhere between the 10th and 25th percentile. If you can find the 10th percentile on BLS OES, use that as your conservative starting estimate — not the median.
            </Callout>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="BLS Median Annual Wage (national)" k="blsMedianAnnual" d={d} update={update}
              placeholder="e.g. $77,000" />
            <Field label="Entry-Level / 10th Percentile Wage" k="blsEntryLevel" d={d} update={update}
              placeholder="e.g. $47,000 (from OES tables)" />
            <Field label="Median Hourly Wage" k="blsMedianHourly" d={d} update={update}
              placeholder="e.g. $37.02/hr" />
            <Field label="Job Outlook (10-year % change)" k="blsOutlook" d={d} update={update}
              placeholder="e.g. +6% (faster than average)" />
            <Field label="Number of Jobs in US" k="blsJobCount" d={d} update={update}
              placeholder="e.g. 3.2 million" />
            <Field label="Highest-Paying States" k="blsTopStates" d={d} update={update}
              placeholder="e.g. California, Washington, New York" />
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="Wage in Your Target City / State" sub="(from BLS OES metro data)" k="blsRegionalWage" d={d} update={update}
              placeholder="e.g. Atlanta, GA median: $64,000" />
          </div>
        </div>

        {/* ── SECTION 4 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={4} title="Education Path Analysis" time="~60 minutes · collegescorecard.ed.gov" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 16 }}>
            Research two different paths to your career. The question isn't "which school is better?" — it's <strong style={{ color: INK }}>"what's the return on this investment?"</strong> Use the College Scorecard to find real tuition costs and typical debt loads.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <RLink href="https://collegescorecard.ed.gov/" label="College Scorecard (Ed.gov)"
              note="Find any school: search by name, program, or location. Shows median debt and salary after graduation." />
            <RLink href="https://nces.ed.gov/collegenavigator/" label="NCES College Navigator"
              note="Official tuition, fees, and financial aid data for every accredited school." />
            <RLink href="https://studentaid.gov/loan-simulator" label="Federal Student Aid Loan Simulator"
              note="Enter a loan amount → see monthly payment under different repayment plans." />
            <RLink href="https://www.bls.gov/careeroutlook/2022/data-on-display/education-pays.htm" label="BLS: Education Pays"
              note="Median earnings and unemployment rates by education level." />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Callout icon="📐" title="The debt-to-income rule of thumb" color={STAMP}>
              If your expected first-year salary is $60,000, your total student loan debt should ideally be under $60,000 (1:1 ratio). Over $90,000 (1.5:1) means loan payments eat 15–20% of take-home every month for a decade.
            </Callout>
          </div>

          {/* Path 1 */}
          <div style={{ background: "#f5f1ea", borderRadius: 10, border: `1px solid ${RULE}`, padding: 20, marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: ACCENT, marginBottom: 14 }}>PATH 1</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="School / Program Name" k="path1Name" d={d} update={update}
                placeholder="e.g. Georgia State University — B.S. Nursing" />
              <Field label="Degree / Credential Type" k="path1Type" d={d} update={update}
                placeholder="e.g. 4-Year Bachelor's Degree" />
              <Field label="Total Cost (all years)" k="path1Cost" d={d} update={update}
                placeholder="e.g. $82,000 total" />
              <Field label="Time to Complete" k="path1Time" d={d} update={update}
                placeholder="e.g. 4 years" />
              <Field label="Estimated Loan Balance at Graduation" k="path1Loans" d={d} update={update}
                placeholder="e.g. $45,000 (Scorecard median debt)" />
              <Field label="Monthly Loan Payment (use Loan Simulator)" k="path1Payment" d={d} update={update}
                placeholder="e.g. $460/mo Standard 10-year plan" />
            </div>
          </div>

          {/* Path 2 */}
          <div style={{ background: "#f5f1ea", borderRadius: 10, border: `1px solid ${RULE}`, padding: 20, marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 14 }}>PATH 2 (ALTERNATIVE)</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="School / Program Name" k="path2Name" d={d} update={update}
                placeholder="e.g. Atlanta Technical College → transfer" />
              <Field label="Degree / Credential Type" k="path2Type" d={d} update={update}
                placeholder="e.g. A.A.S. → Bridge to B.S.N." />
              <Field label="Total Cost (all years)" k="path2Cost" d={d} update={update}
                placeholder="e.g. $28,000 total" />
              <Field label="Time to Complete" k="path2Time" d={d} update={update}
                placeholder="e.g. 3 years" />
              <Field label="Estimated Loan Balance" k="path2Loans" d={d} update={update}
                placeholder="e.g. $14,000" />
              <Field label="Monthly Loan Payment" k="path2Payment" d={d} update={update}
                placeholder="e.g. $145/mo" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Which path are you choosing?" k="chosenPath" d={d} update={update}
              placeholder="Path 1 or Path 2 — or a third option" />
            <Field label="Why that path?" k="chosenPathReason" d={d} update={update}
              placeholder="Lower debt, faster entry, better local campus..." />
          </div>
        </div>

        {/* ── SECTION 5 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={5} title="Your Career Numbers" time="~30 min · synthesize into 3 key figures" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 16 }}>
            Synthesize what you found into the three numbers that drive every other module. Be conservative on your starting salary.
          </p>
          <div style={{ marginBottom: 16 }}>
            <Callout icon="💡" title="How to pick your starting salary" color="#b45309">
              Use the BLS 10th or 25th percentile for your city — not the median. If you couldn't find regional entry-level data, take the national entry-level and apply a 10–20% adjustment for high-cost cities.
            </Callout>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <div style={{ background: `${ACCENT}09`, border: `1px solid ${ACCENT}33`, borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", color: ACCENT, marginBottom: 12 }}>Starting Salary</p>
              <Field label="Annual (Year 1 conservative)" k="startingSalary" d={d} update={update}
                placeholder="e.g. $52,000" />
            </div>
            <div style={{ background: "#7c3aed09", border: "1px solid #7c3aed33", borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", color: "#7c3aed", marginBottom: 12 }}>10-Year Median</p>
              <Field label="Where you'll be at Year 10" k="medianSalary" d={d} update={update}
                placeholder="e.g. $77,000 (BLS median)" />
            </div>
            <div style={{ background: `${STAMP}09`, border: `1px solid ${STAMP}33`, borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", color: STAMP, marginBottom: 12 }}>Monthly Gross</p>
              <Field label="Starting salary ÷ 12" k="grossMonthly" d={d} update={update}
                placeholder="e.g. $4,333" />
            </div>
          </div>
          {d.grossMonthly && (
            <div style={{ marginTop: 14, padding: "14px 16px", background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 10, fontSize: 13, color: "#166534" }}>
              <strong style={{ color: STAMP }}>📌 This feeds Module 2 — </strong>
              your gross monthly of <strong>{d.grossMonthly}</strong> is the starting point for your First Paycheck breakdown.
            </div>
          )}
        </div>

        {/* ── SECTION 6 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={6} title="Career Reflection" time="~60 min writing · these go in your portfolio" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 20 }}>
            Write in complete sentences. Minimum 4–5 sentences per question. Use specific numbers from your research.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Why this career?" sub="(4–5 sentences minimum)" k="whyThisCareer" d={d} update={update} type="textarea" rows={5}
              placeholder="Explain why you chose this career — what draws you to the work itself, not just the salary. What tasks or responsibilities appealed to you on O*NET?" />
            <Field label="Your 10-year vision" sub="(title, city, salary at Year 10)" k="tenYearVision" d={d} update={update} type="textarea" rows={5}
              placeholder="Where do you want to be in this career at the 10-year mark? What steps — certifications, grad school, promotions — get you there?" />
            <Field label="What surprised you in the research?" k="biggestSurprise" d={d} update={update} type="textarea" rows={4}
              placeholder="Was the salary better or worse than expected? What about education requirements or job outlook?" />
            <Field label="Education decision — defend with numbers" k="educationReflection" d={d} update={update} type="textarea" rows={4}
              placeholder="Why your chosen path over the alternative? Compare total cost, loan burden, time to employment, and expected starting salary for both." />
          </div>
        </div>

        {/* ── COMPLETION ───────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", textAlign: "center" }}>
          {completed ? (
            <>
              <p style={{ fontSize: 22, fontWeight: 900, color: STAMP, marginBottom: 8 }}>✓ Module 1 Complete</p>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Your career data is saved to your portfolio.</p>
              <Link href="/simulations/life-budget/paycheck"
                style={{ display: "inline-block", background: ACCENT, color: "#fff", borderRadius: 9999, padding: "12px 28px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Continue to Module 2: First Paycheck →
              </Link>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 6 }}>
                {allRequired ? "All required fields filled — ready to mark complete." : `${REQUIRED.length - filledRequired} required field${REQUIRED.length - filledRequired !== 1 ? "s" : ""} still empty.`}
              </p>
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>
                Your data auto-saves as you type. Look for the "required" badges on fields that need attention.
              </p>
              <button disabled={!allRequired} onClick={markComplete}
                style={{ background: allRequired ? ACCENT : RULE, color: allRequired ? "#fff" : MUTED, border: "none", borderRadius: 9999, padding: "12px 32px", fontSize: 13, fontWeight: 700, cursor: allRequired ? "pointer" : "default", opacity: allRequired ? 1 : 0.5 }}>
                Mark Module 1 Complete →
              </button>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
