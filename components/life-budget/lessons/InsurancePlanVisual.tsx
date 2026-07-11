"use client";

const MONO = '"ui-monospace", "Cascadia Code", monospace';

type Highlight = "premium" | "deductible" | "copay" | "coinsurance" | "oopmax";

interface InsurancePlanVisualProps {
  highlightSection?: Highlight;
}

const PLANS = [
  {
    tier: "Bronze",
    color: "#78716c",
    bg: "#fafaf9",
    premium: "$148/mo",
    deductible: "$6,500",
    pcCopay: "$50",
    specCopay: "$90",
    rxCopay: "$20",
    coinsurance: "40% you pay",
    oopMax: "$8,700",
    selected: false,
  },
  {
    tier: "Silver",
    color: "#059669",
    bg: "#f0fdf4",
    premium: "$235/mo",
    deductible: "$2,000",
    pcCopay: "$25",
    specCopay: "$50",
    rxCopay: "$10",
    coinsurance: "20% you pay",
    oopMax: "$6,000",
    selected: true,
  },
  {
    tier: "Gold",
    color: "#d97706",
    bg: "#fffbeb",
    premium: "$360/mo",
    deductible: "$800",
    pcCopay: "$15",
    specCopay: "$30",
    rxCopay: "$5",
    coinsurance: "10% you pay",
    oopMax: "$4,500",
    selected: false,
  },
] as const;

const ROWS: { id: Highlight; label: string; key: keyof (typeof PLANS)[number] }[] = [
  { id: "premium", label: "Monthly Premium", key: "premium" },
  { id: "deductible", label: "Annual Deductible", key: "deductible" },
  { id: "copay", label: "Primary Care Copay", key: "pcCopay" },
  { id: "copay", label: "Specialist Copay", key: "specCopay" },
  { id: "copay", label: "Generic Rx Copay", key: "rxCopay" },
  { id: "coinsurance", label: "Coinsurance", key: "coinsurance" },
  { id: "oopmax", label: "Out-of-Pocket Max", key: "oopMax" },
];

function rowHighlight(id: Highlight, hl?: Highlight): boolean {
  return hl === id;
}

export default function InsurancePlanVisual({ highlightSection: hl }: InsurancePlanVisualProps) {
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
        ✂&nbsp;&nbsp;Open Enrollment — Health Plan Selection 2027&nbsp;&nbsp;✂
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px 8px", borderBottom: "1px solid #111827" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
            Apex Creative LLC
          </p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>Benefits Enrollment &nbsp;·&nbsp; Plan Year 2027 &nbsp;·&nbsp; Maya Chen</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "#dc2626", fontWeight: 700 }}>Deadline: Nov 15, 2026</p>
        </div>
      </div>

      {/* Plan tier headers */}
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr", borderBottom: "1px solid #9ca3af" }}>
        <div style={{ background: "#e5e7eb", padding: "8px 10px" }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Plan Details
          </p>
        </div>
        {PLANS.map((plan) => (
          <div
            key={plan.tier}
            style={{
              background: plan.selected ? plan.bg : "#f9fafb",
              padding: "8px 10px",
              textAlign: "center",
              borderLeft: "1px solid #d1d5db",
              borderTop: plan.selected ? `3px solid ${plan.color}` : "3px solid transparent",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 800, color: plan.color, letterSpacing: "0.06em" }}>
              {plan.tier}
            </p>
            {plan.selected && (
              <span style={{
                fontSize: 8, fontWeight: 700, color: plan.color,
                background: plan.bg, border: `1px solid ${plan.color}`,
                borderRadius: 4, padding: "1px 5px", marginTop: 2, display: "inline-block",
              }}>
                ✓ Selected
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Plan rows */}
      {ROWS.map(({ id, label, key }, i) => {
        const isHighlighted = rowHighlight(id, hl);
        const isDimmed = hl && !isHighlighted;
        return (
          <div
            key={`${label}-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 1fr 1fr",
              borderBottom: "1px solid #e5e7eb",
              borderLeft: `3px solid ${isHighlighted ? "#059669" : "transparent"}`,
              background: isHighlighted ? "#f0fdf4" : "transparent",
              opacity: isDimmed ? 0.3 : 1,
              transition: "all 0.3s ease",
            }}
          >
            <div style={{ padding: "6px 10px", background: "#f9fafb", borderRight: "1px solid #e5e7eb" }}>
              <span style={{ fontSize: 10, color: "#374151", fontWeight: 500 }}>{label}</span>
            </div>
            {PLANS.map((plan) => (
              <div
                key={plan.tier}
                style={{
                  padding: "6px 10px",
                  textAlign: "center",
                  borderLeft: "1px solid #e5e7eb",
                  background: plan.selected ? (isHighlighted ? "#ecfdf5" : "#fafffe") : "transparent",
                }}
              >
                <span style={{
                  fontSize: 11, fontFamily: MONO,
                  fontWeight: plan.selected ? 700 : 400,
                  color: plan.selected ? plan.color : "#6b7280",
                }}>
                  {plan[key] as string}
                </span>
              </div>
            ))}
          </div>
        );
      })}

      {/* Yearly cost estimate row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr 1fr 1fr",
        borderTop: "2px solid #111827",
        borderBottom: "1px solid #9ca3af",
      }}>
        <div style={{ padding: "6px 10px", background: "#f3f4f6" }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Annual Premium
          </span>
        </div>
        {PLANS.map((plan) => (
          <div key={plan.tier} style={{ padding: "6px 10px", textAlign: "center", borderLeft: "1px solid #d1d5db", background: plan.selected ? plan.bg : "#f9fafb" }}>
            <span style={{ fontSize: 12, fontWeight: 800, fontFamily: MONO, color: plan.color }}>
              ${(parseInt(plan.premium.replace("$", "").replace("/mo", "")) * 12).toLocaleString()}
            </span>
            <p style={{ fontSize: 8, color: "#6b7280" }}>per year</p>
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 14px 10px", background: "#f8fafc" }}>
        <p style={{ fontSize: 9, color: "#64748b", lineHeight: 1.5 }}>
          <strong style={{ color: "#0f172a" }}>Apex Creative LLC pays 60%</strong> of your premium.
          Amounts shown are your employee contribution. The Gold plan costs $125/month more than Silver —
          that&apos;s $1,500/year to lower your deductible by $1,200.
        </p>
      </div>
    </div>
  );
}
