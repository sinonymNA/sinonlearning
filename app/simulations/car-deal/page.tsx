"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Body = "Crossover" | "Sedan" | "Hatchback" | "Pickup";
type Brand = "Arden" | "Lumen" | "Terraforge";
type Trim = "Essential" | "Comfort" | "Apex";
type Screen = "start" | "garage" | "reality" | "market" | "sign" | "result" | "year";
type DealerPageId = "home" | "inventory" | "detail";

const money = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const paymentFor = (amount: number, apr: number, months: number) => {
  const r = apr / 100 / 12;
  if (r === 0) return amount / months;
  return (amount * r) / (1 - Math.pow(1 + r, -months));
};

// ─── Data ────────────────────────────────────────────────────────────────────

const bodies: { name: Body; price: number; note: string }[] = [
  { name: "Crossover", price: 28200, note: "Versatile, higher seating, room for people and gear." },
  { name: "Sedan", price: 23800, note: "Efficient, easy to park, and easier on the budget." },
  { name: "Hatchback", price: 25200, note: "Compact footprint with surprising cargo flexibility." },
  { name: "Pickup", price: 34600, note: "Big capability, bigger fuel and insurance costs." },
];

const brands: { name: Brand; modifier: number; note: string }[] = [
  { name: "Arden", modifier: 0, note: "Dependable mainstream value" },
  { name: "Lumen", modifier: 3600, note: "Tech-forward, premium cabin" },
  { name: "Terraforge", modifier: 5500, note: "Rugged, adventure-ready" },
];

const trims: { name: Trim; modifier: number; note: string }[] = [
  { name: "Essential", modifier: 0, note: "Safety basics, cloth, simple tech" },
  { name: "Comfort", modifier: 2650, note: "Heated seats, driver assists, upgraded audio" },
  { name: "Apex", modifier: 6100, note: "Panoramic roof, 19-inch wheels, premium sound" },
];

const paintColors = [
  { name: "Midnight Black", value: "#1c1c1e" },
  { name: "Deep Red", value: "#7a1a14" },
  { name: "Ocean Blue", value: "#1e3a5f" },
  { name: "Silver", value: "#9ca3af" },
];

const DEALERS = [
  {
    id: "flash",
    name: "Flash Drive Auto",
    domain: "flashdriveauto.com",
    tagline: "LOWEST PAYMENTS. PERIOD.",
    taglineSub: "Metro's #1 volume dealer. Over 2,000 vehicles moved last year.",
    accentColor: "#f97316",
    bgColor: "#111827",
    textColor: "#f8fafc",
    heroBg: "#1f2937",
    apr: 10.9,
    months: 84,
    docFee: 899,
    packageFee: 1595,
    packageName: "DriveSure Protection Package",
    hidden: "The payment looks low because the loan is 84 months (7 years) and a $1,595 DriveSure package is already baked into the listed price — you never chose it.",
  },
  {
    id: "northline",
    name: "Northline Motor Group",
    domain: "northlinemotors.com",
    tagline: "Curated. Certified. Confident.",
    taglineSub: "Northline Certified™ inspection program · premium pre-owned specialists",
    accentColor: "#60a5fa",
    bgColor: "#0e1a2d",
    textColor: "#f0f9ff",
    heroBg: "#152236",
    apr: 7.2,
    months: 60,
    docFee: 649,
    packageFee: 495,
    packageName: "Certified Inspection Fee",
    hidden: "The price looks clean, but the $649 documentation fee is nearly three times what other dealers charge. The 60-month term makes the monthly look better than it is.",
  },
  {
    id: "common",
    name: "Common Mile Auto",
    domain: "commonmileauto.com",
    tagline: "Fair Price. Full Disclosure.",
    taglineSub: "Out-the-door pricing · no add-on packages · 3-day return guarantee",
    accentColor: "#4ade80",
    bgColor: "#052e16",
    textColor: "#f0fdf4",
    heroBg: "#064e3b",
    apr: 5.9,
    months: 48,
    docFee: 249,
    packageFee: 0,
    packageName: "",
    hidden: "The most straightforward of the three — shorter loan = higher payment but far less interest paid overall. Out-the-door price includes all fees upfront.",
  },
] as const;

type Dealer = typeof DEALERS[number];

// ─── Inventory ────────────────────────────────────────────────────────────────

type InventoryItem = {
  id: string;
  brand: Brand;
  body: Body;
  trim: Trim;
  year: number;
  mileage: number;
  basePrice: number;
  colorName: string;
  colorHex: string;
  isTarget: boolean;
};

const invColors: { name: string; hex: string }[] = [
  { name: "Midnight Black", hex: "#1c1c1e" },
  { name: "Pearl White", hex: "#e8e8e8" },
  { name: "Ocean Blue", hex: "#1e3a5f" },
  { name: "Silver", hex: "#9ca3af" },
  { name: "Deep Red", hex: "#7a1a14" },
  { name: "Forest Green", hex: "#2d5a27" },
];

function generateInventory(targetBody: Body, targetBrand: Brand, targetTrim: Trim, dealerId: string, round: number): InventoryItem[] {
  const seed = round * 9871 + dealerId.charCodeAt(0) * 137;
  const rng = (n: number) => Math.abs(Math.sin(seed + n) * 10000) % 1;

  const allBodies: Body[] = ["Crossover", "Sedan", "Hatchback", "Pickup"];
  const allBrands: Brand[] = ["Arden", "Lumen", "Terraforge"];
  const allTrims: Trim[] = ["Essential", "Comfort", "Apex"];

  const count = 6 + Math.floor(rng(0) * 3);
  const targetSlot = 1 + Math.floor(rng(99) * (count - 2));
  const items: InventoryItem[] = [];

  for (let i = 0; i < count; i++) {
    if (i === targetSlot) {
      const bodyObj = bodies.find(b => b.name === targetBody)!;
      const brandObj = brands.find(b => b.name === targetBrand)!;
      const trimObj = trims.find(t => t.name === targetTrim)!;
      const base = bodyObj.price + brandObj.modifier + trimObj.modifier;
      const c = invColors[Math.floor(rng(i + 30) * invColors.length)];
      items.push({
        id: `${dealerId}-target`,
        brand: targetBrand, body: targetBody, trim: targetTrim,
        year: 2022 + Math.floor(rng(i + 50) * 3),
        mileage: 8000 + Math.round(rng(i + 60) * 42000 / 100) * 100,
        basePrice: Math.round((base * (0.87 + rng(i) * 0.12)) / 100) * 100,
        colorName: c.name, colorHex: c.hex, isTarget: true,
      });
    } else {
      let b = allBodies[Math.floor(rng(i * 3 + 1) * allBodies.length)];
      let br = allBrands[Math.floor(rng(i * 3 + 2) * allBrands.length)];
      const t = allTrims[Math.floor(rng(i * 3 + 3) * allTrims.length)];
      if (b === targetBody && br === targetBrand) b = allBodies[(allBodies.indexOf(b) + 1) % allBodies.length];
      const bodyObj = bodies.find(x => x.name === b)!;
      const brandObj = brands.find(x => x.name === br)!;
      const trimObj = trims.find(x => x.name === t)!;
      const base = bodyObj.price + brandObj.modifier + trimObj.modifier;
      const c = invColors[Math.floor(rng(i + 40) * invColors.length)];
      items.push({
        id: `${dealerId}-${i}`,
        brand: br, body: b, trim: t,
        year: 2020 + Math.floor(rng(i + 10) * 5),
        mileage: 5000 + Math.round(rng(i + 20) * 65000 / 100) * 100,
        basePrice: Math.round((base * (0.82 + rng(i + 5) * 0.18)) / 100) * 100,
        colorName: c.name, colorHex: c.hex, isTarget: false,
      });
    }
  }
  return items;
}

// ─── Car SVG ─────────────────────────────────────────────────────────────────

function CarSVG({ body, color }: { body: Body; color: string }) {
  const isLight = color === "#9ca3af" || color === "#e8e8e8";
  const bodyStroke = isLight ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.18)";
  const glass = "rgba(150,200,255,0.26)";
  const gStroke = "rgba(255,255,255,0.35)";
  const hi = "rgba(255,255,255,0.13)";

  const wheel = (cx: number, cy: number, r: number) => (
    <g key={`w${cx}`}>
      <circle cx={cx} cy={cy} r={r + 2} fill="rgba(0,0,0,0.28)" />
      <circle cx={cx} cy={cy} r={r} fill="#111" />
      <circle cx={cx} cy={cy} r={r * 0.66} fill="#2a2a2a" />
      <circle cx={cx} cy={cy} r={r * 0.20} fill="#555" />
      {[0, 60, 120, 180, 240, 300].map(a => {
        const rad = (a * Math.PI) / 180;
        return <line key={a} x1={cx + Math.cos(rad) * r * 0.22} y1={cy + Math.sin(rad) * r * 0.22} x2={cx + Math.cos(rad) * r * 0.60} y2={cy + Math.sin(rad) * r * 0.60} stroke="#666" strokeWidth="1.8" />;
      })}
    </g>
  );

  if (body === "Sedan") return (
    <svg viewBox="0 0 520 185" className="w-full h-full drop-shadow-lg">
      <ellipse cx="260" cy="178" rx="210" ry="8" fill="rgba(0,0,0,0.14)" />
      {/* lower body */}
      <path d="M44,162 L44,136 C48,116 66,102 96,94 L154,86 Q168,64 202,54 L300,54 Q338,54 364,78 L406,90 C428,102 444,122 444,142 L444,162 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* roof — low, fast */}
      <path d="M162,84 Q185,46 212,42 L302,42 Q328,42 352,60 L364,78 L154,86 Z" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <path d="M192,68 Q208,48 222,44 L300,44 Q320,46 338,62 Z" fill={hi} />
      {/* windshield */}
      <path d="M170,136 L204,64 L220,56 L220,136 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      {/* side glass */}
      <path d="M224,56 L300,56 L320,76 L320,136 L224,136 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      {/* rear glass — trunk slope */}
      <path d="M324,76 L360,82 L360,136 L324,136 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      <line x1="224" y1="92" x2="224" y2="156" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
      <path d="M155,86 L166,82 L166,90 Z" fill={color} stroke={bodyStroke} strokeWidth="1" />
      {/* headlights */}
      <path d="M44,126 L44,144 L60,148 L60,122 Z" fill="#fef08a" opacity="0.88" />
      <path d="M440,124 L444,124 L444,148 L440,148 Z" fill="#dc2626" />
      <path d="M436,126 L440,124 L440,148 L436,146 Z" fill="#b91c1c" />
      <rect x="354" y="76" width="10" height="3" rx="1" fill={color} stroke={bodyStroke} strokeWidth="0.5" />
      {wheel(116, 165, 29)}
      {wheel(374, 165, 29)}
    </svg>
  );

  if (body === "Crossover") return (
    <svg viewBox="0 0 520 205" className="w-full h-full drop-shadow-lg">
      <ellipse cx="260" cy="196" rx="215" ry="9" fill="rgba(0,0,0,0.14)" />
      {/* body — notably taller, boxy */}
      <path d="M38,178 L38,138 C42,112 62,94 96,84 L152,74 Q168,48 202,40 L308,40 Q346,40 374,68 L414,82 C438,96 458,120 458,148 L458,178 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* roof — flat top, squared shoulders */}
      <path d="M156,72 Q174,44 202,38 L308,38 Q346,38 370,66 L374,68 L152,74 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      <path d="M186,56 Q198,40 210,38 L306,38 Q334,40 354,58 Z" fill={hi} />
      {/* prominent roof rails */}
      <rect x="160" y="36" width="218" height="5" rx="2.5" fill="rgba(0,0,0,0.38)" />
      {/* windshield — more upright */}
      <path d="M160,148 L190,58 L212,48 L212,148 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      {/* side glass — tall */}
      <path d="M216,48 L312,48 L338,72 L338,148 L216,148 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      {/* rear glass — more vertical */}
      <path d="M342,72 L372,78 L372,148 L342,148 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      <line x1="216" y1="98" x2="216" y2="172" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
      <rect x="150" y="72" width="14" height="10" rx="2" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <path d="M38,120 L38,148 L58,154 L58,114 Z" fill="#fef08a" opacity="0.88" />
      <path d="M454,118 L458,118 L458,160 L454,158 Z" fill="#dc2626" />
      <path d="M448,120 L454,118 L454,158 L448,156 Z" fill="#b91c1c" />
      {/* raised wheel arches */}
      <path d="M68,174 Q118,154 168,174" fill="none" stroke={bodyStroke} strokeWidth="1.5" />
      <path d="M330,174 Q380,154 430,174" fill="none" stroke={bodyStroke} strokeWidth="1.5" />
      {wheel(118, 180, 34)}
      {wheel(380, 180, 34)}
    </svg>
  );

  if (body === "Hatchback") return (
    <svg viewBox="0 0 480 185" className="w-full h-full drop-shadow-lg">
      <ellipse cx="240" cy="178" rx="195" ry="8" fill="rgba(0,0,0,0.14)" />
      {/* body — short, compact */}
      <path d="M40,162 L40,134 C44,114 60,100 88,92 L138,84 Q154,62 186,52 L276,52 Q306,54 332,78 L364,94 C380,108 392,128 392,148 L392,162 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* roof — steeply raked rear, wedge shape */}
      <path d="M144,82 Q162,50 188,46 L276,46 Q306,48 330,76 L332,78 L138,84 Z" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <path d="M170,66 Q182,48 194,46 L274,46 Q296,48 318,68 Z" fill={hi} />
      {/* windshield */}
      <path d="M150,132 L182,62 L198,54 L198,132 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      {/* side glass */}
      <path d="M202,54 L276,54 L292,74 L292,132 L202,132 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      {/* hatch window — steep, nearly vertical */}
      <path d="M296,74 L332,88 L332,132 L296,132 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      {/* hatch seam */}
      <path d="M294,74 L332,88" stroke="rgba(0,0,0,0.14)" strokeWidth="2" />
      <line x1="202" y1="90" x2="202" y2="156" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
      <path d="M141,84 L152,80 L152,88 Z" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <path d="M40,118 L40,140 L56,144 L56,114 Z" fill="#fef08a" opacity="0.88" />
      <path d="M388,112 L392,112 L392,150 L388,150 Z" fill="#dc2626" />
      <path d="M384,114 L388,112 L388,150 L384,148 Z" fill="#b91c1c" />
      {wheel(106, 165, 28)}
      {wheel(320, 165, 28)}
    </svg>
  );

  // Pickup — long cab + distinct bed
  return (
    <svg viewBox="0 0 560 198" className="w-full h-full drop-shadow-lg">
      <ellipse cx="280" cy="188" rx="235" ry="9" fill="rgba(0,0,0,0.14)" />
      {/* cab — tall, squared */}
      <path d="M36,174 L36,124 C40,100 60,82 92,72 L146,64 Q160,40 190,34 L264,34 Q296,34 314,58 L318,170 L36,174 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* cab roof — flat, substantial */}
      <path d="M150,62 Q168,36 192,32 L264,32 Q298,34 312,56 L314,58 L146,64 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      <path d="M178,48 Q192,34 198,32 L262,32 Q288,34 302,50 Z" fill={hi} />
      {/* long bed */}
      <path d="M318,64 L494,64 L494,172 L318,172 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      <line x1="318" y1="100" x2="494" y2="100" stroke="rgba(0,0,0,0.10)" strokeWidth="2" />
      {/* stake pockets */}
      {[340, 390, 440].map(x => (
        <rect key={x} x={x} y="64" width="8" height="10" rx="1" fill="rgba(0,0,0,0.2)" />
      ))}
      {/* tailgate */}
      <rect x="490" y="66" width="4" height="106" rx="1" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* bed rail */}
      <rect x="316" y="60" width="180" height="6" rx="3" fill={color} stroke={bodyStroke} strokeWidth="1" />
      {/* windshield */}
      <path d="M153,146 L186,50 L204,40 L204,146 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      {/* side glass */}
      <path d="M208,40 L264,40 L280,58 L280,146 L208,146 Z" fill={glass} stroke={gStroke} strokeWidth="1" />
      <path d="M284,58 L316,66 L316,146 L284,146 Z" fill={glass} stroke={gStroke} strokeWidth="0.8" opacity="0.65" />
      {/* big truck mirror */}
      <rect x="138" y="66" width="16" height="12" rx="2" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <line x1="146" y1="70" x2="152" y2="66" stroke={bodyStroke} strokeWidth="1" />
      {/* headlight cluster */}
      <path d="M36,108 L36,134 L60,140 L60,102 Z" fill="#fef08a" opacity="0.88" />
      <rect x="36" y="98" width="24" height="4" rx="2" fill="#fef08a" opacity="0.45" />
      {/* tail lights */}
      <path d="M490,108 L494,108 L494,158 L490,158 Z" fill="#dc2626" />
      <path d="M484,110 L490,108 L490,158 L484,156 Z" fill="#b91c1c" />
      {/* running boards */}
      <rect x="50" y="164" width="266" height="7" rx="3" fill="rgba(0,0,0,0.16)" />
      <path d="M66,170 Q116,146 168,170" fill="none" stroke={bodyStroke} strokeWidth="2" />
      <path d="M348,170 Q400,146 452,170" fill="none" stroke={bodyStroke} strokeWidth="2" />
      {wheel(118, 176, 35)}
      {wheel(402, 176, 35)}
    </svg>
  );
}

// ─── Dealer Logo ──────────────────────────────────────────────────────────────

function DealerLogo({ id, accent, size = 20 }: { id: string; accent: string; size?: number }) {
  if (id === "flash") return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polygon points="14,2 4,14 11,14 10,22 20,10 13,10" fill={accent} />
    </svg>
  );
  if (id === "northline") return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polygon points="12,2 21,8 21,16 12,22 3,16 3,8" fill="none" stroke={accent} strokeWidth="1.5" />
      <polygon points="12,6 17,10 17,15 12,19 7,15 7,10" fill={accent} opacity="0.3" />
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke={accent} strokeWidth="1.5" />
      <path d="M8,12 Q12,7 16,12 Q12,17 8,12Z" fill={accent} opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill={accent} />
    </svg>
  );
}

// ─── Dealer Pages ─────────────────────────────────────────────────────────────

function DealerHome({ dealer, onNavigate }: { dealer: Dealer; onNavigate: (p: DealerPageId) => void }) {
  return (
    <div className="h-full overflow-y-auto text-sm" style={{ background: dealer.bgColor, color: dealer.textColor }}>
      <div className="px-8 py-10" style={{ background: dealer.heroBg }}>
        <div className="flex items-center gap-3 mb-5">
          <DealerLogo id={dealer.id} accent={dealer.accentColor} size={28} />
          <div>
            <p className="font-black text-sm tracking-widest">{dealer.name.toUpperCase()}</p>
            <p className="text-[10px] opacity-50">{dealer.domain}</p>
          </div>
        </div>
        <h2 className="text-3xl font-black leading-tight mb-3" style={{ color: dealer.accentColor }}>{dealer.tagline}</h2>
        <p className="text-xs opacity-60 mb-6 max-w-lg">{dealer.taglineSub}</p>
        <button type="button" onClick={() => onNavigate("inventory")}
          className="rounded-lg px-6 py-3 text-sm font-bold transition hover:opacity-90"
          style={{ background: dealer.accentColor, color: dealer.bgColor }}>
          Browse Inventory →
        </button>
      </div>
      <div className="grid grid-cols-3 py-5 px-2" style={{ background: "rgba(0,0,0,0.32)" }}>
        {dealer.id === "flash" && (<>
          <div className="text-center px-4"><p className="text-2xl font-black" style={{ color: dealer.accentColor }}>2,000+</p><p className="text-[10px] opacity-50 mt-1">Vehicles sold last year</p></div>
          <div className="text-center px-4"><p className="text-2xl font-black" style={{ color: dealer.accentColor }}>⭐ 4.8</p><p className="text-[10px] opacity-50 mt-1">847 customer reviews</p></div>
          <div className="text-center px-4"><p className="text-2xl font-black" style={{ color: dealer.accentColor }}>$299</p><p className="text-[10px] opacity-50 mt-1">Payments as low as /mo*</p></div>
        </>)}
        {dealer.id === "northline" && (<>
          <div className="text-center px-4"><p className="text-2xl font-black" style={{ color: dealer.accentColor }}>150-pt</p><p className="text-[10px] opacity-50 mt-1">Certified inspection</p></div>
          <div className="text-center px-4"><p className="text-2xl font-black" style={{ color: dealer.accentColor }}>7.2%</p><p className="text-[10px] opacity-50 mt-1">Financing from APR</p></div>
          <div className="text-center px-4"><p className="text-2xl font-black" style={{ color: dealer.accentColor }}>60-mo</p><p className="text-[10px] opacity-50 mt-1">Standard loan terms</p></div>
        </>)}
        {dealer.id === "common" && (<>
          <div className="text-center px-4"><p className="text-2xl font-black" style={{ color: dealer.accentColor }}>$0</p><p className="text-[10px] opacity-50 mt-1">Hidden add-on packages</p></div>
          <div className="text-center px-4"><p className="text-2xl font-black" style={{ color: dealer.accentColor }}>5.9%</p><p className="text-[10px] opacity-50 mt-1">APR from</p></div>
          <div className="text-center px-4"><p className="text-2xl font-black" style={{ color: dealer.accentColor }}>48-mo</p><p className="text-[10px] opacity-50 mt-1">Standard loan terms</p></div>
        </>)}
      </div>
      <div className="px-8 py-8 text-center">
        <p className="text-sm opacity-50 mb-4">Ready to find your next vehicle?</p>
        <button type="button" onClick={() => onNavigate("inventory")}
          className="rounded-lg border px-8 py-3 text-sm font-bold transition hover:opacity-80"
          style={{ borderColor: dealer.accentColor, color: dealer.accentColor }}>
          View All Inventory →
        </button>
      </div>
      {dealer.id === "flash" && (
        <p className="px-8 pb-6 text-[9px] opacity-30 leading-relaxed">*Payment shown based on 84-month loan at 10.9% APR with approved credit and $3,000 down payment. DriveSure Protection Package ($1,595) included in all advertised vehicles. See dealer for complete details.</p>
      )}
    </div>
  );
}

function DealerInventoryPage({
  dealer, inventory, onSelectVehicle, onNavigate,
}: {
  dealer: Dealer;
  inventory: InventoryItem[];
  onSelectVehicle: (item: InventoryItem) => void;
  onNavigate: (p: DealerPageId) => void;
}) {
  const [filter, setFilter] = useState<Body | "All">("All");
  const filtered = filter === "All" ? inventory : inventory.filter(i => i.body === filter);

  return (
    <div className="h-full overflow-y-auto" style={{ background: dealer.bgColor, color: dealer.textColor }}>
      <div className="px-5 py-3 sticky top-0 z-10 border-b" style={{ background: dealer.heroBg, borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => onNavigate("home")} className="text-[10px] opacity-50 hover:opacity-100 transition">← Home</button>
          <p className="text-xs font-black tracking-widest">INVENTORY</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["All", "Sedan", "Crossover", "Hatchback", "Pickup"] as const).map(b => (
            <button key={b} type="button" onClick={() => setFilter(b)}
              className="rounded-full px-3 py-1 text-[10px] font-semibold transition"
              style={{ background: filter === b ? dealer.accentColor : "rgba(255,255,255,0.07)", color: filter === b ? dealer.bgColor : "rgba(255,255,255,0.55)" }}>
              {b}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {filtered.map(item => {
          const showPrice = dealer.id === "flash"
            ? item.basePrice + dealer.packageFee
            : dealer.id === "common"
            ? item.basePrice + dealer.docFee
            : item.basePrice;
          const mo = paymentFor(showPrice - 3000, dealer.apr, dealer.months);
          return (
            <button key={item.id} type="button"
              onClick={() => { onSelectVehicle(item); onNavigate("detail"); }}
              className="rounded-xl border text-left transition hover:scale-[1.02] active:scale-[0.99]"
              style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.035)" }}>
              <div className="rounded-t-xl px-3 pt-3 pb-1" style={{ background: "rgba(0,0,0,0.28)" }}>
                <div className="h-14">
                  <CarSVG body={item.body} color={item.colorHex} />
                </div>
              </div>
              <div className="p-3">
                <p className="text-[10px] font-black leading-tight">{item.year} {item.brand} {item.body}</p>
                <p className="text-[9px] opacity-50 mb-2">{item.trim} · {item.colorName} · {item.mileage.toLocaleString()} mi</p>
                {dealer.id === "flash" ? (
                  <><p className="text-[10px] font-bold" style={{ color: dealer.accentColor }}>{money(Math.round(mo))}/mo*</p><p className="text-[9px] opacity-40">List: {money(showPrice)}</p></>
                ) : (
                  <><p className="text-[10px] font-bold" style={{ color: dealer.accentColor }}>{money(showPrice)}</p><p className="text-[9px] opacity-40">Est. {money(Math.round(mo))}/mo</p></>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DealerDetailPage({
  dealer, item, onNavigate, onChooseDealer, chosenDealerId,
}: {
  dealer: Dealer;
  item: InventoryItem;
  onNavigate: (p: DealerPageId) => void;
  onChooseDealer: (id: string) => void;
  chosenDealerId: string | null;
}) {
  const showPrice = dealer.id === "flash"
    ? item.basePrice + dealer.packageFee
    : dealer.id === "common"
    ? item.basePrice + dealer.docFee
    : item.basePrice;
  const financed = dealer.id === "northline"
    ? item.basePrice + dealer.docFee + dealer.packageFee - 3000
    : showPrice - 3000;
  const mo = paymentFor(financed, dealer.apr, dealer.months);
  const isChosen = chosenDealerId === dealer.id;

  return (
    <div className="h-full overflow-y-auto" style={{ background: dealer.bgColor, color: dealer.textColor }}>
      <div className="px-5 py-3 sticky top-0 z-10 border-b" style={{ background: dealer.heroBg, borderColor: "rgba(255,255,255,0.06)" }}>
        <button onClick={() => onNavigate("inventory")} className="text-[10px] opacity-50 hover:opacity-100 transition">← Inventory</button>
      </div>
      <div className="px-8 py-6" style={{ background: "rgba(0,0,0,0.28)" }}>
        <div className="max-w-sm mx-auto h-32">
          <CarSVG body={item.body} color={item.colorHex} />
        </div>
        <h2 className="text-lg font-black mt-3">{item.year} {item.brand} {item.body} {item.trim}</h2>
        <p className="text-xs opacity-50">{item.colorName} · {item.mileage.toLocaleString()} miles</p>
      </div>
      <div className="px-8 py-5 space-y-4">
        <div className="rounded-xl border p-5" style={{ borderColor: "rgba(255,255,255,0.09)", background: "rgba(0,0,0,0.22)" }}>
          {dealer.id === "flash" && (<>
            <p className="text-[10px] font-bold tracking-[0.15em] opacity-50 mb-1">AS LOW AS*</p>
            <p className="text-3xl font-black" style={{ color: dealer.accentColor }}>{money(Math.round(mo))}<span className="text-base">/mo</span></p>
            <div className="mt-4 pt-4 border-t space-y-2 text-xs" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex justify-between"><span className="opacity-50">Vehicle price</span><span>{money(item.basePrice)}</span></div>
              <div className="flex justify-between"><span className="opacity-50">{dealer.packageName}</span><span style={{ color: dealer.accentColor }}>+{money(dealer.packageFee)}</span></div>
              <div className="flex justify-between"><span className="opacity-50">Doc fee</span><span>+{money(dealer.docFee)}</span></div>
              <div className="flex justify-between font-bold mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}><span>Total listed</span><span>{money(showPrice + dealer.docFee)}</span></div>
            </div>
            <p className="mt-3 text-[9px] opacity-30">*84-month loan, 10.9% APR, $3,000 down, approved credit required.</p>
          </>)}
          {dealer.id === "northline" && (<>
            <p className="text-[10px] font-bold tracking-[0.15em] opacity-50 mb-1">NORTHLINE PRICE</p>
            <p className="text-3xl font-black" style={{ color: dealer.accentColor }}>{money(item.basePrice)}</p>
            <div className="mt-4 pt-4 border-t space-y-2 text-xs" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex justify-between"><span className="opacity-50">Vehicle price</span><span>{money(item.basePrice)}</span></div>
              <div className="flex justify-between"><span className="opacity-50">Documentation fee</span><span style={{ color: "#fca5a5" }}>+{money(dealer.docFee)}</span></div>
              <div className="flex justify-between"><span className="opacity-50">{dealer.packageName}</span><span>+{money(dealer.packageFee)}</span></div>
              <div className="flex justify-between font-bold mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}><span>Out-the-door est.</span><span>{money(item.basePrice + dealer.docFee + dealer.packageFee)}</span></div>
              <div className="flex justify-between"><span className="opacity-50">Est. payment</span><span>{money(Math.round(mo))}/mo · {dealer.months} mo @ {dealer.apr}%</span></div>
            </div>
          </>)}
          {dealer.id === "common" && (<>
            <p className="text-[10px] font-bold tracking-[0.15em] opacity-50 mb-1">OUT-THE-DOOR PRICE</p>
            <p className="text-3xl font-black" style={{ color: dealer.accentColor }}>{money(showPrice)}</p>
            <div className="mt-4 pt-4 border-t space-y-2 text-xs" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="flex justify-between"><span className="opacity-50">Vehicle price</span><span>{money(item.basePrice)}</span></div>
              <div className="flex justify-between"><span className="opacity-50">Documentation fee</span><span>+{money(dealer.docFee)}</span></div>
              <div className="flex justify-between"><span className="opacity-50">Add-on packages</span><span style={{ color: dealer.accentColor }}>$0</span></div>
              <div className="flex justify-between font-bold mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}><span>Total out-the-door</span><span>{money(showPrice)}</span></div>
              <div className="flex justify-between"><span className="opacity-50">Est. payment</span><span>{money(Math.round(mo))}/mo · {dealer.months} mo @ {dealer.apr}%</span></div>
            </div>
          </>)}
        </div>

        {!item.isTarget && (
          <div className="rounded-lg px-4 py-3 text-xs" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)" }}>
            <p className="text-orange-300">⚠ This isn&apos;t your target vehicle — check the body type and brand against your build before taking notes.</p>
          </div>
        )}
        {item.isTarget && (
          <div className="rounded-lg px-4 py-3 text-xs" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)" }}>
            <p className="text-green-400">✓ This matches your dream build. Take notes on your phone.</p>
          </div>
        )}

        <button type="button" onClick={() => onChooseDealer(isChosen ? "" : dealer.id)}
          className="w-full rounded-xl py-3 text-sm font-black transition hover:opacity-90"
          style={{
            background: isChosen ? "transparent" : dealer.accentColor,
            color: isChosen ? dealer.accentColor : dealer.bgColor,
            border: `2px solid ${dealer.accentColor}`,
          }}>
          {isChosen ? "✓ Selected — click to change" : "Choose this dealer →"}
        </button>
      </div>
    </div>
  );
}

// ─── Simulated Browser ────────────────────────────────────────────────────────

function SimBrowser({
  dealers, activeTab, onTabChange, dealerPages, inventories,
  selectedVehicles, onPageChange, onSelectVehicle, onChooseDealer, chosenDealerId,
}: {
  dealers: readonly Dealer[];
  activeTab: string;
  onTabChange: (id: string) => void;
  dealerPages: Record<string, DealerPageId>;
  inventories: Record<string, InventoryItem[]>;
  selectedVehicles: Record<string, InventoryItem | null>;
  onPageChange: (dealerId: string, page: DealerPageId) => void;
  onSelectVehicle: (dealerId: string, item: InventoryItem) => void;
  onChooseDealer: (id: string) => void;
  chosenDealerId: string | null;
}) {
  const dealer = dealers.find(d => d.id === activeTab)!;
  const page = dealerPages[activeTab] ?? "home";
  const selVehicle = selectedVehicles[activeTab] ?? null;
  const inv = inventories[activeTab] ?? [];

  const urlSuffix = page === "home" ? "" : page === "inventory" ? "/inventory"
    : selVehicle ? `/inventory/${selVehicle.year}-${selVehicle.brand.toLowerCase()}-${selVehicle.body.toLowerCase()}`
    : "/inventory/vehicle";

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-[#21262d] shadow-2xl">
      {/* Browser chrome */}
      <div className="bg-[#1e2433] border-b border-[#0f172a] flex-shrink-0">
        {/* Tab bar */}
        <div className="flex items-stretch">
          <div className="flex items-center gap-1.5 px-3 border-r border-[#0f172a] flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex flex-1 min-w-0">
            {dealers.map(d => (
              <button key={d.id} type="button" onClick={() => onTabChange(d.id)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-medium border-r border-[#0f172a] transition-colors min-w-0 flex-1"
                style={{ background: activeTab === d.id ? "#0d1117" : "#1a1f2e", color: activeTab === d.id ? "#e2e8f0" : "#64748b" }}>
                <DealerLogo id={d.id} accent={activeTab === d.id ? d.accentColor : "#4a5568"} size={11} />
                <span className="truncate text-[10px]">{d.name}</span>
                {chosenDealerId === d.id && <span className="ml-auto text-[8px] rounded-full px-1.5 py-0.5 flex-shrink-0 font-bold" style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        {/* URL + breadcrumb */}
        <div className="flex items-center gap-2 px-3 py-2 border-t border-[#0f172a]">
          <button onClick={() => onPageChange(activeTab, "home")} className="text-[#64748b] hover:text-[#94a3b8] text-xs flex-shrink-0">←</button>
          <div className="flex-1 rounded bg-[#0d1117] border border-[#1e293b] px-3 py-1 flex items-center gap-2 min-w-0">
            <span className="text-[#22c55e] text-[10px] flex-shrink-0">🔒</span>
            <span className="text-[11px] text-[#94a3b8] truncate">{`https://${dealer.domain}${urlSuffix}`}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#475569] flex-shrink-0">
            <button onClick={() => onPageChange(activeTab, "home")} className="hover:text-[#94a3b8] transition">Home</button>
            <span>/</span>
            <button onClick={() => onPageChange(activeTab, "inventory")} className="hover:text-[#94a3b8] transition">Inventory</button>
            {page === "detail" && selVehicle && (<><span>/</span><span className="text-[#94a3b8]">{selVehicle.year} {selVehicle.brand}</span></>)}
          </div>
        </div>
      </div>
      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {page === "home" && <DealerHome dealer={dealer} onNavigate={p => onPageChange(activeTab, p)} />}
        {page === "inventory" && (
          <DealerInventoryPage dealer={dealer} inventory={inv}
            onSelectVehicle={item => onSelectVehicle(activeTab, item)}
            onNavigate={p => onPageChange(activeTab, p)} />
        )}
        {page === "detail" && selVehicle && (
          <DealerDetailPage dealer={dealer} item={selVehicle}
            onNavigate={p => onPageChange(activeTab, p)}
            onChooseDealer={onChooseDealer} chosenDealerId={chosenDealerId} />
        )}
        {page === "detail" && !selVehicle && (
          <div className="h-full flex items-center justify-center text-[#475569] text-sm" style={{ background: dealer.bgColor }}>
            Select a vehicle from inventory first
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phone Widget ─────────────────────────────────────────────────────────────

type PhoneNotes = { price: string; monthly: string; apr: string; term: string; fees: string; notes: string };
const emptyNotes = (): PhoneNotes => ({ price: "", monthly: "", apr: "", term: "", fees: "", notes: "" });

function PhoneWidget({
  dealers, phoneData, activeTab, onTabChange, onFieldChange,
}: {
  dealers: readonly Dealer[];
  phoneData: Record<string, PhoneNotes>;
  activeTab: string;
  onTabChange: (id: string) => void;
  onFieldChange: (dealerId: string, field: keyof PhoneNotes, value: string) => void;
}) {
  const dealer = dealers.find(d => d.id === activeTab)!;
  const data = phoneData[activeTab];
  const completeCount = dealers.filter(d => { const n = phoneData[d.id]; return n.price && n.apr && n.term && n.fees && n.notes; }).length;
  const thisDone = !!(data.price && data.apr && data.term && data.fees && data.notes);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 rounded-[2rem] border-[3px] border-[#2a2a3a] bg-[#08080f] overflow-hidden flex flex-col"
        style={{ boxShadow: "0 0 40px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.04)" }}>
        {/* Notch */}
        <div className="flex justify-center pt-2 pb-0">
          <div className="w-20 h-4 rounded-full bg-[#0f0f1a] flex items-center justify-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-[#1e1e2e]" />
            <div className="w-6 h-0.5 rounded-full bg-[#1e1e2e]" />
          </div>
        </div>
        {/* App */}
        <div className="flex-1 min-h-0 flex flex-col px-2.5 pb-3 overflow-hidden">
          <div className="px-1 pt-1 pb-1.5">
            <p className="text-[9px] font-black tracking-[0.22em] text-[#f59e0b]">DEAL TRACKER</p>
            <p className="text-[8px] text-[#334155]">{completeCount}/3 complete</p>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mb-2">
            {dealers.map(d => {
              const done = !!(phoneData[d.id].price && phoneData[d.id].apr && phoneData[d.id].term && phoneData[d.id].fees && phoneData[d.id].notes);
              return (
                <button key={d.id} type="button" onClick={() => onTabChange(d.id)}
                  className="flex-1 rounded-md py-1 text-[7.5px] font-bold transition"
                  style={{ background: activeTab === d.id ? "#f59e0b" : done ? "#052e16" : "#111827", color: activeTab === d.id ? "#000" : done ? "#4ade80" : "#475569", border: done && activeTab !== d.id ? "1px solid #166534" : "1px solid transparent" }}>
                  {d.id === "flash" ? "Flash" : d.id === "northline" ? "N.Line" : "CMA"}
                  {done && activeTab !== d.id ? " ✓" : ""}
                </button>
              );
            })}
          </div>
          <p className="text-[8px] font-semibold mb-1.5 px-0.5 truncate" style={{ color: dealer.accentColor }}>{dealer.name}</p>
          {/* Fields */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5">
            {([
              { key: "price" as const, label: "Listed price", ph: "$26,400" },
              { key: "monthly" as const, label: "Monthly est.", ph: "$412/mo" },
              { key: "apr" as const, label: "APR", ph: "7.2%" },
              { key: "term" as const, label: "Loan term", ph: "60 months" },
              { key: "fees" as const, label: "Fees", ph: "$649 doc fee" },
              { key: "notes" as const, label: "Notes", ph: "What stands out?" },
            ]).map(f => (
              <div key={f.key}>
                <p className="text-[7.5px] font-semibold text-[#475569] mb-0.5">{f.label}</p>
                <input type="text" value={data[f.key]} onChange={e => onFieldChange(activeTab, f.key, e.target.value)}
                  placeholder={f.ph}
                  className="w-full rounded bg-[#0d1117] border border-[#1e293b] text-[9px] text-[#e2e8f0] px-2 py-1 placeholder-[#334155] focus:outline-none focus:border-[#f59e0b]" />
              </div>
            ))}
          </div>
          <div className="mt-2 rounded-lg px-2 py-1.5 text-center" style={{ background: thisDone ? "#052e16" : "#0d1117", border: `1px solid ${thisDone ? "#166534" : "#1e293b"}` }}>
            <p className="text-[8px] font-bold" style={{ color: thisDone ? "#4ade80" : "#334155" }}>{thisDone ? "✓ Complete" : "Fill all fields"}</p>
          </div>
        </div>
        {/* Home bar */}
        <div className="flex justify-center pb-2"><div className="w-16 h-0.5 rounded-full bg-[#1e1e2e]" /></div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Picker({ title, items, value, onChange }: {
  title: string; items: { name: string; note: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.18em] text-[#64748b]">{title}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map(item => (
          <button key={item.name} type="button" onClick={() => onChange(item.name)} title={item.note}
            className="rounded-xl border px-3 py-3 text-xs font-semibold transition"
            style={{
              borderColor: value === item.name ? "#f59e0b" : "#21262d",
              background: value === item.name ? "rgba(120,53,15,0.3)" : "rgba(255,255,255,0.02)",
              color: value === item.name ? "#f59e0b" : "#94a3b8",
              boxShadow: value === item.name ? "0 0 8px rgba(245,158,11,0.3)" : "none",
            }}>
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-[#21262d] bg-[#0d1117] p-5">
      <p className="text-[10px] font-bold tracking-[0.16em] text-[#64748b]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#f59e0b]">{value}</p>
      <p className="mt-1 text-xs text-[#64748b]">{note}</p>
    </div>
  );
}

function Line({ label, value, strong = false, dim = false }: { label: string; value: string; strong?: boolean; dim?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4" style={{ color: dim ? "#f87171" : strong ? "#e2e8f0" : "#64748b", fontWeight: strong ? 700 : 400 }}>
      <span>{label}</span>
      <span style={{ color: strong ? "#f59e0b" : undefined }}>{value}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DrivelinePage() {
  const [screen, setScreen] = useState<Screen>("start");
  const [body, setBody] = useState<Body>("Crossover");
  const [brand, setBrand] = useState<Brand>("Arden");
  const [trim, setTrim] = useState<Trim>("Comfort");
  const [color, setColor] = useState(paintColors[0]);
  const [round, setRound] = useState(1);

  // Browser state
  const [activeTab, setActiveTab] = useState("flash");
  const [dealerPages, setDealerPages] = useState<Record<string, DealerPageId>>({ flash: "home", northline: "home", common: "home" });
  const [selectedVehicles, setSelectedVehicles] = useState<Record<string, InventoryItem | null>>({ flash: null, northline: null, common: null });
  const [chosenDealerId, setChosenDealerId] = useState<string | null>(null);

  // Phone state
  const [phoneTab, setPhoneTab] = useState("flash");
  const [phoneData, setPhoneData] = useState<Record<string, PhoneNotes>>({ flash: emptyNotes(), northline: emptyNotes(), common: emptyNotes() });

  // Finance state
  const [inspection, setInspection] = useState(false);
  const [preapproved, setPreapproved] = useState(false);
  const [addons, setAddons] = useState<string[]>([]);
  const [quoteRequested, setQuoteRequested] = useState(false);

  const dreamPrice = useMemo(() => {
    const b = bodies.find(x => x.name === body)?.price ?? 0;
    const br = brands.find(x => x.name === brand)?.modifier ?? 0;
    const t = trims.find(x => x.name === trim)?.modifier ?? 0;
    return b + br + t;
  }, [body, brand, trim]);

  const inventories = useMemo(() => {
    const r: Record<string, InventoryItem[]> = {};
    for (const d of DEALERS) r[d.id] = generateInventory(body, brand, trim, d.id, round);
    return r;
  }, [body, brand, trim, round]);

  const selectedDealer = DEALERS.find(d => d.id === chosenDealerId);
  const selectedVehicle = chosenDealerId ? selectedVehicles[chosenDealerId] : null;

  const phoneComplete = DEALERS.every(d => {
    const n = phoneData[d.id];
    return n.price && n.apr && n.term && n.fees && n.notes;
  });

  const addOnTotal = addons.includes("shield") ? 1095 : 0;
  const financedAmount = selectedDealer && selectedVehicle
    ? selectedVehicle.basePrice + selectedDealer.docFee + selectedDealer.packageFee + addOnTotal - 3000
    : 0;
  const effectiveApr = selectedDealer ? (preapproved ? Math.min(selectedDealer.apr, 5.4) : selectedDealer.apr) : 0;
  const monthly = selectedDealer ? paymentFor(financedAmount, effectiveApr, selectedDealer.months) : 0;
  const totalLoan = selectedDealer ? monthly * selectedDealer.months : 0;

  const score = useMemo(() => {
    if (!selectedDealer) return 0;
    const affordability = monthly <= 425 ? 30 : monthly <= 500 ? 18 : 4;
    const finance = preapproved ? 25 : selectedDealer.apr < 7 ? 16 : 5;
    const transparency = quoteRequested ? 20 : 0;
    const protection = inspection ? 15 : 0;
    const addonsScore = addons.length === 0 ? 10 : 2;
    return Math.min(100, Math.round(affordability + finance + transparency + protection + addonsScore));
  }, [addons.length, inspection, monthly, preapproved, quoteRequested, selectedDealer]);

  const reset = () => {
    setRound(v => v + 1);
    setChosenDealerId(null);
    setDealerPages({ flash: "home", northline: "home", common: "home" });
    setSelectedVehicles({ flash: null, northline: null, common: null });
    setPhoneData({ flash: emptyNotes(), northline: emptyNotes(), common: emptyNotes() });
    setInspection(false); setPreapproved(false); setAddons([]); setQuoteRequested(false);
    setScreen("garage");
  };

  const handleSign = () => {
    if (selectedDealer && selectedVehicle) {
      // Fire-and-forget: save transportation data to Life Budget portfolio (no-op if not logged in)
      fetch("/api/life-budget/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleSlug: "transportation",
          data: {
            vehicleName: `${brand} ${body} ${trim}`,
            dealer: selectedDealer.name,
            price: `$${selectedVehicle.basePrice.toLocaleString()}`,
            monthlyPayment: `$${Math.round(monthly).toLocaleString()}/mo`,
            apr: `${effectiveApr.toFixed(1)}%`,
            term: `${selectedDealer.months} months`,
            fees: `$${(selectedDealer.docFee + selectedDealer.packageFee).toLocaleString()}`,
            totalCost: `$${Math.round(totalLoan).toLocaleString()}`,
            drivelineScore: score,
            preapprovedFinancing: preapproved ? "Yes" : "No",
            independentInspection: inspection ? "Yes" : "No",
            outTheDoorQuote: quoteRequested ? "Yes" : "No",
          },
          completed: true,
        }),
      }).catch(() => { /* silently ignore if not logged in */ });
    }
    setScreen("result");
  };

  const BG = "#0d1117";
  const SURFACE = "#161b22";
  const BORDER = "#21262d";
  const TEXT = "#e2e8f0";
  const MUTED = "#64748b";
  const AMBER = "#f59e0b";

  return (
    <main className="min-h-screen" style={{ background: BG, color: TEXT }}>
      <div className="relative mx-auto min-h-screen max-w-[1600px] px-4 py-4 sm:px-6">
        {/* Header */}
        <header className="flex items-center justify-between pb-4 mb-2 border-b" style={{ borderColor: BORDER }}>
          <Link href="/simulations" className="text-xs font-medium tracking-[0.18em] transition hover:opacity-80" style={{ color: MUTED }}>
            ← EXIT TO SINON
          </Link>
          <div className="flex items-center gap-2 text-sm font-black tracking-[0.22em]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: AMBER, boxShadow: `0 0 10px ${AMBER}99` }} />
            DRIVELINE
          </div>
          <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: BORDER, color: MUTED }}>
            FIRST CAR / {String(round).padStart(2, "0")}
          </span>
        </header>

        {/* ── START ── */}
        {screen === "start" && (
          <section className="grid min-h-[calc(100vh-80px)] items-center gap-10 py-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold tracking-[0.28em]" style={{ color: AMBER }}>A FIRST-CAR SIMULATION</p>
              <h1 className="mt-5 max-w-xl text-6xl font-black leading-[.88] tracking-[-0.05em] sm:text-8xl">
                BUILD THE<br />
                <span style={{ color: "transparent", WebkitTextStroke: `2px ${AMBER}` }}>DREAM.</span><br />
                READ THE<br />
                FINE PRINT.
              </h1>
              <p className="mt-7 max-w-sm text-base leading-7" style={{ color: MUTED }}>
                Your first job needs a ride. Build the car you want, then browse three dealer sites, hunt through mixed inventory, and compare what they don&apos;t want you to notice.
              </p>
              <button type="button" onClick={() => setScreen("garage")}
                className="mt-9 rounded-full px-8 py-4 text-sm font-bold transition hover:opacity-90"
                style={{ background: AMBER, color: "#000" }}>
                START YOUR BUILD →
              </button>
              <p className="mt-5 text-xs" style={{ color: MUTED }}>15–20 min · fictional market · real-world skills</p>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-[2.5rem]" style={{ background: SURFACE, border: `1px solid ${BORDER}` }} />
              <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden opacity-15"
                style={{ backgroundImage: `radial-gradient(${AMBER}44 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
              <div className="relative z-10 w-full max-w-[480px] px-8 py-16">
                <CarSVG body="Sedan" color="#1e3a5f" />
                <div className="mt-6 flex items-center justify-center gap-5">
                  {paintColors.map(c => (
                    <div key={c.name} className="h-5 w-5 rounded-full border-2" style={{ background: c.value, borderColor: BORDER }} />
                  ))}
                </div>
                <p className="mt-3 text-center text-[11px] tracking-[0.2em]" style={{ color: MUTED }}>CHOOSE YOUR FINISH IN THE GARAGE</p>
              </div>
            </div>
          </section>
        )}

        {/* ── GARAGE ── */}
        {screen === "garage" && (
          <section className="py-8">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold tracking-[0.22em]" style={{ color: AMBER }}>01 / DREAM GARAGE</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">MAKE IT YOURS.</h1>
              </div>
              <div className="rounded-2xl border px-5 py-3" style={{ borderColor: BORDER, background: SURFACE }}>
                <p className="text-xs" style={{ color: MUTED }}>DREAM BUILD MSRP</p>
                <p className="text-2xl font-bold" style={{ color: AMBER }}>{money(dreamPrice)}</p>
              </div>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <div className="relative min-h-[300px] overflow-hidden rounded-[2rem] border flex items-center justify-center p-8"
                style={{ borderColor: BORDER, background: SURFACE }}>
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: `radial-gradient(${AMBER}44 1px, transparent 1px)`, backgroundSize: "24px 24px" }} />
                <div className="absolute top-4 left-5">
                  <p className="text-[10px] tracking-[0.2em]" style={{ color: MUTED }}>CONCEPT BUILD</p>
                  <p className="mt-0.5 text-sm font-bold">{brand} {body} · {trim}</p>
                </div>
                <div className="relative z-10 w-full max-w-[440px]"><CarSVG body={body} color={color.value} /></div>
              </div>
              <div className="space-y-5 rounded-[2rem] border p-6" style={{ borderColor: BORDER, background: SURFACE }}>
                <Picker title="BODY" items={bodies.map(b => ({ name: b.name, note: b.note }))} value={body} onChange={v => setBody(v as Body)} />
                <Picker title="MAKE" items={brands.map(b => ({ name: b.name, note: b.note }))} value={brand} onChange={v => setBrand(v as Brand)} />
                <Picker title="TRIM" items={trims.map(t => ({ name: t.name, note: t.note }))} value={trim} onChange={v => setTrim(v as Trim)} />
                <div>
                  <p className="text-xs font-bold tracking-[0.18em]" style={{ color: MUTED }}>FINISH</p>
                  <div className="mt-3 flex gap-3">
                    {paintColors.map(c => (
                      <button key={c.name} type="button" aria-label={c.name} onClick={() => setColor(c)}
                        className="h-9 w-9 rounded-full border-2 transition hover:scale-110"
                        style={{ background: c.value, borderColor: color.name === c.name ? AMBER : BORDER, boxShadow: color.name === c.name ? `0 0 8px ${AMBER}55` : "none" }} />
                    ))}
                  </div>
                  <p className="mt-2 text-xs" style={{ color: MUTED }}>{color.name}</p>
                </div>
                <button type="button" onClick={() => setScreen("reality")}
                  className="w-full rounded-2xl py-4 text-sm font-black transition hover:opacity-90"
                  style={{ background: AMBER, color: "#000" }}>
                  LOCK THE DREAM →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── REALITY ── */}
        {screen === "reality" && (
          <section className="mx-auto flex min-h-[calc(100vh-100px)] max-w-4xl items-center py-10">
            <div className="w-full rounded-[2rem] border p-8 sm:p-12" style={{ borderColor: BORDER, background: SURFACE }}>
              <p className="text-xs font-bold tracking-[0.22em]" style={{ color: AMBER }}>02 / REALITY CHECK</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">THE JOB IS REAL.<br />SO IS THE MATH.</h1>
              <div className="mt-9 grid gap-4 sm:grid-cols-3">
                <Metric label="FIRST JOB PAY" value="$3,350" note="monthly take-home" />
                <Metric label="SAVINGS" value="$3,000" note="available for down payment" />
                <Metric label="SAFE CAR BUDGET" value="$425" note="monthly payment ceiling" />
              </div>
              <div className="mt-7 rounded-2xl border p-5 text-sm leading-6" style={{ borderColor: "rgba(120,53,15,0.4)", background: "rgba(120,53,15,0.15)" }}>
                <strong style={{ color: AMBER }}>Your {brand} {body} starts around {money(dreamPrice)}.</strong>{" "}
                <span style={{ color: "#d1a85a" }}>You can still chase the feeling — but you need to work the market. Three local dealers have this car. The price shown won&apos;t be the same at any of them, and neither will the terms.</span>
              </div>
              <button type="button" onClick={() => setScreen("market")}
                className="mt-8 rounded-full px-8 py-4 text-sm font-bold transition hover:opacity-90"
                style={{ background: AMBER, color: "#000" }}>
                OPEN THE LOCAL MARKET →
              </button>
            </div>
          </section>
        )}

        {/* ── MARKET ── */}
        {screen === "market" && (
          <section className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-bold tracking-[0.22em]" style={{ color: AMBER }}>03 / LOCAL MARKET</p>
                <h1 className="mt-1 text-2xl font-black">THREE SITES. ONE SMART DEAL.</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl border px-4 py-2" style={{ borderColor: BORDER, background: SURFACE }}>
                  <p className="text-[9px] font-bold tracking-[0.16em] mb-1" style={{ color: MUTED }}>📱 PHONE NOTES</p>
                  <div className="flex gap-1.5">
                    {DEALERS.map(d => {
                      const n = phoneData[d.id];
                      const done = !!(n.price && n.apr && n.term && n.fees && n.notes);
                      return <span key={d.id} className="text-[9px] rounded-full px-2 py-0.5 font-bold" style={{ background: done ? "#052e16" : "#1e293b", color: done ? "#4ade80" : MUTED, border: `1px solid ${done ? "#166534" : BORDER}` }}>
                        {d.id === "flash" ? "Flash" : d.id === "northline" ? "N.Line" : "CMA"}{done ? " ✓" : " ○"}
                      </span>;
                    })}
                  </div>
                </div>
                <button type="button" disabled={!chosenDealerId || !phoneComplete}
                  onClick={() => setScreen("sign")}
                  className="rounded-xl px-5 py-3 text-sm font-black transition hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: AMBER, color: "#000" }}>
                  FINANCE OFFICE →
                </button>
              </div>
            </div>

            {!chosenDealerId ? (
              <div className="mb-3 rounded-xl border px-4 py-2 text-xs" style={{ borderColor: BORDER, background: SURFACE, color: MUTED }}>
                Looking for your <strong style={{ color: TEXT }}>{brand} {body} {trim}</strong> — browse each dealer&apos;s inventory, find your car, check pricing, and take notes on your phone.
              </div>
            ) : !phoneComplete ? (
              <div className="mb-3 rounded-xl border px-4 py-2 text-xs" style={{ borderColor: "rgba(120,53,15,0.4)", background: "rgba(120,53,15,0.15)" }}>
                <span style={{ color: "#fbbf24" }}>📱 Fill in your phone notes for all 3 dealers before entering the finance office.</span>
              </div>
            ) : null}

            <div className="flex gap-4" style={{ height: "calc(100vh - 240px)", minHeight: 480 }}>
              <div className="flex-1 min-w-0">
                <SimBrowser
                  dealers={DEALERS}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  dealerPages={dealerPages}
                  inventories={inventories}
                  selectedVehicles={selectedVehicles}
                  onPageChange={(id, p) => setDealerPages(prev => ({ ...prev, [id]: p }))}
                  onSelectVehicle={(id, item) => setSelectedVehicles(prev => ({ ...prev, [id]: item }))}
                  onChooseDealer={id => setChosenDealerId(id || null)}
                  chosenDealerId={chosenDealerId}
                />
              </div>
              <div className="w-48 flex-shrink-0">
                <PhoneWidget
                  dealers={DEALERS}
                  phoneData={phoneData}
                  activeTab={phoneTab}
                  onTabChange={setPhoneTab}
                  onFieldChange={(id, field, val) => setPhoneData(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }))}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── FINANCE OFFICE ── */}
        {screen === "sign" && selectedDealer && selectedVehicle && (
          <section className="mx-auto max-w-5xl py-10">
            <p className="text-xs font-bold tracking-[0.22em]" style={{ color: AMBER }}>04 / FINANCE OFFICE</p>
            <h1 className="mt-2 text-4xl font-black sm:text-6xl">DON&apos;T SIGN YET.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: MUTED }}>
              This is where a good advertised deal can quietly become an expensive contract. Read every line.
            </p>
            <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
              <div className="rounded-[2rem] border p-6" style={{ borderColor: BORDER, background: SURFACE }}>
                <p className="text-xs font-bold tracking-[0.18em]" style={{ color: MUTED }}>PURCHASE WORKSHEET · {selectedDealer.name.toUpperCase()}</p>
                <div className="mt-6 space-y-4 text-sm">
                  <Line label="Vehicle price" value={money(selectedVehicle.basePrice)} />
                  <Line label="Documentation fee" value={money(selectedDealer.docFee)} />
                  <Line label={selectedDealer.packageName || "Dealer package"} value={money(selectedDealer.packageFee)} dim={selectedDealer.packageFee > 0} />
                  <Line label="Selected add-ons" value={money(addOnTotal)} />
                  <Line label="Down payment" value={money(-3000)} />
                  <div className="border-t pt-4" style={{ borderColor: BORDER }}>
                    <Line label="Amount financed" value={money(financedAmount)} strong />
                    <Line label={preapproved ? "Pre-approved APR" : "Dealer APR"} value={`${effectiveApr.toFixed(1)}%`} strong />
                    <Line label="Estimated payment" value={`${money(monthly)}/mo × ${selectedDealer.months}`} strong />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { flag: preapproved, set: () => setPreapproved(!preapproved), label: "Bring your bank pre-approval", desc: "Compare the dealer's offer to a 5.4% pre-approval before agreeing to financing.", accent: AMBER },
                  { flag: addons.includes("shield"), set: () => setAddons(a => a.includes("shield") ? a.filter(x => x !== "shield") : [...a, "shield"]), label: `RoadShield protection · ${money(1095)}`, desc: "An optional service product. Not required to buy the car.", accent: "#f87171" },
                  { flag: inspection, set: () => setInspection(!inspection), label: "Request independent inspection", desc: "Third-party mechanic checks the vehicle before you sign.", accent: "#4ade80" },
                  { flag: quoteRequested, set: () => setQuoteRequested(!quoteRequested), label: "Ask for out-the-door quote", desc: "Written itemized quote with all fees, taxes, and costs.", accent: "#4ade80" },
                ].map(opt => (
                  <button key={opt.label} type="button" onClick={opt.set}
                    className="w-full rounded-2xl border p-4 text-left transition"
                    style={{ borderColor: opt.flag ? opt.accent : BORDER, background: opt.flag ? `${opt.accent}11` : SURFACE }}>
                    <p className="font-bold text-sm" style={{ color: opt.flag ? opt.accent : TEXT }}>{opt.flag ? "✓" : "○"} {opt.label}</p>
                    <p className="mt-1 text-xs leading-5" style={{ color: MUTED }}>{opt.desc}</p>
                  </button>
                ))}
                <div className="rounded-2xl border p-4 text-sm leading-6" style={{ borderColor: "rgba(120,53,15,0.4)", background: "rgba(120,53,15,0.15)" }}>
                  <span style={{ color: "#fbbf24" }}>&quot;We can get the monthly payment down.&quot;</span>{" "}
                  <span style={{ color: MUTED }}>A lower payment can still mean a more expensive loan if the term stretches longer.</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={handleSign}
              className="mt-7 rounded-full px-8 py-4 text-sm font-black transition hover:opacity-90"
              style={{ background: AMBER, color: "#000" }}>
              SIGN &amp; SEE THE REAL DEAL →
            </button>
          </section>
        )}

        {/* ── RESULT ── */}
        {screen === "result" && selectedDealer && (
          <section className="mx-auto max-w-5xl py-10">
            <p className="text-xs font-bold tracking-[0.22em]" style={{ color: AMBER }}>05 / SIGNED</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
              <div className="rounded-[2rem] border p-7" style={{ borderColor: BORDER, background: SURFACE }}>
                <p className="text-sm font-bold tracking-widest" style={{ color: MUTED }}>YOUR DRIVELINE SCORE</p>
                <p className="mt-2 text-8xl font-black tracking-[-0.08em]" style={{ color: AMBER }}>{score}</p>
                <p className="mt-1 text-xl font-bold">out of 100</p>
                <p className="mt-7 text-sm leading-6" style={{ color: MUTED }}>
                  {score >= 80 ? "You built a real plan around the dream." : score >= 55 ? "You got the keys — now look at what could be stronger." : "The car may feel right, but the contract needs another look."}
                </p>
              </div>
              <div className="rounded-[2rem] border p-7" style={{ borderColor: BORDER, background: SURFACE }}>
                <h1 className="text-3xl font-black">THE DEAL, UNPACKED.</h1>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Metric label="MONTHLY PAYMENT" value={money(monthly)} note={monthly <= 425 ? "within your target" : "above safe target"} />
                  <Metric label="TOTAL LOAN" value={money(totalLoan)} note={`${selectedDealer.months} mo at ${effectiveApr.toFixed(1)}% APR`} />
                </div>
                <div className="mt-6 space-y-3 text-sm leading-6" style={{ color: MUTED }}>
                  <p><strong style={{ color: TEXT }}>What worked:</strong>{" "}{quoteRequested ? "You asked for a written out-the-door quote — the full comparison baseline." : "Requesting a written out-the-door quote before signing strengthens any deal."}</p>
                  <p><strong style={{ color: TEXT }}>What to watch:</strong>{" "}{inspection ? "An independent inspection gives you evidence beyond a vehicle history report." : "A vehicle history report is not a substitute for an independent inspection."}</p>
                  <p><strong style={{ color: TEXT }}>Finance reality:</strong>{" "}{preapproved ? "Outside financing kept the dealer rate honest." : "A bank or credit-union pre-approval gives you a real offer to compare before the finance office."}</p>
                </div>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => setScreen("year")} className="rounded-full px-6 py-3 text-sm font-bold transition hover:opacity-90" style={{ background: AMBER, color: "#000" }}>
                DRIVE INTO YEAR ONE →
              </button>
              <button type="button" onClick={reset} className="rounded-full border px-6 py-3 text-sm font-bold transition hover:opacity-80" style={{ borderColor: BORDER, color: TEXT }}>
                RESHOP A NEW MARKET
              </button>
            </div>
          </section>
        )}

        {/* ── YEAR ONE ── */}
        {screen === "year" && selectedDealer && (
          <section className="mx-auto flex min-h-[calc(100vh-100px)] max-w-4xl items-center py-10">
            <div className="w-full rounded-[2rem] border p-8 sm:p-12" style={{ borderColor: BORDER, background: SURFACE }}>
              <p className="text-xs font-bold tracking-[0.22em]" style={{ color: AMBER }}>OPTIONAL / YEAR ONE</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">THE KEYS ARE JUST THE START.</h1>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Metric label="PAYMENTS MADE" value={money(monthly * 12)} note="first 12 months" />
                <Metric label="FUEL + INSURANCE" value={money(body === "Pickup" ? 4980 : body === "Crossover" ? 4120 : 3480)} note="estimated first year" />
                <Metric label="SAVINGS LEFT" value={money(Math.max(0, 3000 - 850 - addOnTotal))} note="after down payment costs" />
              </div>
              <div className="mt-7 rounded-2xl border p-5 text-sm leading-6" style={{ borderColor: BORDER, background: BG, color: MUTED }}>
                A first car creates independence — and it also becomes part of every future budget. The best deal leaves room for maintenance, savings, and the life you want outside the driver&apos;s seat.
              </div>
              <button type="button" onClick={reset}
                className="mt-8 rounded-full px-8 py-4 text-sm font-bold transition hover:opacity-90"
                style={{ background: AMBER, color: "#000" }}>
                TRY ANOTHER ROUTE →
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
