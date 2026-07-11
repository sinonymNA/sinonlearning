"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── palette ───────────────────────────────────────────────────────────────────

const DESK   = "#ccc0aa";
const PAPER  = "#faf8f3";
const RULE   = "#ddd5c8";
const INK    = "#1c1917";
const MUTED  = "#78716c";
const ACCENT = "#047857";   // deep green (Module 2)
const STAMP  = "#15803d";

// ── types ─────────────────────────────────────────────────────────────────────

type D = Record<string, string>;

const REQUIRED = [
  "grossMonthly", "federalTax", "stateTax", "fica",
  "netMonthly", "gapAmount", "paycheckReflection",
];

// ── helpers ───────────────────────────────────────────────────────────────────

function RLink({ href, label, note }: { href: string; label: string; note?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition hover:border-[#047857] hover:shadow-sm"
      style={{ borderColor: RULE, background: PAPER, color: INK, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <span className="mt-0.5 flex-shrink-0 text-base">🔗</span>
      <span className="flex-1">
        <span className="block">{label}</span>
        {note && <span className="block text-xs font-normal mt-0.5" style={{ color: MUTED }}>{note}</span>}
      </span>
      <span className="flex-shrink-0 text-xs mt-1" style={{ color: MUTED }}>↗</span>
    </a>
  );
}

function Field({
  label, sub, k, d, update, type = "text", rows = 4, placeholder,
}: {
  label: string; sub?: string; k: string; d: D; update: (k: string, v: string) => void;
  type?: "text" | "textarea"; rows?: number; placeholder?: string;
}) {
  const isRequired = REQUIRED.includes(k);
  const hasValue = !!d[k];
  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `1px solid ${hasValue ? `${ACCENT}66` : RULE}`,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 500,
    background: "#f5f1ea",
    color: INK,
    outline: "none",
    transition: "border-color 0.15s",
  };
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED, marginBottom: 6 }}>
        {label}
        {isRequired && !hasValue && (
          <span style={{ background: `${ACCENT}14`, color: ACCENT, borderRadius: 9999, padding: "1px 6px", fontSize: 8, fontWeight: 700 }}>required</span>
        )}
        {hasValue && <span style={{ color: STAMP, fontSize: 8, fontWeight: 700 }}>✓</span>}
        {sub && <span style={{ color: "#a8a29e", fontSize: 10, fontWeight: 400, textTransform: "none", letterSpacing: "normal" }}>{sub}</span>}
      </label>
      {type === "textarea" ? (
        <textarea style={inputStyle} value={d[k] ?? ""} rows={rows}
          placeholder={placeholder} onChange={e => update(k, e.target.value)} />
      ) : (
        <input style={inputStyle} type="text" value={d[k] ?? ""}
          placeholder={placeholder} onChange={e => update(k, e.target.value)} />
      )}
    </div>
  );
}

function Callout({ color = ACCENT, icon, title, children }: {
  color?: string; icon: string; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      background: PAPER,
      borderRadius: "0 8px 8px 0",
      padding: "14px 16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      fontSize: 13,
      lineHeight: 1.7,
    }}>
      <p style={{ fontWeight: 700, color, marginBottom: 6 }}>{icon} {title}</p>
      <div style={{ color: MUTED }}>{children}</div>
    </div>
  );
}

function SectionHead({ n, title, time }: { n: number; title: string; time: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: `${ACCENT}18`, color: ACCENT, fontSize: 12, fontWeight: 900,
      }}>{n}</div>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: INK, margin: 0 }}>{title}</h2>
        <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{time}</p>
      </div>
    </div>
  );
}

// ── real pay stub visual ──────────────────────────────────────────────────────

function PayStub({ d }: { d: D }) {
  const parse = (s: string) => { const n = parseFloat((s || "").replace(/[$,]/g, "")); return isNaN(n) ? 0 : n; };
  const fmt = (n: number) => n === 0 ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

  const gross  = parse(d.grossMonthly);
  const fed    = parse(d.federalTax);
  const state  = parse(d.stateTax);
  const fica   = parse(d.fica);
  const health = parse(d.healthInsurance);
  const k401   = parse(d.retirement401k);
  const other  = parse(d.otherDeductions);
  const totalDed = fed + state + fica + health + k401 + other;
  const net    = gross - totalDed;
  const gap    = totalDed;

  if (!gross) return (
    <div style={{ textAlign: "center", padding: "24px 0", color: MUTED, fontSize: 13 }}>
      Fill in your gross monthly pay above to see your pay stub.
    </div>
  );

  const stubRow = (label: string, amount: number, sub?: string, bold?: boolean, color?: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: `1px solid ${RULE}` }}>
      <div>
        <span style={{ fontSize: 12, fontWeight: bold ? 700 : 400, color: color || INK }}>{label}</span>
        {sub && <span style={{ fontSize: 10, color: MUTED, marginLeft: 8 }}>{sub}</span>}
      </div>
      <span style={{ fontSize: 12, fontWeight: bold ? 700 : 500, color: color || INK, fontVariantNumeric: "tabular-nums" }}>
        {amount > 0 ? fmt(amount) : "—"}
      </span>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: "#fffef9", border: `2px solid ${RULE}`, borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
      {/* Pay stub header */}
      <div style={{ background: INK, color: "#faf8f3", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#a8a29e", margin: 0 }}>EARNINGS STATEMENT</p>
          <p style={{ fontSize: 13, fontWeight: 700, margin: "2px 0 0", color: "#faf8f3" }}>MONTHLY PAY PERIOD</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 9, color: "#a8a29e", margin: 0 }}>NET PAY</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: net > 0 ? "#4ade80" : "#faf8f3", margin: "2px 0 0" }}>{net > 0 ? fmt(net) : "—"}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `2px solid ${RULE}` }}>
        {/* Earnings */}
        <div style={{ padding: "16px 20px", borderRight: `1px solid ${RULE}` }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, marginBottom: 10 }}>EARNINGS</p>
          {stubRow("Regular Wages", gross, undefined, true)}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `2px solid ${INK}`, marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: INK }}>GROSS PAY</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: INK }}>{fmt(gross)}</span>
          </div>
        </div>

        {/* Deductions */}
        <div style={{ padding: "16px 20px" }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUTED, marginBottom: 10 }}>DEDUCTIONS</p>
          {stubRow("Federal Income Tax", fed, undefined, false, fed > 0 ? "#b91c1c" : MUTED)}
          {stubRow("State Income Tax", state, d.state || undefined, false, state > 0 ? "#c2410c" : MUTED)}
          {stubRow("Social Security", parse(d.socialSecurity) || (gross * 0.062), "6.2%", false, "#b45309")}
          {stubRow("Medicare", parse(d.medicare) || (gross * 0.0145), "1.45%", false, "#b45309")}
          {health > 0 && stubRow("Health Insurance", health, d.insurancePlan || undefined, false, "#6d28d9")}
          {k401 > 0 && stubRow("401(k)", k401, d.contribution401kRate || undefined, false, "#0e7490")}
          {other > 0 && stubRow("Other", other, undefined, false, MUTED)}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `2px solid ${INK}`, marginTop: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: INK }}>TOTAL DEDUCTIONS</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#b91c1c" }}>{totalDed > 0 ? fmt(totalDed) : "—"}</span>
          </div>
        </div>
      </div>

      {/* Net summary */}
      <div style={{ padding: "12px 20px", background: "#f5f1ea", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 9, color: MUTED, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.1em" }}>Gross Pay</p>
          <p style={{ fontSize: 15, fontWeight: 900, color: INK }}>{fmt(gross)}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 9, color: MUTED, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.1em" }}>Deductions</p>
          <p style={{ fontSize: 15, fontWeight: 900, color: "#b91c1c" }}>{totalDed > 0 ? `−${fmt(totalDed)}` : "—"}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 9, color: MUTED, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.1em" }}>Net Pay</p>
          <p style={{ fontSize: 15, fontWeight: 900, color: STAMP }}>{net > 0 ? fmt(net) : "—"}</p>
        </div>
      </div>
      {gap > 0 && (
        <div style={{ padding: "8px 20px", background: "#fef2f2", borderTop: `1px solid #fecaca`, textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "#b91c1c", fontWeight: 600 }}>
            Gap: <strong>{fmt(gap)}</strong> leaves your gross pay every month before you see it
          </span>
        </div>
      )}
    </div>
  );
}

// ── federal bracket table ─────────────────────────────────────────────────────

function BracketTable() {
  const brackets = [
    { rate: "10%", single: "$0 – $11,925", mfj: "$0 – $23,850" },
    { rate: "12%", single: "$11,926 – $48,475", mfj: "$23,851 – $96,950" },
    { rate: "22%", single: "$48,476 – $103,350", mfj: "$96,951 – $206,700" },
    { rate: "24%", single: "$103,351 – $197,300", mfj: "$206,701 – $394,600" },
    { rate: "32%", single: "$197,301 – $250,525", mfj: "$394,601 – $501,050" },
    { rate: "35%", single: "$250,526 – $626,350", mfj: "$501,051 – $751,600" },
    { rate: "37%", single: "Over $626,350", mfj: "Over $751,600" },
  ];
  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${RULE}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <table style={{ width: "100%", fontSize: 12, textAlign: "left", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0ece4", borderBottom: `1px solid ${RULE}` }}>
            {["Tax Rate", "Single Filer", "Married Filing Jointly"].map(h => (
              <th key={h} style={{ padding: "10px 14px", fontWeight: 700, color: MUTED, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 10 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {brackets.map((b, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${RULE}`, background: i % 2 === 0 ? PAPER : "#f5f1ea" }}>
              <td style={{ padding: "9px 14px", fontWeight: 900, color: ACCENT }}>{b.rate}</td>
              <td style={{ padding: "9px 14px", color: INK }}>{b.single}</td>
              <td style={{ padding: "9px 14px", color: MUTED }}>{b.mfj}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ padding: "6px 14px", fontSize: 10, color: "#a8a29e", borderTop: `1px solid ${RULE}` }}>
        2025 federal income tax brackets. These are marginal rates — only the income in each bracket is taxed at that rate.
      </p>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PaycheckPage() {
  const router = useRouter();
  const [d, setD] = useState<D>({});
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [completed, setCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [careerSalary, setCareerSalary] = useState("");

  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then(r => {
        if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/paycheck"); return null; }
        return r.json();
      })
      .then(json => {
        if (!json) return;
        const all = json.progress as Array<{ module_slug: string; data: D; completed_at: string | null }>;
        const paycheckProg = all.find(p => p.module_slug === "paycheck");
        const careerProg = all.find(p => p.module_slug === "career");
        if (paycheckProg) { setD(paycheckProg.data as D); setCompleted(!!paycheckProg.completed_at); }
        if (careerProg?.data) {
          const cd = careerProg.data as D;
          setCareerSalary(cd.grossMonthly || cd.startingSalary || "");
          if (!paycheckProg?.data?.grossMonthly && cd.grossMonthly) {
            setD(prev => ({ ...prev, grossMonthly: cd.grossMonthly }));
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const update = (k: string, v: string) => {
    setD(prev => {
      const next = { ...prev, [k]: v };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        setSaveState("saving");
        fetch("/api/life-budget/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleSlug: "paycheck", data: next, completed: false }),
        }).then(() => { setSaveState("saved"); setTimeout(() => setSaveState("idle"), 2000); });
      }, 1500);
      return next;
    });
  };

  const filledRequired = REQUIRED.filter(k => !!d[k]).length;
  const allRequired = filledRequired === REQUIRED.length;

  const markComplete = () => {
    setSaveState("saving");
    fetch("/api/life-budget/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleSlug: "paycheck", data: d, completed: true }),
    }).then(() => {
      setCompleted(true); setJustCompleted(true);
      setSaveState("saved"); setTimeout(() => setSaveState("idle"), 2000);
    });
  };

  if (loading) {
    return (
      <div style={{ background: DESK, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: MUTED, fontSize: 13, letterSpacing: "0.1em" }}>Loading…</span>
      </div>
    );
  }

  const topBar: React.CSSProperties = {
    position: "sticky", top: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderBottom: `1px solid ${RULE}`,
    padding: "12px 32px",
    background: PAPER,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  };

  return (
    <main style={{ background: DESK, color: INK, minHeight: "100vh" }}>
      <div style={topBar}>
        <Link href="/simulations/life-budget"
          style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: MUTED, textDecoration: "none" }}>
          ← LIFE BUDGET
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {REQUIRED.map(k => (
            <div key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: d[k] ? ACCENT : RULE }} />
          ))}
          <span style={{ fontSize: 10, fontWeight: 700, color: d[REQUIRED[0]] ? ACCENT : MUTED }}>
            {filledRequired}/{REQUIRED.length}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {saveState === "saving" && <span style={{ fontSize: 10, color: MUTED }}>Saving…</span>}
          {saveState === "saved" && <span style={{ fontSize: 10, color: STAMP }}>✓ Saved</span>}
          {completed ? (
            <Link href="/simulations/life-budget/housing"
              style={{ background: ACCENT, color: "#fff", borderRadius: 9999, padding: "6px 16px", fontSize: 10, fontWeight: 700, textDecoration: "none" }}>
              Next: Housing →
            </Link>
          ) : (
            <button disabled={!allRequired} onClick={markComplete}
              style={{ background: allRequired ? ACCENT : RULE, color: allRequired ? "#fff" : MUTED, borderRadius: 9999, padding: "6px 16px", fontSize: 10, fontWeight: 700, border: "none", cursor: allRequired ? "pointer" : "default", opacity: allRequired ? 1 : 0.5 }}>
              Mark Complete
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 24px 96px" }}>

        {/* Cover */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "32px 36px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ background: `${ACCENT}18`, color: ACCENT, borderRadius: 9999, padding: "2px 10px", fontSize: 10, fontWeight: 900, letterSpacing: "0.2em" }}>MODULE 02</span>
            {completed && <span style={{ background: "#f0fdf4", color: STAMP, border: `1px solid #bbf7d0`, borderRadius: 9999, padding: "2px 8px", fontSize: 9, fontWeight: 700 }}>✓ COMPLETE</span>}
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.5px", color: INK, margin: "0 0 6px" }}>First Paycheck</h1>
          <p style={{ fontSize: 17, fontWeight: 500, color: MUTED, margin: "0 0 12px" }}>Gross isn&apos;t what you get.</p>
          {careerSalary && (
            <div style={{ marginBottom: 12, padding: "10px 14px", background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 8, fontSize: 13, color: "#166534" }}>
              📌 Module 1 salary on file: <strong>{careerSalary}/mo gross</strong> — pre-loaded below.
            </div>
          )}
          <p style={{ fontSize: 13, lineHeight: 1.7, color: MUTED, margin: "0 0 16px" }}>
            The gap between your gross pay and actual take-home is usually $800–$1,400/month. By the end of this module, you'll know exactly where every dollar goes before it reaches your account.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["~5 hours", "6 sections", "4 research sites", "Uses Module 1 salary"].map(t => (
              <span key={t} style={{ border: `1px solid ${RULE}`, borderRadius: 9999, padding: "3px 12px", fontSize: 10, fontWeight: 600, color: MUTED }}>{t}</span>
            ))}
          </div>
          {justCompleted && (
            <div style={{ marginTop: 20, padding: "16px 20px", background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 10 }}>
              <p style={{ fontWeight: 900, fontSize: 15, color: STAMP, marginBottom: 6 }}>Module 2 complete.</p>
              <p style={{ fontSize: 13, color: "#166534", marginBottom: 12 }}>
                Your net monthly income is saved. Next: Housing — real listings in your chosen city, rent vs. buy math.
              </p>
              <Link href="/simulations/life-budget/housing"
                style={{ display: "inline-block", background: STAMP, color: "#fff", borderRadius: 9999, padding: "8px 20px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                Start Module 3: Housing →
              </Link>
            </div>
          )}
        </div>

        {/* ── SECTION 1 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={1} title="Gross vs. Net: The Gap Nobody Talks About" time="Read this first — 20 min" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 16 }}>
            Your employer agrees to pay you $60,000/year. That sounds like $5,000/month. Here's what actually happens between that agreement and your bank account — as it looks on a real pay stub:
          </p>

          {/* Demo pay stub */}
          <div style={{ fontFamily: "'Courier New', monospace", background: "#fffef9", border: `2px solid ${RULE}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ background: INK, color: "#faf8f3", padding: "10px 16px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 8, letterSpacing: "0.2em", color: "#a8a29e", margin: 0 }}>SAMPLE EARNINGS STATEMENT</p>
                <p style={{ fontSize: 12, fontWeight: 700, margin: "2px 0 0" }}>$60,000/YEAR EXAMPLE</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 8, color: "#a8a29e", margin: 0 }}>NET PAY</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#4ade80", margin: "2px 0 0" }}>$3,502.00</p>
              </div>
            </div>
            <div style={{ padding: "12px 16px", fontSize: 11, fontFamily: "'Courier New', monospace" }}>
              {[
                ["Regular Wages", "$5,000.00", INK],
                ["Federal Income Tax", "− $520.00", "#b91c1c"],
                ["State Income Tax", "− $180.00", "#c2410c"],
                ["Social Security (6.2%)", "− $310.00", "#b45309"],
                ["Medicare (1.45%)", "−   $72.50", "#b45309"],
                ["Health Insurance Premium", "− $215.00", "#6d28d9"],
                ["401(k) Contribution (4%)", "− $200.00", "#0e7490"],
              ].map(([label, amt, color]) => (
                <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${RULE}` }}>
                  <span style={{ color: MUTED }}>{label as string}</span>
                  <span style={{ color: color as string, fontWeight: 600 }}>{amt as string}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontWeight: 900, fontSize: 13, borderTop: `2px solid ${INK}`, marginTop: 4 }}>
                <span style={{ color: STAMP }}>NET TAKE-HOME</span>
                <span style={{ color: STAMP }}>$3,502.00</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Callout icon="⚡" title="The marginal vs. effective rate trap">
              Most people panic when their tax bracket is 22%. But that's a marginal rate — only dollars above the bracket threshold are taxed at 22%. Your effective rate (total tax ÷ gross) will typically be 10–14% for entry-level earners. The IRS withholding estimator gives you the real number.
            </Callout>
          </div>
        </div>

        {/* ── SECTION 2 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={2} title="Federal Income Tax" time="~60 minutes · IRS.gov research" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 16 }}>
            The US uses a progressive income tax system. Look at the 2025 federal brackets below, then use the IRS estimator to calculate your specific monthly withholding.
          </p>
          <div style={{ marginBottom: 14 }}><BracketTable /></div>
          <div style={{ marginBottom: 14 }}>
            <Callout icon="📋" title="How to use the IRS withholding estimator" color="#b91c1c">
              <ol style={{ paddingLeft: 18, margin: "6px 0 0", lineHeight: 2.2 }}>
                <li>Go to <strong>irs.gov/individuals/tax-withholding-estimator</strong></li>
                <li>Select "Single" filing status (or married if applicable)</li>
                <li>Enter your estimated annual income from Module 1</li>
                <li>Enter 1 job, 0 dependents, no other income</li>
                <li>Tool shows estimated annual withholding — divide by 12 for monthly</li>
              </ol>
            </Callout>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <RLink href="https://www.irs.gov/individuals/tax-withholding-estimator" label="IRS Tax Withholding Estimator"
              note="Official tool — enter your income, get estimated withholding per paycheck." />
            <RLink href="https://taxfoundation.org/data/all/federal/2025-tax-brackets/" label="Tax Foundation: 2025 Tax Brackets"
              note="Clear explanation of bracket structure, standard deduction, and how progressive taxation works." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Gross Annual Salary" k="grossAnnual" d={d} update={update}
              placeholder="e.g. $52,000 (from Module 1)" />
            <Field label="Gross Monthly Pay" k="grossMonthly" d={d} update={update}
              placeholder="e.g. $4,333" />
            <Field label="Federal Tax Bracket (marginal rate)" k="federalBracket" d={d} update={update}
              placeholder="e.g. 12% or 22%" />
            <Field label="Effective Federal Tax Rate" k="effectiveFederalRate" d={d} update={update}
              placeholder="e.g. 11.3% (total tax ÷ gross)" />
            <Field label="Monthly Federal Tax Withheld" k="federalTax" d={d} update={update}
              placeholder="e.g. $390 (from IRS estimator ÷ 12)" />
          </div>
        </div>

        {/* ── SECTION 3 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={3} title="State Income Tax" time="~45 minutes · taxfoundation.org" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 14 }}>
            State income taxes range from <strong style={{ color: INK }}>0%</strong> (Florida, Texas, Nevada, Washington, and 5 others) to <strong style={{ color: INK }}>13.3%</strong> (California top marginal rate). Most states run 2–7%. This matters enormously for where you choose to live.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <RLink href="https://taxfoundation.org/data/all/state/state-income-tax-rates-2025/" label="Tax Foundation: 2025 State Rates"
              note="Every state's rate structure — flat vs. graduated, brackets if applicable." />
            <RLink href="https://smartasset.com/taxes/income-taxes" label="SmartAsset: State Income Tax Calculator"
              note="Enter your state + income → get exact state tax estimate." />
          </div>
          <div style={{ marginBottom: 14 }}>
            <Callout icon="🏙️" title="No-income-tax states" color="#0e7490">
              Texas, Florida, Nevada, Washington, Wyoming, South Dakota, Alaska, or Tennessee — if your Module 1 city is in one of these, your state income tax is $0. Enter $0 below.
            </Callout>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Your State" k="state" d={d} update={update} placeholder="e.g. Georgia, Texas, California" />
            <Field label="State Income Tax Rate" k="stateTaxRate" d={d} update={update} placeholder="e.g. 5.49% (Georgia flat rate)" />
            <Field label="Monthly State Tax Withheld" k="stateTax" d={d} update={update} placeholder="e.g. $198 (or $0 if no income tax)" />
          </div>
        </div>

        {/* ── SECTION 4 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={4} title="FICA: Social Security + Medicare" time="~30 min · fixed rate, easy to calculate" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            {[
              { label: "Social Security", rate: "6.2%", note: "of gross pay (up to $176,100 in 2025)" },
              { label: "Medicare", rate: "1.45%", note: "of gross pay (no wage limit)" },
              { label: "Combined FICA", rate: "7.65%", note: "Your employer matches this amount separately", highlight: true },
            ].map(item => (
              <div key={item.label} style={{ background: "#f5f1ea", border: `1px solid ${RULE}`, borderRadius: 8, padding: "14px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 28, fontWeight: 900, color: item.highlight ? ACCENT : INK, margin: "4px 0" }}>{item.rate}</p>
                <p style={{ fontSize: 10, color: MUTED }}>{item.note}</p>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <Callout icon="🧮" title="Calculate your FICA now">
              Multiply your gross monthly pay × <strong>0.0765</strong>. If your gross is $4,333/mo, FICA = $4,333 × 0.0765 = <strong>$331.47/mo</strong>.
            </Callout>
          </div>
          {d.grossMonthly && (
            <div style={{ marginBottom: 14, padding: "12px 16px", background: `${ACCENT}09`, border: `1px solid ${ACCENT}33`, borderRadius: 8, fontSize: 13, color: ACCENT }}>
              Based on your gross of <strong>{d.grossMonthly}</strong>: FICA ≈ <strong>${(parseFloat((d.grossMonthly || "0").replace(/[$,]/g, "")) * 0.0765).toFixed(2)}/mo</strong>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <Field label="Social Security (gross × 6.2%)" k="socialSecurity" d={d} update={update} placeholder="e.g. $269" />
            <Field label="Medicare (gross × 1.45%)" k="medicare" d={d} update={update} placeholder="e.g. $63" />
            <Field label="Total FICA (gross × 7.65%)" k="fica" d={d} update={update} placeholder="e.g. $332" />
          </div>
        </div>

        {/* ── SECTION 5 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={5} title="Benefits & Voluntary Deductions" time="~60 min · research health plans and 401k" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 14 }}>
            Beyond taxes, your paycheck has voluntary deductions — health insurance, 401k contributions, dental, vision. These come out before or after taxes depending on the type, and you choose most of them.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <RLink href="https://www.healthcare.gov/see-plans/" label="HealthCare.gov — Browse Plans"
              note="Real plan costs in your zip code. Use estimated income for subsidy estimate." />
            <RLink href="https://www.dol.gov/agencies/ebsa/about-ebsa/our-activities/resource-center/faqs/401k-plans-for-employees" label="DOL: 401(k) Basics"
              note="Official explanation of 401k rules, employer match, vesting, and limits." />
          </div>
          <div style={{ marginBottom: 14 }}>
            <Callout icon="💡" title="Employer 401k match = free money" color="#0e7490">
              Most employers match 50–100% of your 401k contribution up to 3–6% of salary. A 100% match on 4% of $52,000 = $2,080/year in free money. Always contribute enough to get the full match.
            </Callout>
          </div>

          {/* Health insurance block */}
          <div style={{ background: "#f5f1ea", border: `1px solid ${RULE}`, borderRadius: 10, padding: 20, marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6d28d9", marginBottom: 14 }}>HEALTH INSURANCE</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Insurance Type" k="insuranceType" d={d} update={update} placeholder="e.g. Employer plan, Healthcare.gov Bronze" />
              <Field label="Plan Tier" k="insurancePlan" d={d} update={update} placeholder="e.g. Bronze, Silver, HMO, PPO" />
              <Field label="Monthly Premium (Your Share)" k="healthInsurance" d={d} update={update} placeholder="e.g. $215/mo" />
              <Field label="Annual Deductible" k="deductible" d={d} update={update} placeholder="e.g. $3,000 individual" />
            </div>
          </div>

          {/* 401k block */}
          <div style={{ background: "#f5f1ea", border: `1px solid ${RULE}`, borderRadius: 10, padding: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0e7490", marginBottom: 14 }}>401(k) RETIREMENT SAVINGS</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Employer Match Terms" k="employerMatch" d={d} update={update} placeholder="e.g. 100% match on first 4% of salary" />
              <Field label="Your Contribution Rate" k="contribution401kRate" d={d} update={update} placeholder="e.g. 4% (to get full match)" />
              <Field label="Monthly 401(k) Contribution" k="retirement401k" d={d} update={update} placeholder="e.g. $173 (= $52,000 × 4% ÷ 12)" />
              <Field label="Employer Match / Month" k="employerMatchAmount" d={d} update={update} placeholder="e.g. $173/mo" />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="Other Deductions" sub="(dental, vision, FSA, union dues, etc.)" k="otherDeductions" d={d} update={update}
              placeholder="e.g. $45/mo dental+vision" />
          </div>
        </div>

        {/* ── SECTION 6 ────────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", marginBottom: 16 }}>
          <SectionHead n={6} title="Your Real Monthly Pay Stub" time="~30 min · calculate and reflect" />
          <p style={{ fontSize: 13, lineHeight: 1.8, color: MUTED, marginBottom: 16 }}>
            As you fill in the fields above, your pay stub below updates in real time. Add up all deductions and record your actual take-home.
          </p>

          <div style={{ marginBottom: 20 }}><PayStub d={d} /></div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Field label="Monthly Net Take-Home Pay" k="netMonthly" d={d} update={update}
              placeholder="e.g. $3,502 (gross minus all deductions)" />
            <Field label="Annual Net Income" k="netAnnual" d={d} update={update}
              placeholder="e.g. $42,024 (net × 12)" />
            <Field label="Monthly Gap (Gross − Net)" k="gapAmount" d={d} update={update}
              placeholder="e.g. $831 (never reaches your account)" />
            <Field label="Gap as % of Gross" k="gapPercent" d={d} update={update}
              placeholder="e.g. 19.2% (gap ÷ gross × 100)" />
          </div>

          <Callout icon="📌" title="This number feeds your entire budget" color={STAMP}>
            Your net monthly pay is the foundation of Module 5: Monthly Budget. Every spending and saving decision is sized against this number — not your gross salary.
          </Callout>

          <div style={{ marginTop: 16 }}>
            <Field label="Paycheck reflection" sub="(what surprised you? 4–5 sentences minimum)" k="paycheckReflection"
              d={d} update={update} type="textarea" rows={5}
              placeholder="How big was the gap between gross and net? Which deduction surprised you most? How does your state compare to a no-income-tax state?" />
          </div>
          <div style={{ marginTop: 12 }}>
            <Field label="What you'd do differently" sub="(optional)" k="whatIdChange" d={d} update={update} type="textarea" rows={3}
              placeholder="Would you change your 401k rate? Choose a different state? Pick a different insurance tier?" />
          </div>
        </div>

        {/* ── COMPLETION ───────────────────────────────────────────────── */}
        <div style={{ background: PAPER, borderRadius: 12, border: `1px solid ${RULE}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", padding: "32px 36px", textAlign: "center" }}>
          {completed ? (
            <>
              <p style={{ fontSize: 22, fontWeight: 900, color: STAMP, marginBottom: 8 }}>✓ Module 2 Complete</p>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Your paycheck breakdown is saved to your portfolio.</p>
              <Link href="/simulations/life-budget/housing"
                style={{ display: "inline-block", background: ACCENT, color: "#fff", borderRadius: 9999, padding: "12px 28px", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Continue to Module 3: Housing →
              </Link>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 6 }}>
                {allRequired ? "All required fields filled — ready to mark complete." : `${REQUIRED.length - filledRequired} required field${REQUIRED.length - filledRequired !== 1 ? "s" : ""} still empty.`}
              </p>
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>Look for the "required" badges on fields that need your attention.</p>
              <button disabled={!allRequired} onClick={markComplete}
                style={{ background: allRequired ? ACCENT : RULE, color: allRequired ? "#fff" : MUTED, border: "none", borderRadius: 9999, padding: "12px 32px", fontSize: 13, fontWeight: 700, cursor: allRequired ? "pointer" : "default", opacity: allRequired ? 1 : 0.5 }}>
                Mark Module 2 Complete →
              </button>
            </>
          )}
        </div>

      </div>
    </main>
  );
}
