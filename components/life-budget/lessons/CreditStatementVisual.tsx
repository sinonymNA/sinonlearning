"use client";

const MONO = '"ui-monospace", "Cascadia Code", monospace';

type Highlight = "apr" | "minimum" | "score" | "utilization" | "inquiry";

interface CreditStatementVisualProps {
  highlightSection?: Highlight;
}

function sectionStyle(
  id: Highlight,
  hl?: Highlight,
): { bg?: string; borderColor?: string; dim?: boolean } {
  if (!hl) return {};
  if (hl === id) return { bg: "#fef2f2", borderColor: "#dc2626" };
  return { dim: true };
}

function DataRow({ label, value, red = false, bold = false }: { label: string; value: string; red?: boolean; bold?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", padding: "5px 0", borderBottom: "1px solid #e5e7eb" }}>
      <span style={{ fontSize: 11, color: "#374151" }}>{label}</span>
      <span style={{
        fontSize: 11, fontFamily: MONO, fontWeight: bold ? 700 : 400,
        color: red ? "#dc2626" : "#111827",
      }}>
        {value}
      </span>
    </div>
  );
}

function SectionPanel({
  id,
  hl,
  title,
  children,
}: {
  id: Highlight;
  hl?: Highlight;
  title: string;
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
      <p style={{ fontSize: 9, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export default function CreditStatementVisual({ highlightSection: hl }: CreditStatementVisualProps) {
  const balance = 3400;
  const limit = 3500;
  const utilPct = Math.round((balance / limit) * 100);

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
        ✂&nbsp;&nbsp;Credit Card Statement — Retain for Your Records&nbsp;&nbsp;✂
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px 8px", borderBottom: "1px solid #111827" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
            Vertex Rewards Visa
          </p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>Priya Anand &nbsp;·&nbsp; Account ••••7291</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "#6b7280", marginBottom: 1 }}>Statement Date</p>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>Oct 31, 2026</p>
        </div>
      </div>

      <div style={{ padding: "6px 4px" }}>

        {/* APR */}
        <SectionPanel id="apr" hl={hl} title="Interest Rate & Charges">
          <DataRow label="Purchase APR" value="24.99%" red bold />
          <DataRow label="Statement Balance" value="$3,400.00" bold />
          <DataRow label="Monthly Interest Charge" value="$70.97" red />
          <div style={{ marginTop: 6, padding: "6px 8px", background: "#fff7f7", border: "1px solid #fecaca", borderRadius: 6 }}>
            <p style={{ fontSize: 9, color: "#dc2626", lineHeight: 1.5 }}>
              <strong>$70.97/month in interest</strong> — nearly 21% of your minimum payment.
              At 24.99% APR, every month you carry a balance costs you $70+ before touching the principal.
            </p>
          </div>
        </SectionPanel>

        {/* Minimum payment */}
        <SectionPanel id="minimum" hl={hl} title="Payment Information">
          <DataRow label="Statement Balance" value="$3,400.00" />
          <DataRow label="Minimum Payment Due" value="$68.00" red />
          <DataRow label="Payment Due Date" value="Nov 15, 2026" />
          <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <div style={{ background: "#fff7f7", border: "1px solid #fecaca", borderRadius: 6, padding: "7px 8px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", marginBottom: 2 }}>Minimum payments only</p>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", fontFamily: MONO }}>141 months</p>
              <p style={{ fontSize: 9, color: "#6b7280" }}>to pay off · $1,620 interest</p>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "7px 8px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", marginBottom: 2 }}>Paying $150/month</p>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#16a34a", fontFamily: MONO }}>27 months</p>
              <p style={{ fontSize: 9, color: "#6b7280" }}>to pay off · $480 interest</p>
            </div>
          </div>
        </SectionPanel>

        {/* Credit score */}
        <SectionPanel id="score" hl={hl} title="Credit Score Summary">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b", fontFamily: MONO }}>638</p>
              <p style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fair</p>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                {[
                  { label: "Poor", color: "#dc2626", pct: "20%" },
                  { label: "Fair", color: "#f59e0b", pct: "20%", active: true },
                  { label: "Good", color: "#84cc16", pct: "20%" },
                  { label: "V.Good", color: "#22c55e", pct: "20%" },
                  { label: "Excl.", color: "#15803d", pct: "20%" },
                ].map(({ label, color, pct, active }) => (
                  <div key={label} style={{ flex: 1 }}>
                    <div style={{ height: 6, background: active ? color : "#e2e8f0", borderRadius: 2, marginBottom: 2 }} />
                    <p style={{ fontSize: 7, color: active ? color : "#9ca3af", textAlign: "center" }}>{label}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 9, color: "#6b7280" }}>
                <strong style={{ color: "#dc2626" }}>High utilization</strong> is the biggest factor keeping your score below 680 — the minimum many landlords require.
              </p>
            </div>
          </div>
        </SectionPanel>

        {/* Utilization */}
        <SectionPanel id="utilization" hl={hl} title="Credit Utilization">
          <DataRow label="Credit Limit" value="$3,500.00" />
          <DataRow label="Current Balance" value="$3,400.00" red bold />
          <DataRow label="Available Credit" value="$100.00" />
          <div style={{ margin: "6px 0 4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 9, color: "#6b7280" }}>Utilization</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: MONO, color: "#dc2626" }}>{utilPct}%</span>
            </div>
            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4 }}>
              <div style={{ width: `${utilPct}%`, height: 8, background: "#dc2626", borderRadius: 4 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
              <span style={{ fontSize: 8, color: "#16a34a" }}>0%</span>
              <span style={{ fontSize: 8, color: "#f59e0b" }}>30% target</span>
              <span style={{ fontSize: 8, color: "#dc2626" }}>100%</span>
            </div>
          </div>
          <p style={{ fontSize: 9, color: "#dc2626" }}>
            <strong>{utilPct}% utilization</strong> — above 30% significantly lowers your score.
            Target: keep balance below <strong style={{ fontFamily: MONO }}>$1,050</strong> to stay under 30%.
          </p>
        </SectionPanel>

        {/* Inquiry */}
        <SectionPanel id="inquiry" hl={hl} title="Recent Credit Inquiries">
          {[
            { date: "Sep 12, 2026", creditor: "Vertex Bank (this card)", type: "Hard", pts: "-5 pts" },
            { date: "Sep 18, 2026", creditor: "Chase Freedom Card", type: "Hard", pts: "-5 pts" },
            { date: "Oct 3, 2026", creditor: "Annual Credit Report", type: "Soft", pts: "No impact" },
          ].map(({ date, creditor, type, pts }) => (
            <div key={creditor} style={{ display: "grid", gridTemplateColumns: "80px 1fr 60px 70px", padding: "4px 0", borderBottom: "1px solid #f3f4f6", gap: 4 }}>
              <span style={{ fontSize: 9, color: "#6b7280" }}>{date}</span>
              <span style={{ fontSize: 10, color: "#374151" }}>{creditor}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, textAlign: "center",
                color: type === "Hard" ? "#dc2626" : "#16a34a",
                background: type === "Hard" ? "#fef2f2" : "#f0fdf4",
                borderRadius: 4, padding: "2px 4px",
              }}>{type}</span>
              <span style={{ fontSize: 9, color: type === "Hard" ? "#dc2626" : "#16a34a", textAlign: "right" }}>{pts}</span>
            </div>
          ))}
          <p style={{ fontSize: 9, color: "#6b7280", marginTop: 4 }}>
            2 hard inquiries in 6 months = ~10-point score reduction for up to 12 months.
          </p>
        </SectionPanel>

      </div>
    </div>
  );
}
