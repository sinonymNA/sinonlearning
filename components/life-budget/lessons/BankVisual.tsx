"use client";

const MONO = '"ui-monospace", "Cascadia Code", monospace';

type Highlight = "checking" | "apy" | "fdic" | "overdraft" | "ach";

interface BankVisualProps {
  highlightSection?: Highlight;
}

function panelStyle(
  id: Highlight,
  hl?: Highlight,
): { bg?: string; borderColor?: string; dim?: boolean } {
  if (!hl) return {};
  if (hl === id) return { bg: "#eff6ff", borderColor: "#0369a1" };
  return { dim: true };
}

function AccountRow({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
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
  const s = panelStyle(id, hl);
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
            fontSize: 8, fontWeight: 700, color: "#0369a1",
            background: "#dbeafe", borderRadius: 4, padding: "2px 6px",
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

export default function BankVisual({ highlightSection: hl }: BankVisualProps) {
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
        ✂&nbsp;&nbsp;Account Summary — November 2026&nbsp;&nbsp;✂
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 14px 8px", borderBottom: "1px solid #111827" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
            First National Bank
          </p>
          <p style={{ fontSize: 9, color: "#6b7280" }}>Marcus Thompson &nbsp;·&nbsp; Member since Oct 2026</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "#6b7280", marginBottom: 1 }}>Account Summary</p>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em" }}>Nov 1, 2026</p>
        </div>
      </div>

      <div style={{ padding: "6px 4px" }}>

        {/* Checking account */}
        <SectionPanel id="checking" hl={hl} title="Checking Account — ••••3847">
          <AccountRow label="Current Balance" value="$843.22" highlight />
          <AccountRow label="Available Balance" value="$843.22" />
          <AccountRow label="Interest Rate (APY)" value="0.00%" />
          <AccountRow label="Monthly Fee" value="$0 (with direct deposit)" />
        </SectionPanel>

        {/* APY / HYSA comparison */}
        <SectionPanel id="apy" hl={hl} title="Savings Account Comparison" badge="Action recommended">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 4 }}>
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, padding: "8px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: 4 }}>Traditional Savings</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#111827", fontFamily: MONO }}>0.01%</p>
              <p style={{ fontSize: 9, color: "#9ca3af" }}>APY</p>
              <div style={{ marginTop: 6, padding: "4px 6px", background: "#f8fafc", borderRadius: 4 }}>
                <p style={{ fontSize: 9, color: "#6b7280" }}>$1,800 balance → <strong style={{ color: "#111827", fontFamily: MONO }}>$0.18</strong>/year</p>
              </div>
            </div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "8px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#0369a1", textTransform: "uppercase", marginBottom: 4 }}>High-Yield (HYSA)</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: "#0369a1", fontFamily: MONO }}>4.75%</p>
              <p style={{ fontSize: 9, color: "#0369a1" }}>APY</p>
              <div style={{ marginTop: 6, padding: "4px 6px", background: "#dbeafe", borderRadius: 4 }}>
                <p style={{ fontSize: 9, color: "#0369a1" }}>$1,800 balance → <strong style={{ fontFamily: MONO }}>$85.50</strong>/year</p>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 9, color: "#6b7280", fontStyle: "italic" }}>Same FDIC protection. $85.32 more per year for choosing the right bank.</p>
        </SectionPanel>

        {/* FDIC */}
        <SectionPanel id="fdic" hl={hl} title="Deposit Insurance" badge="FDIC Insured">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: "#dbeafe", borderRadius: 6, padding: "8px 12px", flexShrink: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#0369a1", fontFamily: MONO }}>$250,000</p>
              <p style={{ fontSize: 8, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.06em" }}>per depositor</p>
            </div>
            <p style={{ fontSize: 10, color: "#374151", lineHeight: 1.5 }}>
              All deposits at First National Bank are insured by the Federal Deposit Insurance Corporation
              (FDIC). Your funds are protected up to $250,000 even if the bank fails.
            </p>
          </div>
        </SectionPanel>

        {/* Overdraft */}
        <SectionPanel id="overdraft" hl={hl} title="Recent Transactions — Overdraft Alert">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 4, padding: "4px 0", borderBottom: "1px solid #e5e7eb" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Description</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Amount</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Balance</span>
          </div>
          {[
            { desc: "Spotify — Auto Pay", amt: "-$12.99", bal: "$18.23", red: false },
            { desc: "Lunch — Chipotle", amt: "-$13.45", bal: "$4.78", red: false },
            { desc: "Renters Insurance — Auto Pay", amt: "-$15.00", bal: "-$10.22", red: true },
            { desc: "Overdraft Fee", amt: "-$35.00", bal: "-$45.22", red: true },
          ].map(({ desc, amt, bal, red }) => (
            <div key={desc} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 4, padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 10, color: red ? "#dc2626" : "#374151" }}>{desc}</span>
              <span style={{ fontSize: 10, fontFamily: MONO, textAlign: "right", color: red ? "#dc2626" : "#374151" }}>{amt}</span>
              <span style={{ fontSize: 10, fontFamily: MONO, textAlign: "right", color: red ? "#dc2626" : "#6b7280" }}>{bal}</span>
            </div>
          ))}
          <p style={{ fontSize: 9, color: "#dc2626", fontWeight: 600, marginTop: 4 }}>
            $15 autopay → $35 overdraft fee → that $15 payment cost $50 total.
          </p>
        </SectionPanel>

        {/* ACH */}
        <SectionPanel id="ach" hl={hl} title="Scheduled Payments">
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 4, padding: "4px 0", borderBottom: "1px solid #e5e7eb" }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Payee</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Method</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Timing</span>
          </div>
          {[
            { payee: "Peach State Properties (Rent)", method: "ACH", timing: "1–2 business days" },
            { payee: "Navient (Student Loans)", method: "ACH", timing: "1–2 business days" },
            { payee: "Geico (Auto Insurance)", method: "ACH", timing: "Next day" },
          ].map(({ payee, method, timing }) => (
            <div key={payee} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 4, padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontSize: 10, color: "#374151" }}>{payee}</span>
              <span style={{ fontSize: 10, fontFamily: MONO, textAlign: "right", color: "#0369a1" }}>{method}</span>
              <span style={{ fontSize: 10, textAlign: "right", color: "#6b7280" }}>{timing}</span>
            </div>
          ))}
        </SectionPanel>

      </div>
    </div>
  );
}
