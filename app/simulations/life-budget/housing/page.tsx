"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ModuleShell from "@/components/life-budget/ModuleShell";
import SectionStep from "@/components/life-budget/SectionStep";
import HousingHook from "@/components/life-budget/hooks/HousingHook";

const BG     = "#f8fafc";
const CARD   = "#ffffff";
const BORDER = "#e2e8f0";
const INK    = "#0f172a";
const MUTED  = "#64748b";
const FAINT  = "#94a3b8";
const GREEN  = "#16a34a";
const ACCENT = "#7c3aed";

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
  housingTradeoff: string;
  notes: string;
}

const EMPTY: FormData = {
  city: "", housingType: "", listingUrl: "",
  monthlyPayment: "", utilities: "", rentersInsurance: "", securityDeposit: "",
  totalHousing: "",
  housingReflection: "", housingTradeoff: "", notes: "",
};

const REQUIRED: (keyof FormData)[] = ["city", "housingType", "monthlyPayment", "utilities", "totalHousing", "housingReflection"];

const inp = (filled: boolean): React.CSSProperties => ({
  width: "100%", padding: "10px 14px",
  border: `1px solid ${filled ? ACCENT + "88" : BORDER}`,
  borderRadius: 8, background: "#fff", fontSize: 14, color: INK,
  outline: "none", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box",
});
const ta = (filled: boolean): React.CSSProperties => ({ ...inp(filled), resize: "vertical", minHeight: 84, lineHeight: 1.55 });

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

function ResearchLink({ href, label, sub }: { href: string; label: string; sub: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${BORDER}`, textDecoration: "none" }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${ACCENT}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12 }}>↗</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: ACCENT, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{sub}</p>
      </div>
    </a>
  );
}

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
      <div style={{ background: filled ? (over ? "#7f1d1d" : INK) : INK, padding: "20px 20px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Monthly Housing Cost</p>
        <p style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{total > 0 ? `$${total.toFixed(0)}` : "—"}</p>
        {pct > 0 && (
          <p style={{ fontSize: 12, color: over ? "#fca5a5" : "#86efac", marginTop: 3, fontWeight: 600 }}>
            {pct.toFixed(1)}% of your net pay {over ? "⚠ over 30% rule" : "✓ within 30% rule"}
          </p>
        )}
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={{ background: BG, borderRadius: 8, padding: "12px", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: INK, fontVariantNumeric: "tabular-nums", marginBottom: 3 }}>{$val(net)}</p>
            <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Net pay / mo</p>
          </div>
          <div style={{ background: BG, borderRadius: 8, padding: "12px", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontVariantNumeric: "tabular-nums", marginBottom: 3 }}>{$val(cap)}</p>
            <p style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>30% cap</p>
          </div>
        </div>
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

export default function HousingPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
  const [phase, setPhase] = useState<"hook" | "work">("hook");
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
        if (m?.data) { setD({ ...EMPTY, ...(m.data as Partial<FormData>) }); setPhase("work"); }
        if (m?.completed_at) setIsComplete(true);
        const paycheck = json.progress?.find((p: { module_slug: string }) => p.module_slug === "paycheck");
        if (paycheck?.data?.netMonthly) setNetMonthly(String(paycheck.data.netMonthly));
      })
      .catch(() => {});
  }, [router]);

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
        method: "POST", headers: { "Content-Type": "application/json" },
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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleSlug: "housing", data: d, completed: true }),
    });
    setIsComplete(true);
    setCompleting(false);
  };

  const step2Unlocked = !!(d.city.trim() && d.housingType.trim());
  const step3Unlocked = step2Unlocked && !!(d.monthlyPayment.trim() && d.utilities.trim());

  const sidebar = (
    <>
      <AffordabilityPanel d={d} netMonthly={netMonthly} />
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Where to search</p>
        <ResearchLink href="https://www.apartments.com" label="Apartments.com" sub="Filter by city and bedroom count to find real listings" />
        <ResearchLink href="https://www.zillow.com/homes/for_rent" label="Zillow Rentals" sub="Listings with photos, neighborhood data, and virtual tours" />
        <ResearchLink href="https://www.craigslist.org" label="Craigslist Housing" sub="Often cheaper local listings — search your city" />
        <ResearchLink href="https://www.consumerfinance.gov/ask-cfpb/what-are-my-rights-as-a-renter-en-1555/" label="CFPB: Renter Rights" sub="Know your rights before you sign a lease" />
      </div>
    </>
  );

  return (
    <ModuleShell
      moduleLabel="MODULE 03 · HOUSING"
      accent={ACCENT}
      filledRequired={filledRequired}
      totalRequired={REQUIRED.length}
      isComplete={isComplete}
      onMarkComplete={markComplete}
      completing={completing}
      saving={saving}
      saved={saved}
      phase={phase}
      hookContent={<HousingHook onReady={() => { window.scrollTo(0, 0); setPhase("work"); }} />}
      sidebarContent={sidebar}
      nextHref="/simulations/life-budget"
      nextLabel="Back to Life Budget Hub"
      completionHighlights={[
        { label: "Monthly housing", value: d.totalHousing ? `$${Math.round(parseFloat(d.totalHousing)).toLocaleString()}/mo` : "", sub: d.city || "" },
        { label: "Housing type", value: d.housingType || "" },
      ]}
    >
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 36px" }}>

        <SectionStep number={1} total={3} title="Where are you setting up?" subtitle="Search real listings in your target city before filling this in." isUnlocked={true} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl req>City & state</Lbl>
              <input value={d.city} onChange={up("city")} placeholder="e.g. Atlanta, GA" style={inp(!!d.city)} />
            </Field>
            <Field>
              <Lbl req>Type of housing</Lbl>
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
            <Lbl>Paste the actual listing you found</Lbl>
            <input value={d.listingUrl} onChange={up("listingUrl")} placeholder="https://www.apartments.com/…" type="url" style={inp(!!d.listingUrl)} />
            <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>This saves to your portfolio — future you will want this link</p>
          </Field>
        </SectionStep>

        <SectionStep number={2} total={3} title="What does it actually cost?" subtitle="Rent is just the starting point. Add every line." isUnlocked={step2Unlocked} accent={ACCENT}>
          <Row>
            <Field>
              <Lbl req>Monthly rent or mortgage</Lbl>
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
              <Lbl>Renters insurance</Lbl>
              <input value={d.rentersInsurance} onChange={up("rentersInsurance")} placeholder="e.g. 15" type="number" style={inp(!!d.rentersInsurance)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Usually $12–$25/mo — covers your stuff</p>
            </Field>
            <Field>
              <Lbl>Security deposit (one-time)</Lbl>
              <input value={d.securityDeposit} onChange={up("securityDeposit")} placeholder="e.g. 1200" type="number" style={inp(!!d.securityDeposit)} />
              <p style={{ fontSize: 10, color: FAINT, marginTop: 4 }}>Due upfront — usually 1–2× rent</p>
            </Field>
          </Row>
        </SectionStep>

        <SectionStep number={3} total={3} title="Your decision" subtitle="Was this realistic — and what tradeoffs did you make?" isUnlocked={step3Unlocked} accent={ACCENT}>
          <Field>
            <Lbl req>Was finding housing in this price range realistic for your income?</Lbl>
            <textarea value={d.housingReflection} onChange={up("housingReflection")}
              placeholder="Is this affordable on your net paycheck? If you're over 30%, what's your plan — roommate, farther out, accept the tradeoff?"
              style={{ ...ta(!!d.housingReflection), minHeight: 110 }} />
          </Field>
          <Field>
            <Lbl>What tradeoff did you make — location, size, price, or commute?</Lbl>
            <textarea value={d.housingTradeoff} onChange={up("housingTradeoff")}
              placeholder="I chose this because… The compromise was…"
              style={ta(!!d.housingTradeoff)} />
          </Field>
          <Field>
            <Lbl>Notes</Lbl>
            <textarea value={d.notes} onChange={up("notes")} placeholder="Other listings considered, neighborhood notes…" style={ta(!!d.notes)} />
          </Field>
        </SectionStep>

      </div>
    </ModuleShell>
  );
}
