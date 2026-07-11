"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── palette ───────────────────────────────────────────────────────────────────

const DESK   = "#ccc0aa";
const PAPER  = "#faf8f3";
const RULE   = "#ddd5c8";
const INK    = "#1c1917";
const MUTED  = "#78716c";
const STAMP  = "#15803d";
const ACCENT = "#6d28d9";  // darkened purple for light bg

// ── required fields ───────────────────────────────────────────────────────────

const REQUIRED = [
  "city",
  "housingType",
  "monthlyPayment",
  "utilities",
  "totalHousing",
  "housingReflection",
];

// ── form state type ───────────────────────────────────────────────────────────

interface FormData {
  city: string;
  housingType: string;
  listingUrl: string;
  monthlyPayment: string;
  utilities: string;
  rentersInsurance: string;
  securityDeposit: string;
  totalHousing: string;
  housingVsPaycheck: string;
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
  housingVsPaycheck: "",
  housingReflection: "",
  notes: "",
};

// ── sub-components ─────────────────────────────────────────────────────────────

function SectionHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginTop: 2,
        background: `${ACCENT}18`, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 900, color: ACCENT,
      }}>{n}</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 2 }}>{title}</p>
        <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{sub}</p>
      </div>
    </div>
  );
}

function RLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{
        display: "block", padding: "10px 14px", borderRadius: 8, textDecoration: "none",
        background: PAPER, border: `1px solid ${RULE}`, marginBottom: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "border-color 0.15s",
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${ACCENT}66`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = RULE)}>
      <p style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 2 }}>{label} ↗</p>
      <p style={{ fontSize: 11, color: MUTED }}>{desc}</p>
    </a>
  );
}

function Callout({ color, title, children }: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}`, paddingLeft: 14, paddingTop: 10, paddingBottom: 10,
      paddingRight: 12, background: "#fff", borderRadius: "0 6px 6px 0",
      marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <p style={{ fontSize: 10, fontWeight: 800, color, marginBottom: 4, letterSpacing: "0.12em", textTransform: "uppercase" }}>{title}</p>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function inputStyle(filled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "9px 12px", borderRadius: 6,
    border: `1px solid ${filled ? `${ACCENT}66` : RULE}`,
    background: "#f5f1ea", fontSize: 13, color: INK, outline: "none",
    transition: "border-color 0.15s",
    fontFamily: "system-ui, sans-serif",
  };
}

function textareaStyle(filled: boolean): React.CSSProperties {
  return {
    ...inputStyle(filled),
    resize: "vertical" as const,
    minHeight: 80,
    lineHeight: 1.5,
  };
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 5 }}>
      {children}{required && <span style={{ color: ACCENT, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: PAPER, border: `1px solid ${RULE}`, borderRadius: 12,
      padding: 24, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// Rule-of-thumb data for the 30% affordability check
const AFFORDABILITY_RULE = 0.30;

// ── main component ────────────────────────────────────────────────────────────

export default function HousingPage() {
  const router = useRouter();
  const [d, setD] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [netMonthly, setNetMonthly] = useState<string>("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load progress on mount
  useEffect(() => {
    fetch("/api/life-budget/progress")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/margins/login?next=/simulations/life-budget/housing");
          return null;
        }
        return r.json();
      })
      .then((json) => {
        if (!json) return;
        const housing = json.progress?.find((p: { module_slug: string }) => p.module_slug === "housing");
        if (housing?.data) setD({ ...EMPTY, ...(housing.data as Partial<FormData>) });
        if (housing?.completed_at) setIsComplete(true);

        // Pre-populate net monthly from paycheck module
        const paycheck = json.progress?.find((p: { module_slug: string }) => p.module_slug === "paycheck");
        if (paycheck?.data?.netMonthly) setNetMonthly(String(paycheck.data.netMonthly));
      })
      .catch(() => {});
  }, [router]);

  // Auto-calculate total housing cost
  useEffect(() => {
    const rent = parseFloat(d.monthlyPayment) || 0;
    const utils = parseFloat(d.utilities) || 0;
    const insurance = parseFloat(d.rentersInsurance) || 0;
    if (rent > 0 || utils > 0) {
      const total = rent + utils + insurance;
      setD(prev => ({ ...prev, totalHousing: total.toFixed(0) }));
    }
  }, [d.monthlyPayment, d.utilities, d.rentersInsurance]);

  // Auto-calculate housing vs paycheck %
  useEffect(() => {
    const total = parseFloat(d.totalHousing) || 0;
    const net = parseFloat(netMonthly.replace(/[^0-9.]/g, "")) || 0;
    if (total > 0 && net > 0) {
      const pct = ((total / net) * 100).toFixed(1);
      setD(prev => ({ ...prev, housingVsPaycheck: `${pct}%` }));
    }
  }, [d.totalHousing, netMonthly]);

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

  const update = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...d, [key]: e.target.value } as FormData;
    setD(next);
    autoSave(next);
  };

  const filledRequired = REQUIRED.filter((k) => d[k as keyof FormData]?.trim()).length;
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

  // Affordability calculation
  const totalHousingNum = parseFloat(d.totalHousing) || 0;
  const netNum = parseFloat(netMonthly.replace(/[^0-9.]/g, "")) || 0;
  const housingPct = netNum > 0 ? (totalHousingNum / netNum) * 100 : 0;
  const affordabilityOk = housingPct > 0 && housingPct <= 30;
  const affordabilityHigh = housingPct > 30;

  return (
    <main style={{ minHeight: "100vh", background: DESK, color: INK }}>

      {/* Sticky top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: PAPER, borderBottom: `1px solid ${RULE}`,
        padding: "10px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <Link href="/simulations/life-budget"
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: MUTED, textDecoration: "none" }}>
          ← LIFE BUDGET
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: ACCENT,
          }} />
          <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", color: INK }}>MODULE 03 · HOUSING</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saving && <span style={{ fontSize: 11, color: MUTED }}>Saving…</span>}
          {saved && !saving && <span style={{ fontSize: 11, color: STAMP }}>✓ Saved</span>}
          {isComplete
            ? <span style={{ fontSize: 11, fontWeight: 700, color: STAMP, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px" }}>✓ Complete</span>
            : (
              <button
                onClick={markComplete}
                disabled={!allFilled || completing}
                style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "5px 16px",
                  border: "none", cursor: allFilled ? "pointer" : "not-allowed",
                  background: allFilled ? ACCENT : RULE,
                  color: allFilled ? "#fff" : MUTED,
                  transition: "background 0.15s",
                }}
              >
                {completing ? "Saving…" : `Mark Complete (${filledRequired}/${REQUIRED.length})`}
              </button>
            )
          }
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "28px 20px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.28em", color: ACCENT,
            textTransform: "uppercase", display: "block", marginBottom: 8,
          }}>Module 03</span>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: INK, marginBottom: 6, letterSpacing: "-0.3px" }}>
            Housing
          </h1>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
            Rent or buy — both cost more than you think. Search real listings, run the numbers,
            and figure out what "affordable" actually means on your specific paycheck.
          </p>
        </div>

        {/* ── SECTION 1: Your City ── */}
        <Card>
          <SectionHead n={1} title="Your City & Housing Choice"
            sub="Where are you planning to live? This locks in the market you're researching." />

          <Callout color={ACCENT} title="Why city matters">
            A $70k salary in rural Georgia feels completely different than $70k in San Francisco.
            Housing markets are hyperlocal — research your actual city, not a national average.
          </Callout>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
            <div>
              <Label required>City & State</Label>
              <input
                value={d.city} onChange={update("city")}
                placeholder="e.g. Atlanta, GA"
                style={inputStyle(!!d.city)}
              />
              <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Where you plan to live after school</p>
            </div>
            <div>
              <Label required>Housing Type</Label>
              <select value={d.housingType} onChange={update("housingType")} style={inputStyle(!!d.housingType)}>
                <option value="">Select one…</option>
                <option value="Apartment (renting)">Apartment (renting)</option>
                <option value="Shared apartment / roommates">Shared apartment / roommates</option>
                <option value="Studio apartment">Studio apartment</option>
                <option value="House (renting)">House (renting)</option>
                <option value="Buying a home">Buying a home</option>
                <option value="Living with family">Living with family (free/reduced rent)</option>
                <option value="Public transit city / no car needed">Public transit city / no car needed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* ── SECTION 2: Find a Real Listing ── */}
        <Card>
          <SectionHead n={2} title="Find a Real Listing"
            sub="Search actual apartments or homes in your city. Use these sites to find real prices — not estimates." />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            <RLink
              href="https://www.apartments.com"
              label="Apartments.com"
              desc="Filter by city, bedrooms, price. Good for apartment rentals in any city."
            />
            <RLink
              href="https://www.zillow.com/homes/for_rent"
              label="Zillow Rentals"
              desc="Rental listings with photos, neighborhood info, and virtual tours."
            />
            <RLink
              href="https://www.craigslist.org"
              label="Craigslist Housing"
              desc="Local listings, often cheaper than managed properties. Browse your city."
            />
          </div>

          <Callout color="#b45309" title="What to look for">
            Find a real listing you could actually afford — 1BR apartment or shared house.
            Note the monthly rent, whether utilities are included, and what the security deposit is.
            Save the URL below.
          </Callout>

          <div>
            <Label>Listing URL (optional but recommended)</Label>
            <input
              value={d.listingUrl} onChange={update("listingUrl")}
              placeholder="https://www.apartments.com/..."
              style={inputStyle(!!d.listingUrl)}
              type="url"
            />
            <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Paste the link to the specific listing you're using for your research</p>
          </div>
        </Card>

        {/* ── SECTION 3: Monthly Cost Breakdown ── */}
        <Card>
          <SectionHead n={3} title="Monthly Cost Breakdown"
            sub="Add up every cost that comes with your housing choice — not just rent." />

          <Callout color={ACCENT} title="Real cost of housing">
            Rent is just the starting point. Add utilities, renters insurance, and parking
            to get your true monthly housing cost. Most first-time renters underestimate this by $200–$400/month.
          </Callout>

          {/* Demo breakdown box */}
          <div style={{
            background: "#f5f1ea", border: `1px solid ${RULE}`, borderRadius: 8,
            padding: 16, marginBottom: 20, fontFamily: "'Courier New', monospace",
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: MUTED, marginBottom: 10 }}>SAMPLE HOUSING COST BREAKDOWN</p>
            {[
              ["Base Rent", "$1,200.00"],
              ["Electric & Gas", "$85.00"],
              ["Water (if separate)", "$30.00"],
              ["Internet", "$60.00"],
              ["Renters Insurance", "$15.00"],
              ["Parking", "$50.00"],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderBottom: `1px solid ${RULE}`, padding: "4px 0", color: INK }}>
                <span>{label}</span><span>{val}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 900, borderTop: `2px solid ${INK}`, paddingTop: 6, marginTop: 4 }}>
              <span>TOTAL MONTHLY</span><span>$1,440.00</span>
            </div>
            <p style={{ fontSize: 10, color: MUTED, marginTop: 8, fontFamily: "system-ui" }}>
              On a $3,800 net paycheck, this is 37.9% of take-home — above the recommended 30%.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: 16 }}>
            <div>
              <Label required>Monthly Rent / Mortgage Payment</Label>
              <input
                value={d.monthlyPayment} onChange={update("monthlyPayment")}
                placeholder="1200"
                type="number"
                style={inputStyle(!!d.monthlyPayment)}
              />
            </div>
            <div>
              <Label required>Utilities (electric, gas, water, internet)</Label>
              <input
                value={d.utilities} onChange={update("utilities")}
                placeholder="150"
                type="number"
                style={inputStyle(!!d.utilities)}
              />
              <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>
                Estimate: studio ≈ $80–$120, 1BR ≈ $100–$180/month
              </p>
            </div>
            <div>
              <Label>Renters / Homeowners Insurance (monthly)</Label>
              <input
                value={d.rentersInsurance} onChange={update("rentersInsurance")}
                placeholder="15"
                type="number"
                style={inputStyle(!!d.rentersInsurance)}
              />
              <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Renters insurance typically costs $12–$25/month</p>
            </div>
            <div>
              <Label>Security Deposit (one-time)</Label>
              <input
                value={d.securityDeposit} onChange={update("securityDeposit")}
                placeholder="1200"
                type="number"
                style={inputStyle(!!d.securityDeposit)}
              />
              <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Usually 1–2 months' rent, due upfront</p>
            </div>
          </div>

          {/* Auto-calculated total */}
          <div style={{
            background: `${ACCENT}0d`, border: `1px solid ${ACCENT}33`, borderRadius: 8,
            padding: 16, display: "flex", alignItems: "center", gap: 20,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 2 }}>
                Total Monthly Housing Cost
              </p>
              <p style={{ fontSize: 26, fontWeight: 900, color: ACCENT, fontFamily: "'Courier New', monospace" }}>
                ${d.totalHousing ? parseFloat(d.totalHousing).toLocaleString() : "—"}
                <span style={{ fontSize: 13, fontWeight: 400, color: MUTED }}>/mo</span>
              </p>
              <p style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Auto-calculated from rent + utilities + insurance</p>
            </div>
            {netNum > 0 && totalHousingNum > 0 && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: affordabilityHigh ? "#dc2626" : STAMP, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                  % of Net Pay
                </p>
                <p style={{ fontSize: 22, fontWeight: 900, color: affordabilityHigh ? "#dc2626" : STAMP, fontFamily: "'Courier New', monospace" }}>
                  {housingPct.toFixed(1)}%
                </p>
                <p style={{ fontSize: 10, color: affordabilityHigh ? "#dc2626" : STAMP }}>
                  {affordabilityOk ? "✓ Under 30% rule" : affordabilityHigh ? "⚠ Over 30% — tight budget" : ""}
                </p>
              </div>
            )}
          </div>

          {/* Hidden field for portfolio */}
          <input type="hidden" value={d.totalHousing} onChange={update("totalHousing")} />
        </Card>

        {/* ── SECTION 4: The 30% Rule ── */}
        <Card>
          <SectionHead n={4} title="The 30% Rule — Does Your Housing Fit?"
            sub="Financial advisors recommend spending no more than 30% of your net income on housing." />

          <RLink
            href="https://www.consumerfinance.gov/about-us/blog/how-much-of-your-income-should-go-toward-housing-costs/"
            label="CFPB: How much should housing cost?"
            desc="The Consumer Financial Protection Bureau explains the 30% rule and why it matters."
          />
          <RLink
            href="https://www.zillow.com/research/afford-rent-or-buy-23961/"
            label="Zillow Research: Rent vs Buy"
            desc="Real data comparing renting vs buying costs across different U.S. cities."
          />

          <div style={{ background: "#f5f1ea", borderRadius: 8, padding: 16, marginTop: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: INK, marginBottom: 12 }}>Your Affordability Check</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 10, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Your Net Monthly</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: INK, fontFamily: "'Courier New', monospace" }}>
                  {netNum > 0 ? `$${netNum.toLocaleString()}` : "—"}
                </p>
                <p style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>from paycheck module</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 10, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>30% Budget Cap</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: INK, fontFamily: "'Courier New', monospace" }}>
                  {netNum > 0 ? `$${(netNum * AFFORDABILITY_RULE).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                </p>
                <p style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>recommended max</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 10, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Your Housing Cost</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: affordabilityHigh ? "#dc2626" : STAMP, fontFamily: "'Courier New', monospace" }}>
                  {totalHousingNum > 0 ? `$${totalHousingNum.toLocaleString()}` : "—"}
                </p>
                <p style={{ fontSize: 9, color: affordabilityHigh ? "#dc2626" : STAMP, marginTop: 2, fontWeight: 700 }}>
                  {affordabilityHigh ? `⚠ ${housingPct.toFixed(1)}% of net — over budget` :
                    affordabilityOk ? `✓ ${housingPct.toFixed(1)}% of net — within rule` : "fill in rent + paycheck"}
                </p>
              </div>
            </div>
          </div>

          <Callout color="#b45309" title="If you're over 30%">
            That's reality in most cities — not a sign you chose wrong. Options: find a roommate
            (split rent by 40–50%), look further from downtown, negotiate a longer lease for a lower rate,
            or accept the tradeoff knowing your other expenses must shrink. Write your plan in the reflection below.
          </Callout>
        </Card>

        {/* ── SECTION 5: Move-In Costs ── */}
        <Card>
          <SectionHead n={5} title="Move-In Costs — The Upfront Reality"
            sub="Before you can live somewhere, you usually need 2–3 months' rent saved just to walk in the door." />

          <div style={{
            fontFamily: "'Courier New', monospace",
            background: "#f5f1ea", border: `1px solid ${RULE}`, borderRadius: 8,
            padding: 16, marginBottom: 16,
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: MUTED, marginBottom: 10 }}>TYPICAL MOVE-IN COSTS</p>
            {[
              ["First month's rent", "= 1× monthly"],
              ["Last month's rent (some landlords)", "= 1× monthly"],
              ["Security deposit", "= 1–2× monthly"],
              ["Application fees (per person)", "$35–$100"],
              ["Moving costs", "$200–$1,500"],
              ["Furniture & basics", "$500–$2,000"],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderBottom: `1px solid ${RULE}`, padding: "4px 0", color: INK }}>
                <span>{label}</span><span style={{ color: MUTED }}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, color: MUTED, fontFamily: "system-ui" }}>
              On a $1,200/mo apartment: expect $3,600–$5,500 upfront before you sleep there night one.
            </div>
          </div>

          <Callout color={ACCENT} title="Why this matters">
            Most young adults are blindsided by move-in costs. If your security deposit is $1,200
            and you're bringing home $3,200/month, that's almost 40% of one month's pay — gone before you've
            paid any other bill. Plan for this before accepting a job offer in a new city.
          </Callout>
        </Card>

        {/* ── SECTION 6: Renter's Rights ── */}
        <Card>
          <SectionHead n={6} title="Your Rights as a Renter"
            sub="Before you sign a lease, know what protections you have." />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <RLink
              href="https://www.hud.gov/topics/rental_assistance/tenantrights"
              label="HUD: Tenant Rights"
              desc="Federal tenant protections — what landlords can and cannot legally do."
            />
            <RLink
              href="https://www.consumerfinance.gov/ask-cfpb/what-are-my-rights-as-a-renter-en-1555/"
              label="CFPB: Renter Rights Guide"
              desc="Plain-English guide to lease terms, deposits, and dispute processes."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 4 }}>
            {[
              { label: "Security Deposit Return", desc: "Landlord must return within 30 days (most states) with itemized deductions" },
              { label: "Habitability", desc: "Heat, water, and working appliances are legally required — not optional upgrades" },
              { label: "Lease Terms", desc: "Read every line before signing. Subletting rules, pet clauses, and renewal terms matter" },
            ].map(item => (
              <div key={item.label} style={{
                background: "#f5f1ea", borderRadius: 8, padding: 12, border: `1px solid ${RULE}`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: INK, marginBottom: 4 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── SECTION 7: Reflection ── */}
        <Card>
          <SectionHead n={7} title="Your Housing Decision"
            sub="Explain what you found and what tradeoffs you're making." />

          <div style={{ marginBottom: 16 }}>
            <Label required>Housing Reflection</Label>
            <textarea
              value={d.housingReflection} onChange={update("housingReflection")}
              placeholder="What did you find? Is your housing affordable on your projected net income? If you're over 30%, what's your plan? Would you get a roommate, live further out, or accept the tradeoff? What surprised you most about the cost of housing in your city?"
              style={textareaStyle(!!d.housingReflection)}
              rows={5}
            />
          </div>

          <div>
            <Label>Additional Notes</Label>
            <textarea
              value={d.notes} onChange={update("notes")}
              placeholder="Any other notes, links, or things you want to remember…"
              style={textareaStyle(!!d.notes)}
              rows={3}
            />
          </div>
        </Card>

        {/* Complete button */}
        {!isComplete && (
          <div style={{ textAlign: "center", paddingTop: 8 }}>
            <button
              onClick={markComplete}
              disabled={!allFilled || completing}
              style={{
                fontSize: 13, fontWeight: 700, borderRadius: 24, padding: "12px 32px",
                border: "none", cursor: allFilled ? "pointer" : "not-allowed",
                background: allFilled ? ACCENT : RULE,
                color: allFilled ? "#fff" : MUTED,
                transition: "background 0.15s", letterSpacing: "0.06em",
              }}
            >
              {completing ? "Saving…" : allFilled ? "Mark Module 3 Complete →" : `Fill all required fields (${filledRequired}/${REQUIRED.length})`}
            </button>
            {!allFilled && (
              <p style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>
                Required: City, Housing Type, Rent, Utilities, Total Housing Cost, Reflection
              </p>
            )}
          </div>
        )}

        {isComplete && (
          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12,
            padding: 20, textAlign: "center",
          }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: STAMP, marginBottom: 6 }}>✓ Module 3 Complete</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 14 }}>
              Your housing data is saved to your portfolio. Next: Module 4 Transportation.
            </p>
            <Link href="/simulations/life-budget"
              style={{
                display: "inline-block", fontSize: 12, fontWeight: 700, color: ACCENT,
                textDecoration: "none", border: `1px solid ${ACCENT}`, borderRadius: 20,
                padding: "7px 20px",
              }}>
              ← Back to Life Budget Hub
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
