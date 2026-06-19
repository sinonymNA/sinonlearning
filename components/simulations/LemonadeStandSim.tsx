"use client";

import { useState } from "react";
import { RotateCcw, Sun, CloudRain, Flame, PartyPopper, Swords, DollarSign } from "lucide-react";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import DemandCurveChart, { ProfitBarChart } from "./DemandCurveChart";

const TOTAL_ROUNDS = 7;
const COST_PER_CUP = 0.3;
const MIN_PRICE = 0.25;
const MAX_PRICE = 3;

interface WeatherEvent {
  id: string;
  label: string;
  description: string;
  intercept: number;
  slope: number;
}

const WEATHER_EVENTS: WeatherEvent[] = [
  {
    id: "sunny",
    label: "Sunny Day",
    description: "A normal sunny day. Demand is steady and moderately price-sensitive.",
    intercept: 42,
    slope: 9,
  },
  {
    id: "scorching",
    label: "Scorching Heat Wave",
    description:
      "It's brutally hot. People are thirsty and willing to pay more — demand is less sensitive to price today.",
    intercept: 68,
    slope: 5,
  },
  {
    id: "rainy",
    label: "Rainy Day",
    description: "Few people are outside. Demand is thin, and the ones who are out want a bargain.",
    intercept: 16,
    slope: 11,
  },
  {
    id: "festival",
    label: "Local Festival",
    description: "A festival down the street brings a flood of foot traffic past your stand.",
    intercept: 88,
    slope: 7,
  },
];

const COMPETITOR_EVENT = {
  id: "competitor",
  label: "New Competitor Arrives",
  description:
    "Another lemonade stand just opened nearby. Some of your customers — especially the price-sensitive ones — will go there instead, for the rest of the game.",
  interceptDelta: -18,
  slopeDelta: 3,
};

const eventIcons: Record<string, typeof Sun> = {
  sunny: Sun,
  scorching: Flame,
  rainy: CloudRain,
  festival: PartyPopper,
  competitor: Swords,
};

interface CurrentEvent {
  id: string;
  label: string;
  description: string;
  intercept: number;
  slope: number;
  competitorJustArrived: boolean;
}

interface RoundResult {
  round: number;
  eventLabel: string;
  price: number;
  cupsPrepared: number;
  quantitySold: number;
  demand: number;
  revenue: number;
  cost: number;
  profit: number;
  optimalPrice: number;
  optimalProfit: number;
  feedback: string;
}

interface LemonadeState {
  phase: "playing" | "review" | "finished";
  round: number;
  competitorActive: boolean;
  currentEvent: CurrentEvent;
  pendingPrice: number;
  pendingCups: number;
  results: RoundResult[];
}

function rollEvent(round: number, competitorActive: boolean): CurrentEvent {
  const weather = WEATHER_EVENTS[Math.floor(Math.random() * WEATHER_EVENTS.length)];
  const competitorJustArrived =
    !competitorActive && round >= 3 && Math.random() < 0.35;
  const nowActive = competitorActive || competitorJustArrived;

  const intercept = Math.max(5, weather.intercept + (nowActive ? COMPETITOR_EVENT.interceptDelta : 0));
  const slope = weather.slope + (nowActive ? COMPETITOR_EVENT.slopeDelta : 0);

  return {
    id: competitorJustArrived ? "competitor" : weather.id,
    label: competitorJustArrived ? COMPETITOR_EVENT.label : weather.label,
    description: competitorJustArrived ? COMPETITOR_EVENT.description : weather.description,
    intercept,
    slope,
    competitorJustArrived,
  };
}

function demandAt(price: number, intercept: number, slope: number) {
  return Math.max(0, intercept - slope * price);
}

function optimalPriceFor(intercept: number, slope: number) {
  const price = intercept / (2 * slope) + COST_PER_CUP / 2;
  const clamped = Math.min(MAX_PRICE, Math.max(MIN_PRICE, price));
  const quantity = demandAt(clamped, intercept, slope);
  const profit = (clamped - COST_PER_CUP) * quantity;
  return { price: clamped, quantity, profit };
}

function buildFeedback(event: CurrentEvent, demand: number, cupsPrepared: number): string {
  const traits: Record<string, string> = {
    sunny: "Demand today was fairly typical and moderately sensitive to price.",
    scorching:
      "Demand was inelastic today — the heat meant people kept buying even at a higher price.",
    rainy: "Demand was thin and elastic — fewer customers, and they were picky about price.",
    festival: "Demand was unusually high thanks to the festival crowd.",
    competitor:
      "Your demand curve just shifted left permanently — a competitor is now taking your price-sensitive customers.",
  };

  const trait = traits[event.id] ?? traits.sunny;

  let outcome: string;
  if (cupsPrepared > demand + 2) {
    outcome = `You over-prepared — about ${Math.round(cupsPrepared - demand)} cups went to waste.`;
  } else if (cupsPrepared < demand - 2) {
    outcome = `You sold out! You could have sold about ${Math.round(demand - cupsPrepared)} more cups if you'd prepared more.`;
  } else {
    outcome = "You prepared almost exactly the right number of cups — nice forecasting.";
  }

  return `${trait} ${outcome}`;
}

function freshState(): LemonadeState {
  return {
    phase: "playing",
    round: 1,
    competitorActive: false,
    currentEvent: rollEvent(1, false),
    pendingPrice: 1,
    pendingCups: 30,
    results: [],
  };
}

export default function LemonadeStandSim() {
  const [state, setState] = useLocalStorageState<LemonadeState>("sim:lemonade-stand", freshState());
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  const playRound = () => {
    const { currentEvent, round, pendingPrice, pendingCups } = state;
    const demand = demandAt(pendingPrice, currentEvent.intercept, currentEvent.slope);
    const quantitySold = Math.min(demand, pendingCups);
    const revenue = pendingPrice * quantitySold;
    const cost = COST_PER_CUP * pendingCups;
    const profit = revenue - cost;
    const optimal = optimalPriceFor(currentEvent.intercept, currentEvent.slope);

    const result: RoundResult = {
      round,
      eventLabel: currentEvent.label,
      price: pendingPrice,
      cupsPrepared: pendingCups,
      quantitySold,
      demand,
      revenue,
      cost,
      profit,
      optimalPrice: optimal.price,
      optimalProfit: optimal.profit,
      feedback: buildFeedback(currentEvent, demand, pendingCups),
    };

    setLastResult(result);
    setState({
      ...state,
      phase: "review",
      competitorActive: state.competitorActive || currentEvent.competitorJustArrived,
      results: [...state.results, result],
    });
  };

  const nextRound = () => {
    const nextRoundNumber = state.round + 1;
    if (nextRoundNumber > TOTAL_ROUNDS) {
      setState({ ...state, phase: "finished" });
      return;
    }
    setState({
      ...state,
      phase: "playing",
      round: nextRoundNumber,
      currentEvent: rollEvent(nextRoundNumber, state.competitorActive),
      pendingPrice: 1,
      pendingCups: 30,
    });
    setLastResult(null);
  };

  const playAgain = () => {
    setState(freshState());
    setLastResult(null);
  };

  const totalProfit = state.results.reduce((acc, r) => acc + r.profit, 0);
  const totalOptimalProfit = state.results.reduce((acc, r) => acc + r.optimalProfit, 0);

  if (state.phase === "finished") {
    const performance = totalOptimalProfit > 0 ? totalProfit / totalOptimalProfit : 0;
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <h2 className="font-display text-2xl font-medium text-white">Stand closed for the season</h2>
        <p className="mt-2 text-white/65">
          You ran your lemonade stand for {TOTAL_ROUNDS} days. Here&rsquo;s how you did.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Your total profit</p>
            <p className="mt-1 font-display text-3xl font-medium text-teal-300">
              ${totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">
              Optimal-pricing benchmark
            </p>
            <p className="mt-1 font-display text-3xl font-medium text-purple-300">
              ${totalOptimalProfit.toFixed(2)}
            </p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-white/60">
          {performance >= 0.95
            ? "Excellent! You priced nearly as well as a profit-maximizing seller with perfect information would have."
            : performance >= 0.7
              ? "Solid run. You captured most of the available profit — small pricing or supply misses cost you the rest."
              : "There's real room to improve. Watch how each event shifts the demand curve, and try to prepare close to the quantity people will actually buy."}
        </p>

        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-white/40">Profit by round</p>
          <div className="mt-2">
            <ProfitBarChart rounds={state.results.map((r) => ({ round: r.round, profit: r.profit }))} />
          </div>
        </div>

        <button
          onClick={playAgain}
          className="mt-8 flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
        >
          <RotateCcw size={15} />
          Play again
        </button>
      </div>
    );
  }

  const { currentEvent, round } = state;
  const EventIcon = eventIcons[currentEvent.id] ?? Sun;

  if (state.phase === "review" && lastResult) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300/70">
            Day {lastResult.round} of {TOTAL_ROUNDS} — Results
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Cups sold" value={`${Math.round(lastResult.quantitySold)}`} />
          <Stat label="Revenue" value={`$${lastResult.revenue.toFixed(2)}`} />
          <Stat label="Cost" value={`$${lastResult.cost.toFixed(2)}`} />
          <Stat
            label="Profit"
            value={`$${lastResult.profit.toFixed(2)}`}
            tone={lastResult.profit >= 0 ? "good" : "bad"}
          />
        </div>

        <p className="mt-5 text-sm leading-relaxed text-white/70">{lastResult.feedback}</p>
        <p className="mt-2 text-xs text-white/40">
          The profit-maximizing price today was ${lastResult.optimalPrice.toFixed(2)}, which would
          have earned ${lastResult.optimalProfit.toFixed(2)}.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <DemandCurveChart
            intercept={currentEvent.intercept}
            slope={currentEvent.slope}
            price={lastResult.price}
            quantitySold={lastResult.quantitySold}
            optimalPrice={lastResult.optimalPrice}
            optimalQuantity={demandAt(lastResult.optimalPrice, currentEvent.intercept, currentEvent.slope)}
          />
        </div>

        <button
          onClick={nextRound}
          className="mt-6 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
        >
          {round >= TOTAL_ROUNDS ? "See final results" : "Start next day"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300/70">
          Day {round} of {TOTAL_ROUNDS}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-teal-300/20 bg-teal-300/10 text-teal-200">
          <EventIcon size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">{currentEvent.label}</p>
          <p className="mt-1 text-sm leading-relaxed text-white/60">{currentEvent.description}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-white/80">
            Price per cup
            <span className="text-teal-300">${state.pendingPrice.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={0.05}
            value={state.pendingPrice}
            onChange={(e) => setState({ ...state, pendingPrice: Number(e.target.value) })}
            className="mt-3 w-full accent-teal-400"
          />
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-white/80">
            Cups to prepare
            <span className="text-teal-300">{state.pendingCups}</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={state.pendingCups}
            onChange={(e) => setState({ ...state, pendingCups: Number(e.target.value) })}
            className="mt-3 w-full accent-teal-400"
          />
        </div>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-white/40">
        <DollarSign size={12} />
        Each cup costs ${COST_PER_CUP.toFixed(2)} to make, whether you sell it or not.
      </p>

      <button
        onClick={playRound}
        className="mt-6 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-medium text-navy-950 transition-colors hover:bg-teal-200"
      >
        Open the stand
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
}) {
  const color = tone === "good" ? "text-teal-300" : tone === "bad" ? "text-rose-300" : "text-white";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">{label}</p>
      <p className={`mt-1 font-display text-lg font-medium ${color}`}>{value}</p>
    </div>
  );
}
