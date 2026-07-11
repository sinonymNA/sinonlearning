"use client";

const MONO = '"ui-monospace", "Cascadia Code", monospace';

type Highlight = "assets" | "liabilities" | "networth" | "liquidity" | "trajectory";

interface NetWorthVisualProps {
  highlightSection?: Highlight;
}

function colStyle(
  col: "assets" | "liabilities",
  hl?: Highlight,
): { dim?: boolean; border?: string } {
  if (!hl) return {};
  if (hl === "assets" && col === "liabilities") return { dim: true };
  if (hl === "liabilities" && col === "assets") return { dim: true };
  return {};
}

function AssetRow({
  label,
  value,
  liquid = false,
  hl,
}: {
  label: string;
  value: string;
  liquid?: boolean;
  hl?: Highlight;
}) {
  const isHighlighted = hl === "liquidity" && liquid;
  const isDimmed = hl === "liquidity" && !liquid;
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: "1px solid #d1d5db",
      background: isHighlighted ? "#f0fdf4" : "transparent",
      borderLeft: isHighlighted ? "3px solid #7c3aed" : "3px solid transparent",
      paddingLeft: isHighlighted ? 7 : 0,
      opacity: isDimmed ? 0.3 : 1,
      transition: "all 0.3s ease",
    }}>
      <span style={{ fontSize: 11, color: "#374151" }}>
        {liquid && hl === "liquidity" && <span style={{ fontSize: 9, color: "#7c3aed", fontWeight: 700, marginRight: 4 }}>LIQUID</span>}
        {label}
      </span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: "#111827" }}>{value}</span>
    </div>
  );
}

function LiabilityRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #d1d5db" }}>
      <span style={{ fontSize: 11, color: "#374151" }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: MONO, color: "#dc2626" }}>{value}</span>
    </div>
  );
}

export default function NetWorthVisual({ highlightSection: hl }: NetWorthVisualProps) {
  const totalAssets = 17700;
  const totalLiabilities = 26200;
  const netWorth = totalAssets - totalLiabilities;
  const prevNetWorth = -19000;
  const change = netWorth - prevNetWorth;

  const assetsDimmed = colStyle("assets", hl).dim;
  const liabilitiesDimmed = colStyle("liabilities", hl).dim;

  const networthHighlighted = hl === "networth";
  const networthDimmed = hl === "assets" || hl === "liabilities" || hl === "liquidity";
  const trajectoryHighlighted = hl === "trajectory";

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
        ✂&nbsp;&nbsp;Personal Balance Sheet — Retain for Your Records&nbsp;&nbsp;✂
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px 8px", borderBottom: "1px solid #111827" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
            Personal Balance Sheet
          </p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>Maya Chen &nbsp;·&nbsp; As of November 1, 2027</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "#6b7280", marginBottom: 1 }}>Year 1 Anniversary</p>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>12 months at Apex Creative</p>
        </div>
      </div>

      {/* Assets / Liabilities side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #9ca3af" }}>

        {/* Assets column */}
        <div style={{
          opacity: assetsDimmed ? 0.3 : 1,
          transition: "opacity 0.3s ease",
          borderRight: "1px solid #d1d5db",
        }}>
          <div style={{ background: "#f3f4f6", borderBottom: "1px solid #9ca3af", padding: "5px 10px" }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em" }}>Assets</p>
          </div>
          <div style={{ padding: "6px 10px" }}>
            <AssetRow label="Checking Account" value="$1,850" liquid hl={hl} />
            <AssetRow label="High-Yield Savings" value="$4,200" liquid hl={hl} />
            <AssetRow label="401(k)" value="$3,150" hl={hl} />
            <AssetRow label="Vehicle (2022 Civic)" value="$8,500" hl={hl} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 2px", marginTop: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>Total Assets</span>
              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: MONO, color: "#111827" }}>$17,700</span>
            </div>
          </div>
        </div>

        {/* Liabilities column */}
        <div style={{
          opacity: liabilitiesDimmed ? 0.3 : 1,
          transition: "opacity 0.3s ease",
        }}>
          <div style={{ background: "#f3f4f6", borderBottom: "1px solid #9ca3af", padding: "5px 10px" }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em" }}>Liabilities</p>
          </div>
          <div style={{ padding: "6px 10px" }}>
            <LiabilityRow label="Federal Student Loan" value="$26,200" />
            <LiabilityRow label="Credit Card Balance" value="$0" />
            <LiabilityRow label="Car Loan" value="$0" />
            <div style={{ height: "5px 0", padding: "5px 0", borderBottom: "1px solid #d1d5db" }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 2px", marginTop: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>Total Liabilities</span>
              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: MONO, color: "#dc2626" }}>$26,200</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Worth total */}
      <div style={{
        borderBottom: "1px solid #9ca3af",
        borderLeft: `3px solid ${networthHighlighted ? "#7c3aed" : "transparent"}`,
        background: networthHighlighted ? "#faf5ff" : "#f9fafb",
        opacity: networthDimmed ? 0.3 : 1,
        transition: "all 0.3s ease",
        padding: "10px 14px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
              Net Worth
            </p>
            <p style={{ fontSize: 9, color: "#9ca3af" }}>Total Assets − Total Liabilities</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 20, fontWeight: 800, fontFamily: MONO, color: netWorth < 0 ? "#dc2626" : "#16a34a" }}>
              ({Math.abs(netWorth).toLocaleString()})
            </p>
            <p style={{ fontSize: 9, color: "#9ca3af" }}>negative</p>
          </div>
        </div>
      </div>

      {/* Trajectory */}
      <div style={{
        borderLeft: `3px solid ${trajectoryHighlighted ? "#7c3aed" : "transparent"}`,
        background: trajectoryHighlighted ? "#faf5ff" : "transparent",
        opacity: (hl && !trajectoryHighlighted && hl !== "networth") ? 0.3 : 1,
        transition: "all 0.3s ease",
        padding: "8px 14px 10px",
      }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
          Year-over-Year Trajectory
        </p>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ textAlign: "center", flex: 1, background: "#f8fafc", borderRadius: 6, padding: "6px 8px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: 9, color: "#6b7280", marginBottom: 2 }}>1 year ago</p>
            <p style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: "#dc2626" }}>($19,000)</p>
          </div>
          <div style={{ fontSize: 16, color: "#7c3aed", fontWeight: 800 }}>→</div>
          <div style={{ textAlign: "center", flex: 1, background: trajectoryHighlighted ? "#ede9fe" : "#f8fafc", borderRadius: 6, padding: "6px 8px", border: `1px solid ${trajectoryHighlighted ? "#c4b5fd" : "#e2e8f0"}` }}>
            <p style={{ fontSize: 9, color: "#6b7280", marginBottom: 2 }}>Today</p>
            <p style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: "#dc2626" }}>($8,500)</p>
          </div>
          <div style={{ fontSize: 16, color: "#7c3aed", fontWeight: 800 }}>↑</div>
          <div style={{ textAlign: "center", flex: 1, background: "#f0fdf4", borderRadius: 6, padding: "6px 8px", border: "1px solid #bbf7d0" }}>
            <p style={{ fontSize: 9, color: "#16a34a", marginBottom: 2 }}>Improved</p>
            <p style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: "#16a34a" }}>+${Math.abs(change).toLocaleString()}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
