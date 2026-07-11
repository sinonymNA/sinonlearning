"use client";

const MONO = '"ui-monospace", "Cascadia Code", monospace';

type Highlight = "affordability" | "deposit" | "term" | "utilities" | "insurance";

interface LeaseVisualProps {
  highlightSection?: Highlight;
}

function sectionStyle(
  id: Highlight,
  hl?: Highlight,
): { bg?: string; borderColor?: string; dim?: boolean } {
  if (!hl) return {};
  if (hl === id) return { bg: "#f0f9ff", borderColor: "#0891b2" };
  return { dim: true };
}

function LeaseRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        padding: "5px 0",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", paddingRight: 8, lineHeight: 1.5 }}>
        {label}
      </span>
      <span style={{ fontSize: 11, color: "#111827", fontFamily: mono ? MONO : "inherit", lineHeight: 1.5 }}>
        {value}
      </span>
    </div>
  );
}

function SectionBlock({
  id,
  hl,
  children,
}: {
  id: Highlight;
  hl?: Highlight;
  children: React.ReactNode;
}) {
  const s = sectionStyle(id, hl);
  return (
    <div
      style={{
        borderLeft: `3px solid ${s.borderColor ?? "transparent"}`,
        background: s.bg ?? "transparent",
        opacity: s.dim ? 0.3 : 1,
        transition: "all 0.3s ease",
        padding: "8px 10px",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function ClauseLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 8, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
      {children}
    </p>
  );
}

function ClauseText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, color: "#374151", lineHeight: 1.55 }}>
      {children}
    </p>
  );
}

export default function LeaseVisual({ highlightSection: hl }: LeaseVisualProps) {
  return (
    <div style={{ background: "#fffef8", fontFamily: "inherit" }}>

      {/* Perforated line */}
      <div style={{
        borderBottom: "1px dashed #9ca3af",
        textAlign: "center",
        padding: "7px 0 0",
        fontSize: 8,
        letterSpacing: "0.1em",
        color: "#9ca3af",
        textTransform: "uppercase",
      }}>
        ✂&nbsp;&nbsp;Residential Lease Agreement — Retain for Your Records&nbsp;&nbsp;✂
      </div>

      {/* Header */}
      <div style={{
        padding: "10px 14px 8px",
        borderBottom: "1px solid #111827",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
          Residential Lease Agreement
        </p>
        <p style={{ fontSize: 9, color: "#6b7280" }}>
          Peach State Properties LLC &nbsp;·&nbsp; Atlanta, GA
        </p>
      </div>

      {/* Parties */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #9ca3af", marginTop: 8, fontSize: 11 }}>
        <div style={{ padding: "6px 8px", borderRight: "1px solid #9ca3af" }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Tenant</p>
          <p style={{ fontWeight: 700, color: "#111827", marginBottom: 1 }}>Maya Chen</p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>First-time lessee</p>
        </div>
        <div style={{ padding: "6px 8px" }}>
          <p style={{ fontSize: 8, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Property</p>
          <p style={{ fontWeight: 700, color: "#111827", marginBottom: 1 }}>347 Juniper St, Apt 4B</p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>Atlanta, GA 30308</p>
        </div>
      </div>

      <div style={{ marginTop: 8, paddingLeft: 4, paddingRight: 4 }}>

        {/* Rent & Affordability */}
        <SectionBlock id="affordability" hl={hl}>
          <ClauseLabel>§1 — Monthly Rent</ClauseLabel>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", padding: "3px 0", borderBottom: "1px solid #e5e7eb" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em" }}>Monthly Rent</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#111827", fontFamily: MONO }}>$1,150.00</span>
          </div>
          <div style={{ marginTop: 5, padding: "6px 8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6 }}>
            <p style={{ fontSize: 9, color: "#64748b" }}>
              <strong style={{ color: "#0f172a" }}>30% guide:</strong> At $54,000/year gross, 30% of gross = $1,350 max.
              30% of net take-home ($3,380) = $1,014. Rent is 25.6% of gross but 34% of net — before utilities.
            </p>
          </div>
        </SectionBlock>

        {/* Security Deposit */}
        <SectionBlock id="deposit" hl={hl}>
          <ClauseLabel>§2 — Security Deposit</ClauseLabel>
          <LeaseRow label="Security Deposit" value="$1,725.00 (1.5 months)" mono />
          <LeaseRow label="Due at Signing" value="$1,150.00 (first month) + $1,725.00 deposit = $2,875.00" />
          <LeaseRow label="Return Timeline" value="Within 30 days of move-out, less any deductions for damages" />
        </SectionBlock>

        {/* Lease Term */}
        <SectionBlock id="term" hl={hl}>
          <ClauseLabel>§3 — Lease Term</ClauseLabel>
          <LeaseRow label="Lease Term" value="Dec 1, 2026 – Nov 30, 2027 (12 months)" />
          <LeaseRow label="Month-to-Month" value="Converts automatically after term; 60-day notice required to vacate" />
          <LeaseRow label="Early Termination" value="2 months' rent penalty ($2,300) + forfeit of security deposit" />
        </SectionBlock>

        {/* Utilities */}
        <SectionBlock id="utilities" hl={hl}>
          <ClauseLabel>§4 — Utilities</ClauseLabel>
          <ClauseText>
            Tenant is solely responsible for all utility accounts and charges, including electricity,
            gas, water/sewer, internet, and trash. Utilities are <strong>not included</strong> in rent.
            Estimated monthly utility cost: <strong style={{ fontFamily: MONO }}>$75–$200</strong> depending on season and usage.
          </ClauseText>
        </SectionBlock>

        {/* Renters Insurance */}
        <SectionBlock id="insurance" hl={hl}>
          <ClauseLabel>§8 — Renters Insurance</ClauseLabel>
          <ClauseText>
            Tenant <strong>must maintain</strong> a valid renters insurance policy throughout the lease term.
            Minimum liability coverage: $100,000. Policy must name Peach State Properties LLC as additional
            interested party. Proof of coverage required within 14 days of move-in.
            Typical cost: <strong>$12–$18/month</strong>.
          </ClauseText>
        </SectionBlock>

      </div>

      {/* Signature block */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        borderTop: "2px solid #111827",
        padding: "8px 14px 10px",
        gap: 20,
        marginTop: 4,
      }}>
        <div>
          <div style={{ borderBottom: "1px solid #111827", height: 20, marginBottom: 4 }} />
          <p style={{ fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tenant Signature / Date</p>
        </div>
        <div>
          <div style={{ borderBottom: "1px solid #111827", height: 20, marginBottom: 4 }} />
          <p style={{ fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Landlord Signature / Date</p>
        </div>
      </div>

    </div>
  );
}
