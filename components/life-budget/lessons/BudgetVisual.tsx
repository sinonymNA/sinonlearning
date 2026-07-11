"use client";

const MONO = '"ui-monospace", "Cascadia Code", monospace';

type Highlight = "framework" | "fixed" | "variance" | "emergency" | "zerobased";
type RowId = "rent" | "loan" | "carins" | "phone" | "groceries" | "gas" | "dining" | "misc" | "emergency" | "total";

interface BudgetVisualProps {
  highlightSection?: Highlight;
}

function rowStyle(
  id: RowId,
  hl?: Highlight,
): { bg?: string; borderColor?: string; dim?: boolean } {
  if (!hl) return {};

  if (hl === "framework") {
    return {};
  }

  if (hl === "fixed") {
    if (id === "rent" || id === "loan" || id === "carins" || id === "phone") {
      return { bg: "#eff6ff", borderColor: "#3b82f6" };
    }
    return { dim: true };
  }

  if (hl === "variance") {
    if (id === "dining") return { bg: "#fef2f2", borderColor: "#dc2626" };
    if (id === "misc") return { bg: "#fff7ed", borderColor: "#f59e0b" };
    return {};
  }

  if (hl === "emergency") {
    if (id === "emergency") return { bg: "#f0fdf4", borderColor: "#16a34a" };
    return { dim: true };
  }

  if (hl === "zerobased") {
    if (id === "total") return { bg: "#f0fdf4", borderColor: "#16a34a" };
    return {};
  }

  return {};
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      background: "#f3f4f6",
      borderTop: "1px solid #9ca3af",
      borderBottom: "1px solid #9ca3af",
      padding: "4px 10px",
      fontSize: 9,
      fontWeight: 800,
      color: "#374151",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    }}>
      {label}
    </div>
  );
}

function ColHeaders() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 72px 72px 72px",
      background: "#e5e7eb",
      borderTop: "1px solid #9ca3af",
      borderBottom: "1px solid #9ca3af",
      padding: "4px 10px",
    }}>
      {["Category", "Budget", "Actual", "Variance"].map((h, i) => (
        <span key={h} style={{
          fontSize: 9, fontWeight: 700, color: "#374151",
          textTransform: "uppercase", letterSpacing: "0.07em",
          textAlign: i > 0 ? "right" : "left",
        }}>
          {h}
        </span>
      ))}
    </div>
  );
}

function BudgetRow({
  id,
  label,
  budget,
  actual,
  variance,
  bold = false,
  hl,
}: {
  id: RowId;
  label: string;
  budget: string;
  actual: string;
  variance: string;
  bold?: boolean;
  hl?: Highlight;
}) {
  const s = rowStyle(id, hl);
  const isNeg = variance.startsWith("-");
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 72px 72px 72px",
      padding: "5px 10px",
      borderBottom: "1px solid #d1d5db",
      borderLeft: `3px solid ${s.borderColor ?? "transparent"}`,
      background: s.bg ?? "transparent",
      opacity: s.dim ? 0.3 : 1,
      transition: "all 0.3s ease",
    }}>
      <span style={{ fontSize: 11, fontWeight: bold ? 700 : 400, color: bold ? "#111827" : "#374151" }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, textAlign: "right", color: "#6b7280" }}>
        {budget}
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, textAlign: "right", fontWeight: bold ? 700 : 400, color: "#111827" }}>
        {actual}
      </span>
      <span style={{
        fontSize: 11, fontFamily: MONO, textAlign: "right",
        fontWeight: bold ? 700 : 400,
        color: isNeg ? "#dc2626" : variance === "$0" ? "#9ca3af" : "#16a34a",
      }}>
        {variance}
      </span>
    </div>
  );
}

function FrameworkBar({ hl }: { hl?: Highlight }) {
  const isActive = hl === "framework" || hl === "zerobased";
  return (
    <div style={{
      padding: "8px 10px",
      background: isActive ? "#f0fdf4" : "#f8fafc",
      borderBottom: "1px solid #d1d5db",
      borderLeft: `3px solid ${isActive ? "#16a34a" : "transparent"}`,
      transition: "all 0.3s ease",
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
        50/30/20 Guide vs. Actual Split
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { label: "Needs", pct: "52%", target: "50%", color: "#3b82f6" },
          { label: "Wants", pct: "21%", target: "30%", color: "#f59e0b" },
          { label: "Savings", pct: "27%", target: "20%", color: "#16a34a" },
        ].map(({ label, pct, target, color }) => (
          <div key={label} style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 8px" }}>
            <div style={{ width: "100%", height: 4, background: "#e2e8f0", borderRadius: 2, marginBottom: 4 }}>
              <div style={{ width: pct, height: 4, background: color, borderRadius: 2 }} />
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 1 }}>{pct}</p>
            <p style={{ fontSize: 8, color: "#6b7280" }}>{label} <span style={{ color: "#9ca3af" }}>({target} target)</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BudgetVisual({ highlightSection: hl }: BudgetVisualProps) {
  return (
    <div style={{ background: "#fffef8", fontFamily: "inherit" }}>

      {/* Header */}
      <div style={{
        borderBottom: "1px dashed #9ca3af",
        textAlign: "center",
        padding: "7px 0 0",
        fontSize: 8,
        letterSpacing: "0.1em",
        color: "#9ca3af",
        textTransform: "uppercase",
      }}>
        ✂&nbsp;&nbsp;Monthly Budget Tracker — November 2026&nbsp;&nbsp;✂
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px 8px", borderBottom: "1px solid #111827" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
            Monthly Budget
          </p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>Jordan Williams &nbsp;·&nbsp; November 2026</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "#6b7280", marginBottom: 1 }}>Monthly Net Income</p>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#111827", fontFamily: MONO }}>$2,700.00</p>
        </div>
      </div>

      <FrameworkBar hl={hl} />

      <div style={{ marginTop: 6 }}>
        <ColHeaders />

        <SectionHeader label="Fixed Expenses (Needs)" />
        <BudgetRow id="rent" label="Rent" budget="$950" actual="$950" variance="$0" hl={hl} />
        <BudgetRow id="loan" label="Student Loan (min.)" budget="$316" actual="$316" variance="$0" hl={hl} />
        <BudgetRow id="carins" label="Car Insurance" budget="$90" actual="$90" variance="$0" hl={hl} />
        <BudgetRow id="phone" label="Phone" budget="$65" actual="$65" variance="$0" hl={hl} />

        <SectionHeader label="Variable Expenses (Wants)" />
        <BudgetRow id="groceries" label="Groceries" budget="$250" actual="$238" variance="+$12" hl={hl} />
        <BudgetRow id="gas" label="Gas" budget="$75" actual="$81" variance="-$6" hl={hl} />
        <BudgetRow id="dining" label="Dining Out" budget="$200" actual="$340" variance="-$140" hl={hl} />
        <BudgetRow id="misc" label="Miscellaneous" budget="$100" actual="$180" variance="-$80" hl={hl} />

        <SectionHeader label="Savings" />
        <BudgetRow id="emergency" label="Emergency Fund" budget="$654" actual="$440" variance="-$214" hl={hl} />

        <div style={{ borderTop: "2px solid #111827" }} />
        <BudgetRow id="total" label="Total" budget="$2,700" actual="$2,700" variance="$0" bold hl={hl} />
      </div>

    </div>
  );
}
