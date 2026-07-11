"use client";

const MONO = '"ui-monospace", "Cascadia Code", monospace';
const INK = "#0f172a";
const MUTED = "#64748b";
const LIGHT = "#f8fafc";
const BORDER = "#e2e8f0";

type Highlight = "gap" | "federal" | "fica" | "benefits" | "net";
type RowId = "gross" | "federal" | "state" | "ss" | "medicare" | "health" | "k401" | "total_ded" | "net";

interface PayStubVisualProps {
  highlightSection?: Highlight;
}

function rowStyle(
  id: RowId,
  hl?: Highlight,
): { bg?: string; borderColor?: string; dim?: boolean } {
  if (!hl) return {};

  if (hl === "gap") {
    if (id === "gross" || id === "net") return { bg: "#f0fdf4", borderColor: "#16a34a" };
    return { dim: true };
  }

  if (hl === "federal") {
    if (id === "federal") return { bg: "#fffbeb", borderColor: "#d97706" };
    return {};
  }

  if (hl === "fica") {
    if (id === "ss" || id === "medicare") return { bg: "#fff7ed", borderColor: "#ea580c" };
    return {};
  }

  if (hl === "benefits") {
    if (id === "health") return { bg: "#fef2f2", borderColor: "#dc2626" };
    if (id === "k401") return { bg: "#f0fdf4", borderColor: "#16a34a" };
    return {};
  }

  if (hl === "net") {
    if (id === "net") return { bg: "#f0fdf4", borderColor: "#16a34a" };
    return { dim: true };
  }

  return {};
}

function StubRow({
  id,
  label,
  amount,
  bold = false,
  hl,
}: {
  id: RowId;
  label: string;
  amount: string;
  bold?: boolean;
  hl?: Highlight;
}) {
  const s = rowStyle(id, hl);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 20px",
        background: s.bg ?? "transparent",
        borderLeft: `3px solid ${s.borderColor ?? "transparent"}`,
        opacity: s.dim ? 0.38 : 1,
        transition: "all 0.3s ease",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: bold ? 700 : 400, color: bold ? INK : MUTED }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: bold ? 700 : 500,
          color: INK,
          fontFamily: MONO,
          letterSpacing: "0.02em",
        }}
      >
        {amount}
      </span>
    </div>
  );
}

export default function PayStubVisual({ highlightSection: hl }: PayStubVisualProps) {
  return (
    <div style={{ fontFamily: "inherit" }}>
      {/* Header */}
      <div style={{ background: "#1e293b", color: "#fff", padding: "16px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              Apex Creative LLC
            </p>
            <p style={{ fontSize: 10, color: "#94a3b8" }}>Atlanta, GA 30303</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#94a3b8",
                marginBottom: 3,
              }}
            >
              Pay Statement
            </p>
            <p style={{ fontSize: 11, fontWeight: 700 }}>Marcus Thompson</p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            borderTop: "1px solid #334155",
            paddingTop: 10,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 9,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 2,
              }}
            >
              Pay Period
            </p>
            <p style={{ fontSize: 11, fontWeight: 600 }}>Oct 1 – Oct 31, 2026</p>
          </div>
          <div>
            <p
              style={{
                fontSize: 9,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 2,
              }}
            >
              Pay Date
            </p>
            <p style={{ fontSize: 11, fontWeight: 600 }}>Nov 1, 2026</p>
          </div>
        </div>
      </div>

      {/* EARNINGS */}
      <div
        style={{
          background: LIGHT,
          padding: "7px 20px 5px",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: MUTED,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Earnings
        </span>
      </div>
      <StubRow id="gross" label="Regular Pay" amount="$3,542.00" hl={hl} />
      <div style={{ borderTop: `1px solid ${BORDER}` }} />
      <StubRow id="gross" label="Gross Pay" amount="$3,542.00" bold hl={hl} />

      {/* DEDUCTIONS */}
      <div
        style={{
          background: LIGHT,
          padding: "7px 20px 5px",
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: MUTED,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Deductions
        </span>
      </div>
      <StubRow id="federal" label="Federal Income Tax" amount="$295.00" hl={hl} />
      <StubRow id="state" label="State Income Tax (GA)" amount="$105.00" hl={hl} />
      <StubRow id="ss" label="Social Security (6.2%)" amount="$220.00" hl={hl} />
      <StubRow id="medicare" label="Medicare (1.45%)" amount="$51.00" hl={hl} />
      <StubRow id="health" label="Health Insurance" amount="$140.00" hl={hl} />
      <StubRow id="k401" label="401(k) — 5%" amount="$177.00" hl={hl} />
      <div style={{ borderTop: `1px solid ${BORDER}` }} />
      <StubRow id="total_ded" label="Total Deductions" amount="$988.00" bold hl={hl} />

      {/* NET PAY */}
      <div style={{ borderTop: `2px solid ${BORDER}` }} />
      <StubRow id="net" label="Net Pay" amount="$2,554.00" bold hl={hl} />
    </div>
  );
}
