"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Body = "Crossover" | "Sedan" | "Hatchback" | "Pickup";
type Brand = "Arden" | "Lumen" | "Terraforge";
type Trim = "Essential" | "Comfort" | "Apex";
type Screen = "start" | "garage" | "reality" | "market" | "sign" | "result" | "year";

const money = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const paymentFor = (amount: number, apr: number, months: number) => {
  const r = apr / 100 / 12;
  return (amount * r) / (1 - Math.pow(1 + r, -months));
};

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
    sub: "Metro's #1 volume dealer · over 2,000 vehicles sold last year",
    nav: ["Home", "New", "Used", "Finance Specials"],
    headerBg: "#111827",
    headerAccent: "#f97316",
    heroBg: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
    badge: "⭐⭐⭐⭐⭐  847 Reviews",
    highlightLabel: "AS LOW AS",
    highlightNote: "per month for qualified buyers",
    footerNote: "*84-month loan, 10.9% APR, $3,000 down, approved credit. Protection package included in price.",
    apr: 10.9,
    months: 84,
    docFee: 899,
    packageFee: 1595,
    hidden: "The payment is low because the loan is 84 months (7 years) and a $1,595 protection package is already baked into the price.",
  },
  {
    id: "northline",
    name: "Northline Motor Group",
    domain: "northlinemotors.com",
    tagline: "Curated. Certified. Confident.",
    sub: "Northline Certified™ inspection program · premium pre-owned specialists",
    nav: ["Our Story", "Inventory", "Certified", "Contact"],
    headerBg: "#0e1a2d",
    headerAccent: "#93c5fd",
    heroBg: "linear-gradient(135deg, #0e1a2d 0%, #1e3a5f 100%)",
    badge: "✦ Northline Certified™",
    highlightLabel: "NORTHLINE PRICE",
    highlightNote: "no-haggle. fully itemized.",
    footerNote: "Per mo. est. 60-month loan, 7.2% APR, $3,000 down. $649 documentation fee shown separately.",
    apr: 7.2,
    months: 60,
    docFee: 649,
    packageFee: 495,
    hidden: "The price is transparent, but the $649 documentation fee is nearly three times what other dealers charge.",
  },
  {
    id: "common",
    name: "Common Mile Auto",
    domain: "commonmileauto.com",
    tagline: "Fair Price. Full Disclosure.",
    sub: "Out-the-door pricing · no add-on packages · 3-day return guarantee",
    nav: ["Inventory", "Pricing", "How It Works", "Reviews"],
    headerBg: "#f9fafb",
    headerAccent: "#166534",
    heroBg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    badge: "✓ No-Haggle Guaranteed",
    highlightLabel: "OUT-THE-DOOR PRICE",
    highlightNote: "taxes, fees, and doc charge included",
    footerNote: "All-in price includes $249 documentation fee. 48-month est. at 5.9% APR, $3,000 down. No added packages.",
    apr: 5.9,
    months: 48,
    docFee: 249,
    packageFee: 0,
    hidden: "The most straightforward of the three. Shorter loan = higher payment but much less paid overall.",
  },
];

// ─── Car SVG ─────────────────────────────────────────────────────────────────

function CarSVG({ body, color }: { body: Body; color: string }) {
  const isLight = color === "#9ca3af";

  const wheel = (cx: number, cy: number, r: number) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={r} fill="#1c1c1e" />
      <circle cx={cx} cy={cy} r={r * 0.72} fill={isLight ? "#d1d5db" : "#c8c2b8"} />
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#6b7280" />
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line
            key={a}
            x1={cx + Math.cos(rad) * r * 0.22}
            y1={cy + Math.sin(rad) * r * 0.22}
            x2={cx + Math.cos(rad) * r * 0.65}
            y2={cy + Math.sin(rad) * r * 0.65}
            stroke="#9ca3af"
            strokeWidth="1.8"
          />
        );
      })}
    </g>
  );

  const glass = "rgba(140,190,240,0.30)";
  const glassStroke = "rgba(255,255,255,0.35)";
  const bodyStroke = isLight ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.10)";
  const highlight = "rgba(255,255,255,0.16)";

  if (body === "Sedan") return (
    <svg viewBox="0 0 500 200" className="w-full h-full">
      <ellipse cx="250" cy="188" rx="200" ry="11" fill="rgba(0,0,0,0.09)" />
      {/* body */}
      <path d="M52,168 L52,138 C56,120 74,106 102,98 L160,90 C174,70 198,58 228,56 L278,56 C308,58 326,70 342,88 L382,96 C404,108 422,126 422,144 L422,168 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* roof */}
      <path d="M168,88 C186,64 206,54 230,52 L276,52 C302,54 320,66 336,86 Z" fill={color} stroke={bodyStroke} strokeWidth="1" />
      {/* roof highlight */}
      <path d="M198,72 C210,60 222,54 234,52 L272,52 C286,54 298,62 308,72 Z" fill={highlight} />
      {/* windshield */}
      <path d="M174,132 L206,72 L226,64 L226,132 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      {/* side window */}
      <path d="M230,64 L276,64 L294,82 L294,132 L230,132 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      {/* rear window */}
      <path d="M298,82 L334,88 L334,132 L298,132 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      {/* door line */}
      <line x1="230" y1="96" x2="230" y2="162" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
      {/* mirror */}
      <rect x="162" y="88" width="11" height="8" rx="2" fill={color} stroke={bodyStroke} strokeWidth="1" />
      {/* headlight */}
      <ellipse cx="57" cy="126" rx="5" ry="7" fill="#fef9c3" />
      {/* taillight */}
      <rect x="418" y="120" width="6" height="14" rx="2" fill="#dc2626" />
      {wheel(116, 170, 30)}
      {wheel(360, 170, 30)}
    </svg>
  );

  if (body === "Crossover") return (
    <svg viewBox="0 0 500 210" className="w-full h-full">
      <ellipse cx="250" cy="196" rx="200" ry="11" fill="rgba(0,0,0,0.09)" />
      {/* body */}
      <path d="M46,172 L46,134 C50,114 68,98 98,90 L155,82 C168,60 194,48 228,46 L278,46 C310,48 330,62 350,82 L390,92 C414,104 432,126 432,146 L432,172 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* roof */}
      <path d="M162,80 C178,56 202,44 228,42 L278,42 C306,44 326,58 346,80 Z" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <path d="M196,64 C210,50 222,44 234,42 L274,42 C288,44 302,54 312,64 Z" fill={highlight} />
      {/* roof rails */}
      <line x1="165" y1="78" x2="345" y2="78" stroke="rgba(0,0,0,0.12)" strokeWidth="2.5" />
      {/* windshield */}
      <path d="M168,138 L200,66 L224,58 L224,138 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      {/* side window */}
      <path d="M228,58 L280,58 L300,78 L300,138 L228,138 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      {/* rear window */}
      <path d="M304,78 L346,84 L346,138 L304,138 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      <line x1="228" y1="96" x2="228" y2="166" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
      <rect x="157" y="78" width="12" height="9" rx="2" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <ellipse cx="52" cy="128" rx="5" ry="7" fill="#fef9c3" />
      <rect x="428" y="122" width="6" height="16" rx="2" fill="#dc2626" />
      {wheel(114, 175, 34)}
      {wheel(370, 175, 34)}
    </svg>
  );

  if (body === "Hatchback") return (
    <svg viewBox="0 0 480 200" className="w-full h-full">
      <ellipse cx="240" cy="188" rx="192" ry="11" fill="rgba(0,0,0,0.09)" />
      {/* body */}
      <path d="M48,168 L48,138 C52,120 70,106 98,98 L156,90 C170,70 194,58 220,56 L264,56 C292,58 312,70 340,90 L366,100 C380,112 392,130 392,148 L392,168 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* roof — slopes into hatch */}
      <path d="M164,88 C180,64 200,54 222,52 L264,52 C288,54 308,66 336,88 Z" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <path d="M194,72 C206,60 218,54 228,52 L260,52 C274,54 288,62 302,72 Z" fill={highlight} />
      {/* windshield */}
      <path d="M170,132 L202,72 L220,64 L220,132 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      {/* side window */}
      <path d="M224,64 L264,64 L280,82 L280,132 L224,132 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      {/* hatch window (slopes back) */}
      <path d="M284,82 L338,94 L338,132 L284,132 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      <line x1="224" y1="96" x2="224" y2="162" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
      <rect x="156" y="88" width="11" height="8" rx="2" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <ellipse cx="54" cy="126" rx="5" ry="7" fill="#fef9c3" />
      <rect x="388" y="120" width="6" height="14" rx="2" fill="#dc2626" />
      {wheel(112, 170, 30)}
      {wheel(330, 170, 30)}
    </svg>
  );

  // Pickup
  return (
    <svg viewBox="0 0 520 210" className="w-full h-full">
      <ellipse cx="260" cy="196" rx="215" ry="11" fill="rgba(0,0,0,0.09)" />
      {/* cab body */}
      <path d="M46,174 L46,132 C50,112 68,96 98,88 L152,82 C166,60 190,48 216,46 L260,46 C284,48 300,60 312,76 L312,174 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* cab roof */}
      <path d="M158,80 C174,56 194,44 218,42 L260,42 C282,44 298,58 310,76 Z" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <path d="M190,64 C202,50 214,44 224,42 L256,42 C270,44 284,52 296,64 Z" fill={highlight} />
      {/* bed */}
      <path d="M312,82 L460,82 L460,174 L312,174 Z" fill={color} stroke={bodyStroke} strokeWidth="1.5" />
      {/* bed floor */}
      <line x1="312" y1="112" x2="460" y2="112" stroke="rgba(0,0,0,0.10)" strokeWidth="2" />
      {/* tailgate */}
      <line x1="458" y1="84" x2="458" y2="172" stroke="rgba(0,0,0,0.12)" strokeWidth="2.5" />
      {/* bed rail */}
      <rect x="310" y="78" width="152" height="8" rx="2" fill={color} stroke={bodyStroke} strokeWidth="1" />
      {/* windshield */}
      <path d="M164,140 L196,64 L214,56 L214,140 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      {/* side window */}
      <path d="M218,56 L260,56 L276,76 L276,140 L218,140 Z" fill={glass} stroke={glassStroke} strokeWidth="1" />
      <rect x="152" y="80" width="12" height="9" rx="2" fill={color} stroke={bodyStroke} strokeWidth="1" />
      <ellipse cx="52" cy="128" rx="5" ry="8" fill="#fef9c3" />
      <rect x="455" y="118" width="7" height="16" rx="2" fill="#dc2626" />
      {/* running boards */}
      <rect x="60" y="168" width="250" height="6" rx="3" fill="rgba(0,0,0,0.12)" />
      {wheel(112, 177, 34)}
      {wheel(386, 177, 34)}
    </svg>
  );
}

// ─── Dealer Website Cards ─────────────────────────────────────────────────────

function DealerSite({
  dealer,
  brand,
  body,
  trim,
  listing,
  selected,
  onSelect,
}: {
  dealer: typeof DEALERS[0];
  brand: Brand;
  body: Body;
  trim: Trim;
  listing: { price: number; mileage: number };
  selected: boolean;
  onSelect: () => void;
}) {
  const monthly = paymentFor(
    listing.price + dealer.docFee + dealer.packageFee - 3000,
    dealer.apr,
    dealer.months
  );
  const isCommon = dealer.id === "common";
  const headerTextColor = isCommon ? dealer.headerAccent : dealer.headerAccent;
  const headerText = isCommon ? "#111827" : "#f8fafc";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex flex-col rounded-2xl overflow-hidden text-left transition-all ${
        selected
          ? "ring-2 ring-[#b52d25] shadow-xl scale-[1.01]"
          : "ring-1 ring-[#e8d5be] shadow-md hover:shadow-lg hover:-translate-y-0.5"
      }`}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 bg-[#f0ebe3] border-b border-[#e0d4c4] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <div className="ml-2 flex-1 rounded bg-white/70 border border-[#ddd0c0] px-2.5 py-0.5 text-[10px] text-[#8b7355]">
          🔒 {dealer.domain}
        </div>
      </div>

      {/* Dealer header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: dealer.headerBg }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          {dealer.id === "flash" && (
            <svg width="22" height="22" viewBox="0 0 22 22">
              <polygon points="13,2 4,13 10,13 9,20 18,9 12,9" fill={dealer.headerAccent} />
            </svg>
          )}
          {dealer.id === "northline" && (
            <svg width="22" height="22" viewBox="0 0 22 22">
              <polygon points="11,2 20,8 20,14 11,20 2,14 2,8" fill="none" stroke={dealer.headerAccent} strokeWidth="1.5" />
              <polygon points="11,6 16,9.5 16,14 11,17 6,14 6,9.5" fill={dealer.headerAccent} opacity="0.4" />
            </svg>
          )}
          {dealer.id === "common" && (
            <svg width="22" height="22" viewBox="0 0 22 22">
              <circle cx="11" cy="11" r="9" fill="none" stroke={dealer.headerAccent} strokeWidth="1.5" />
              <circle cx="11" cy="11" r="4" fill={dealer.headerAccent} opacity="0.6" />
              <line x1="11" y1="2" x2="11" y2="5" stroke={dealer.headerAccent} strokeWidth="1.5" />
              <line x1="11" y1="17" x2="11" y2="20" stroke={dealer.headerAccent} strokeWidth="1.5" />
            </svg>
          )}
          <span
            className="text-xs font-black tracking-[0.12em]"
            style={{ color: headerText }}
          >
            {dealer.name.toUpperCase()}
          </span>
        </div>
        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-3">
          {dealer.nav.slice(0, 3).map((item) => (
            <span key={item} className="text-[9px] tracking-wide opacity-60" style={{ color: headerText }}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Hero section */}
      <div
        className="relative px-5 pt-5 pb-4"
        style={{ background: dealer.heroBg }}
      >
        <p
          className="text-[9px] font-bold tracking-[0.2em] mb-1"
          style={{ color: dealer.headerAccent }}
        >
          {dealer.badge}
        </p>
        <p
          className="text-sm font-black leading-tight mb-3"
          style={{ color: isCommon ? "#111827" : "#f8fafc" }}
        >
          {dealer.tagline}
        </p>
        <div
          className="text-[10px] leading-4 mb-1 opacity-70"
          style={{ color: isCommon ? "#374151" : "#e2e8f0" }}
        >
          {brand} {body} {trim} · {listing.mileage.toLocaleString()} mi
        </div>
      </div>

      {/* Pricing section */}
      <div className="bg-white flex-1 px-5 py-4">
        <p className="text-[9px] font-bold tracking-[0.18em] text-[#8b6340] mb-1">
          {dealer.highlightLabel}
        </p>
        {dealer.id === "flash" ? (
          <div>
            <p className="text-3xl font-black text-[#1a0a00]">
              {money(monthly)}
              <span className="text-base font-semibold text-[#8b6340]">/mo*</span>
            </p>
            <p className="text-[9px] text-[#8b6340] mt-0.5">{dealer.highlightNote}</p>
            <div className="mt-3 pt-3 border-t border-[#f0e8dc]">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#8b6340]">Listed price</span>
                <span className="font-semibold text-[#1a0a00]">{money(listing.price)}</span>
              </div>
              <div className="flex justify-between text-[10px] mt-1">
                <span className="text-[#8b6340]">Protection pkg</span>
                <span className="font-semibold text-[#b52d25]">+{money(dealer.packageFee)}</span>
              </div>
            </div>
          </div>
        ) : dealer.id === "northline" ? (
          <div>
            <p className="text-3xl font-black text-[#1a0a00]">{money(listing.price)}</p>
            <p className="text-[9px] text-[#8b6340] mt-0.5">{dealer.highlightNote}</p>
            <div className="mt-3 pt-3 border-t border-[#f0e8dc] space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#8b6340]">Documentation fee</span>
                <span className="font-semibold text-[#b52d25]">+{money(dealer.docFee)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#8b6340]">Est. payment</span>
                <span className="font-semibold text-[#1a0a00]">{money(monthly)}/mo</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#8b6340]">Loan term</span>
                <span className="font-semibold text-[#1a0a00]">{dealer.months} months</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-3xl font-black text-[#166534]">
              {money(listing.price + dealer.docFee)}
            </p>
            <p className="text-[9px] text-[#8b6340] mt-0.5">{dealer.highlightNote}</p>
            <div className="mt-3 pt-3 border-t border-[#f0e8dc] space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#8b6340]">Vehicle price</span>
                <span className="font-semibold text-[#1a0a00]">{money(listing.price)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#8b6340]">Doc fee</span>
                <span className="font-semibold text-[#1a0a00]">+{money(dealer.docFee)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#8b6340]">Add-on packages</span>
                <span className="font-semibold text-[#166534]">$0</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / select */}
      <div
        className={`px-5 py-3 flex items-center justify-between border-t ${
          selected ? "border-[#b52d25]/20 bg-[#fef2f0]" : "border-[#f0e8dc] bg-[#faf7f3]"
        }`}
      >
        <p className="text-[9px] text-[#8b6340] leading-relaxed max-w-[60%]">
          {dealer.footerNote}
        </p>
        <div
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition ${
            selected
              ? "bg-[#b52d25] text-white"
              : "bg-[#1a0a00] text-[#f5ede0] group-hover:bg-[#b52d25]"
          }`}
        >
          {selected ? "✓ Selected" : "Select →"}
        </div>
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DrivelinePage() {
  const [screen, setScreen] = useState<Screen>("start");
  const [body, setBody] = useState<Body>("Crossover");
  const [brand, setBrand] = useState<Brand>("Arden");
  const [trim, setTrim] = useState<Trim>("Comfort");
  const [color, setColor] = useState(paintColors[0]);
  const [round, setRound] = useState(1);
  const [dealerId, setDealerId] = useState<string | null>(null);
  const [inspection, setInspection] = useState(false);
  const [preapproved, setPreapproved] = useState(false);
  const [addons, setAddons] = useState<string[]>([]);
  const [quoteRequested, setQuoteRequested] = useState(false);

  const dreamPrice = useMemo(() => {
    const b = bodies.find((x) => x.name === body)?.price ?? 0;
    const br = brands.find((x) => x.name === brand)?.modifier ?? 0;
    const t = trims.find((x) => x.name === trim)?.modifier ?? 0;
    return b + br + t;
  }, [body, brand, trim]);

  const listings = useMemo(() => {
    const seed = round * 7919 + dreamPrice;
    const jitter = (offset: number, amount: number) => Math.abs(Math.sin(seed + offset) * amount);
    return DEALERS.map((dealer, i) => ({
      id: dealer.id,
      price: Math.max(17800, dreamPrice - 1500 - Math.round(jitter(i + 1, 4200) / 100) * 100 + i * 400),
      mileage: 6000 + Math.round(jitter(i + 9, 55000) / 100) * 100,
    }));
  }, [dreamPrice, round]);

  const selectedDealer = DEALERS.find((d) => d.id === dealerId);
  const selectedListing = listings.find((l) => l.id === dealerId);

  const addOnTotal = addons.includes("shield") ? 1095 : 0;
  const financedAmount = selectedDealer && selectedListing
    ? selectedListing.price + selectedDealer.docFee + selectedDealer.packageFee + addOnTotal - 3000
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
    setRound((v) => v + 1);
    setDealerId(null);
    setInspection(false);
    setPreapproved(false);
    setAddons([]);
    setQuoteRequested(false);
    setScreen("garage");
  };

  // ── shared wrapper ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#f5ede0] text-[#1a0a00] selection:bg-red-200">
      {/* subtle grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,99,64,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,99,64,.06) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative mx-auto min-h-screen max-w-[1400px] px-5 py-5 sm:px-8">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#e0d0bc] pb-5 mb-2">
          <Link
            href="/simulations"
            className="text-xs font-medium tracking-[0.18em] text-[#8b6340] transition hover:text-[#1a0a00]"
          >
            ← EXIT TO SINON
          </Link>
          <div className="flex items-center gap-2 text-sm font-black tracking-[0.22em] text-[#1a0a00]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#b52d25] shadow-[0_0_12px_#b52d25aa]" />
            DRIVELINE
          </div>
          <span className="rounded-full border border-[#e0d0bc] bg-white/60 px-3 py-1 text-xs text-[#8b6340]">
            FIRST CAR / 01
          </span>
        </header>

        {/* ── START ── */}
        {screen === "start" && (
          <section className="grid min-h-[calc(100vh-96px)] items-center gap-10 py-12 lg:grid-cols-[1fr_1fr]">
            <div className="relative z-10">
              <p className="text-xs font-bold tracking-[0.28em] text-[#b52d25]">A FIRST-CAR SIMULATION</p>
              <h1 className="mt-5 max-w-xl text-6xl font-black leading-[.88] tracking-[-0.05em] sm:text-8xl text-[#1a0a00]">
                BUILD THE<br />
                <span className="text-transparent" style={{ WebkitTextStroke: "2px #b52d25" }}>
                  DREAM.
                </span>
                <br />
                READ THE<br />
                FINE PRINT.
              </h1>
              <p className="mt-7 max-w-sm text-base leading-7 text-[#6b4a2a]">
                Your first job needs a ride. Build the car you want, then navigate a live market of dealers, offers, fees, and tradeoffs.
              </p>
              <button
                type="button"
                onClick={() => setScreen("garage")}
                className="mt-9 rounded-full bg-[#1a0a00] px-8 py-4 text-sm font-bold text-[#f5ede0] transition hover:bg-[#b52d25] hover:scale-[1.02]"
              >
                START YOUR BUILD →
              </button>
              <p className="mt-5 text-xs text-[#a0835a]">10–15 minute solo game · fictional market · real-world skills</p>
            </div>

            {/* Hero car illustration */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-[#ede0cc] to-[#f5ede0] border border-[#e0d0bc]" />
              <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
                {/* decorative rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-[#d4bfa0]/40" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-[#d4bfa0]/30" />
              </div>
              <div className="relative z-10 w-full max-w-[480px] px-8 py-16">
                <CarSVG body="Sedan" color="#1c1c1e" />
                <div className="mt-6 flex items-center justify-center gap-6">
                  {paintColors.map((c) => (
                    <div
                      key={c.name}
                      className="h-5 w-5 rounded-full border-2 border-[#c8b49a]"
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-center text-[11px] tracking-[0.2em] text-[#a0835a]">
                  CHOOSE YOUR COLOR IN THE GARAGE
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── GARAGE ── */}
        {screen === "garage" && (
          <section className="py-10">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold tracking-[0.22em] text-[#b52d25]">01 / DREAM GARAGE</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">MAKE IT YOURS.</h1>
              </div>
              <div className="rounded-2xl border border-[#e0d0bc] bg-white/70 px-5 py-3">
                <p className="text-xs text-[#8b6340]">DREAM BUILD MSRP</p>
                <p className="text-2xl font-bold text-[#1a0a00]">{money(dreamPrice)}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              {/* Live car preview */}
              <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-[#e0d0bc] bg-gradient-to-br from-[#ede0cc] to-[#f5ede0] flex items-center justify-center p-8">
                <div className="absolute top-4 left-5">
                  <p className="text-[10px] tracking-[0.2em] text-[#a0835a]">CONCEPT BUILD</p>
                  <p className="mt-0.5 text-sm font-bold text-[#1a0a00]">{brand} {body} · {trim}</p>
                </div>
                <div className="w-full max-w-[440px]">
                  <CarSVG body={body} color={color.value} />
                </div>
                <div className="absolute bottom-4 right-5">
                  <div className="h-4 w-4 rounded-full border-2 border-[#c8b49a]" style={{ background: color.value }} />
                </div>
              </div>

              {/* Pickers */}
              <div className="space-y-5 rounded-[2rem] border border-[#e0d0bc] bg-white/50 p-6">
                <Picker
                  title="BODY"
                  items={bodies.map((b) => ({ name: b.name, note: b.note }))}
                  value={body}
                  onChange={(v) => setBody(v as Body)}
                />
                <Picker
                  title="MAKE"
                  items={brands.map((b) => ({ name: b.name, note: b.note }))}
                  value={brand}
                  onChange={(v) => setBrand(v as Brand)}
                />
                <Picker
                  title="TRIM"
                  items={trims.map((t) => ({ name: t.name, note: t.note }))}
                  value={trim}
                  onChange={(v) => setTrim(v as Trim)}
                />
                <div>
                  <p className="text-xs font-bold tracking-[0.18em] text-[#8b6340]">FINISH</p>
                  <div className="mt-3 flex gap-3">
                    {paintColors.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        aria-label={c.name}
                        onClick={() => setColor(c)}
                        className={`h-9 w-9 rounded-full border-2 transition ${
                          color.name === c.name
                            ? "scale-110 border-[#1a0a00] shadow-md"
                            : "border-[#d4bfa0]"
                        }`}
                        style={{ background: c.value }}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[#8b6340]">{color.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setScreen("reality")}
                  className="w-full rounded-2xl bg-[#1a0a00] py-4 text-sm font-black text-[#f5ede0] transition hover:bg-[#b52d25]"
                >
                  LOCK THE DREAM →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── REALITY ── */}
        {screen === "reality" && (
          <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl items-center py-10">
            <div className="w-full rounded-[2rem] border border-[#e0d0bc] bg-white/60 p-8 shadow-sm sm:p-12">
              <p className="text-xs font-bold tracking-[0.22em] text-[#b52d25]">02 / REALITY CHECK</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
                THE JOB IS REAL.<br />SO IS THE MATH.
              </h1>
              <div className="mt-9 grid gap-4 sm:grid-cols-3">
                <Metric label="FIRST JOB PAY" value="$3,350" note="monthly take-home" />
                <Metric label="SAVINGS" value="$3,000" note="available for down payment" />
                <Metric label="SAFE CAR BUDGET" value="$425" note="monthly payment ceiling" />
              </div>
              <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-[#6b4a2a]">
                <strong className="text-[#1a0a00]">Your {brand} {body} starts around {money(dreamPrice)}.</strong>{" "}
                You can still chase the feeling — just make the market prove it fits your actual first-year life. A used model, a shorter loan, or fewer packages can protect your savings without killing the dream.
              </div>
              <button
                type="button"
                onClick={() => setScreen("market")}
                className="mt-8 rounded-full bg-[#1a0a00] px-8 py-4 text-sm font-bold text-[#f5ede0] transition hover:bg-[#b52d25]"
              >
                OPEN THE LOCAL MARKET →
              </button>
            </div>
          </section>
        )}

        {/* ── MARKET ── */}
        {screen === "market" && (
          <section className="py-10">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold tracking-[0.22em] text-[#b52d25]">03 / LOCAL MARKET</p>
                <h1 className="mt-2 text-4xl font-black sm:text-6xl">THREE SITES. ONE SMART DEAL.</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#6b4a2a]">
                  Every dealer has the kind of information a real buyer needs — and some information it would rather you miss. Browse all three before you decide.
                </p>
              </div>
              <div className="rounded-2xl border border-[#e0d0bc] bg-white/60 px-4 py-3 text-right">
                <p className="text-[10px] font-bold tracking-[0.16em] text-[#8b6340]">CASE NOTEBOOK</p>
                <p className="mt-1 text-sm text-[#6b4a2a]">
                  {inspection ? "✓ Inspection planned" : "No inspection yet"} ·{" "}
                  {quoteRequested ? "✓ Written quote" : "No written quote"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {DEALERS.map((dealer, i) => (
                <DealerSite
                  key={dealer.id}
                  dealer={dealer}
                  brand={brand}
                  body={body}
                  trim={trim}
                  listing={listings[i]}
                  selected={dealerId === dealer.id}
                  onSelect={() => setDealerId(dealer.id)}
                />
              ))}
            </div>

            {/* Selected dealer's hidden info */}
            {dealerId && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-[10px] font-bold tracking-[0.16em] text-[#8b6340] mb-1">WHAT TO KNOW</p>
                <p className="text-sm leading-6 text-[#6b4a2a]">
                  {DEALERS.find((d) => d.id === dealerId)?.hidden}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setInspection(!inspection)}
                className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                  inspection
                    ? "border-[#1a0a00] bg-[#1a0a00] text-[#f5ede0]"
                    : "border-[#e0d0bc] bg-white text-[#6b4a2a] hover:border-[#1a0a00]"
                }`}
              >
                {inspection ? "✓ Independent inspection requested" : "+ Request independent inspection"}
              </button>
              <button
                type="button"
                onClick={() => setQuoteRequested(!quoteRequested)}
                className={`rounded-full border px-5 py-3 text-sm font-semibold transition ${
                  quoteRequested
                    ? "border-[#1a0a00] bg-[#1a0a00] text-[#f5ede0]"
                    : "border-[#e0d0bc] bg-white text-[#6b4a2a] hover:border-[#1a0a00]"
                }`}
              >
                {quoteRequested ? "✓ Itemized quote requested" : "+ Ask for out-the-door quote"}
              </button>
              <button
                type="button"
                disabled={!dealerId}
                onClick={() => setScreen("sign")}
                className="ml-auto rounded-full bg-[#b52d25] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#8d1a16] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ENTER FINANCE OFFICE →
              </button>
            </div>
          </section>
        )}

        {/* ── FINANCE OFFICE ── */}
        {screen === "sign" && selectedDealer && selectedListing && (
          <section className="mx-auto max-w-5xl py-10">
            <p className="text-xs font-bold tracking-[0.22em] text-[#b52d25]">04 / FINANCE OFFICE</p>
            <h1 className="mt-2 text-4xl font-black sm:text-6xl">DON&apos;T SIGN YET.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b4a2a]">
              This is where a good advertised deal can quietly become an expensive contract. Read every line.
            </p>
            <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
              <div className="rounded-[2rem] border border-[#e0d0bc] bg-white/60 p-6">
                <p className="text-xs font-bold tracking-[0.18em] text-[#8b6340]">
                  PURCHASE WORKSHEET · {selectedDealer.name.toUpperCase()}
                </p>
                <div className="mt-6 space-y-4 text-sm">
                  <Line label="Vehicle price" value={money(selectedListing.price)} />
                  <Line label="Documentation fee" value={money(selectedDealer.docFee)} />
                  <Line label="Dealer protection package" value={money(selectedDealer.packageFee)} dim={selectedDealer.packageFee > 0} />
                  <Line label="Selected add-ons" value={money(addOnTotal)} />
                  <Line label="Down payment" value={money(-3000)} />
                  <div className="border-t border-[#e0d0bc] pt-4">
                    <Line label="Amount financed" value={money(financedAmount)} strong />
                    <Line label={preapproved ? "Pre-approved APR" : "Dealer APR"} value={`${effectiveApr.toFixed(1)}%`} strong />
                    <Line label="Estimated payment" value={`${money(monthly)}/mo × ${selectedDealer.months}`} strong />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setPreapproved(!preapproved)}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    preapproved
                      ? "border-[#1a0a00] bg-[#1a0a00] text-[#f5ede0]"
                      : "border-[#e0d0bc] bg-white/60 hover:border-[#1a0a00]"
                  }`}
                >
                  <p className="font-bold">{preapproved ? "✓" : "○"} Bring your bank pre-approval</p>
                  <p className={`mt-1 text-sm leading-6 ${preapproved ? "text-[#f5ede0]/75" : "text-[#6b4a2a]"}`}>
                    Compare the dealer&apos;s offer to a 5.4% pre-approval before agreeing to financing.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setAddons((a) => a.includes("shield") ? a.filter((x) => x !== "shield") : [...a, "shield"])}
                  className={`w-full rounded-2xl border p-5 text-left transition ${
                    addons.includes("shield")
                      ? "border-amber-500 bg-amber-50"
                      : "border-[#e0d0bc] bg-white/60 hover:border-amber-400"
                  }`}
                >
                  <p className="font-bold">{addons.includes("shield") ? "✓" : "○"} RoadShield protection · {money(1095)}</p>
                  <p className="mt-1 text-sm leading-6 text-[#6b4a2a]">
                    An optional service product. It may be useful for some drivers, but it is not required to buy the car.
                  </p>
                </button>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-[#6b4a2a]">
                  The salesperson says, &quot;We can get the monthly payment down.&quot; A lower payment can still mean a more expensive loan if the term stretches longer.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScreen("result")}
              className="mt-7 rounded-full bg-[#b52d25] px-8 py-4 text-sm font-black text-white transition hover:bg-[#8d1a16]"
            >
              SIGN &amp; SEE THE REAL DEAL →
            </button>
          </section>
        )}

        {/* ── RESULT ── */}
        {screen === "result" && selectedDealer && (
          <section className="mx-auto max-w-5xl py-10">
            <p className="text-xs font-bold tracking-[0.22em] text-[#b52d25]">05 / SIGNED</p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
              <div className="rounded-[2rem] border border-[#e0d0bc] bg-[#1a0a00] p-7 text-[#f5ede0]">
                <p className="text-sm font-bold tracking-widest opacity-60">YOUR DRIVELINE SCORE</p>
                <p className="mt-2 text-8xl font-black tracking-[-0.08em] text-[#f5ede0]">{score}</p>
                <p className="mt-1 text-xl font-bold">out of 100</p>
                <p className="mt-7 text-sm leading-6 opacity-75">
                  {score >= 80
                    ? "You built a real plan around the dream."
                    : score >= 55
                    ? "You got the keys — now look at what could be stronger."
                    : "The car may feel right, but the contract needs another look."}
                </p>
              </div>
              <div className="rounded-[2rem] border border-[#e0d0bc] bg-white/60 p-7">
                <h1 className="text-3xl font-black">THE DEAL, UNPACKED.</h1>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Metric
                    label="MONTHLY PAYMENT"
                    value={money(monthly)}
                    note={monthly <= 425 ? "within your target" : "above your safe target"}
                  />
                  <Metric
                    label="TOTAL LOAN PAYMENTS"
                    value={money(totalLoan)}
                    note={`${selectedDealer.months} months at ${effectiveApr.toFixed(1)}% APR`}
                  />
                </div>
                <div className="mt-6 space-y-3 text-sm leading-6 text-[#6b4a2a]">
                  <p>
                    <strong className="text-[#1a0a00]">What worked:</strong>{" "}
                    {quoteRequested
                      ? "You asked for a written out-the-door quote, making it easier to compare the full deal."
                      : "You can strengthen this deal by requesting a written out-the-door quote before signing."}
                  </p>
                  <p>
                    <strong className="text-[#1a0a00]">What to watch:</strong>{" "}
                    {inspection
                      ? "An independent inspection gives you evidence beyond a vehicle-history report."
                      : "For a used car, a vehicle-history report is not a substitute for an independent inspection."}
                  </p>
                  <p>
                    <strong className="text-[#1a0a00]">Finance reality:</strong>{" "}
                    {preapproved
                      ? "You used outside financing to keep the dealer rate honest."
                      : "A bank or credit-union pre-approval gives you a real offer to compare before the finance office."}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setScreen("year")}
                className="rounded-full bg-[#1a0a00] px-6 py-3 text-sm font-bold text-[#f5ede0] transition hover:bg-[#b52d25]"
              >
                DRIVE INTO YEAR ONE →
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-full border border-[#e0d0bc] bg-white/60 px-6 py-3 text-sm font-bold text-[#6b4a2a] transition hover:border-[#1a0a00]"
              >
                RESHOP A NEW MARKET
              </button>
            </div>
          </section>
        )}

        {/* ── YEAR ONE ── */}
        {screen === "year" && selectedDealer && (
          <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl items-center py-10">
            <div className="w-full rounded-[2rem] border border-[#e0d0bc] bg-white/60 p-8 sm:p-12">
              <p className="text-xs font-bold tracking-[0.22em] text-[#b52d25]">OPTIONAL / YEAR ONE</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">THE KEYS ARE JUST THE START.</h1>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Metric label="PAYMENTS MADE" value={money(monthly * 12)} note="first 12 months" />
                <Metric
                  label="FUEL + INSURANCE"
                  value={money(body === "Pickup" ? 4980 : body === "Crossover" ? 4120 : 3480)}
                  note="estimated first year"
                />
                <Metric
                  label="SAVINGS LEFT"
                  value={money(Math.max(0, 3000 - 850 - addOnTotal))}
                  note="after down payment costs"
                />
              </div>
              <div className="mt-7 rounded-2xl border border-[#e0d0bc] bg-[#f5ede0] p-5 text-sm leading-6 text-[#6b4a2a]">
                A first car can create independence — and it also becomes part of every future budget. The best deal leaves enough room for maintenance, savings, and the life you want outside the driver&apos;s seat.
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-8 rounded-full bg-[#1a0a00] px-8 py-4 text-sm font-bold text-[#f5ede0] transition hover:bg-[#b52d25]"
              >
                TRY ANOTHER ROUTE →
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Picker({
  title,
  items,
  value,
  onChange,
}: {
  title: string;
  items: { name: string; note: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold tracking-[0.18em] text-[#8b6340]">{title}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => onChange(item.name)}
            title={item.note}
            className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${
              value === item.name
                ? "border-[#1a0a00] bg-[#1a0a00] text-[#f5ede0]"
                : "border-[#e0d0bc] bg-white/60 text-[#6b4a2a] hover:border-[#1a0a00]"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-[#e0d0bc] bg-white/70 p-5">
      <p className="text-[10px] font-bold tracking-[0.16em] text-[#8b6340]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#1a0a00]">{value}</p>
      <p className="mt-1 text-xs text-[#8b6340]">{note}</p>
    </div>
  );
}

function Line({
  label,
  value,
  strong = false,
  dim = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong ? "text-base font-bold text-[#1a0a00]" : dim ? "text-[#b52d25]" : "text-[#6b4a2a]"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
