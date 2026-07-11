"use client";

const MONO = '"ui-monospace", "Cascadia Code", monospace';

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

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        background: "#f3f4f6",
        borderTop: "1px solid #9ca3af",
        borderBottom: "1px solid #9ca3af",
        padding: "4px 10px",
        fontSize: 9,
        fontWeight: 800,
        color: "#374151",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
}

function ColHeaders() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 85px 78px",
        background: "#e5e7eb",
        borderTop: "1px solid #9ca3af",
        borderBottom: "1px solid #9ca3af",
        padding: "4px 10px",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#374151",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Description
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#374151",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          textAlign: "right",
        }}
      >
        Current
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "#374151",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          textAlign: "right",
        }}
      >
        YTD
      </span>
    </div>
  );
}

function StubRow({
  id,
  label,
  current,
  ytd,
  bold = false,
  netStyle = false,
  hl,
}: {
  id: RowId;
  label: string;
  current: string;
  ytd?: string;
  bold?: boolean;
  netStyle?: boolean;
  hl?: Highlight;
}) {
  const s = rowStyle(id, hl);
  const size = netStyle ? 13 : 11;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 85px 78px",
        padding: netStyle ? "8px 10px" : "5px 10px",
        borderBottom: "1px solid #d1d5db",
        borderLeft: `3px solid ${s.borderColor ?? "transparent"}`,
        background: s.bg ?? (netStyle ? "#f9fafb" : "transparent"),
        opacity: s.dim ? 0.35 : 1,
        transition: "all 0.3s ease",
      }}
    >
      <span
        style={{
          fontSize: size,
          fontWeight: bold ? 700 : 400,
          color: bold ? "#111827" : "#374151",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: size,
          fontFamily: MONO,
          textAlign: "right",
          fontWeight: bold ? 700 : 400,
          color: "#111827",
          letterSpacing: "0.01em",
        }}
      >
        {current}
      </span>
      <span
        style={{
          fontSize: netStyle ? 11 : 10,
          fontFamily: MONO,
          textAlign: "right",
          color: "#9ca3af",
        }}
      >
        {ytd ?? ""}
      </span>
    </div>
  );
}

export default function PayStubVisual({ highlightSection: hl }: PayStubVisualProps) {
  return (
    <div style={{ background: "#fffef8", fontFamily: "inherit" }}>

      {/* Perforated tear-off line */}
      <div
        style={{
          borderBottom: "1px dashed #9ca3af",
          textAlign: "center",
          padding: "7px 0 0",
          fontSize: 8,
          letterSpacing: "0.1em",
          color: "#9ca3af",
          textTransform: "uppercase",
        }}
      >
        ✂&nbsp;&nbsp;Detach and Retain for Your Records&nbsp;&nbsp;✂
      </div>

      {/* Company letterhead */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "10px 14px 8px",
          borderBottom: "1px solid #111827",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#111827",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Apex Creative LLC
          </p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>
            1234 Peachtree St NW &nbsp;·&nbsp; Atlanta, GA 30303
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#374151",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              lineHeight: 1.4,
            }}
          >
            Earnings<br />Statement
          </p>
        </div>
      </div>

      {/* Employee info grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          border: "1px solid #9ca3af",
          marginTop: 8,
          fontSize: 11,
        }}
      >
        <div style={{ padding: "6px 8px", borderRight: "1px solid #9ca3af" }}>
          <p
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 3,
            }}
          >
            Employee
          </p>
          <p style={{ fontWeight: 700, color: "#111827", marginBottom: 3 }}>Marcus Thompson</p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>ID: EMP-4892</p>
        </div>

        <div style={{ padding: "6px 8px", borderRight: "1px solid #9ca3af" }}>
          <p
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 3,
            }}
          >
            Pay Period
          </p>
          <p style={{ fontWeight: 600, color: "#111827", marginBottom: 8 }}>Oct 1 – 31, 2026</p>
          <p
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 3,
            }}
          >
            Pay Date
          </p>
          <p style={{ fontWeight: 600, color: "#111827" }}>Nov 1, 2026</p>
        </div>

        <div style={{ padding: "6px 8px" }}>
          <p
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 3,
            }}
          >
            Check No.
          </p>
          <p style={{ fontWeight: 600, color: "#111827", fontFamily: MONO, marginBottom: 8 }}>001847</p>
          <p
            style={{
              fontSize: 8,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 3,
            }}
          >
            Frequency
          </p>
          <p style={{ fontWeight: 600, color: "#111827" }}>Monthly</p>
        </div>
      </div>

      {/* Table header row */}
      <div style={{ marginTop: 10 }}>
        <ColHeaders />
      </div>

      {/* EARNINGS */}
      <SectionHeader label="Earnings" />
      <StubRow id="gross" label="Regular Pay" current="$3,542.00" ytd="$35,420.00" hl={hl} />
      <StubRow id="gross" label="Gross Pay" current="$3,542.00" ytd="$35,420.00" bold hl={hl} />

      {/* DEDUCTIONS */}
      <SectionHeader label="Deductions" />
      <StubRow id="federal" label="Federal Income Tax" current="$295.00" ytd="$2,950.00" hl={hl} />
      <StubRow id="state" label="State Income Tax (GA)" current="$105.00" ytd="$1,050.00" hl={hl} />
      <StubRow id="ss" label="Social Security (6.2%)" current="$220.00" ytd="$2,200.00" hl={hl} />
      <StubRow id="medicare" label="Medicare (1.45%)" current="$51.00" ytd="$510.00" hl={hl} />
      <StubRow id="health" label="Health Insurance" current="$140.00" ytd="$1,400.00" hl={hl} />
      <StubRow id="k401" label="401(k) — 5%" current="$177.00" ytd="$1,770.00" hl={hl} />
      <StubRow id="total_ded" label="Total Deductions" current="$988.00" ytd="$9,880.00" bold hl={hl} />

      {/* NET PAY */}
      <div style={{ borderTop: "2px solid #111827" }} />
      <StubRow id="net" label="Net Pay" current="$2,554.00" bold netStyle hl={hl} />
    </div>
  );
}
