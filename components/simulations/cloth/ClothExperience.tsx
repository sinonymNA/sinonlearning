"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Eye, RotateCcw, Sparkles, X } from "lucide-react";

type Chapter = {
  kicker: string;
  title: string;
  years: string;
  thesis: string;
  label: string;
  evidence: string;
  prompt: string;
};

const chapters: Chapter[] = [
  {
    kicker: "Gallery I · The object",
    title: "Begin with the evidence.",
    years: "c. 1710–1725",
    thesis: "A hand-painted cotton from India’s Coromandel Coast, made for an export market—and preserved long enough to tell a global story.",
    label: "Length of cotton ‘chintz’",
    evidence: "Cotton; painted, resist- and mordant-dyed · 3.9 m long · The Metropolitan Museum of Art",
    prompt: "Look before you explain. What does its scale, color, or design suggest about the people who made and purchased it?",
  },
  {
    kicker: "Gallery II · Knowledge in the cloth",
    title: "Color was technology.",
    years: "Before 1700",
    thesis: "Indian artisans combined specialized labor, a bamboo kalam, mordants, wax or mud resists, indigo, and chay-root red to make color that survived washing and travel.",
    label: "The sequence mattered",
    evidence: "Draw → mordant → dye → resist → dye again → wash. A mistake at one stage could undo weeks of skilled work.",
    prompt: "This is not a ‘raw material.’ Where do you see evidence of accumulated scientific and artistic knowledge?",
  },
  {
    kicker: "Gallery III · Desired everywhere",
    title: "Europe entered an Asian system.",
    years: "1600–1750",
    thesis: "Indian textiles already moved through the Indian Ocean. English and Dutch companies joined those networks, paid in bullion, and ordered designs for consumers from Southeast Asia to West Africa and Europe.",
    label: "A fabric with many destinations",
    evidence: "Coromandel → Batavia → Amsterdam and London; Indian cotton also circulated to East Africa and West African markets.",
    prompt: "Who has power in this network: the producer, the merchant, the state, or the consumer? Defend one answer.",
  },
  {
    kicker: "Gallery IV · Cloth and coercion",
    title: "Beauty entered a brutal ledger.",
    years: "1650–1800",
    thesis: "European traders used desirable textiles as exchange goods in Atlantic commerce—including the trafficking of enslaved people. African merchants were discerning market actors; Europeans exploited those markets inside a violent system.",
    label: "Follow the transaction",
    evidence: "By 1701, English textile exports and re-exports to the Americas and West Africa had risen more than 500% from 1669.",
    prompt: "How can one object reveal both consumer choice and coercive power without confusing the two?",
  },
  {
    kicker: "Gallery V · Copy, ban, mechanize",
    title: "Desire helped power a revolution.",
    years: "1700–1850",
    thesis: "Unable to match Indian cloth at first, European states restricted it and manufacturers imitated it. Mechanized spinning and printing transformed the same desire into industrial production.",
    label: "Protection before dominance",
    evidence: "Britain restricted imported printed cotton in 1700. From the 1780s, British machine-made yarn and cloth increasingly flowed back toward India.",
    prompt: "Does industrialization look inevitable when you begin with Britain trying to stop a superior import?",
  },
  {
    kicker: "Gallery VI · The reversed current",
    title: "The copy became an instrument of empire.",
    years: "1780s–1900",
    thesis: "Colonial policy, tariffs, and machine production reversed the flow: British cloth undercut many Indian producers. The textile later became a language of resistance through swadeshi and khadi.",
    label: "An object becomes an argument",
    evidence: "The global economy did not simply ‘connect’ regions. States and empires changed the terms of connection—and people contested them.",
    prompt: "Which caused more change: technology, consumer demand, or imperial policy? Your answer is your thesis.",
  },
];

const nodes = [
  { name: "Coromandel", x: 68, y: 55, note: "production" },
  { name: "Batavia", x: 82, y: 69, note: "exchange" },
  { name: "East Africa", x: 55, y: 65, note: "market" },
  { name: "West Africa", x: 38, y: 55, note: "market" },
  { name: "London", x: 43, y: 25, note: "company + state" },
  { name: "Amsterdam", x: 47, y: 27, note: "company + market" },
  { name: "Caribbean", x: 22, y: 50, note: "plantation economy" },
];

const sourceLinks = [
  ["The Met · Length of cotton ‘chintz’", "https://www.metmuseum.org/art/collection/search/231243"],
  ["V&A · Indian textiles", "https://www.vam.ac.uk/articles/indian-textiles/"],
  ["The Met · Interwoven Globe", "https://www.metmuseum.org/exhibitions/listings/2013/interwoven-globe"],
  ["The Met · Indian Textiles: Trade and Production", "https://www.metmuseum.org/pt/essays/indian-textiles-trade-and-production"],
];

export default function ClothExperience() {
  const [chapter, setChapter] = useState(0);
  const [collected, setCollected] = useState<number[]>([]);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const current = chapters[chapter];
  const progress = ((chapter + 1) / chapters.length) * 100;
  const causation = useMemo(() => {
    const chosen = collected.length;
    return chosen >= 4 ? "You have enough evidence to build a defensible causal chain." : `Collect ${4 - chosen} more thread${4 - chosen === 1 ? "" : "s"} of evidence.`;
  }, [collected]);

  function collect() {
    setCollected((old) => (old.includes(chapter) ? old : [...old, chapter]));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0a08] text-[#eee5d2] selection:bg-[#b64d35] selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.055] [background-image:url('/cloth/indian-chintz-met.jpg')] bg-cover bg-center" />
      <header className="relative z-30 flex items-center justify-between border-b border-[#e4ca98]/15 bg-[#0b0a08]/85 px-4 py-3 backdrop-blur-xl md:px-8">
        <Link href="/simulations" className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-[#d7c7a8] hover:text-white">
          <ArrowLeft size={14} /> Exhibitions
        </Link>
        <p className="hidden font-serif text-sm italic text-[#d8b979] md:block">An Object That Conquered the World</p>
        <button onClick={() => setSourcesOpen(true)} className="text-xs uppercase tracking-[.2em] text-[#d7c7a8] hover:text-white">Sources</button>
      </header>

      <div className="relative z-10 grid min-h-[calc(100vh-53px)] lg:grid-cols-[minmax(0,1.16fr)_minmax(420px,.84fr)]">
        <section className="relative min-h-[54vh] overflow-hidden border-b border-[#e4ca98]/15 lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(184,117,67,.18),transparent_43%),linear-gradient(180deg,#18120d,#090806)]" />
          {chapter === 2 ? (
            <TradeConstellation />
          ) : chapter === 3 ? (
            <Ledger />
          ) : chapter === 4 ? (
            <Machine />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-8 py-14">
              <button onClick={() => setZoom(!zoom)} aria-label="Magnify textile" className="group relative h-[78%] min-h-[380px] w-full max-w-[460px] cursor-zoom-in overflow-hidden shadow-[0_35px_90px_rgba(0,0,0,.7)] ring-1 ring-[#f4d9a1]/25">
                <Image src="/cloth/indian-chintz-met.jpg" alt="Early eighteenth-century Indian painted and dyed cotton chintz with red flowers and blue-green foliage" fill priority className={`object-cover transition duration-1000 ${zoom ? "scale-[2.15] object-[53%_42%]" : "scale-100"}`} />
                <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/25 bg-black/60 px-3 py-2 text-[10px] uppercase tracking-[.16em] text-white backdrop-blur"><Eye size={13}/>{zoom ? "Return" : "Inspect"}</span>
              </button>
            </div>
          )}
          <div className="absolute bottom-4 left-5 text-[10px] uppercase tracking-[.17em] text-[#dec99d]/55">Open Access image · The Metropolitan Museum of Art</div>
        </section>

        <section className="relative flex flex-col bg-[#100e0b]/92 px-6 py-8 md:px-10 md:py-10 lg:px-12 lg:py-12">
          <div className="mb-8 flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[.25em] text-[#c55b43]">{current.kicker}</span>
            <span className="h-px flex-1 bg-[#e4ca98]/15" />
            <span className="font-mono text-[11px] text-[#d8b979]">{current.years}</span>
          </div>

          <h1 className="max-w-xl font-serif text-4xl leading-[.98] tracking-[-.03em] text-[#f4ead7] md:text-6xl">{current.title}</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#d1c5b2] md:text-lg">{current.thesis}</p>

          <div className="my-8 border-l border-[#b64d35] pl-5">
            <p className="text-xs uppercase tracking-[.2em] text-[#d8b979]">{current.label}</p>
            <p className="mt-2 text-sm leading-6 text-[#a99e8c]">{current.evidence}</p>
          </div>

          <div className="mt-auto">
            <p className="font-serif text-lg italic leading-7 text-[#eee0c7]">“{current.prompt}”</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={collect} className={`flex items-center gap-2 border px-4 py-3 text-xs uppercase tracking-[.14em] transition ${collected.includes(chapter) ? "border-[#6f8f77] bg-[#6f8f77]/15 text-[#b9d3bc]" : "border-[#d8b979]/45 text-[#e6cf9f] hover:bg-[#d8b979]/10"}`}>
                {collected.includes(chapter) ? <Check size={14}/> : <Sparkles size={14}/>} {collected.includes(chapter) ? "Evidence collected" : "Collect this thread"}
              </button>
              <button disabled={chapter === chapters.length - 1} onClick={() => setChapter((c) => Math.min(chapters.length - 1, c + 1))} className="flex items-center gap-2 bg-[#eee5d2] px-5 py-3 text-xs uppercase tracking-[.14em] text-[#17120d] transition hover:bg-white disabled:opacity-30">Next gallery <ArrowRight size={14}/></button>
            </div>
            <p className="mt-5 text-xs text-[#8f8678]">{causation}</p>
          </div>
        </section>
      </div>

      <nav aria-label="Exhibition chapters" className="relative z-20 border-t border-[#e4ca98]/15 bg-[#0b0a08] px-4 py-4 md:px-8">
        <div className="relative mx-auto flex max-w-7xl justify-between">
          <div className="absolute left-0 right-0 top-[7px] h-px bg-[#e4ca98]/15"><div className="h-full bg-[#b64d35] transition-all duration-700" style={{width: `${progress}%`}} /></div>
          {chapters.map((item, index) => <button key={item.title} onClick={() => setChapter(index)} aria-label={`Open ${item.kicker}`} className="relative flex flex-col items-center gap-2"><span className={`h-[15px] w-[15px] rounded-full border-2 transition ${index === chapter ? "scale-125 border-[#e7ca8f] bg-[#b64d35]" : index < chapter ? "border-[#b64d35] bg-[#b64d35]" : "border-[#5e5548] bg-[#0b0a08]"}`}/><span className={`hidden text-[9px] uppercase tracking-[.12em] md:block ${index === chapter ? "text-[#e7ca8f]" : "text-[#70685c]"}`}>0{index + 1}</span></button>)}
        </div>
      </nav>

      {sourcesOpen && <Sources onClose={() => setSourcesOpen(false)} />}
    </main>
  );
}

function TradeConstellation() {
  return <div className="absolute inset-0 flex items-center justify-center p-5 md:p-10">
    <div className="relative aspect-[1.55] w-full max-w-4xl overflow-hidden border border-[#d8b979]/15 bg-[#0e1515] shadow-2xl [background-image:linear-gradient(rgba(220,190,130,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(220,190,130,.06)_1px,transparent_1px)] [background-size:8%_16%]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {nodes.slice(1).map((n, i) => <path key={n.name} d={`M68 55 Q${(68+n.x)/2} ${Math.min(18, n.y-22+i*2)} ${n.x} ${n.y}`} fill="none" stroke={i === 3 || i === 5 ? "#b64d35" : "#d8b979"} strokeWidth=".45" strokeDasharray="2 1.5" className="animate-pulse" />)}
      </svg>
      {nodes.map((node) => <div key={node.name} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{left:`${node.x}%`,top:`${node.y}%`}}><span className="mx-auto block h-2 w-2 rounded-full bg-[#e7ca8f] shadow-[0_0_16px_#d8b979]"/><span className="mt-2 block whitespace-nowrap font-serif text-xs text-[#f1dfbb] md:text-sm">{node.name}</span><span className="hidden text-[8px] uppercase tracking-[.14em] text-[#8fa6a0] md:block">{node.note}</span></div>)}
      <p className="absolute left-4 top-4 text-[9px] uppercase tracking-[.2em] text-[#8fa6a0]">A schematic trade constellation · not national borders</p>
    </div>
  </div>;
}

function Ledger() {
  return <div className="absolute inset-0 flex items-center justify-center p-8"><div className="relative w-full max-w-xl rotate-[-1deg] bg-[#d8c49d] p-8 text-[#2b2117] shadow-[0_30px_80px_#000] md:p-12"><p className="font-mono text-[10px] uppercase tracking-[.18em] opacity-55">A ledger is never neutral</p><div className="my-8 space-y-4 font-serif text-xl md:text-3xl"><p className="flex justify-between border-b border-[#392b1c]/25 pb-3"><span>Textiles</span><span>↑ 500%+</span></p><p className="flex justify-between border-b border-[#392b1c]/25 pb-3"><span>Markets</span><span>Expanded</span></p><p className="flex justify-between text-[#8e2f25]"><span>Human cost</span><span>Uncountable</span></p></div><p className="text-sm leading-6">Trade data can show volume. It cannot contain the lives violated by the Atlantic trafficking system.</p></div></div>;
}

function Machine() {
  return <div className="absolute inset-0 grid grid-cols-2"><div className="relative overflow-hidden border-r border-[#d8b979]/15"><Image src="/cloth/indian-chintz-met.jpg" alt="Irregular hand-painted floral detail" fill className="object-cover object-center"/><span className="absolute left-4 top-4 bg-black/70 px-3 py-2 text-[10px] uppercase tracking-[.18em]">Hand · variation</span></div><div className="relative overflow-hidden bg-[#1a1712] [background-image:url('/cloth/indian-chintz-met.jpg')] bg-[length:120px_auto] bg-repeat opacity-80"><div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(0,0,0,.35)_50%),linear-gradient(transparent_49%,rgba(0,0,0,.35)_50%)] bg-[length:120px_120px]"/><span className="absolute right-4 top-4 bg-black/70 px-3 py-2 text-[10px] uppercase tracking-[.18em]">Machine · repeat</span></div></div>;
}

function Sources({onClose}:{onClose:()=>void}) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Sources"><div className="h-full w-full max-w-lg overflow-y-auto border-l border-[#d8b979]/20 bg-[#12100c] p-8 md:p-12"><button onClick={onClose} className="float-right text-[#d8c9ad]" aria-label="Close sources"><X/></button><p className="text-xs uppercase tracking-[.22em] text-[#b64d35]">Curator’s file</p><h2 className="mt-3 font-serif text-4xl">Evidence & attribution</h2><p className="mt-5 text-sm leading-7 text-[#b9ae9c]">The central object is public domain. Interpretive text is paraphrased from museum scholarship; contested human histories are framed with care and without invented testimony.</p><div className="mt-8 space-y-3">{sourceLinks.map(([label,href])=><a key={href} href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between border-b border-[#d8b979]/15 py-4 text-sm text-[#ead8b6] hover:text-white"><span>{label}</span><ExternalLink size={14}/></a>)}</div><button onClick={onClose} className="mt-10 flex items-center gap-2 text-xs uppercase tracking-[.18em] text-[#d8b979]"><RotateCcw size={14}/> Return to object</button></div></div>;
}
