"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── theme ─────────────────────────────────────────────────────────────────────

const ACCENT = "#10b981";
const BG = "#0d1117";
const SURFACE = "#161b22";
const BORDER = "#21262d";
const TEXT = "#e2e8f0";
const MUTED = "#64748b";

// ── types ─────────────────────────────────────────────────────────────────────

type D = Record<string, string>;

const REQUIRED = [
  "grossMonthly", "federalTax", "stateTax", "fica",
  "netMonthly", "gapAmount", "paycheckReflection",
];

// ── helpers ───────────────────────────────────────────────────────────────────

function RLink({ href, label, note }: { href: string; label: string; note?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:border-[#10b981]"
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
            style={{ background: "rgba(16,185,129,0.15)", color: ACCENT }}>required</span>
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

// ── tax bracket table ─────────────────────────────────────────────────────────

function FederalBracketTable() {
  const brackets = [
    { rate: "10%", single: "$0 – $11,925", married: "$0 – $23,850" },
    { rate: "12%", single: "$11,926 – $48,475", married: "$23,851 – $96,950" },
    { rate: "22%", single: "$48,476 – $103,350", married: "$96,951 – $206,700" },
    { rate: "24%", single: "$103,351 – $197,300", married: "$206,701 – $394,600" },
    { rate: "32%", single: "$197,301 – $250,525", married: "$394,601 – $501,050" },
    { rate: "35%", single: "$250,526 – $626,350", married: "$501,051 – $751,600" },
    { rate: "37%", single: "Over $626,350", married: "Over $751,600" },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: BORDER }}>
      <table className="w-full text-xs text-left">
        <thead>
          <tr style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
            {["Tax Rate", "Single Filer", "Married Filing Jointly"].map(h => (
              <th key={h} className="px-4 py-3 font-bold tracking-wide" style={{ color: MUTED }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {brackets.map((b, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${BORDER}`, background: i % 2 === 0 ? BG : SURFACE }}>
              <td className="px-4 py-2.5 font-black" style={{ color: ACCENT }}>{b.rate}</td>
              <td className="px-4 py-2.5">{b.single}</td>
              <td className="px-4 py-2.5" style={{ color: MUTED }}>{b.married}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-2 text-[10px]" style={{ color: "#334155" }}>
        2025 federal income tax brackets. These are marginal rates — only the income in each bracket is taxed at that rate.
      </p>
    </div>
  );
}

// ── paycheck breakdown visual ─────────────────────────────────────────────────

function PaycheckVisual({ d }: { d: D }) {
  const parseAmt = (s: string) => {
    const n = parseFloat(s.replace(/[$,]/g, ""));
    return isNaN(n) ? 0 : n;
  };

  const gross = parseAmt(d.grossMonthly);
  const federal = parseAmt(d.federalTax);
  const state = parseAmt(d.stateTax);
  const fica = parseAmt(d.fica);
  const health = parseAmt(d.healthInsurance);
  const retirement = parseAmt(d.retirement401k);
  const other = parseAmt(d.otherDeductions);
  const totalDeductions = federal + state + fica + health + retirement + other;
  const net = gross - totalDeductions;

  if (!gross) return null;

  const items = [
    { label: "Federal Tax", amount: federal, color: "#ef4444" },
    { label: "State Tax", amount: state, color: "#f97316" },
    { label: "FICA", amount: fica, color: "#f59e0b" },
    { label: "Health Insurance", amount: health, color: "#8b5cf6" },
    { label: "401(k)", amount: retirement, color: "#06b6d4" },
    { label: "Other", amount: other, color: "#64748b" },
  ].filter(x => x.amount > 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}08` }}>
      <p className="text-xs font-black tracking-[0.16em] uppercase mb-4" style={{ color: ACCENT }}>
        YOUR MONTHLY PAYCHECK BREAKDOWN
      </p>

      {/* Bar */}
      <div className="h-8 rounded-full overflow-hidden flex mb-3" style={{ background: "#1e293b" }}>
        {items.map(item => (
          gross > 0 && item.amount > 0 ? (
            <div key={item.label}
              style={{ width: `${(item.amount / gross) * 100}%`, background: item.color }}
              title={`${item.label}: ${fmt(item.amount)}`} />
          ) : null
        ))}
        {net > 0 && (
          <div style={{ width: `${(net / gross) * 100}%`, background: ACCENT }}
            title={`Take-Home: ${fmt(net)}`} />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mt-4">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span style={{ color: MUTED }}>{item.label}</span>
            </div>
            <span className="font-bold" style={{ color: TEXT }}>−{fmt(item.amount)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between col-span-2 border-t pt-2 mt-1" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: ACCENT }} />
            <span className="font-bold" style={{ color: ACCENT }}>Take-Home Pay</span>
          </div>
          <span className="font-black text-sm" style={{ color: ACCENT }}>{fmt(Math.max(0, net))}</span>
        </div>
      </div>

      {gross > 0 && net > 0 && (
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center" style={{ borderColor: BORDER }}>
          <div>
            <p className="text-xs font-black" style={{ color: TEXT }}>{fmt(gross)}</p>
            <p className="text-[10px]" style={{ color: MUTED }}>Gross / mo</p>
          </div>
          <div>
            <p className="text-xs font-black" style={{ color: "#ef4444" }}>−{fmt(totalDeductions)}</p>
            <p className="text-[10px]" style={{ color: MUTED }}>Deductions / mo</p>
          </div>
          <div>
            <p className="text-xs font-black" style={{ color: ACCENT }}>{fmt(Math.max(0, net))}</p>
            <p className="text-[10px]" style={{ color: MUTED }}>Net / mo</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PaycheckPage() {
  const router = useRouter();
  const [d, setD] = useState<D>({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [completed, setCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [careerSalary, setCareerSalary] = useState("");

  // Load
  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then(r => {
        if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/paycheck"); return null; }
        return r.json();
      })
      .then(json => {
        if (!json) return;
        const all = json.progress as Array<{ module_slug: string; data: D; completed_at: string | null }>;
        const paycheckProg = all.find(p => p.module_slug === "paycheck");
        const careerProg = all.find(p => p.module_slug === "career");
        if (paycheckProg) {
          setD(paycheckProg.data as D);
          setCompleted(!!paycheckProg.completed_at);
        }
        if (careerProg?.data) {
          const cd = careerProg.data as D;
          setCareerSalary(cd.grossMonthly || cd.startingSalary || "");
          // Pre-populate gross monthly if not yet set
          if (!paycheckProg?.data?.grossMonthly && cd.grossMonthly) {
            setD(prev => ({ ...prev, grossMonthly: cd.grossMonthly }));
          }
        }
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
          body: JSON.stringify({ moduleSlug: "paycheck", data: next, completed: false }),
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
      body: JSON.stringify({ moduleSlug: "paycheck", data: d, completed: true }),
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
            <Link href="/simulations/life-budget/housing"
              className="rounded-full px-4 py-1.5 text-[10px] font-bold transition hover:opacity-90"
              style={{ background: ACCENT, color: "#fff" }}>
              Next: Housing →
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
            style={{ background: `${ACCENT}22`, color: ACCENT }}>MODULE 02</span>
          {completed && (
            <span className="rounded-full border px-2 py-0.5 text-[9px] font-bold"
              style={{ borderColor: "#166534", color: "#4ade80", background: "#052e16" }}>✓ COMPLETE</span>
          )}
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">First Paycheck</h1>
        <p className="mt-2 text-lg font-medium" style={{ color: MUTED }}>Gross isn&apos;t what you get.</p>

        {careerSalary && (
          <div className="mt-4 rounded-xl border px-4 py-3 text-sm flex items-center gap-3"
            style={{ borderColor: `${ACCENT}33`, background: `${ACCENT}08` }}>
            <span style={{ color: ACCENT }}>📌</span>
            <span style={{ color: "#94a3b8" }}>
              Module 1 salary on file: <strong style={{ color: TEXT }}>{careerSalary}/mo gross</strong> — pre-loaded below.
            </span>
          </div>
        )}

        <p className="mt-3 text-sm leading-6" style={{ color: "#94a3b8" }}>
          The gap between your gross pay and your actual take-home is usually $800–$1,400/month. Most people have no idea how big it is until their first real paycheck. By the end of this module, you'll know exactly where every dollar goes before it reaches your account.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
          {["~5 hours", "6 sections", "4 research sites", "Uses your Module 1 salary"].map(t => (
            <span key={t} className="rounded-full border px-3 py-1 font-semibold"
              style={{ borderColor: BORDER, color: MUTED }}>{t}</span>
          ))}
        </div>

        {justCompleted && (
          <div className="mt-6 rounded-2xl border p-5 text-sm"
            style={{ borderColor: `${ACCENT}44`, background: `${ACCENT}09` }}>
            <p className="font-black text-base mb-1" style={{ color: ACCENT }}>Module 2 complete.</p>
            <p style={{ color: "#94a3b8" }}>
              Your net monthly income is saved. Next: Module 3 — Housing, where you find real listings in your chosen city and decide: rent or buy?
            </p>
            <Link href="/simulations/life-budget/housing"
              className="mt-3 inline-block rounded-full px-5 py-2 text-xs font-bold transition hover:opacity-90"
              style={{ background: ACCENT, color: "#fff" }}>
              Start Module 3: Housing →
            </Link>
          </div>
        )}

        {/* ── SECTION 1: GROSS VS. NET ─────────────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={1} title="Gross vs. Net: The Gap Nobody Talks About" time="Read this first — 20 min" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              Your employer agrees to pay you $60,000/year. That sounds like $5,000/month. But here's what actually happens between that agreement and your bank account:
            </p>
            <div className="rounded-xl border p-4 font-mono text-xs space-y-2" style={{ borderColor: BORDER, background: SURFACE }}>
              <div className="flex justify-between"><span>Gross monthly pay</span><span style={{ color: TEXT }}>$5,000</span></div>
              <div className="flex justify-between"><span style={{ color: "#ef4444" }}>− Federal income tax (est.)</span><span style={{ color: "#ef4444" }}>−$520</span></div>
              <div className="flex justify-between"><span style={{ color: "#f97316" }}>− State income tax (est.)</span><span style={{ color: "#f97316" }}>−$180</span></div>
              <div className="flex justify-between"><span style={{ color: "#f59e0b" }}>− FICA (SS + Medicare)</span><span style={{ color: "#f59e0b" }}>−$383</span></div>
              <div className="flex justify-between"><span style={{ color: "#8b5cf6" }}>− Health insurance premium</span><span style={{ color: "#8b5cf6" }}>−$215</span></div>
              <div className="flex justify-between"><span style={{ color: "#06b6d4" }}>− 401(k) contribution (4%)</span><span style={{ color: "#06b6d4" }}>−$200</span></div>
              <div className="border-t pt-2 flex justify-between font-black" style={{ borderColor: BORDER }}>
                <span style={{ color: ACCENT }}>Net take-home</span><span style={{ color: ACCENT }}>$3,502</span>
              </div>
            </div>
            <p>
              <strong style={{ color: TEXT }}>That's a $1,498 gap every single month</strong> — money that never reaches your checking account. This is why "I make $60k" tells you almost nothing about what someone can actually afford.
            </p>
            <p>
              In this module, you'll build your own version of this breakdown using real tax rates for your income level, real health insurance estimates, and your actual 401k decision.
            </p>
          </div>

          <Callout icon="⚡" title="Key insight: the marginal vs. effective rate trap">
            Most people panic when they see their "tax bracket" is 22%. But that's a marginal rate — only dollars above the bracket threshold are taxed at 22%. Your effective rate (total tax ÷ gross income) will be lower: typically 10–14% for entry-level earners. The IRS withholding estimator will give you a precise number.
          </Callout>
        </div>

        {/* ── SECTION 2: FEDERAL INCOME TAX ───────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={2} title="Federal Income Tax" time="~60 minutes · IRS.gov research" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              The US uses a progressive income tax system — the more you earn, the higher rate on the additional dollars. Look at the 2025 federal brackets below, then use the IRS withholding estimator to calculate your specific monthly withholding.
            </p>
          </div>

          <div className="mt-5">
            <FederalBracketTable />
          </div>

          <Callout icon="📋" title="How to use the IRS withholding estimator" color="#ef4444">
            <ol className="list-decimal list-inside space-y-1.5 mt-1">
              <li>Go to <strong>irs.gov/individuals/tax-withholding-estimator</strong></li>
              <li>Select "Single" filing status (unless you know you'll be married/filing jointly)</li>
              <li>Enter your estimated annual income (from Module 1)</li>
              <li>Enter 1 job, 0 dependents, no other income</li>
              <li>The tool will show your estimated annual withholding — divide by 12 for monthly</li>
            </ol>
          </Callout>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <RLink href="https://www.irs.gov/individuals/tax-withholding-estimator"
              label="IRS Tax Withholding Estimator"
              note="Official tool — enter your income, get your estimated federal withholding per paycheck." />
            <RLink href="https://taxfoundation.org/data/all/federal/2025-tax-brackets/"
              label="Tax Foundation: 2025 Tax Brackets"
              note="Clear explanation of bracket structure, standard deduction, and how progressive taxation works." />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Gross Annual Salary" k="grossAnnual" d={d} update={update}
              placeholder="e.g. $52,000 (from Module 1)" />
            <Field label="Gross Monthly Pay" k="grossMonthly" d={d} update={update}
              placeholder="e.g. $4,333" />
            <Field label="Federal Tax Bracket (marginal)" k="federalBracket" d={d} update={update}
              placeholder="e.g. 12% or 22%" />
            <Field label="Effective Federal Tax Rate" k="effectiveFederalRate" d={d} update={update}
              placeholder="e.g. 11.3% (total tax ÷ gross income)" />
            <Field label="Monthly Federal Tax Withheld" k="federalTax" d={d} update={update}
              placeholder="e.g. $390 (from IRS estimator ÷ 12)" />
          </div>
        </div>

        {/* ── SECTION 3: STATE INCOME TAX ─────────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={3} title="State Income Tax" time="~45 minutes · taxfoundation.org" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              State income taxes range from <strong style={{ color: TEXT }}>0%</strong> (in Florida, Texas, Nevada, Washington, and 5 other states) to as high as <strong style={{ color: TEXT }}>13.3%</strong> (California top marginal rate). Most states have a flat or graduated rate between 2–7%.
            </p>
            <p>
              This matters enormously for where you choose to live. A Georgia resident paying 5.49% state tax on a $52,000 salary pays about $2,855/year in state taxes — almost $238/month. A Texas resident pays $0.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <RLink href="https://taxfoundation.org/data/all/state/state-income-tax-rates-2025/"
              label="Tax Foundation: 2025 State Income Tax Rates"
              note="Every state's rate structure — flat vs. graduated, brackets if applicable." />
            <RLink href="https://smartasset.com/taxes/income-taxes"
              label="SmartAsset: State Income Tax Calculator"
              note="Enter your state + income → get exact state tax estimate." />
          </div>

          <Callout icon="🏙️" title="No-income-tax states" color="#06b6d4">
            If you chose Texas, Florida, Nevada, Washington, Wyoming, South Dakota, Alaska, or Tennessee as your city in Module 1 — your state income tax is $0. Enter $0 in the field below and note it. (Tennessee does tax investment income; Alaska has no income tax and no sales tax.)
          </Callout>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Your State" k="state" d={d} update={update}
              placeholder="e.g. Georgia, Texas, California" />
            <Field label="State Income Tax Rate" k="stateTaxRate" d={d} update={update}
              placeholder="e.g. 5.49% (Georgia flat rate)" />
            <Field label="Monthly State Tax Withheld" k="stateTax" d={d} update={update}
              placeholder="e.g. $198 (or $0 if no income tax state)" />
          </div>
        </div>

        {/* ── SECTION 4: FICA ──────────────────────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={4} title="FICA: Social Security + Medicare" time="~30 minutes · fixed rate, easy to calculate" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              FICA (Federal Insurance Contributions Act) is the most straightforward deduction — it's a fixed percentage that doesn't change based on your income level (up to the Social Security wage base).
            </p>

            <div className="rounded-xl border p-4" style={{ borderColor: BORDER, background: SURFACE }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-black tracking-wide mb-1" style={{ color: MUTED }}>SOCIAL SECURITY</p>
                  <p className="text-2xl font-black" style={{ color: TEXT }}>6.2%</p>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>of gross pay (up to $176,100 in 2025)</p>
                </div>
                <div>
                  <p className="text-xs font-black tracking-wide mb-1" style={{ color: MUTED }}>MEDICARE</p>
                  <p className="text-2xl font-black" style={{ color: TEXT }}>1.45%</p>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>of gross pay (no wage limit)</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
                <p className="text-xs font-black tracking-wide mb-1" style={{ color: MUTED }}>COMBINED FICA RATE</p>
                <p className="text-2xl font-black" style={{ color: ACCENT }}>7.65%</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  Your employer matches this amount — they pay an additional 7.65% on your behalf to the government. You never see their half, but it's part of why hiring you costs them more than your stated salary.
                </p>
              </div>
            </div>
          </div>

          <Callout icon="🧮" title="Calculate your FICA now">
            Multiply your gross monthly pay × 0.0765. That&apos;s it. If your gross is $4,333/mo, FICA is $4,333 × 0.0765 = <strong>$331.47/mo</strong>.
          </Callout>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4" style={{ borderColor: BORDER, background: SURFACE }}>
              <p className="text-xs font-black tracking-wide mb-3" style={{ color: MUTED }}>FICA CALCULATION</p>
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                Your gross monthly: <strong style={{ color: TEXT }}>{d.grossMonthly || "(fill in Section 2)"}</strong><br />
                × 7.65% = <strong style={{ color: ACCENT }}>
                  {d.grossMonthly
                    ? `$${(parseFloat(d.grossMonthly.replace(/[$,]/g, "")) * 0.0765).toFixed(2)}`
                    : "(enter gross first)"}
                </strong>
              </p>
            </div>
            <Field label="Monthly FICA Withheld" k="fica" d={d} update={update}
              placeholder="e.g. $331 (= gross × 7.65%)" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Social Security Portion" sub="(gross × 6.2%)" k="socialSecurity" d={d} update={update}
              placeholder="e.g. $269" />
            <Field label="Medicare Portion" sub="(gross × 1.45%)" k="medicare" d={d} update={update}
              placeholder="e.g. $63" />
          </div>
        </div>

        {/* ── SECTION 5: BENEFITS & DEDUCTIONS ─────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={5} title="Benefits & Voluntary Deductions" time="~60 minutes · research health plans and 401k" />
          <div className="space-y-4 text-sm leading-7" style={{ color: "#94a3b8" }}>
            <p>
              Beyond taxes, your paycheck has a second category of deductions: benefits. These are partially or fully your choice — you decide your health plan, your 401k contribution rate, and whether to add dental/vision. They come out before or after taxes depending on the type.
            </p>
            <p>
              <strong style={{ color: TEXT }}>Health insurance</strong> is the biggest unknown. Without employer coverage, a Bronze plan on healthcare.gov for a 22-year-old in a major metro runs $200–$450/month. With employer coverage, your share is typically $100–$350/month for single coverage. Research your likely employer type (government, large corporation, small business, self-employed) to estimate realistically.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <RLink href="https://www.healthcare.gov/see-plans/"
              label="HealthCare.gov — Browse Plans"
              note="See real plan costs in your zip code. Use your estimated income for the subsidy estimate." />
            <RLink href="https://www.smartasset.com/retirement/401k-calculator"
              label="SmartAsset 401(k) Calculator"
              note="See how different contribution rates grow over 30 years with compound interest." />
            <RLink href="https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/faqs/401k-plans-for-employees"
              label="DOL: 401(k) Basics"
              note="Official explanation of 401k rules, employer match, vesting, and contribution limits." />
          </div>

          <Callout icon="💡" title="The employer match is free money" color="#06b6d4">
            Most employers match a portion of your 401k contribution — commonly 50–100% match on the first 3–6% of your salary. A 100% match on 4% of a $52,000 salary = $2,080/year in free money. Always contribute at least enough to get the full match.
          </Callout>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border p-5" style={{ borderColor: BORDER, background: SURFACE }}>
              <p className="text-xs font-black tracking-[0.16em] uppercase mb-4" style={{ color: "#8b5cf6" }}>Health Insurance</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Insurance Type" k="insuranceType" d={d} update={update}
                  placeholder="e.g. Employer plan, Healthcare.gov Bronze" />
                <Field label="Plan Tier" k="insurancePlan" d={d} update={update}
                  placeholder="e.g. Bronze, Silver, HMO, PPO" />
                <Field label="Monthly Premium (Your Share)" k="healthInsurance" d={d} update={update}
                  placeholder="e.g. $215/mo (your portion after employer contribution)" />
                <Field label="Annual Deductible" k="deductible" d={d} update={update}
                  placeholder="e.g. $3,000 individual deductible" />
              </div>
            </div>

            <div className="rounded-xl border p-5" style={{ borderColor: BORDER, background: SURFACE }}>
              <p className="text-xs font-black tracking-[0.16em] uppercase mb-4" style={{ color: "#06b6d4" }}>401(k) Retirement Savings</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Employer Match" sub="(% and terms)" k="employerMatch" d={d} update={update}
                  placeholder="e.g. 100% match on first 4% of salary" />
                <Field label="Your Contribution Rate" k="contribution401kRate" d={d} update={update}
                  placeholder="e.g. 4% (to get full match)" />
                <Field label="Monthly 401(k) Contribution" k="retirement401k" d={d} update={update}
                  placeholder="e.g. $173 (= $52,000 × 4% ÷ 12)" />
                <Field label="Employer Match Amount / Month" k="employerMatchAmount" d={d} update={update}
                  placeholder="e.g. $173/mo (they match your 4%)" />
              </div>
            </div>

            <Field label="Other Deductions" sub="(dental, vision, FSA, union dues, etc.)" k="otherDeductions" d={d} update={update}
              placeholder="e.g. $45/mo dental+vision" />
          </div>
        </div>

        {/* ── SECTION 6: YOUR REAL PAYCHECK ───────────────────────────────── */}
        <div className="border-t mt-10 pt-10" style={{ borderColor: BORDER }}>
          <SectionHead n={6} title="Your Real Monthly Paycheck" time="~30 min · calculate and reflect" />
          <div className="text-sm leading-6 mb-5" style={{ color: "#94a3b8" }}>
            Add up all your deductions and calculate your actual take-home. This is the number that your entire budget (Module 5) will be built around.
          </div>

          <PaycheckVisual d={d} />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Monthly Net Take-Home Pay" k="netMonthly" d={d} update={update}
              placeholder="e.g. $3,502 (gross minus all deductions)" />
            <Field label="Annual Net Income" k="netAnnual" d={d} update={update}
              placeholder="e.g. $42,024 (net × 12)" />
            <Field label="Monthly Gap (Gross − Net)" k="gapAmount" d={d} update={update}
              placeholder="e.g. $831 — this never reaches your account" />
            <Field label="Gap as % of Gross" k="gapPercent" d={d} update={update}
              placeholder="e.g. 19.2% (gap ÷ gross × 100)" />
          </div>

          <Callout icon="📌" title="This number feeds your entire budget" color="#10b981">
            Your net monthly pay is the foundation of Module 5: Monthly Budget. Every spending and saving decision will be sized against this number — not your gross salary. When people say "I can't afford it," they almost always mean it relative to net pay, not gross.
          </Callout>

          <div className="mt-6">
            <Field label="Paycheck reflection" sub="(what surprised you? 4–5 sentences)" k="paycheckReflection"
              d={d} update={update} type="textarea" rows={5}
              placeholder="How big was the gap between your gross and net? Which deduction surprised you most? What does knowing your real take-home change about how you think about your future salary? How does your state compare to a no-income-tax state?" />
          </div>

          <div className="mt-4">
            <Field label="What you'd do differently" sub="(optional — would you change your 401k rate? your state? your insurance tier?)"
              k="whatIdChange" d={d} update={update} type="textarea" rows={3}
              placeholder="Looking at the numbers, would you contribute more or less to 401k? Choose a different state? Pick a different insurance tier?" />
          </div>
        </div>

        {/* ── COMPLETION ───────────────────────────────────────────────────── */}
        <div className="mt-12 rounded-2xl border p-6 text-center" style={{ borderColor: BORDER, background: SURFACE }}>
          {completed ? (
            <>
              <p className="text-2xl font-black mb-2" style={{ color: "#4ade80" }}>✓ Module 2 Complete</p>
              <p className="text-sm mb-4" style={{ color: MUTED }}>Your paycheck breakdown is saved to your portfolio.</p>
              <Link href="/simulations/life-budget/housing"
                className="rounded-full px-6 py-3 text-sm font-bold transition hover:opacity-90"
                style={{ background: ACCENT, color: "#fff" }}>
                Continue to Module 3: Housing →
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
                  ? "Your data auto-saves as you type. Mark complete when you're satisfied with your numbers."
                  : "Look for the 'required' badges on the fields that still need your attention."}
              </p>
              <button disabled={!allRequired} onClick={markComplete}
                className="rounded-full px-8 py-3 text-sm font-bold transition disabled:opacity-30 hover:opacity-90"
                style={{ background: allRequired ? ACCENT : BORDER, color: allRequired ? "#fff" : MUTED }}>
                Mark Module 2 Complete →
              </button>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
