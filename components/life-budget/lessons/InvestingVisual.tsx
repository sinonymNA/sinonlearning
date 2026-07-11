"use client";

const MONO = '"ui-monospace", "Cascadia Code", monospace';

type Highlight = "contribution" | "match" | "fund" | "targetdate" | "compound";

interface InvestingVisualProps {
  highlightSection?: Highlight;
}

function sectionStyle(
  id: Highlight,
  hl?: Highlight,
): { bg?: string; borderColor?: string; dim?: boolean } {
  if (!hl) return {};
  if (hl === id) return { bg: "#fffbeb", borderColor: "#d97706" };
  return { dim: true };
}

function SectionPanel({
  id,
  hl,
  title,
  badge,
  children,
}: {
  id: Highlight;
  hl?: Highlight;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const s = sectionStyle(id, hl);
  return (
    <div style={{
      borderLeft: `3px solid ${s.borderColor ?? "transparent"}`,
      background: s.bg ?? "transparent",
      opacity: s.dim ? 0.3 : 1,
      transition: "all 0.3s ease",
      padding: "8px 10px",
      marginBottom: 4,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {title}
        </p>
        {badge && (
          <span style={{
            fontSize: 8, fontWeight: 700, color: "#d97706",
            background: "#fef3c7", borderRadius: 4, padding: "2px 6px",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function DataRow({ label, value, highlight = false, sub }: { label: string; value: string; highlight?: boolean; sub?: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "5px 0", borderBottom: "1px solid #e5e7eb" }}>
      <div>
        <span style={{ fontSize: 11, color: "#374151" }}>{label}</span>
        {sub && <p style={{ fontSize: 9, color: "#9ca3af", marginTop: 1 }}>{sub}</p>}
      </div>
      <span style={{
        fontSize: 11, fontFamily: MONO, fontWeight: highlight ? 700 : 400,
        color: highlight ? "#111827" : "#6b7280",
      }}>
        {value}
      </span>
    </div>
  );
}

export default function InvestingVisual({ highlightSection: hl }: InvestingVisualProps) {
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
        ✂&nbsp;&nbsp;401(k) Enrollment Confirmation — Retain for Your Records&nbsp;&nbsp;✂
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px 8px", borderBottom: "1px solid #111827" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
            Vanguard 401(k) Plan
          </p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>Meridian Analytics Inc. &nbsp;·&nbsp; Marcus Thompson &nbsp;·&nbsp; EMP-4892</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "#6b7280", marginBottom: 1 }}>Enrollment Date</p>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Nov 30, 2026</p>
        </div>
      </div>

      <div style={{ padding: "6px 4px" }}>

        {/* Contribution */}
        <SectionPanel id="contribution" hl={hl} title="Your Contribution">
          <DataRow label="Annual Salary" value="$42,500.00" />
          <DataRow label="Contribution Rate" value="6.0%" highlight />
          <DataRow label="Monthly Contribution" value="$212.50" highlight sub="Deducted pre-tax from each paycheck" />
          <DataRow label="Annual Contribution" value="$2,550.00" />
          <div style={{ marginTop: 6, padding: "6px 8px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6 }}>
            <p style={{ fontSize: 9, color: "#64748b" }}>
              Pre-tax means you pay <strong>no income tax</strong> on this money now.
              At your tax rate, $212.50 out-of-pocket reduces your take-home by only ~$185.
            </p>
          </div>
        </SectionPanel>

        {/* Employer match */}
        <SectionPanel id="match" hl={hl} title="Employer Match" badge="Free money">
          <DataRow label="Match Formula" value="50% up to 6%" />
          <DataRow label="Employer Monthly Match" value="$106.25" highlight sub="Added directly to your account" />
          <DataRow label="Employer Annual Match" value="$1,275.00" />
          <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "7px 8px" }}>
              <p style={{ fontSize: 9, color: "#6b7280", marginBottom: 2 }}>You contribute</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", fontFamily: MONO }}>$212.50<span style={{ fontSize: 9, fontWeight: 400 }}>/mo</span></p>
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "7px 8px" }}>
              <p style={{ fontSize: 9, color: "#d97706", marginBottom: 2 }}>Employer adds</p>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#d97706", fontFamily: MONO }}>$106.25<span style={{ fontSize: 9, fontWeight: 400 }}>/mo</span></p>
            </div>
          </div>
          <div style={{ marginTop: 6, padding: "6px 8px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 6 }}>
            <p style={{ fontSize: 9, color: "#92400e", fontWeight: 600 }}>
              Total going to your retirement: <span style={{ fontFamily: MONO }}>$318.75/month</span> —
              50% more than you put in. That&apos;s an instant 50% return before your investments earn anything.
            </p>
          </div>
        </SectionPanel>

        {/* Fund selection */}
        <SectionPanel id="fund" hl={hl} title="Investment Allocation">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px", padding: "4px 0", borderBottom: "1px solid #e5e7eb" }}>
            {["Fund Name", "Expense", "Alloc."].map((h, i) => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: i > 0 ? "right" : "left" }}>
                {h}
              </span>
            ))}
          </div>
          {[
            { name: "Vanguard Target 2065 Fund", expense: "0.08%", alloc: "100%", selected: true },
            { name: "(Other options available)", expense: "—", alloc: "0%", selected: false },
          ].map(({ name, expense, alloc, selected }) => (
            <div key={name} style={{
              display: "grid", gridTemplateColumns: "1fr 80px 70px",
              padding: "5px 0", borderBottom: "1px solid #f3f4f6",
              background: selected ? "#fffbeb" : "transparent",
            }}>
              <span style={{ fontSize: 10, color: selected ? "#92400e" : "#9ca3af", fontWeight: selected ? 700 : 400 }}>
                {selected && "★ "}{name}
              </span>
              <span style={{ fontSize: 10, fontFamily: MONO, textAlign: "right", color: "#6b7280" }}>{expense}</span>
              <span style={{ fontSize: 10, fontFamily: MONO, textAlign: "right", fontWeight: selected ? 700 : 400, color: selected ? "#d97706" : "#9ca3af" }}>{alloc}</span>
            </div>
          ))}
        </SectionPanel>

        {/* Target date fund explanation */}
        <SectionPanel id="targetdate" hl={hl} title="Target Date Fund — How It Works">
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 6 }}>
            {[
              { year: "2026", stocks: "90%", bonds: "10%", label: "Now" },
              { year: "2045", stocks: "65%", bonds: "35%", label: "Midpoint" },
              { year: "2065", stocks: "40%", bonds: "60%", label: "Retirement" },
            ].map(({ year, stocks, bonds, label }) => (
              <div key={year} style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px", textAlign: "center" }}>
                <p style={{ fontSize: 8, color: "#9ca3af", marginBottom: 3 }}>{label}</p>
                <div style={{ height: 30, display: "flex", flexDirection: "column", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ flex: parseInt(stocks), background: "#d97706" }} />
                  <div style={{ flex: parseInt(bonds), background: "#e2e8f0" }} />
                </div>
                <p style={{ fontSize: 8, color: "#d97706", fontWeight: 700, marginTop: 3 }}>{stocks} stocks</p>
                <p style={{ fontSize: 8, color: "#6b7280" }}>{bonds} bonds</p>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#374151", marginTop: 2 }}>{year}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 9, color: "#6b7280" }}>
            The fund automatically shifts from growth-focused to preservation-focused as you near 2065.
            No rebalancing required — ever.
          </p>
        </SectionPanel>

        {/* Compound interest */}
        <SectionPanel id="compound" hl={hl} title="Projected Growth at 7% Average Annual Return">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "8px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#d97706", marginBottom: 3 }}>Starting at 22 (today)</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#d97706", fontFamily: MONO }}>~$519K</p>
              <p style={{ fontSize: 9, color: "#6b7280" }}>at age 65 · 43 years</p>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", marginBottom: 3 }}>Starting at 32 instead</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#9ca3af", fontFamily: MONO }}>~$241K</p>
              <p style={{ fontSize: 9, color: "#9ca3af" }}>at age 65 · 33 years</p>
            </div>
          </div>
          <div style={{ padding: "6px 8px", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 6 }}>
            <p style={{ fontSize: 9, color: "#92400e", fontWeight: 600 }}>
              Same $212.50/month. 10-year head start = <span style={{ fontFamily: MONO }}>$278,000 more</span>.
              Time is the only variable.
            </p>
          </div>
        </SectionPanel>

      </div>
    </div>
  );
}
