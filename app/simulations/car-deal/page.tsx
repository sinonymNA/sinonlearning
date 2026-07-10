"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Body = "Crossover" | "Sedan" | "Hatchback" | "Pickup";
type Brand = "Arden" | "Lumen" | "Terraforge";
type Trim = "Essential" | "Comfort" | "Apex";
type Listing = {
  id: string;
  dealer: string;
  vibe: string;
  deal: string;
  price: number;
  mileage: number;
  apr: number;
  months: number;
  docFee: number;
  packageFee: number;
  color: string;
  hidden: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const paymentFor = (amount: number, apr: number, months: number) => {
  const monthlyRate = apr / 100 / 12;
  return (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
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

const colors = [
  { name: "Voltage Blue", value: "#377dff" },
  { name: "Afterglow", value: "#f1a36f" },
  { name: "Signal Red", value: "#ee4f61" },
  { name: "Carbon", value: "#303c51" },
];

const dealerProfiles = [
  {
    dealer: "FLASH DRIVE",
    vibe: "Fast deals · bright promises",
    deal: "PAYMENTS FROM $219/MO",
    hidden: "The payment is low because the loan is 84 months long and an extra package is already in the deal.",
  },
  {
    dealer: "NORTHLINE",
    vibe: "Precision motor collective",
    deal: "A calmer way to buy",
    hidden: "The price is transparent, but the documentation fee is higher than nearby dealers.",
  },
  {
    dealer: "COMMON MILE",
    vibe: "Straight numbers · local inventory",
    deal: "ASK FOR THE OUT-THE-DOOR PRICE",
    hidden: "Less glamorous presentation, but the quote is designed to be compared line by line.",
  },
];

export default function DrivelinePage() {
  const [screen, setScreen] = useState<"start" | "garage" | "reality" | "market" | "sign" | "result" | "year">("start");
  const [body, setBody] = useState<Body>("Crossover");
  const [brand, setBrand] = useState<Brand>("Arden");
  const [trim, setTrim] = useState<Trim>("Comfort");
  const [color, setColor] = useState(colors[0]);
  const [round, setRound] = useState(1);
  const [listingId, setListingId] = useState<string | null>(null);
  const [inspection, setInspection] = useState(false);
  const [preapproved, setPreapproved] = useState(false);
  const [addons, setAddons] = useState<string[]>([]);
  const [quoteRequested, setQuoteRequested] = useState(false);

  const dreamPrice = useMemo(() => {
    const bodyPrice = bodies.find((item) => item.name === body)?.price ?? 0;
    const brandPrice = brands.find((item) => item.name === brand)?.modifier ?? 0;
    const trimPrice = trims.find((item) => item.name === trim)?.modifier ?? 0;
    return bodyPrice + brandPrice + trimPrice;
  }, [body, brand, trim]);

  const listings = useMemo<Listing[]>(() => {
    const seed = round * 7919 + dreamPrice;
    const jitter = (offset: number, amount: number) => Math.abs(Math.sin(seed + offset) * amount);
    return dealerProfiles.map((profile, index) => {
      const usedDiscount = 1500 + Math.round(jitter(index + 1, 5200) / 100) * 100;
      const price = Math.max(17800, dreamPrice - usedDiscount + index * 450);
      const months = index === 0 ? 84 : index === 1 ? 60 : 48;
      const apr = index === 0 ? 10.9 : index === 1 ? 7.2 : 5.9;
      const docFee = index === 0 ? 899 : index === 1 ? 649 : 249;
      const packageFee = index === 0 ? 1595 : index === 1 ? 495 : 0;
      return {
        id: `dealer-${index}`,
        dealer: profile.dealer,
        vibe: profile.vibe,
        deal: profile.deal,
        price,
        mileage: 6000 + Math.round(jitter(index + 9, 58000) / 100) * 100,
        apr,
        months,
        docFee,
        packageFee,
        color: colors[(round + index) % colors.length].value,
        hidden: profile.hidden,
      };
    });
  }, [dreamPrice, round]);

  const selected = listings.find((listing) => listing.id === listingId);
  const addOnTotal = addons.includes("shield") ? 1095 : 0;
  const financedAmount = selected ? selected.price + selected.docFee + selected.packageFee + addOnTotal - 3000 : 0;
  const effectiveApr = selected ? (preapproved ? Math.min(selected.apr, 5.4) : selected.apr) : 0;
  const monthly = selected ? paymentFor(financedAmount, effectiveApr, selected.months) : 0;
  const totalLoan = selected ? monthly * selected.months : 0;

  const score = useMemo(() => {
    if (!selected) return 0;
    const affordability = monthly <= 425 ? 30 : monthly <= 500 ? 18 : 4;
    const finance = preapproved ? 25 : selected.apr < 7 ? 16 : 5;
    const transparency = quoteRequested ? 20 : 0;
    const protection = inspection ? 15 : 0;
    const addonsScore = addons.length === 0 ? 10 : 2;
    return Math.min(100, Math.round(affordability + finance + transparency + protection + addonsScore));
  }, [addons.length, inspection, monthly, preapproved, quoteRequested, selected]);

  const reset = () => {
    setRound((value) => value + 1);
    setListingId(null);
    setInspection(false);
    setPreapproved(false);
    setAddons([]);
    setQuoteRequested(false);
    setScreen("garage");
  };

  const addOnSelected = (id: string) => addons.includes(id);
  const toggleAddOn = (id: string) => setAddons((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#070b15] text-white selection:bg-fuchsia-500/50">
      <div className="pointer-events-none fixed inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(circle at 15% 0%, rgba(94,92,255,.22), transparent 30%), radial-gradient(circle at 85% 15%, rgba(236,72,153,.16), transparent 30%), linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)", backgroundSize: "auto, auto, 34px 34px, 34px 34px" }} />
      <div className="relative mx-auto min-h-screen max-w-[1500px] px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/simulations" className="text-xs font-medium tracking-[0.18em] text-white/50 transition hover:text-white">← EXIT TO SINON</Link>
          <div className="flex items-center gap-2 text-sm font-bold tracking-[0.2em]">
            <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_22px_#22d3ee]" />
            DRIVELINE
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">FIRST CAR / 01</span>
        </header>

        {screen === "start" && (
          <section className="grid min-h-[calc(100vh-96px)] items-center gap-10 py-14 lg:grid-cols-[.85fr_1.15fr]">
            <div className="relative z-10">
              <p className="text-xs font-bold tracking-[0.25em] text-cyan-300">A FIRST-CAR SIMULATION</p>
              <h1 className="mt-5 max-w-xl text-6xl font-black leading-[.9] tracking-[-.06em] sm:text-8xl">BUILD THE<br /><span className="text-transparent" style={{ WebkitTextStroke: "1px #8b5cf6" }}>DREAM.</span><br />READ THE<br />FINE PRINT.</h1>
              <p className="mt-7 max-w-md text-base leading-7 text-white/65">Your first job needs a ride. Build the car you want, then navigate a live market of dealers, offers, fees, and tradeoffs.</p>
              <button type="button" onClick={() => setScreen("garage")} className="mt-9 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#070b15] transition hover:scale-[1.03]">START YOUR BUILD →</button>
              <p className="mt-5 text-xs text-white/40">10–15 minute solo game · fictional market · real-world skills</p>
            </div>
            <div className="relative min-h-[440px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#101a35] shadow-2xl">
              <div className="absolute inset-0 bg-cover bg-center opacity-85" style={{ backgroundImage: "url('/games/driveline/hero-car.png')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070b15] via-transparent to-transparent" />
              <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between">
                <div><p className="text-xs tracking-[.2em] text-cyan-300">YOUR GARAGE AWAITS</p><p className="mt-1 text-2xl font-bold">Define the car. Define the stakes.</p></div>
                <span className="hidden rounded-full border border-white/20 bg-black/20 px-3 py-2 text-xs backdrop-blur sm:block">LIVE MARKET ENGINE</span>
              </div>
            </div>
          </section>
        )}

        {screen === "garage" && (
          <section className="py-10">
            <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-xs font-bold tracking-[.22em] text-cyan-300">01 / DREAM GARAGE</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">MAKE IT YOURS.</h1></div><div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3"><p className="text-xs text-white/45">DREAM BUILD MSRP</p><p className="text-2xl font-bold">{money(dreamPrice)}</p></div></div>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
              <div className="relative min-h-[390px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111c39] to-[#090b1c] p-7">
                <div className="absolute -left-10 top-12 h-56 w-56 rounded-full blur-3xl" style={{ background: color.value, opacity: .28 }} />
                <div className="absolute inset-x-10 bottom-20 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
                <div className="absolute bottom-[108px] left-[18%] h-28 w-[64%] rounded-[45%_45%_22%_22%] border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,.55)]" style={{ background: `linear-gradient(135deg, ${color.value}, #101c3e 90%)` }}><div className="absolute left-[18%] top-3 h-10 w-[38%] skew-x-[-20deg] rounded-tl-3xl border border-white/30 bg-[#0a1025]/80" /><div className="absolute right-[18%] top-3 h-10 w-[38%] skew-x-[20deg] rounded-tr-3xl border border-white/30 bg-[#0a1025]/80" /><div className="absolute -bottom-6 left-[12%] h-12 w-12 rounded-full border-4 border-[#111] bg-white/40 shadow-[0_0_0_8px_#060812]" /><div className="absolute -bottom-6 right-[12%] h-12 w-12 rounded-full border-4 border-[#111] bg-white/40 shadow-[0_0_0_8px_#060812]" /></div>
                <div className="absolute bottom-7 left-7"><p className="text-xs tracking-[.2em] text-white/45">CONCEPT BUILD</p><p className="mt-1 text-xl font-bold">{brand} {body} · {trim}</p></div>
              </div>
              <div className="space-y-5 rounded-[2rem] border border-white/10 bg-white/[.04] p-6">
                <Picker title="BODY" items={bodies.map((item) => item.name)} value={body} onChange={(value) => setBody(value as Body)} />
                <Picker title="MAKE" items={brands.map((item) => item.name)} value={brand} onChange={(value) => setBrand(value as Brand)} />
                <Picker title="TRIM" items={trims.map((item) => item.name)} value={trim} onChange={(value) => setTrim(value as Trim)} />
                <div><p className="text-xs font-bold tracking-[.18em] text-white/45">FINISH</p><div className="mt-3 flex gap-3">{colors.map((option) => <button aria-label={option.name} key={option.name} type="button" onClick={() => setColor(option)} className={`h-8 w-8 rounded-full border-2 transition ${color.name === option.name ? "scale-110 border-white" : "border-transparent"}`} style={{ background: option.value }} />)}</div></div>
                <button type="button" onClick={() => setScreen("reality")} className="w-full rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-400 py-4 text-sm font-black text-[#08101e] transition hover:brightness-110">LOCK THE DREAM →</button>
              </div>
            </div>
          </section>
        )}

        {screen === "reality" && (
          <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl items-center py-10">
            <div className="w-full rounded-[2rem] border border-white/10 bg-[#0d1427]/90 p-7 shadow-2xl sm:p-11">
              <p className="text-xs font-bold tracking-[.22em] text-fuchsia-300">02 / REALITY CHECK</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">THE JOB IS REAL.<br />SO IS THE MATH.</h1>
              <div className="mt-9 grid gap-4 sm:grid-cols-3"><Metric label="FIRST JOB PAY" value="$3,350" note="monthly take-home" /><Metric label="SAVINGS" value="$3,000" note="available for down payment" /><Metric label="SAFE CAR BUDGET" value="$425" note="monthly payment ceiling" /></div>
              <div className="mt-7 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-5 text-sm leading-6 text-white/75"><strong className="text-white">Your {brand} {body} starts around {money(dreamPrice)}.</strong> You can still chase the feeling—just make the market prove it fits your actual first-year life. A used model, a shorter loan, or fewer packages can protect your savings without killing the dream.</div>
              <button type="button" onClick={() => setScreen("market")} className="mt-8 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#070b15]">OPEN THE LOCAL MARKET →</button>
            </div>
          </section>
        )}

        {screen === "market" && (
          <section className="py-10">
            <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold tracking-[.22em] text-cyan-300">03 / LOCAL MARKET</p><h1 className="mt-2 text-4xl font-black sm:text-6xl">THREE SITES. ONE SMART DEAL.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Every dealer has the kind of information a real buyer needs—and some information it would rather you miss.</p></div><div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-right"><p className="text-[10px] font-bold tracking-[.16em] text-cyan-200">CASE NOTEBOOK</p><p className="mt-1 text-sm text-white/75">{inspection ? "Inspection planned" : "No inspection yet"} · {quoteRequested ? "Written quote requested" : "No written quote"}</p></div></div>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">{listings.map((listing) => { const selectedListing = listingId === listing.id; const estimate = paymentFor(listing.price + listing.docFee + listing.packageFee - 3000, listing.apr, listing.months); return <button type="button" onClick={() => setListingId(listing.id)} key={listing.id} className={`group overflow-hidden rounded-[1.7rem] border text-left transition ${selectedListing ? "border-cyan-300 bg-cyan-300/10 ring-1 ring-cyan-300" : "border-white/10 bg-white/[.04] hover:-translate-y-1 hover:border-white/30"}`}><div className="h-32 p-5" style={{ background: `radial-gradient(circle at 68% 28%, ${listing.color}, transparent 42%), linear-gradient(140deg,#121a34,#080b17)` }}><p className="text-xs font-black tracking-[.16em]">{listing.dealer}</p><p className="mt-2 text-xs text-white/65">{listing.vibe}</p></div><div className="p-5"><p className="text-[10px] font-bold tracking-[.14em] text-fuchsia-300">{listing.deal}</p><h2 className="mt-2 text-xl font-bold">{brand} {body} {trim}</h2><p className="mt-1 text-sm text-white/55">{listing.mileage.toLocaleString()} miles · {listing.months} months · {listing.apr}% APR</p><div className="mt-5 flex items-end justify-between"><div><p className="text-xs text-white/45">listed price</p><p className="text-2xl font-black">{money(listing.price)}</p></div><p className="text-sm font-semibold text-cyan-200">≈ {money(estimate)}/mo</p></div><div className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/50">Potential hidden cost: {listing.hidden}</div></div></button>})}</div>
            <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => setInspection(!inspection)} className={`rounded-full border px-5 py-3 text-sm font-semibold ${inspection ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-white/15 text-white/70"}`}>{inspection ? "✓ Independent inspection requested" : "+ Request independent inspection"}</button><button type="button" onClick={() => setQuoteRequested(!quoteRequested)} className={`rounded-full border px-5 py-3 text-sm font-semibold ${quoteRequested ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-white/15 text-white/70"}`}>{quoteRequested ? "✓ Itemized quote requested" : "+ Ask for out-the-door quote"}</button><button type="button" disabled={!selected} onClick={() => setScreen("sign")} className="ml-auto rounded-full bg-white px-6 py-3 text-sm font-bold text-[#070b15] disabled:cursor-not-allowed disabled:opacity-30">ENTER FINANCE OFFICE →</button></div>
          </section>
        )}

        {screen === "sign" && selected && (
          <section className="mx-auto max-w-5xl py-10">
            <p className="text-xs font-bold tracking-[.22em] text-fuchsia-300">04 / FINANCE OFFICE</p><h1 className="mt-2 text-4xl font-black sm:text-6xl">DON&apos;T SIGN YET.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">This is where a good advertised deal can quietly become an expensive contract. Read every line.</p>
            <div className="mt-7 grid gap-6 lg:grid-cols-[1.05fr_.95fr]"><div className="rounded-[2rem] border border-white/10 bg-white/[.045] p-6"><p className="text-xs font-bold tracking-[.18em] text-cyan-200">PURCHASE WORKSHEET · {selected.dealer}</p><div className="mt-6 space-y-4 text-sm"><Line label="Vehicle price" value={money(selected.price)} /><Line label="Documentation fee" value={money(selected.docFee)} /><Line label="Dealer protection package" value={money(selected.packageFee)} dim={selected.packageFee > 0} /><Line label="Selected add-ons" value={money(addOnTotal)} /><Line label="Down payment" value={money(-3000)} /><div className="border-t border-white/15 pt-4"><Line label="Amount financed" value={money(financedAmount)} strong /><Line label={preapproved ? "Pre-approved APR" : "Dealer APR"} value={`${effectiveApr.toFixed(1)}%`} strong /><Line label="Estimated payment" value={`${money(monthly)}/mo × ${selected.months}`} strong /></div></div></div>
            <div className="space-y-4"><button type="button" onClick={() => setPreapproved(!preapproved)} className={`w-full rounded-2xl border p-5 text-left ${preapproved ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-white/[.04]"}`}><p className="font-bold">{preapproved ? "✓" : "○"} Bring your bank pre-approval</p><p className="mt-1 text-sm leading-6 text-white/55">Compare the dealer&apos;s offer to a 5.4% pre-approval before agreeing to financing.</p></button><button type="button" onClick={() => toggleAddOn("shield")} className={`w-full rounded-2xl border p-5 text-left ${addOnSelected("shield") ? "border-fuchsia-300 bg-fuchsia-300/10" : "border-white/10 bg-white/[.04]"}`}><p className="font-bold">{addOnSelected("shield") ? "✓" : "○"} RoadShield protection · {money(1095)}</p><p className="mt-1 text-sm leading-6 text-white/55">An optional service product. It may be useful for some drivers, but it is not required to buy the car.</p></button><div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-6 text-amber-100">The salesperson says, “We can get the monthly payment down.” A lower payment can still mean a more expensive loan if the term stretches longer.</div></div></div>
            <button type="button" onClick={() => setScreen("result")} className="mt-7 rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-400 px-7 py-4 text-sm font-black text-[#13091c]">SIGN & SEE THE REAL DEAL →</button>
          </section>
        )}

        {screen === "result" && selected && (
          <section className="mx-auto max-w-5xl py-10"><p className="text-xs font-bold tracking-[.22em] text-cyan-300">05 / SIGNED</p><div className="mt-4 grid gap-6 lg:grid-cols-[.75fr_1.25fr]"><div className="rounded-[2rem] bg-gradient-to-br from-cyan-300 to-violet-400 p-7 text-[#08101e]"><p className="text-sm font-bold">YOUR DRIVELINE SCORE</p><p className="mt-2 text-8xl font-black tracking-[-.08em]">{score}</p><p className="mt-1 text-xl font-bold">out of 100</p><p className="mt-7 text-sm leading-6">{score >= 80 ? "You built a real plan around the dream." : score >= 55 ? "You got the keys—now look at what could be stronger." : "The car may feel right, but the contract needs another look."}</p></div><div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-7"><h1 className="text-3xl font-black">THE DEAL, UNPACKED.</h1><div className="mt-6 grid gap-4 sm:grid-cols-2"><Metric label="MONTHLY PAYMENT" value={`${money(monthly)}`} note={monthly <= 425 ? "within your target" : "above your safe target"} dark /><Metric label="TOTAL LOAN PAYMENTS" value={money(totalLoan)} note={`${selected.months} months at ${effectiveApr.toFixed(1)}% APR`} dark /></div><div className="mt-6 space-y-3 text-sm leading-6 text-white/65"><p><strong className="text-white">What worked:</strong> {quoteRequested ? "You asked for a written out-the-door quote, making it easier to compare the full deal." : "You can strengthen this deal by requesting a written out-the-door quote before signing."}</p><p><strong className="text-white">What to watch:</strong> {inspection ? "An independent inspection gives you evidence beyond a vehicle-history report." : "For a used car, a vehicle-history report is not a substitute for an independent inspection."}</p><p><strong className="text-white">Finance reality:</strong> {preapproved ? "You used outside financing to keep the dealer rate honest." : "A bank or credit-union pre-approval gives you a real offer to compare before the finance office."}</p></div></div></div>
            <div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={() => setScreen("year")} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#070b15]">DRIVE INTO YEAR ONE →</button><button type="button" onClick={reset} className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white/75">RESHOP A NEW MARKET</button></div></section>
        )}

        {screen === "year" && selected && (
          <section className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl items-center py-10"><div className="w-full rounded-[2rem] border border-white/10 bg-[#0d1427] p-8 sm:p-11"><p className="text-xs font-bold tracking-[.22em] text-fuchsia-300">OPTIONAL / YEAR ONE</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">THE KEYS ARE JUST THE START.</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="PAYMENTS MADE" value={money(monthly * 12)} note="first 12 months" /><Metric label="FUEL + INSURANCE" value={money(body === "Pickup" ? 4980 : body === "Crossover" ? 4120 : 3480)} note="estimated first year" /><Metric label="SAVINGS LEFT" value={money(Math.max(0, 3000 - 850 - addOnTotal))} note="after down payment costs" /></div><div className="mt-7 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-sm leading-6 text-cyan-50">A first car can create independence—and it also becomes part of every future budget. The best deal leaves enough room for maintenance, savings, and the life you want outside the driver&apos;s seat.</div><button type="button" onClick={reset} className="mt-8 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#070b15]">TRY ANOTHER ROUTE →</button></div></section>
        )}
      </div>
    </main>
  );
}

function Picker({ title, items, value, onChange }: { title: string; items: string[]; value: string; onChange: (value: string) => void }) {
  return <div><p className="text-xs font-bold tracking-[.18em] text-white/45">{title}</p><div className="mt-3 grid grid-cols-3 gap-2">{items.map((item) => <button type="button" key={item} onClick={() => onChange(item)} className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${value === item ? "border-cyan-300 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[.03] text-white/60 hover:border-white/30"}`}>{item}</button>)}</div></div>;
}

function Metric({ label, value, note, dark = false }: { label: string; value: string; note: string; dark?: boolean }) {
  return <div className={`rounded-2xl border p-5 ${dark ? "border-white/10 bg-black/15" : "border-white/10 bg-white/[.04]"}`}><p className="text-[10px] font-bold tracking-[.16em] text-white/45">{label}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-white/55">{note}</p></div>;
}

function Line({ label, value, strong = false, dim = false }: { label: string; value: string; strong?: boolean; dim?: boolean }) {
  return <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-bold text-white" : dim ? "text-fuchsia-200" : "text-white/65"}`}><span>{label}</span><span>{value}</span></div>;
}
