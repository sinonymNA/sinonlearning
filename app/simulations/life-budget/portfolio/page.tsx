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
            background: completed ? "#f0fdf4" : started ? "#fffbeb" : "#f5f5f5",
            color: completed ? "#15803d" : started ? "#b45309" : "#78716c",
            border: `1px solid ${completed ? "#bbf7d0" : started ? "#fde68a" : "#ddd5c8"}`,
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
        el("BLS Median Annual", "blsMedianAnnual"),
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
        el("Paycheck Reflection", "paycheckReflection"),
        el("Notes", "notes"),
      ].filter(Boolean) as React.ReactElement[];

    case "housing":
      return [
        el("City", "city"),
        el("Housing Decision", "housingType"),
        el("Monthly Rent / Mortgage", "monthlyPayment"),
        el("Utilities (estimated)", "utilities"),
        el("Renters / Homeowners Insurance", "rentersInsurance"),
        el("Security Deposit", "securityDeposit"),
        el("Total Monthly Housing Cost", "totalHousing"),
        el("Listing URL", "listingUrl"),
        el("Housing Reflection", "housingReflection"),
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

// ── styles (screen = paper look; print = clean white document) ────────────────

const PRINT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: Georgia, 'Times New Roman', serif;
    background: #ccc0aa;
    color: #1c1917;
    min-height: 100vh;
  }

  .screen-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #faf8f3;
    border-bottom: 1px solid #ddd5c8;
    padding: 12px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }

  .screen-bar-left {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    color: #78716c;
    text-decoration: none;
    font-family: system-ui, sans-serif;
  }
  .screen-bar-left:hover { color: #1c1917; }

  .screen-bar-title {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.22em;
    color: #1c1917;
    font-family: system-ui, sans-serif;
  }

  .print-btn {
    background: #15803d;
    color: #fff;
    border: none;
    border-radius: 9999px;
    padding: 8px 20px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    cursor: pointer;
    font-family: system-ui, sans-serif;
    transition: opacity 0.15s;
  }
  .print-btn:hover { opacity: 0.85; }

  /* The portfolio document — looks like paper on screen */
  .portfolio-wrap {
    max-width: 820px;
    margin: 32px auto;
    background: #faf8f3;
    border: 1px solid #ddd5c8;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08);
    padding: 56px 64px 80px;
  }

  /* Cover */
  .cover {
    border-bottom: 2px solid #1c1917;
    padding-bottom: 40px;
    margin-bottom: 48px;
  }
  .cover-eyebrow {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.32em;
    color: #15803d;
    margin-bottom: 16px;
    font-family: system-ui, sans-serif;
    text-transform: uppercase;
  }
  .cover-name {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -0.5px;
    line-height: 1;
    color: #1c1917;
    margin-bottom: 6px;
    font-family: system-ui, sans-serif;
  }
  .cover-meta {
    font-size: 12px;
    color: #78716c;
    margin-bottom: 28px;
    font-family: system-ui, sans-serif;
  }
  .cover-stats {
    display: flex;
    gap: 40px;
    flex-wrap: wrap;
    margin-top: 20px;
  }
  .cover-stat-num {
    font-size: 32px;
    font-weight: 900;
    color: #15803d;
    font-family: system-ui, sans-serif;
    line-height: 1;
  }
  .cover-stat-label {
    font-size: 9px;
    font-weight: 700;
    color: #78716c;
    letter-spacing: 0.16em;
    margin-top: 4px;
    text-transform: uppercase;
    font-family: system-ui, sans-serif;
  }

  .cover-bar {
    margin-top: 28px;
    height: 3px;
    background: #ddd5c8;
    border-radius: 0;
    overflow: hidden;
  }
  .cover-bar-fill {
    height: 100%;
    background: #15803d;
    border-radius: 0;
  }

  /* Module sections */
  .module-section {
    border-left: 3px solid #ddd5c8;
    padding-left: 20px;
    margin-bottom: 44px;
    page-break-inside: avoid;
  }

  .module-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }

  .module-number {
    min-width: 30px;
    height: 30px;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 900;
    color: #fff;
    flex-shrink: 0;
    margin-top: 2px;
    font-family: system-ui, sans-serif;
    letter-spacing: 0.05em;
  }

  .module-title-block { flex: 1; }
  .module-title {
    font-size: 17px;
    font-weight: 900;
    margin-bottom: 2px;
    font-family: system-ui, sans-serif;
  }
  .module-subtitle {
    font-size: 11px;
    color: #78716c;
    font-family: system-ui, sans-serif;
    font-style: italic;
  }

  .module-status {
    font-size: 9px;
    font-weight: 700;
    border-radius: 9999px;
    padding: 3px 10px;
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 4px;
    font-family: system-ui, sans-serif;
    letter-spacing: 0.08em;
  }

  .field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 32px;
  }

  .field-row {
    border-bottom: 1px solid #ddd5c8;
    padding: 6px 0;
  }

  .field-label {
    display: block;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: #78716c;
    text-transform: uppercase;
    margin-bottom: 2px;
    font-family: system-ui, sans-serif;
  }

  .field-value {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #1c1917;
    font-family: system-ui, sans-serif;
  }

  .module-empty {
    font-size: 12px;
    color: #a8a29e;
    font-style: italic;
    font-family: system-ui, sans-serif;
  }

  .module-date {
    margin-top: 10px;
    font-size: 9px;
    color: #15803d;
    font-weight: 700;
    letter-spacing: 0.1em;
    font-family: system-ui, sans-serif;
    text-transform: uppercase;
  }

  /* Print overrides */
  @media print {
    body { background: #fff !important; }

    .screen-bar { display: none !important; }

    .portfolio-wrap {
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      max-width: 100% !important;
    }

    .cover { border-bottom-color: #1c1917 !important; }
    .cover-eyebrow { color: #15803d !important; }
    .cover-name { color: #1c1917 !important; }
    .cover-meta { color: #78716c !important; }
    .cover-stat-num { color: #15803d !important; }
    .cover-bar { background: #ddd5c8 !important; }
    .cover-bar-fill { background: #15803d !important; }

    .module-section { border-left-width: 3px; }
    .module-number { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .module-subtitle { color: #78716c !important; }
    .field-row { border-color: #ddd5c8 !important; }
    .field-label { color: #78716c !important; }
    .field-value { color: #1c1917 !important; }
    .module-empty { color: #a8a29e !important; }
    .module-status { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .module-date { color: #15803d !important; }

    @page {
      margin: 0.75in;
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
      <div style={{ background: "#ccc0aa", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#78716c", fontSize: 13, letterSpacing: "0.1em", fontFamily: "system-ui, sans-serif" }}>Loading portfolio…</div>
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

      {/* Portfolio document — looks like paper on screen */}
      <div className="portfolio-wrap">

        {/* Cover */}
        <div className="cover">
          <p className="cover-eyebrow">Personal Finance Portfolio · Everyday Economics</p>
          <h1 className="cover-name">{name}</h1>
          <p className="cover-meta">Prepared {today}</p>

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
