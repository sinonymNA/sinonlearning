"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── theme ─────────────────────────────────────────────────────────────────────

const ACCENT = "#3b82f6";
const BG = "#0d1117";
const SURFACE = "#161b22";
const BORDER = "#21262d";
const TEXT = "#e2e8f0";
const MUTED = "#64748b";

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
      className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:border-[#3b82f6]"
      style={{ borderColor: BORDER, color: TEXT, background: BG }}>
      <span className="mt-0.5 flex-shrink-0">🔗</span>
      <span className="flex-1">
        <span className="block">{label}</span>
        {note && <span className="block text-xs font-normal mt-0.5" style={{ color: MUTED }}>{note}</span>}
      </span>
      <span className="flex-shrink-0 text-xs mt-0.5" style={{ color: MUTED }}>↗</span>
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
  const base = "w-full rounded-xl border px-4 py-3 text-sm font-medium transition focus:outline-none";
  const style = {
    borderColor: hasValue ? `${ACCENT}55` : BORDER,
    background: BG,
    color: TEXT,
  };

  return (
    <div>
      <label className="flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] uppercase mb-2">
        <span style={{ color: MUTED }}>{label}</span>
        {isRequired && !hasValue && (
          <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
            style={{ background: "rgba(59,130,246,0.15)", color: ACCENT }}>required</span>
        )}
        {hasValue && <span className="text-[8px] font-bold" style={{ color: "#4ade80" }}>✓</span>}
        {sub && <span className="ml-1 normal-case font-normal tracking-normal text-[10px]" style={{ color: "#475569" }}>{sub}</span>}
      </label>
      {type === "textarea" ? (
        <textarea className={base} style={style} value={d[k] ?? ""} rows={rows}
          placeholder={placeholder} onChange={e => update(k, e.target.value)} />
      ) : (
        <input className={base} style={style} type="text" value={d[k] ?? ""}
          placeholder={placeholder} onChange={e => update(k, e.target.value)} />
      )}
    </div>
  );
}

function Callout({ color = ACCENT, icon, title, children }: {
  color?: string; icon: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4 text-sm leading-6"
      style={{ borderColor: `${color}30`, background: `${color}08` }}>
      <p className="font-bold mb-1.5" style={{ color }}>{icon} {title}</p>
      <div style={{ color: "#94a3b8" }}>{children}</div>
    </div>
  );
}

function SectionHead({ n, title, time }: { n: number; title: string; time: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-black"
        style={{ background: `${ACCENT}22`, color: ACCENT }}>{n}</div>
      <div>
        <h2 className="text-xl font-black" style={{ color: TEXT }}>{title}</h2>
        <p className="text-xs" style={{ color: MUTED }}>{time}</p>
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
    n >= 1000000
      ? `$${(n / 1000000).toFixed(1)}M`
      : `$${(n / 1000).toFixed(0)}k`;

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: BORDER }}>
      <table className="w-full text-xs text-left">
        <thead>
          <tr style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
            {["Starting Salary", "Monthly Gross", "Earned by Year 5", "Earned by Year 10", "Earned by Year 20"].map(h => (
              <th key={h} className="px-4 py-3 font-bold tracking-wide" style={{ color: MUTED }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? BG : SURFACE }}>
              <td className="px-4 py-3 font-black text-sm" style={{ color: ACCENT }}>{fmt(r.salary)}/yr</td>
              <td className="px-4 py-3 font-semibold">{fmt(r.mo)}</td>
              <td className="px-4 py-3" style={{ color: TEXT }}>{fmt(r.y5)}</td>
              <td className="px-4 py-3" style={{ color: TEXT }}>{fmt(r.y10)}</td>
              <td className="px-4 py-3 font-bold" style={{ color: "#4ade80" }}>{fmt(r.y20)}</td>
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
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [justCompleted, setJustCompleted] = useState(false);

  // Load
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
        if (prog) {
          setD(prog.data as D);
          setCompleted(!!prog.completed_at);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const update = (k: string, v: string) => {
    setD(prev => {
      const next = { ...prev, [k]: v };
      // Debounced auto-save
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaveState("saving");
        fetch("/api/life-budget/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleSlug: "career", data: next, completed: false }),
        }).then(() => {
          setSaveState("saved");
          setTimeout(() => setSaveState("idle"), 2000);
        });
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
      setCompleted(true);
      setJustCompleted(true);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    });
  };

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: MUTED, fontSize: 13, letterSpacing: "0.1em" }}>Loading your progress…</span>
      </div>
    );
  }

  return (
    <main style={{ background: BG, color: TEXT, minHeight: "100vh" }}>

      {/* Sticky top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b px-5 py-3 sm:px-8"
        style={{ background: BG, borderColor: BORDER }}>
        <Link href="/simulations/life-budget"
          className="text-[10px] font-bold tracking-[0.2em] transition hover:opacity-70"
          style={{ color: MUTED }}>
          ← LIFE BUDGET
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 sm:flex">
            {REQUIRED.map(k => (
              <div key={k} className="h-1.5 w-1.5 rounded-full"
                style={{ background: d[k] ? ACCENT : BORDER }} />
            ))}
          </div>
          <span className="text-[10px] font-bold" style={{ color: d[REQUIRED[0]] ? ACCENT : MUTED }}>
            {filledRequired}/{REQUIRED.length} required
          </span>
        </div>
        <div className="flex items-center gap-2">
          {saveState === "saving" && <span className="text-[10px]" style={{ color: MUTED }}>Saving…</span>}
          {saveState === "saved" && <span className="text-[10px]" style={{ color: "#4ade80" }}>✓ Saved</span>}
          {completed ? (
            <Link href="/simulations/life-budget/paycheck"
              className="rounded-full px-4 py-1.5 text-[10px] font-bold transition hover:opacity-90"
              style={{ background: ACCENT, color: "#fff" }}>
              Next: Paycheck →
            </Link>
          ) : (
            <button disabled={!allRequired} onClick={markComplete}
              className="rounded-full px-4 py-1.5 text-[10px] font-bold transition disabled:opacity-30"
              style={{ background: allRequired ? ACCENT : BORDER, color: allRequired ? "#fff" : MUTED }}>
              Mark Complete
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8">

        {/* Module header */}
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full px-3 py-1 text-[10px] font-black tracking-[0.2em]"
            style={{ background: `${ACCENT}22`, color: ACCENT }}>MODULE 01</span>
          {completed && (
            <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold"
              style={{ borderColor: "#166534", color: "#4ade80", background: "#052e16" }}>✓ COMPLETE</span>
          )}
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Career</h1>
        <p className="mt-2 text-lg font-medium" style={{ color: MUTED }}>Choose your path. Know your worth.</p>
        <p className="mt-3 text-sm leading-6" style={{ color: "#94a3b8" }}>
          Every number in this portfolio traces back to this module. Your career determines your income, and your income shapes every financial decision you'll make for the next 40 years. Take this one seriously.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
          {["~5 hours", "6 sections", "3 research sites", "Your data only"].map(t => (
            <span key={t} className="rounded-full border px-3 py-1 font-semibold"
              style={{ borderColor: BORDER, color: MUTED }}>{t}</span>
          ))}
        </div>

        {justCompleted && (
          <div className="mt-6 rounded-2xl border p-5 text-sm"
            style={{ borderColor: `${ACCENT}44`, background: `${ACCENT}09` }}>
            <p className="font-black text-base mb-1" style={{ color: ACCENT }}>Module 1 complete.</p>
            <p style={{ color: "#94a3b8" }}>
              Your career data is saved to your portfolio. Next up: Module 2 — First Paycheck, where you decode your actual take-home pay using the salary you just researched.
            </p>
            <Link href="/simulations/life-budget/paycheck"
              className="mt-3 inline-block rounded-full px-5 py-2 text-xs font-bold transition hover:opacity-90"
              style={{ background: ACCENT, color: "#fff" }}>
              Start Module 2: First Paycheck →
            </Link>
          </div>
        )}

        {/* ── SECTION 1: THE FOUNDATION ──────────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={1} title="The Foundation" time="Read this first — 15 min" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              Here's the uncomfortable truth about personal finance courses: most of them use made-up numbers. "Assume a salary of $50,000." "Assume a mortgage of $1,200/month." Those numbers don't help you — they help the textbook look clean.
            </p>
            <p>
              This portfolio uses your numbers. Which means we start here: <strong style={{ color: TEXT }}>what will you actually earn?</strong>
            </p>
            <p>
              Your career choice is the single biggest financial decision you will ever make — bigger than buying a house, bigger than choosing a car, bigger than which credit card you open. A $20,000/year difference in starting salary compounds into a $500,000+ difference in lifetime wealth by retirement.
            </p>
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold tracking-[0.14em] uppercase mb-3" style={{ color: MUTED }}>
              What a $20,000 salary difference actually means over time:
            </p>
            <SalaryTable />
            <p className="mt-2 text-[11px]" style={{ color: "#475569" }}>
              * These are gross earnings totals, not accounting for taxes, savings, or investment returns. The real compounding effect is even larger when investing is factored in (Module 9).
            </p>
          </div>

          <Callout icon="📌" title="Your job for this module">
            <p>
              Research a real career you're genuinely considering — not a placeholder. Use Bureau of Labor Statistics data, not guesses. Every number you enter here flows into Modules 2 through 10.
            </p>
          </Callout>
        </div>

        {/* ── SECTION 2: EXPLORE YOUR FIELD ───────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={2} title="Explore Your Field" time="~45 minutes on O*NET and BLS" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              Start broad, then narrow. Most people have a rough idea of what they want to do ("work in healthcare," "do something with computers," "open a business"), but haven't translated that into a specific job title. That translation matters because salary data is attached to specific titles.
            </p>
            <p>
              <strong style={{ color: TEXT }}>O*NET OnLine</strong> is the US government's official job taxonomy — 900+ specific occupations, each with required skills, education levels, typical tasks, and crosswalk codes to BLS salary data. Start here.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <RLink href="https://www.onetonline.org/find/"
              label="O*NET OnLine — Browse Occupations"
              note='Search by keyword or browse "Career Clusters." Find a job title that matches your interest.' />
            <RLink href="https://www.bls.gov/ooh/"
              label="BLS Occupational Outlook Handbook"
              note="The official government source for salary, outlook, and education data by occupation." />
          </div>

          <Callout icon="🎯" title="How to use O*NET" color="#8b5cf6">
            <ol className="list-decimal list-inside space-y-1.5 mt-1">
              <li>Go to onetonline.org/find/ and search a word describing what you want to do</li>
              <li>Click through 2–3 results to read their "Tasks" and "Work Activities" sections</li>
              <li>Find one that actually sounds like your kind of work</li>
              <li>Note the O*NET-SOC code (looks like 15-1254.00) — you'll use it on BLS.gov</li>
            </ol>
          </Callout>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Job Title" sub="(exactly as listed on O*NET or BLS)" k="jobTitle" d={d} update={update}
              placeholder="e.g. Registered Nurse, Software Developer, Electrician" />
            <Field label="Industry / Sector" k="industry" d={d} update={update}
              placeholder="e.g. Healthcare, Tech, Construction, Education" />
            <Field label="Target City & State" k="city" d={d} update={update}
              placeholder="e.g. Atlanta, GA or Houston, TX" />
            <Field label="O*NET-SOC Code" sub="(optional but helpful)" k="onetCode" d={d} update={update}
              placeholder="e.g. 29-1141.00" />
          </div>
        </div>

        {/* ── SECTION 3: SALARY RESEARCH ───────────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={3} title="Research Real Salaries — BLS.gov" time="~90 minutes · this is the core research" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              The Bureau of Labor Statistics Occupational Outlook Handbook is the most authoritative salary source in the US. It's updated every 1–2 years with actual employer payroll data. This is where you go — not salary websites that crowdsource self-reported numbers (which skew high).
            </p>
            <p>
              <strong style={{ color: TEXT }}>Important distinction:</strong> The OOH lists the median annual wage — the midpoint where half of workers earn more and half earn less. Your starting salary will likely be at or below the 10th percentile (the "entry-level" range), not the median. Many students overestimate their starting pay because they only look at the median.
            </p>
          </div>

          <Callout icon="📋" title="Step-by-step: How to find your occupation on BLS.gov">
            <ol className="list-decimal list-inside space-y-2 mt-1">
              <li>Go to <strong>bls.gov/ooh/</strong> — you'll see a search bar and category list</li>
              <li>Search your job title OR browse the category that fits your field</li>
              <li>Click your occupation — the page will have tabs at the top</li>
              <li>Click <strong>"Pay"</strong> tab → find "Median annual wage" and "Wage estimates"</li>
              <li>Click <strong>"Job Outlook"</strong> tab → find the % change and "projected new jobs"</li>
              <li>For state-level data: click the BLS OES link below and search your state</li>
            </ol>
          </Callout>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <RLink href="https://www.bls.gov/ooh/"
              label="BLS Occupational Outlook Handbook"
              note="Find your occupation → Pay tab → Job Outlook tab" />
            <RLink href="https://www.bls.gov/oes/current/oes_nat.htm"
              label="BLS OES — National Wage Estimates"
              note="Full occupation wage tables including 10th/25th/75th/90th percentile wages" />
            <RLink href="https://www.bls.gov/oes/"
              label="BLS OES — State & Metro Area Data"
              note="Find wages for YOUR specific city or state — often different from the national figure" />
            <RLink href="https://www.onetonline.org/link/summary/"
              label="O*NET Wages by State"
              note="Cross-check wages by state; some O*NET pages link directly to state BLS data" />
          </div>

          <Callout icon="⚠️" title="Entry-level ≠ median" color="#f59e0b">
            The median wage is what the middle worker earns after several years of experience. Most students starting out earn somewhere between the 10th and 25th percentile. If you can find the 10th percentile on BLS OES, use that as your conservative starting estimate.
          </Callout>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="BLS Median Annual Wage (national)" k="blsMedianAnnual" d={d} update={update}
              placeholder="e.g. $77,000" />
            <Field label="Entry-Level / 10th Percentile Wage" k="blsEntryLevel" d={d} update={update}
              placeholder="e.g. $47,000 (find in OES tables)" />
            <Field label="Median Hourly Wage" k="blsMedianHourly" d={d} update={update}
              placeholder="e.g. $37.02/hr" />
            <Field label="Job Outlook (10-year % change)" k="blsOutlook" d={d} update={update}
              placeholder="e.g. +6% (faster than average)" />
            <Field label="Number of Jobs in US" k="blsJobCount" d={d} update={update}
              placeholder="e.g. 3.2 million" />
            <Field label="Highest-Paying States for This Career" k="blsTopStates" d={d} update={update}
              placeholder="e.g. California, Washington, New York" />
          </div>

          <div className="mt-4">
            <Field label="Wage in Your Target City / State" sub="(from BLS OES metro data)" k="blsRegionalWage" d={d} update={update}
              placeholder="e.g. Atlanta, GA median: $64,000" />
          </div>

          <Callout icon="💡" title="Why regional data matters" color="#06b6d4">
            A registered nurse in San Francisco earns roughly $130,000. The same role in rural Mississippi averages $58,000. The national median hides enormous geographic variation. Always look up your specific city — and compare to cost of living in Module 3 (Housing).
          </Callout>
        </div>

        {/* ── SECTION 4: EDUCATION PATH ANALYSIS ───────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={4} title="Education Path Analysis" time="~60 minutes · collegescorecard.ed.gov + your BLS data" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              This is where most students make their first major financial mistake: choosing education by prestige or habit rather than by the math. The question is not "which school is better?" — it's <strong style={{ color: TEXT }}>"what's the return on this investment?"</strong>
            </p>
            <p>
              Research two different paths to your career. This might be: community college → transfer vs. 4-year direct; trade school vs. bachelor's; bachelor's vs. associate's + certifications. Use the College Scorecard to find real tuition costs and typical debt loads.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <RLink href="https://collegescorecard.ed.gov/"
              label="College Scorecard (Ed.gov)"
              note="Find any school: search by name, program, or location. Shows median debt, median salary after graduation, and cost." />
            <RLink href="https://nces.ed.gov/collegenavigator/"
              label="NCES College Navigator"
              note="Official tuition, fees, and financial aid data for every accredited school in the US." />
            <RLink href="https://studentaid.gov/loan-simulator"
              label="Federal Student Aid Loan Simulator"
              note="Enter a loan amount → see monthly payment under different repayment plans." />
            <RLink href="https://www.bls.gov/careeroutlook/2022/data-on-display/education-pays.htm"
              label="BLS: Education Pays"
              note="Chart showing median earnings and unemployment rates by education level." />
          </div>

          <Callout icon="📋" title="How to use College Scorecard">
            <ol className="list-decimal list-inside space-y-1.5 mt-1">
              <li>Search for a school or program in your field</li>
              <li>Look at <strong>"Median Earnings"</strong> — what graduates from that program actually earn</li>
              <li>Look at <strong>"Median Total Debt"</strong> — what they borrowed to get there</li>
              <li>Calculate the ratio: debt ÷ annual salary. Under 1.0 is generally manageable; over 1.5 is a warning sign.</li>
            </ol>
          </Callout>

          <div className="mt-6 grid gap-4">
            <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: BORDER, background: SURFACE }}>
              <p className="text-xs font-black tracking-[0.16em] uppercase" style={{ color: ACCENT }}>Path 1</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="School / Program Name" k="path1Name" d={d} update={update}
                  placeholder="e.g. Georgia State University — B.S. Nursing" />
                <Field label="Degree / Credential Type" k="path1Type" d={d} update={update}
                  placeholder="e.g. 4-Year Bachelor's Degree" />
                <Field label="Total Cost (tuition + fees, all years)" k="path1Cost" d={d} update={update}
                  placeholder="e.g. $82,000 total" />
                <Field label="Time to Complete" k="path1Time" d={d} update={update}
                  placeholder="e.g. 4 years" />
                <Field label="Estimated Loan Balance at Graduation" k="path1Loans" d={d} update={update}
                  placeholder="e.g. $45,000 (from Scorecard median debt)" />
                <Field label="Monthly Loan Payment (use Loan Simulator)" k="path1Payment" d={d} update={update}
                  placeholder="e.g. $460/mo on Standard 10-year plan" />
              </div>
            </div>

            <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: BORDER, background: SURFACE }}>
              <p className="text-xs font-black tracking-[0.16em] uppercase" style={{ color: "#8b5cf6" }}>Path 2 (Alternative)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="School / Program Name" k="path2Name" d={d} update={update}
                  placeholder="e.g. Atlanta Technical College → transfer" />
                <Field label="Degree / Credential Type" k="path2Type" d={d} update={update}
                  placeholder="e.g. A.A.S. → Bridge to B.S.N." />
                <Field label="Total Cost (tuition + fees, all years)" k="path2Cost" d={d} update={update}
                  placeholder="e.g. $28,000 total" />
                <Field label="Time to Complete" k="path2Time" d={d} update={update}
                  placeholder="e.g. 3 years" />
                <Field label="Estimated Loan Balance at Graduation" k="path2Loans" d={d} update={update}
                  placeholder="e.g. $14,000" />
                <Field label="Monthly Loan Payment" k="path2Payment" d={d} update={update}
                  placeholder="e.g. $145/mo on Standard 10-year plan" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Which path are you choosing?" k="chosenPath" d={d} update={update}
                placeholder="Path 1 or Path 2 — or a third option" />
              <Field label="Why that path?" k="chosenPathReason" d={d} update={update}
                placeholder="e.g. Lower debt, faster entry, better local campus..." />
            </div>
          </div>

          <Callout icon="📐" title="The debt-to-income rule of thumb" color="#10b981">
            If your expected first-year salary is $60,000, your total student loan debt should ideally be under $60,000 (1:1 ratio). Over $90,000 (1.5:1) means loan payments will eat 15–20% of your take-home every month for a decade. Under $30,000 (0.5:1) leaves real breathing room.
          </Callout>
        </div>

        {/* ── SECTION 5: YOUR CAREER NUMBERS ───────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={5} title="Your Career Numbers" time="~30 min · synthesize your research into 3 key figures" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              Now synthesize what you found into the three numbers that drive every other module in this portfolio. Be conservative on your starting salary — you're more likely to get a raise in Year 2 than to start above entry level.
            </p>
          </div>

          <Callout icon="💡" title="How to pick your starting salary" color="#f59e0b">
            Use your BLS entry-level (10th percentile) or the 25th percentile from OES data for your city — not the median. If you couldn't find regional entry-level data, take the national entry-level wage and apply a regional cost-of-living adjustment (high-cost cities usually pay 10–20% above national; low-cost regions may be below).
          </Callout>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border p-4" style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}08` }}>
              <p className="text-[10px] font-black tracking-[0.16em] uppercase mb-3" style={{ color: ACCENT }}>Starting Salary</p>
              <Field label="Annual (Year 1 conservative estimate)" k="startingSalary" d={d} update={update}
                placeholder="e.g. $52,000" />
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "#8b5cf633", background: "#8b5cf608" }}>
              <p className="text-[10px] font-black tracking-[0.16em] uppercase mb-3" style={{ color: "#8b5cf6" }}>10-Year Median</p>
              <Field label="Where you expect to be at Year 10" k="medianSalary" d={d} update={update}
                placeholder="e.g. $77,000 (BLS median)" />
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: "#10b98133", background: "#10b98108" }}>
              <p className="text-[10px] font-black tracking-[0.16em] uppercase mb-3" style={{ color: "#10b981" }}>Monthly Gross</p>
              <Field label="Starting salary ÷ 12" k="grossMonthly" d={d} update={update}
                placeholder="e.g. $4,333" />
            </div>
          </div>

          {d.startingSalary && (
            <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "#10b98130", background: "#10b98108" }}>
              <p className="font-bold mb-1" style={{ color: "#10b981" }}>📌 This feeds Module 2</p>
              <p style={{ color: "#94a3b8" }}>
                Your gross monthly pay of <strong style={{ color: TEXT }}>{d.grossMonthly || "(fill in above)"}</strong> is the starting point for your First Paycheck module. After federal tax, state tax, FICA, and benefits, you'll see exactly what actually lands in your account.
              </p>
            </div>
          )}
        </div>

        {/* ── SECTION 6: REFLECTION ────────────────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={6} title="Career Reflection" time="~60 min writing · these go in your portfolio" />
          <div className="space-y-4 text-sm leading-7 mb-6" style={{ color: "#94a3b8" }}>
            <p>
              This is the portfolio section your teacher will read. Write in complete sentences. Minimum of 4–5 sentences per question. Use specific numbers from your research to support your answers.
            </p>
          </div>

          <div className="space-y-5">
            <Field label="Why this career?" sub="(4–5 sentences minimum)" k="whyThisCareer" d={d} update={update} type="textarea" rows={5}
              placeholder="Explain why you chose this career — what draws you to the work itself, not just the salary. What tasks or responsibilities appealed to you on O*NET? What does a day in this job actually look like?" />

            <Field label="Your 10-year vision" sub="(where do you see yourself by age 28–30?)" k="tenYearVision" d={d} update={update} type="textarea" rows={5}
              placeholder="Where do you want to be in this career at the 10-year mark? What title, what city, what salary? What steps — certifications, grad school, promotions — get you there?" />

            <Field label="What surprised you in the research?" k="biggestSurprise" d={d} update={update} type="textarea" rows={4}
              placeholder="What was different from what you expected — salary, education requirements, regional variation, job outlook? Was it better or worse than you thought?" />

            <Field label="Education decision explanation" sub="(defend your path choice with numbers)" k="educationReflection" d={d} update={update} type="textarea" rows={4}
              placeholder="Why the path you chose over the alternative? Compare total cost, loan burden, time to employment, and expected first-year salary for both paths. Use the actual numbers you researched." />
          </div>
        </div>

        {/* ── COMPLETION ───────────────────────────────────────────────────── */}
        <div className="mt-12 rounded-2xl border p-6 text-center" style={{ borderColor: BORDER, background: SURFACE }}>
          {completed ? (
            <>
              <p className="text-2xl font-black mb-2" style={{ color: "#4ade80" }}>✓ Module 1 Complete</p>
              <p className="text-sm mb-4" style={{ color: MUTED }}>Your career data is saved to your portfolio.</p>
              <Link href="/simulations/life-budget/paycheck"
                className="rounded-full px-6 py-3 text-sm font-bold transition hover:opacity-90"
                style={{ background: ACCENT, color: "#fff" }}>
                Continue to Module 2: First Paycheck →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-bold mb-1" style={{ color: TEXT }}>
                {allRequired
                  ? "All required fields filled — you're ready to mark this complete."
                  : `${REQUIRED.length - filledRequired} required field${REQUIRED.length - filledRequired !== 1 ? "s" : ""} still empty.`}
              </p>
              <p className="text-xs mb-4" style={{ color: MUTED }}>
                {allRequired
                  ? "Your data auto-saves as you type. Mark complete when you're satisfied with your research."
                  : "Scroll back up to find the fields marked 'required.' Fill them in before marking complete."}
              </p>
              <button disabled={!allRequired} onClick={markComplete}
                className="rounded-full px-8 py-3 text-sm font-bold transition disabled:opacity-30 hover:opacity-90"
                style={{ background: allRequired ? ACCENT : BORDER, color: allRequired ? "#fff" : MUTED }}>
                Mark Module 1 Complete →
              </button>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
