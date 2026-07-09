"use client";

import { useMemo, useState } from "react";
import { Cloud, Cpu, Users, DollarSign, ArrowUpFromLine, ArrowDownToLine } from "lucide-react";
import FadeIn from "@/components/FadeIn";
import Button from "@/components/Button";

const W = 460;
const H = 280;
const PAD_L = 48;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 36;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const MAX_P = 10;
const MAX_Q = 100;

const BASE = { demandBase: 9, demandSlope: 0.09, supplyBase: 0.5, supplySlope: 0.07 };

type EventId = "weather" | "tech" | "buyers" | "costs" | "ceiling" | "floor";

const EVENTS: { id: EventId; label: string; blurb: string; icon: typeof Cloud }[] = [
  { id: "weather", label: "Bad weather", blurb: "Decreases supply", icon: Cloud },
  { id: "tech", label: "New technology", blurb: "Increases supply", icon: Cpu },
  { id: "buyers", label: "More buyers", blurb: "Increases demand", icon: Users },
  { id: "costs", label: "Higher costs", blurb: "Decreases supply", icon: DollarSign },
  { id: "ceiling", label: "Price ceiling", blurb: "Sets a max price", icon: ArrowDownToLine },
  { id: "floor", label: "Price floor", blurb: "Sets a min price", icon: ArrowUpFromLine },
];

function xScale(q: number) {
  return PAD_L + (Math.min(Math.max(q, 0), MAX_Q) / MAX_Q) * PLOT_W;
}
function yScale(p: number) {
  return PAD_T + (1 - Math.min(Math.max(p, 0), MAX_P) / MAX_P) * PLOT_H;
}

// Demand: P = base - slope*Q (downward). Exits the plot either through the
// bottom (P=0) or the right edge (Q=MAX_Q), whichever comes first.
function demandExit(base: number, slope: number) {
  const qAtZeroPrice = base / slope;
  if (qAtZeroPrice <= MAX_Q) return { q: qAtZeroPrice, p: 0 };
  return { q: MAX_Q, p: base - slope * MAX_Q };
}

// Supply: P = base + slope*Q (upward). Exits through the right edge
// (Q=MAX_Q) or the top (P=MAX_P), whichever comes first.
function supplyExit(base: number, slope: number) {
  const qAtMaxPrice = (MAX_P - base) / slope;
  if (qAtMaxPrice <= MAX_Q) return { q: qAtMaxPrice, p: MAX_P };
  return { q: MAX_Q, p: base + slope * MAX_Q };
}

export default function EconSupplyDemandLab() {
  const [active, setActive] = useState<EventId | null>(null);

  const { demandBase, supplyBase, equilibrium, priceControl, shortageOrSurplus } = useMemo(() => {
    let demandBase = BASE.demandBase;
    let supplyBase = BASE.supplyBase;

    if (active === "weather") supplyBase += 1.2;
    if (active === "tech") supplyBase = Math.max(0, supplyBase - 1.2);
    if (active === "buyers") demandBase += 1.0;
    if (active === "costs") supplyBase += 1.0;

    const q = (demandBase - supplyBase) / (BASE.supplySlope + BASE.demandSlope);
    const p = supplyBase + BASE.supplySlope * q;
    const equilibrium = { q, p };

    let priceControl: { price: number; label: string } | null = null;
    let shortageOrSurplus: { label: string; qDemanded: number; qSupplied: number } | null = null;

    if (active === "ceiling") {
      const price = p * 0.7;
      const qDemanded = (demandBase - price) / BASE.demandSlope;
      const qSupplied = (price - supplyBase) / BASE.supplySlope;
      priceControl = { price, label: "Price ceiling" };
      shortageOrSurplus = { label: "Shortage", qDemanded, qSupplied };
    }
    if (active === "floor") {
      const price = p * 1.3;
      const qDemanded = (demandBase - price) / BASE.demandSlope;
      const qSupplied = (price - supplyBase) / BASE.supplySlope;
      priceControl = { price, label: "Price floor" };
      shortageOrSurplus = { label: "Surplus", qDemanded, qSupplied };
    }

    return { demandBase, supplyBase, equilibrium, priceControl, shortageOrSurplus };
  }, [active]);

  const demandStart = { x: xScale(0), y: yScale(demandBase) };
  const demandExitPoint = demandExit(demandBase, BASE.demandSlope);
  const demandEnd = { x: xScale(demandExitPoint.q), y: yScale(demandExitPoint.p) };
  const supplyStart = { x: xScale(0), y: yScale(supplyBase) };
  const supplyExitPoint = supplyExit(supplyBase, BASE.supplySlope);
  const supplyEnd = { x: xScale(supplyExitPoint.q), y: yScale(supplyExitPoint.p) };

  const eq = { x: xScale(equilibrium.q), y: yScale(equilibrium.p) };

  return (
    <section className="bg-econ-950 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeIn>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-econ-300/70">
            Interactive lab preview
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
            See how markets work.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/60">
            Tap an event below and watch supply, demand, and the market price respond.
          </p>
        </FadeIn>

        <div className="mt-9 grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr]">
          <FadeIn delay={0.06}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

                <text x={PAD_L - 8} y={PAD_T + 8} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
                  ${MAX_P}
                </text>
                <text x={PAD_L - 8} y={H - PAD_B} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
                  $0
                </text>
                <text x={PAD_L} y={H - 10} fontSize="9" fill="rgba(255,255,255,0.4)">
                  0
                </text>
                <text x={W - PAD_R} y={H - 10} fontSize="9" fill="rgba(255,255,255,0.4)" textAnchor="end">
                  {MAX_Q}
                </text>
                <text x={(PAD_L + W - PAD_R) / 2} y={H - 4} fontSize="9" fill="rgba(255,255,255,0.35)" textAnchor="middle">
                  Quantity
                </text>

                <line x1={demandStart.x} y1={demandStart.y} x2={demandEnd.x} y2={demandEnd.y} stroke="#f2c85b" strokeWidth={2} />
                <line x1={supplyStart.x} y1={supplyStart.y} x2={supplyEnd.x} y2={supplyEnd.y} stroke="#62966a" strokeWidth={2} />

                {!priceControl && (
                  <>
                    <line x1={eq.x} y1={PAD_T} x2={eq.x} y2={H - PAD_B} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="4 3" />
                    <line x1={PAD_L} y1={eq.y} x2={W - PAD_R} y2={eq.y} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="4 3" />
                    <circle cx={eq.x} cy={eq.y} r={5} fill="#fdfbf6" />
                  </>
                )}

                {priceControl && shortageOrSurplus && (
                  <>
                    <line
                      x1={PAD_L}
                      y1={yScale(priceControl.price)}
                      x2={W - PAD_R}
                      y2={yScale(priceControl.price)}
                      stroke="#fb7185"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                    />
                    <line
                      x1={xScale(shortageOrSurplus.qSupplied)}
                      y1={yScale(priceControl.price)}
                      x2={xScale(shortageOrSurplus.qDemanded)}
                      y2={yScale(priceControl.price)}
                      stroke="#fb7185"
                      strokeWidth={5}
                      opacity={0.6}
                    />
                  </>
                )}
              </svg>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-white/60">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#62966a" }} />
                  Supply
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f2c85b" }} />
                  Demand
                </span>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                {!priceControl ? (
                  <p className="text-white/80">
                    Equilibrium — Price: <span className="font-semibold text-white">${equilibrium.p.toFixed(2)}</span>{" "}
                    &middot; Quantity: <span className="font-semibold text-white">{Math.round(equilibrium.q)}</span>
                  </p>
                ) : (
                  <p className="text-white/80">
                    {shortageOrSurplus?.label} at ${priceControl.price.toFixed(2)} — demanded{" "}
                    <span className="font-semibold text-white">{Math.round(shortageOrSurplus?.qDemanded ?? 0)}</span>,
                    supplied{" "}
                    <span className="font-semibold text-white">{Math.round(shortageOrSurplus?.qSupplied ?? 0)}</span>
                  </p>
                )}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <p className="text-sm font-semibold text-white">Tap an event</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {EVENTS.map((event) => {
                  const isActive = active === event.id;
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setActive(isActive ? null : event.id)}
                      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                        isActive
                          ? "border-econ-400/50 bg-econ-400/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <event.icon size={16} className={isActive ? "text-econ-300" : "text-white/50"} />
                      <span>
                        <span className="block text-sm font-medium text-white">{event.label}</span>
                        <span className="block text-xs text-white/50">{event.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5">
                <Button href="/simulations/lemonade-stand-economics" variant="ghost" size="sm" className="w-full">
                  Play the full lab
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
