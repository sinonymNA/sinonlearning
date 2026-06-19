export type Personality = "saver" | "investor" | "realEstate" | "balanced";
export type EventCategory = "positive" | "neutral" | "negative";
export type PropertyType = "starterRental" | "duplex" | "airbnb";
export type Archetype =
  | "lifestyleChaser"
  | "steadyBuilder"
  | "millionaire"
  | "financialFreedom"
  | "realEstateMogul";

export interface PersonalityPreset {
  id: Personality;
  label: string;
  tagline: string;
  startingSalary: number;
  startingCash: number;
  investmentReturnRange: [number, number];
  lifestyleLeakRate: number;
  propertyAppreciationBonus: number;
}

export interface PropertyTypeDef {
  id: PropertyType;
  label: string;
  purchasePrice: number;
  downPayment: number;
  baseMonthlyCashFlow: number;
  appreciationRate: number;
  riskLabel: "Low" | "Medium" | "High";
  cashFlowVariance: number;
}

export interface OwnedProperty {
  type: PropertyType;
  purchasedTurn: number;
  purchasedAge: number;
  equity: number;
}

export interface Allocation {
  emergency: number;
  investing: number;
  realEstate: number;
  lifestyle: number;
}

export interface StackedEventChoice {
  id: string;
  label: string;
  resolve: (state: StackedState) => { state: StackedState; narrative: string };
}

export interface StackedEvent {
  id: string;
  category: EventCategory;
  title: string;
  prompt: string;
  minAge?: number;
  maxAge?: number;
  weight: number;
  once?: boolean;
  choices: StackedEventChoice[];
}

export interface TurnSnapshot {
  turn: number;
  age: number;
  salary: number;
  cash: number;
  investments: number;
  propertyEquity: number;
  monthlyCashFlow: number;
  netWorth: number;
}

export interface DecisionLogEntry {
  turn: number;
  age: number;
  label: string;
}

export interface StackedState {
  phase: "intro" | "playing" | "finished";
  personality: Personality;
  turn: number;
  age: number;
  salary: number;
  cash: number;
  investments: number;
  monthlyExpenses: number;
  properties: OwnedProperty[];
  usedEventIds: string[];
  pendingEvent: StackedEvent | null;
  pendingNarrative: string | null;
  allocation: Allocation;
  history: TurnSnapshot[];
  decisionLog: DecisionLogEntry[];
}

export const TOTAL_TURNS = 15;
export const STARTING_AGE = 22;
export const PROPERTY_UNLOCK_CASH = 30_000;
