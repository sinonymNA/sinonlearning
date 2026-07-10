"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LIFE_BUDGET_MODULES, type LifeBudgetModule } from "@/lib/lifeBudgetModules";
import type { ModuleProgress } from "@/lib/lifeBudgetDb";

// ── types ─────────────────────────────────────────────────────────────────────

interface PortfolioData {
  progress: ModuleProgress[];
  name: string;
  userId: string;
}

// ── field renderers per module ─────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: unknown }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <span className="field-value">{String(value)}</span>
    </div>
  );
}

function ModuleSection({
  mod,
  prog,
}: {
  mod: LifeBudgetModule;
  prog?: ModuleProgress;
}) {
  const d = (prog?.data ?? {}) as Record<string, unknown>;
  const completed = !!prog?.completed_at;
  const started = !!prog;

  const fields = renderModuleFields(mod.slug, d);

  return (
    <section className="module-section" style={{ borderLeftColor: mod.accent }}>
      <div className="module-header">
        <div className="module-number" style={{ background: mod.accent }}>
          {String(mod.number).padStart(2, "0")}
        </div>
        <div className="module-title-block">
          <h2 className="module-title" style={{ color: mod.accent }}>
            {mod.title}
          </h2>
          <p className="module-subtitle">{mod.subtitle}</p>
        </div>
        <div
          className="module-status"
          style={{
            background: completed ? "#052e16" : started ? "rgba(245,158,11,0.1)" : "#1e293b",
            color: completed ? "#4ade80" : started ? "#f59e0b" : "#475569",
            border: `1px solid ${completed ? "#166534" : started ? "rgba(245,158,11,0.3)" : "#334155"}`,
          }}
        >
          {completed ? "✓ Complete" : started ? "In Progress" : "Not started"}
        </div>
      </div>

      {fields.length > 0 ? (
        <div className="field-grid">{fields}</div>
      ) : (
        <p className="module-empty">No data recorded yet.</p>
      )}

      {prog?.completed_at && (
        <p className="module-date">
          Completed {new Date(prog.completed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      )}
    </section>
  );
}

function renderModuleFields(slug: string, d: Record<string, unknown>): React.ReactElement[] {
  const el = (label: string, key: string) => {
    const val = d[key];
    if (!val && val !== 0) return null;
    return <Field key={key} label={label} value={val} />;
  };

  switch (slug) {
    case "career":
      return [
        el("Job Title", "jobTitle"),
        el("Industry / Employer Type", "industry"),
        el("City / State", "city"),
        el("Education Required", "education"),
        el("Starting Salary (BLS)", "startingSalary"),
        el("Median Salary at 10 Years", "medianSalary"),
        el("Job Outlook (10-year growth)", "jobOutlook"),
        el("Why This Career", "whyThisCareer"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "paycheck":
      return [
        el("Gross Monthly Pay", "grossMonthly"),
        el("Federal Income Tax", "federalTax"),
        el("State Income Tax", "stateTax"),
        el("FICA (Social Security + Medicare)", "fica"),
        el("Health Insurance Premium", "healthInsurance"),
        el("401(k) Contribution", "retirement401k"),
        el("Other Deductions", "otherDeductions"),
        el("Net Monthly Take-Home", "netMonthly"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "housing":
      return [
        el("City", "city"),
        el("Housing Decision", "housingType"),
        el("Monthly Rent / Mortgage", "monthlyPayment"),
        el("Utilities (estimated)", "utilities"),
        el("Renters Insurance", "rentersInsurance"),
        el("Security Deposit", "securityDeposit"),
        el("Total Monthly Housing Cost", "totalHousing"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "transportation":
      return [
        el("Vehicle", "vehicleName"),
        el("Dealer", "dealer"),
        el("Purchase Price", "price"),
        el("Monthly Payment", "monthlyPayment"),
        el("APR", "apr"),
        el("Loan Term", "term"),
        el("Doc / Dealer Fees", "fees"),
        el("Total Cost of Ownership (est.)", "totalCost"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "budget":
      return [
        el("Monthly Net Income", "netIncome"),
        el("Housing", "housing"),
        el("Transportation", "transportation"),
        el("Food & Groceries", "food"),
        el("Utilities & Phone", "utilities"),
        el("Health & Personal", "health"),
        el("Entertainment & Subscriptions", "entertainment"),
        el("Clothing", "clothing"),
        el("Savings", "savings"),
        el("Monthly Surplus / Deficit", "surplus"),
        el("50/30/20 Notes", "budgetNotes"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "banking":
      return [
        el("Checking Account Bank", "checkingBank"),
        el("Savings Account Bank", "savingsBank"),
        el("HYSA APY", "savingsAPY"),
        el("Emergency Fund Target (3–6 mo.)", "emergencyFundGoal"),
        el("Monthly Emergency Savings", "monthlyEmergency"),
        el("Months to Fully Funded", "monthsToFund"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "credit":
      return [
        el("Estimated Starting Credit Score", "estimatedScore"),
        el("Student Loan Balance", "studentLoanBalance"),
        el("Repayment Plan", "repaymentPlan"),
        el("Monthly Student Loan Payment", "studentLoanPayment"),
        el("Credit Card Goal (limit & bank)", "creditCardGoal"),
        el("Target Credit Score at Year 2", "scoreGoal"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "insurance":
      return [
        el("Health Plan Tier", "healthPlan"),
        el("Monthly Premium", "monthlyPremium"),
        el("Annual Deductible", "deductible"),
        el("Out-of-Pocket Maximum", "oopMax"),
        el("Renters / Homeowners Insurance", "propertyInsurance"),
        el("Auto Insurance (monthly)", "autoInsurance"),
        el("Total Monthly Insurance Cost", "totalInsurance"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "investing":
      return [
        el("401(k) Contribution Rate", "contribution401k"),
        el("Employer Match", "employerMatch"),
        el("Roth IRA Monthly Contribution", "rothContribution"),
        el("Monthly Investment Total", "totalInvesting"),
        el("Projected Balance at Age 40", "projectedAt40"),
        el("Projected Balance at Age 65", "projectedAt65"),
        el("Investment Strategy / Notes", "strategy"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "net-worth":
      return [
        el("Total Assets (Year 1)", "assetsY1"),
        el("Total Liabilities (Year 1)", "liabilitiesY1"),
        el("Net Worth (Year 1)", "netWorthY1"),
        el("Projected Net Worth (Year 5)", "netWorthY5"),
        el("Projected Net Worth (Year 10)", "netWorthY10"),
        el("Biggest Financial Decision", "biggestDecision"),
        el("What I'd Do Differently", "doOver"),
        el("Generational Wealth Reflection", "reflection"),
      ].filter(Boolean) as React.ReactElement[];

    default:
      return [];
  }
}

// ── print styles ──────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0d1117;
    --surface: #161b22;
    --border: #21262d;
    --muted: #64748b;
    --text: #e2e8f0;
  }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #0d1117;
    color: #e2e8f0;
    min-height: 100vh;
  }

  .screen-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #0d1117;
    border-bottom: 1px solid #21262d;
    padding: 14px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .screen-bar-left { font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #64748b; }
  .screen-bar-title { font-size: 13px; font-weight: 900; letter-spacing: 0.15em; color: #e2e8f0; }

  .print-btn {
    background: #10b981;
    color: #fff;
    border: none;
    border-radius: 9999px;
    padding: 8px 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .print-btn:hover { opacity: 0.85; }

  .portfolio-wrap {
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 32px 80px;
  }

  /* Cover */
  .cover {
    border-bottom: 1px solid #21262d;
    padding-bottom: 40px;
    margin-bottom: 48px;
  }
  .cover-eyebrow {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: #10b981;
    margin-bottom: 12px;
  }
  .cover-name {
    font-size: 48px;
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1;
    color: #e2e8f0;
    margin-bottom: 8px;
  }
  .cover-meta {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 24px;
  }
  .cover-stats {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
    margin-top: 24px;
  }
  .cover-stat { }
  .cover-stat-num { font-size: 32px; font-weight: 900; color: #10b981; }
  .cover-stat-label { font-size: 10px; font-weight: 600; color: #64748b; letter-spacing: 0.15em; margin-top: 2px; }

  .cover-bar {
    margin-top: 24px;
    height: 4px;
    background: #21262d;
    border-radius: 9999px;
    overflow: hidden;
  }
  .cover-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #3b82f6);
    border-radius: 9999px;
  }

  /* Module sections */
  .module-section {
    border-left: 3px solid #21262d;
    padding-left: 20px;
    margin-bottom: 40px;
  }

  .module-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }

  .module-number {
    min-width: 32px;
    height: 32px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 900;
    color: #000;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .module-title-block { flex: 1; }
  .module-title { font-size: 18px; font-weight: 900; margin-bottom: 2px; }
  .module-subtitle { font-size: 12px; color: #64748b; }

  .module-status {
    font-size: 9px;
    font-weight: 600;
    border-radius: 9999px;
    padding: 3px 10px;
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 4px;
  }

  .field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
  }

  .field-row {
    border-bottom: 1px solid #1e293b;
    padding-bottom: 7px;
  }

  .field-label {
    display: block;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #475569;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .field-value {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
  }

  .module-empty {
    font-size: 12px;
    color: #334155;
    font-style: italic;
  }

  .module-date {
    margin-top: 12px;
    font-size: 10px;
    color: #4ade80;
  }

  /* Print overrides */
  @media print {
    body { background: #fff !important; color: #111 !important; }
    .screen-bar { display: none !important; }
    .portfolio-wrap { padding: 0; }
    .cover-eyebrow { color: #059669 !important; }
    .cover-name { color: #111 !important; }
    .cover-meta { color: #6b7280 !important; }
    .cover-stat-num { color: #059669 !important; }
    .cover-stat-label { color: #6b7280 !important; }
    .cover-bar { background: #e5e7eb !important; }
    .module-section { border-left-width: 3px; page-break-inside: avoid; }
    .module-title { }
    .module-subtitle { color: #6b7280 !important; }
    .module-number { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .field-row { border-color: #e5e7eb !important; }
    .field-label { color: #9ca3af !important; }
    .field-value { color: #111 !important; }
    .module-empty { color: #9ca3af !important; }
    .module-status { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .module-date { color: #059669 !important; }

    @page {
      margin: 0.75in 0.75in 0.75in 0.75in;
      size: letter portrait;
    }
  }
`;

// ── main component ─────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const router = useRouter();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/margins/login?next=/simulations/life-budget/portfolio");
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (json) setData(json as PortfolioData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div style={{ background: "#0d1117", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#64748b", fontSize: 13, letterSpacing: "0.1em" }}>Loading portfolio…</div>
      </div>
    );
  }

  if (!data) return null;

  const { progress, name } = data;

  const completedCount = LIFE_BUDGET_MODULES.filter((m) =>
    progress.find((p) => p.module_slug === m.slug && p.completed_at)
  ).length;
  const percent = Math.round((completedCount / LIFE_BUDGET_MODULES.length) * 100);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      {/* Screen nav bar (hidden on print) */}
      <div className="screen-bar">
        <a href="/simulations/life-budget" className="screen-bar-left">← LIFE BUDGET</a>
        <div className="screen-bar-title">PERSONAL FINANCE PORTFOLIO</div>
        <button className="print-btn" onClick={() => window.print()}>
          Download as PDF →
        </button>
      </div>

      {/* Portfolio document */}
      <div className="portfolio-wrap">

        {/* Cover */}
        <div className="cover">
          <p className="cover-eyebrow">PERSONAL FINANCE PORTFOLIO · EVERYDAY ECONOMICS</p>
          <h1 className="cover-name">{name}</h1>
          <p className="cover-meta">Prepared {today} · Sinonlearning</p>

          <div className="cover-stats">
            <div className="cover-stat">
              <div className="cover-stat-num">{completedCount}</div>
              <div className="cover-stat-label">modules complete</div>
            </div>
            <div className="cover-stat">
              <div className="cover-stat-num">{percent}%</div>
              <div className="cover-stat-label">portfolio filled</div>
            </div>
            <div className="cover-stat">
              <div className="cover-stat-num">10</div>
              <div className="cover-stat-label">total modules</div>
            </div>
          </div>

          <div className="cover-bar">
            <div className="cover-bar-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* Module sections */}
        {LIFE_BUDGET_MODULES.map((mod) => {
          const prog = progress.find((p) => p.module_slug === mod.slug);
          return <ModuleSection key={mod.slug} mod={mod} prog={prog} />;
        })}

      </div>
    </>
  );
}
