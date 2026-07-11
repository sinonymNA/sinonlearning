"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Design tokens ─────────────────────────────────────────────────────────────

const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "#e2e8f0";
const INK    = "#0f172a";
const MUTED  = "#64748b";
const FAINT  = "#94a3b8";
const GREEN  = "#16a34a";
const ACCENT = "#7c3aed";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  city: string;
  housingType: string;
  listingUrl: string;
  monthlyPayment: string;
  utilities: string;
  rentersInsurance: string;
  securityDeposit: string;
  totalHousing: string;
  housingReflection: string;
  notes: string;
}

const EMPTY: FormData = {
  city: "",
  housingType: "",
  listingUrl: "",
  monthlyPayment: "",
  utilities: "",
  rentersInsurance: "",
  securityDeposit: "",
  totalHousing: "",
  housingReflection: "",
  notes: "",
};

const REQUIRED: (keyof FormData)[] = ["city", "housingType", "monthlyPayment", "utilities", "totalHousing", "housingReflection"];

// ── Shared styles ─────────────────────────────────────────────────────────────

const inp = (filled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "10px 14px",
  border: `1px solid ${filled ? ACCENT + "88" : BORDER}`,
  borderRadius: 8,
  background: "#fff",
  fontSize: 14,
  color: INK,
  outline: "none",
  fontFamily: "system-ui, -apple-system, sans-serif",
  boxSizing: "border-box",
});

const ta = (filled: boolean): React.CSSProperties => ({
  ...inp(filled),
  resize: "vertical",
  minHeight: 84,
  lineHeight: 1.55,
});

function Lbl({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
      {children}{req && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>{children}</div>;
}

function Field({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 20 }}>{children}</div>;
}

function Divider() {
  return <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "28px 0" }} />;
}

function ResearchLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, textDecoration: "none" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, background: `${ACCENT}12`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12,
      }}>↗</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: ACCENT, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{sub}</p>
      </div>
    </a>
  );
}

// ── Affordability Panel ───────────────────────────────────────────────────────

function AffordabilityPanel({ d, netMonthly }: { d: FormData; netMonthly: string }) {
  const total = parseFloat(d.totalHousing) || 0;
  const net = parseFloat(netMonthly.replace(/[^0-9.]/g, "")) || 0;
  const pct = net > 0 && total > 0 ? (total / net) * 100 : 0;
  const cap = net * 0.3;
  const over = pct > 30;
  const filled = total > 0;

  const $val = (n: number) => n > 0 ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—";

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: filled ? (over ? "#7f1d1d" : INK) : INK, padding: "20px 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Monthly Housing Cost</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          {total > 0 ? `$${total.toFixed(0)}` : "—"}
        </p>
        {pct > 0 && (
          <p style={{ fontSize: 12, color: over ? "#fca5a5" : "#86efac", marginTop: 3, fontWeight: 600 }}>
            {pct.toFixed(1)}% of your net pay {over ? "⚠ over 30% rule" : "✓ within 30% rule"}
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ background: BG, borderRadius: 8, padding: "12px 12px", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", marginBottom: 3 }}>{$val(net)}</p>
            <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Net pay / mo</p>
          </div>
          <div style={{ background: BG, borderRadius: 8, padding: "12px 12px", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontVariantNumeric: "tabular-nums", marginBottom: 3 }}>{$val(cap)}</p>
            <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>30% cap</p>
          </div>
        </div>

        {/* Cost breakdown */}
        {parseFloat(d.monthlyPayment) > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Breakdown</p>
            {[
              { label: "Rent / mortgage", val: parseFloat(d.monthlyPayment) || 0 },
              { label: "Utilities", val: parseFloat(d.utilities) || 0 },
              { label: "Renters insurance", val: parseFloat(d.rentersInsurance) || 0 },
            ].filter(r => r.val > 0).map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: `1px solid ${BORDER}`, color: MUTED }}>
                <span>{r.label}</span>
                <span style={{ fontWeight: 600, color: INK }}>${r.val.toFixed(0)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, padding: "7px 0", marginTop: 2 }}>
              <span style={{ color: INK }}>Total</span>
              <span style={{ color: ACCENT }}>${total.toFixed(0)}/mo</span>
            </div>
          </div>
        )}

        {over && total > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>Over budget by ${(total - cap).toFixed(0)}/mo</p>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Consider a roommate to cut rent 40–50%</p>
          </div>
        )}
        {!over && pct > 0 && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>Within the 30% guideline</p>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>${(cap - total).toFixed(0)}/mo headroom</p>
          </div>
        )}
        {net === 0 && (
          <p style={{ fontSize: 11, color: FAINT, marginTop: 8, textAlign: "center" }}>Complete Module 2 to see % of net pay</p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HousingPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [netMonthly, setNetMonthly] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then((r) => {
        if (r.status === 401) { router.replace("/margins/login?next=/simulations/life-budget/housing"); return null; }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        const m = json.progress?.find((p: { module_slug: string }) => p.module_slug === "housing");
        if (m?.data) setD({ ...EMPTY, ...(m.data as Partial<FormData>) });
        if (m?.completed_at) setIsComplete(true);
        const paycheck = json.progress?.find((p: { module_slug: string }) => p.module_slug === "paycheck");
        if (paycheck?.data?.netMonthly) setNetMonthly(String(paycheck.data.netMonthly));
      })
      .catch(() => {});
  }, [router]);

  // Auto-calculate total housing cost
  useEffect(() => {
    const rent = parseFloat(d.monthlyPayment) || 0;
    const utils = parseFloat(d.utilities) || 0;
    const ins = parseFloat(d.rentersInsurance) || 0;
    if (rent > 0 || utils > 0) {
      setD((prev) => ({ ...prev, totalHousing: (rent + utils + ins).toFixed(0) }));
    }
  }, [d.monthlyPayment, d.utilities, d.rentersInsurance]);

  const autoSave = useCallback((next: FormData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setSaving(true);
      fetch("/api/life-budget/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleSlug: "housing", data: next }),
      })
        .then(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); })
        .catch(() => setSaving(false));
    }, 1500);
  }, []);

  const up = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...d, [key]: e.target.value } as FormData;
    setD(next);
    autoSave(next);
  };

  const filledRequired = REQUIRED.filter((k) => d[k]?.trim()).length;
  const allFilled = filledRequired === REQUIRED.length;

  const markComplete = async () => {
    if (!allFilled || isComplete) return;
    setCompleting(true);
    await fetch("/api/life-budget/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleSlug: "housing", data: d, completed: true }),
    });
    setIsComplete(true);
    setCompleting(false);
  };

  return (
    <main style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif", color: INK }}>

      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: CARD, borderBottom: `1px solid ${BORDER}`,
        padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/simulations/life-budget" style={{ fontSize: 12, fontWeight: 600, color: MUTED, textDecoration: "none" }}>← Life Budget</Link>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, letterSpacing: "0.1em" }}>MODULE 03 · HOUSING</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saving && <span style={{ fontSize: 11, color: FAINT }}>Saving…</span>}
          {saved && !saving && <span style={{ fontSize: 11, color: GREEN, fontWeight: 600 }}>✓ Saved</span>}
          {isComplete
            ? <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px" }}>✓ Complete</span>
            : (
              <button onClick={markComplete} disabled={!allFilled || completing}
                style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "5px 16px", border: "none",
                  cursor: allFilled ? "pointer" : "not-allowed",
                  background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED,
                }}>
                {completing ? "Saving…" : `Complete (${filledRequired}/${REQUIRED.length})`}
              </button>
            )}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 24px 80px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

        {/* Main form */}
        <div>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 4 }}>Housing</h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
              Search real listings in your city. Run the numbers on what housing actually costs —
              rent is just the starting point.
            </p>
          </div>

          {/* Form card */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

            {/* Group 1: Location */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Where you&apos;ll live</p>

            <Row>
              <Field>
                <Lbl req>City & State</Lbl>
                <input value={d.city} onChange={up("city")} placeholder="e.g. Atlanta, GA" style={inp(!!d.city)} />
              </Field>
              <Field>
                <Lbl req>Housing Type</Lbl>
                <select value={d.housingType} onChange={up("housingType")} style={inp(!!d.housingType)}>
                  <option value="">Select…</option>
                  <option>Apartment (renting)</option>
                  <option>Shared apartment / roommates</option>
                  <option>Studio apartment</option>
                  <option>House (renting)</option>
                  <option>Buying a home</option>
                  <option>Living with family</option>
                </select>
              </Field>
            </Row>

            <Field>
              <Lbl>Listing URL (optional)</Lbl>
              <input value={d.listingUrl} onChange={up("listingUrl")} placeholder="https://www.apartments.com/..." type="url" style={inp(!!d.listingUrl)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Paste the actual listing you found — it saves to your portfolio</p>
            </Field>

            <Divider />

            {/* Group 2: Costs */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Monthly costs</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 1.5 }}>
              Most first-time renters underestimate total housing cost by $200–$400/month.
              Add every line — the panel on the right shows your running total.
            </p>

            <Row>
              <Field>
                <Lbl req>Rent / Mortgage Payment</Lbl>
                <input value={d.monthlyPayment} onChange={up("monthlyPayment")} placeholder="e.g. 1200" type="number" style={inp(!!d.monthlyPayment)} />
              </Field>
              <Field>
                <Lbl req>Utilities (electric, gas, water, internet)</Lbl>
                <input value={d.utilities} onChange={up("utilities")} placeholder="e.g. 140" type="number" style={inp(!!d.utilities)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>1BR estimate: $100–$180/mo</p>
              </Field>
            </Row>

            <Row>
              <Field>
                <Lbl>Renters Insurance</Lbl>
                <input value={d.rentersInsurance} onChange={up("rentersInsurance")} placeholder="e.g. 15" type="number" style={inp(!!d.rentersInsurance)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Usually $12–$25/mo</p>
              </Field>
              <Field>
                <Lbl>Security Deposit (one-time)</Lbl>
                <input value={d.securityDeposit} onChange={up("securityDeposit")} placeholder="e.g. 1200" type="number" style={inp(!!d.securityDeposit)} />
                <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Due upfront — usually 1–2× rent</p>
              </Field>
            </Row>

            <Divider />

            {/* Group 3: Reflection */}
            <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>Your decision</p>

            <Field>
              <Lbl req>Housing Reflection</Lbl>
              <textarea value={d.housingReflection} onChange={up("housingReflection")}
                placeholder="What did you find? Is this affordable on your net paycheck? If you're over 30%, what's your plan — roommate, farther out, accept the tradeoff? What surprised you?"
                style={{ ...ta(!!d.housingReflection), minHeight: 110 }} />
            </Field>

            <Field>
              <Lbl>Notes</Lbl>
              <textarea value={d.notes} onChange={up("notes")} placeholder="Links, other listings you considered, anything else…" style={ta(!!d.notes)} />
            </Field>

          </div>

          {/* Complete */}
          {!isComplete && (
            <div style={{ marginTop: 24 }}>
              <button onClick={markComplete} disabled={!allFilled || completing}
                style={{
                  width: "100%", fontSize: 14, fontWeight: 700, borderRadius: 10, padding: "13px 0", border: "none",
                  cursor: allFilled ? "pointer" : "not-allowed",
                  background: allFilled ? ACCENT : BORDER, color: allFilled ? "#fff" : MUTED,
                }}>
                {completing ? "Saving…" : allFilled ? "Mark Module 3 Complete →" : `Fill required fields (${filledRequired} / ${REQUIRED.length} done)`}
              </button>
            </div>
          )}

          {isComplete && (
            <div style={{ marginTop: 24, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 6 }}>✓ Module 3 Complete</p>
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>Housing data saved. Head to Module 4: Transportation.</p>
              <Link href="/simulations/life-budget"
                style={{ display: "inline-block", fontSize: 13, fontWeight: 700, color: "#fff", background: GREEN, borderRadius: 8, padding: "9px 22px", textDecoration: "none" }}>
                ← Back to Life Budget Hub
              </Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 64 }}>

          <AffordabilityPanel d={d} netMonthly={netMonthly} />

          {/* Research links */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Where to search</p>
            <ResearchLink href="https://www.apartments.com" label="Apartments.com" sub="Filter by city and bedroom count to find real listings" />
            <ResearchLink href="https://www.zillow.com/homes/for_rent" label="Zillow Rentals" sub="Listings with photos, neighborhood data, and virtual tours" />
            <ResearchLink href="https://www.craigslist.org" label="Craigslist Housing" sub="Often cheaper local listings — search your city" />
            <ResearchLink href="https://www.consumerfinance.gov/ask-cfpb/what-are-my-rights-as-a-renter-en-1555/" label="CFPB: Renter Rights" sub="Know your rights before you sign a lease" />
          </div>

        </div>
      </div>
    </main>
  );
}
