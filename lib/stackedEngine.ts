import { PERSONALITY_PRESETS, PROPERTY_TYPES, STACKED_EVENTS } from "./stackedEvents";
import {
  Allocation,
  Archetype,
  DecisionLogEntry,
  OwnedProperty,
  Personality,
  PropertyType,
  STARTING_AGE,
  StackedEvent,
  StackedState,
  TOTAL_TURNS,
  TurnSnapshot,
} from "./stackedTypes";

function presetFor(personality: Personality) {
  return PERSONALITY_PRESETS.find((p) => p.id === personality) ?? PERSONALITY_PRESETS[3];
}

function propertyDefFor(type: PropertyType) {
  return PROPERTY_TYPES.find((p) => p.id === type)!;
}

function seededVariance(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export function freshState(personality: Personality): StackedState {
  const preset = presetFor(personality);
  return {
    phase: "intro",
    personality,
    turn: 0,
    age: STARTING_AGE,
    salary: preset.startingSalary,
    cash: preset.startingCash,
    investments: 0,
    monthlyExpenses: preset.startingSalary / 12 / 2,
    properties: [],
    usedEventIds: [],
    pendingEvent: null,
    pendingNarrative: null,
    allocation: { emergency: 30, investing: 40, realEstate: 20, lifestyle: 10 },
    history: [],
    decisionLog: [],
  };
}

export function propertyEquityTotal(state: StackedState): number {
  return state.properties.reduce((sum, p) => sum + p.equity, 0);
}

export function netWorth(state: StackedState): number {
  return state.cash + state.investments + propertyEquityTotal(state);
}

export function monthlyCashFlow(state: StackedState): number {
  return state.properties.reduce((sum, p, i) => {
    const def = propertyDefFor(p.type);
    const variance = def.cashFlowVariance * seededVariance(state.turn * 131 + i * 17 + 7);
    return sum + def.baseMonthlyCashFlow + variance;
  }, 0);
}

export function discretionaryIncome(state: StackedState): number {
  return Math.max(0, state.salary * 2 - state.monthlyExpenses * 24);
}

export function pickRandomEvent(state: StackedState): StackedEvent | null {
  const eligible = STACKED_EVENTS.filter((e) => {
    if (e.minAge !== undefined && state.age < e.minAge) return false;
    if (e.maxAge !== undefined && state.age > e.maxAge) return false;
    if (e.once && state.usedEventIds.includes(e.id)) return false;
    return true;
  });
  const pool = eligible.length > 0 ? eligible : STACKED_EVENTS.filter((e) => !e.once);
  if (pool.length === 0) return null;

  const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const event of pool) {
    roll -= event.weight;
    if (roll <= 0) return event;
  }
  return pool[pool.length - 1];
}

export function applyEventChoice(state: StackedState, choiceId: string): StackedState {
  const event = state.pendingEvent;
  if (!event) return state;
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return state;

  const { state: resolved, narrative } = choice.resolve(state);
  const logEntry: DecisionLogEntry = {
    turn: resolved.turn,
    age: resolved.age,
    label: `${event.title}: ${choice.label}`,
  };

  return {
    ...resolved,
    pendingEvent: null,
    pendingNarrative: narrative,
    usedEventIds: [...resolved.usedEventIds, event.id],
    decisionLog: [...resolved.decisionLog, logEntry],
  };
}

export function applyAllocationAndAdvance(state: StackedState, allocation: Allocation): StackedState {
  const preset = presetFor(state.personality);
  const discretionary = discretionaryIncome(state);

  const emergencyAmt = (discretionary * allocation.emergency) / 100;
  const investingAmt = (discretionary * allocation.investing) / 100;
  const realEstateAmt = (discretionary * allocation.realEstate) / 100;
  const lifestyleAmt = (discretionary * allocation.lifestyle) / 100;

  const monthlyExpenseLeak = (lifestyleAmt * preset.lifestyleLeakRate) / 24;

  const [minReturn, maxReturn] = preset.investmentReturnRange;
  const annualReturn = minReturn + Math.random() * (maxReturn - minReturn);
  const growthFactor = (1 + annualReturn) ** 2;
  const newInvestments = state.investments * growthFactor + investingAmt;

  const cashFlowAccrual = monthlyCashFlow(state) * 24;
  const newCash = state.cash + emergencyAmt + realEstateAmt + cashFlowAccrual;

  const newProperties: OwnedProperty[] = state.properties.map((p) => {
    const def = propertyDefFor(p.type);
    const rate = def.appreciationRate + preset.propertyAppreciationBonus;
    const appreciationDollars = def.purchasePrice * ((1 + rate) ** 2 - 1);
    return { ...p, equity: p.equity + appreciationDollars };
  });

  const newSalary = state.salary * 1.025 ** 2;
  const newTurn = state.turn + 1;
  const newAge = state.age + 2;
  const newMonthlyExpenses = state.monthlyExpenses + monthlyExpenseLeak;

  const next: StackedState = {
    ...state,
    turn: newTurn,
    age: newAge,
    salary: newSalary,
    cash: newCash,
    investments: newInvestments,
    monthlyExpenses: newMonthlyExpenses,
    properties: newProperties,
    allocation,
    phase: newTurn >= TOTAL_TURNS ? "finished" : "playing",
  };

  const snapshot: TurnSnapshot = {
    turn: newTurn,
    age: newAge,
    salary: newSalary,
    cash: newCash,
    investments: newInvestments,
    propertyEquity: propertyEquityTotal(next),
    monthlyCashFlow: monthlyCashFlow(next),
    netWorth: netWorth(next),
  };

  return { ...next, history: [...state.history, snapshot] };
}

export function purchaseProperty(state: StackedState, type: PropertyType): StackedState {
  const def = propertyDefFor(type);
  if (state.cash < def.downPayment) return state;

  const property: OwnedProperty = {
    type,
    purchasedTurn: state.turn,
    purchasedAge: state.age,
    equity: def.downPayment,
  };

  return {
    ...state,
    cash: state.cash - def.downPayment,
    properties: [...state.properties, property],
    decisionLog: [
      ...state.decisionLog,
      { turn: state.turn, age: state.age, label: `Bought a ${def.label}` },
    ],
  };
}

export function classifyArchetype(state: StackedState): Archetype {
  if (state.properties.length >= 5) return "realEstateMogul";
  if (monthlyCashFlow(state) * 12 > state.monthlyExpenses * 12) return "financialFreedom";
  if (netWorth(state) > 1_000_000) return "millionaire";
  if (netWorth(state) > 400_000) return "steadyBuilder";
  return "lifestyleChaser";
}

export function biggestDecision(state: StackedState): string {
  if (state.properties.length > 0) {
    const best = state.properties.reduce((max, p) => (p.equity > max.equity ? p : max));
    const def = propertyDefFor(best.type);
    return `Buying a ${def.label.toLowerCase()} at age ${best.purchasedAge} grew into $${Math.round(
      best.equity,
    ).toLocaleString()} of your final wealth.`;
  }
  if (state.investments > state.cash) {
    return `Consistently investing instead of holding cash drove most of your $${Math.round(
      state.investments,
    ).toLocaleString()} portfolio.`;
  }
  if (state.cash > 0) {
    return `Steady saving built up $${Math.round(state.cash).toLocaleString()} in cash reserves over the years.`;
  }
  return "Your financial story is still being written — every decision counted.";
}

interface HeadlessStrategy {
  personality: Personality;
  allocation: Allocation;
  buysProperty: boolean;
}

export function runHeadlessSimulation(strategy: HeadlessStrategy): StackedState {
  let state = freshState(strategy.personality);
  state = { ...state, phase: "playing" };

  while (state.phase === "playing") {
    const event = pickRandomEvent(state);
    if (event) {
      state = { ...state, pendingEvent: event };
      state = applyEventChoice(state, event.choices[0].id);
    }

    if (strategy.buysProperty && state.properties.length === 0 && state.cash >= 30_000) {
      state = purchaseProperty(state, "starterRental");
    }

    state = applyAllocationAndAdvance(state, strategy.allocation);
  }

  return state;
}
