import type {
  PersonalityPreset,
  PropertyTypeDef,
  StackedEvent,
  StackedState,
} from "./stackedTypes";

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    id: "saver",
    label: "Conservative Saver",
    tagline: "Slow and steady. A big emergency fund and lower-risk investing.",
    startingSalary: 42_000,
    startingCash: 5_000,
    investmentReturnRange: [0.05, 0.07],
    lifestyleLeakRate: 0.1,
    propertyAppreciationBonus: 0,
  },
  {
    id: "investor",
    label: "Investor",
    tagline: "Heavy into the stock market, riding out the highs and lows.",
    startingSalary: 45_000,
    startingCash: 3_000,
    investmentReturnRange: [0.06, 0.11],
    lifestyleLeakRate: 0.15,
    propertyAppreciationBonus: 0,
  },
  {
    id: "realEstate",
    label: "Real Estate Builder",
    tagline: "Always scouting the next rental property.",
    startingSalary: 44_000,
    startingCash: 4_000,
    investmentReturnRange: [0.05, 0.08],
    lifestyleLeakRate: 0.12,
    propertyAppreciationBonus: 0.01,
  },
  {
    id: "balanced",
    label: "Balanced",
    tagline: "A little bit of everything — saving, investing, and real estate.",
    startingSalary: 43_000,
    startingCash: 4_000,
    investmentReturnRange: [0.06, 0.09],
    lifestyleLeakRate: 0.12,
    propertyAppreciationBonus: 0,
  },
];

export const PROPERTY_TYPES: PropertyTypeDef[] = [
  {
    id: "starterRental",
    label: "Starter Rental",
    purchasePrice: 150_000,
    downPayment: 30_000,
    baseMonthlyCashFlow: 200,
    appreciationRate: 0.03,
    riskLabel: "Low",
    cashFlowVariance: 0,
  },
  {
    id: "duplex",
    label: "Duplex",
    purchasePrice: 250_000,
    downPayment: 50_000,
    baseMonthlyCashFlow: 450,
    appreciationRate: 0.035,
    riskLabel: "Medium",
    cashFlowVariance: 0,
  },
  {
    id: "airbnb",
    label: "Airbnb",
    purchasePrice: 300_000,
    downPayment: 60_000,
    baseMonthlyCashFlow: 700,
    appreciationRate: 0.04,
    riskLabel: "High",
    cashFlowVariance: 150,
  },
];

function patch(state: StackedState, changes: Partial<StackedState>): StackedState {
  return { ...state, ...changes };
}

function spendCash(state: StackedState, amount: number): StackedState {
  return patch(state, { cash: Math.max(0, state.cash - amount) });
}

export const STACKED_EVENTS: StackedEvent[] = [
  // --- positive ---
  {
    id: "promotion",
    category: "positive",
    title: "Promotion",
    prompt: "You've been promoted! Your salary is going up 15%. What do you do with the raise?",
    weight: 14,
    choices: [
      {
        id: "upgrade-lifestyle",
        label: "Upgrade your lifestyle a bit",
        resolve: (state) => {
          const newSalary = Math.round(state.salary * 1.15);
          return {
            state: patch(state, { salary: newSalary, monthlyExpenses: state.monthlyExpenses + 60 }),
            narrative: `Your salary jumped to $${newSalary.toLocaleString()}, and you treated yourself to a nicer lifestyle.`,
          };
        },
      },
      {
        id: "invest-the-difference",
        label: "Invest the difference",
        resolve: (state) => {
          const newSalary = Math.round(state.salary * 1.15);
          return {
            state: patch(state, { salary: newSalary, investments: state.investments + 1000 }),
            narrative: `Your salary jumped to $${newSalary.toLocaleString()}, and you put the extra income straight to work.`,
          };
        },
      },
    ],
  },
  {
    id: "year-end-bonus",
    category: "positive",
    title: "Year-End Bonus",
    prompt: "You received a $3,000 year-end bonus.",
    weight: 10,
    choices: [
      {
        id: "bank-it",
        label: "Bank it",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 3000 }),
          narrative: "You banked the entire bonus.",
        }),
      },
      {
        id: "invest-it",
        label: "Invest it",
        resolve: (state) => ({
          state: patch(state, { investments: state.investments + 3000 }),
          narrative: "You invested the entire bonus.",
        }),
      },
    ],
  },
  {
    id: "side-hustle-success",
    category: "positive",
    title: "Side Hustle Success",
    prompt: "Your weekend side hustle had a great run and brought in an extra $4,000.",
    weight: 8,
    choices: [
      {
        id: "keep-cash",
        label: "Keep it as cash",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 4000 }),
          narrative: "The side hustle income padded your cash reserves.",
        }),
      },
      {
        id: "invest-it",
        label: "Invest it",
        resolve: (state) => ({
          state: patch(state, { investments: state.investments + 4000 }),
          narrative: "The side hustle income went straight into your portfolio.",
        }),
      },
    ],
  },
  {
    id: "inheritance",
    category: "positive",
    title: "Inheritance",
    prompt: "A relative left you an inheritance of $10,000.",
    weight: 4,
    once: true,
    minAge: 26,
    choices: [
      {
        id: "save-it",
        label: "Save it for a rainy day",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 10_000 }),
          narrative: "You added the inheritance to your cash reserves.",
        }),
      },
      {
        id: "invest-it",
        label: "Invest it",
        resolve: (state) => ({
          state: patch(state, { investments: state.investments + 10_000 }),
          narrative: "You invested the inheritance.",
        }),
      },
    ],
  },
  {
    id: "stock-market-boom",
    category: "positive",
    title: "Stock Market Boom",
    prompt: "The market is booming — your investments are up sharply this year.",
    weight: 8,
    choices: [
      {
        id: "ride-it",
        label: "Let it ride",
        resolve: (state) => {
          const gain = Math.round(state.investments * 0.2);
          return {
            state: patch(state, { investments: state.investments + gain }),
            narrative:
              gain > 0
                ? `Your portfolio grew an extra $${gain.toLocaleString()} from the boom.`
                : "You don't have any investments yet to benefit from the boom.",
          };
        },
      },
    ],
  },
  {
    id: "tax-refund",
    category: "positive",
    title: "Tax Refund",
    prompt: "You got a $1,500 tax refund.",
    weight: 10,
    choices: [
      {
        id: "save-refund",
        label: "Save it",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 1500 }),
          narrative: "You saved the refund.",
        }),
      },
      {
        id: "spend-refund",
        label: "Spend it on something fun",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 200 }),
          narrative: "You enjoyed most of the refund and banked a little.",
        }),
      },
    ],
  },
  {
    id: "raffle-win",
    category: "positive",
    title: "Raffle Win",
    prompt: "You won $500 in a workplace raffle.",
    weight: 7,
    choices: [
      {
        id: "keep-it",
        label: "Keep it",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 500 }),
          narrative: "Easy money, straight into your cash reserves.",
        }),
      },
    ],
  },
  {
    id: "employer-match-boost",
    category: "positive",
    title: "Employer Match Increase",
    prompt: "Your employer increased their retirement match, adding $1,000 to your investments.",
    weight: 6,
    choices: [
      {
        id: "accept",
        label: "Great news",
        resolve: (state) => ({
          state: patch(state, { investments: state.investments + 1000 }),
          narrative: "Free money from your employer's match landed in your portfolio.",
        }),
      },
    ],
  },
  {
    id: "referral-bonus",
    category: "positive",
    title: "Referral Bonus",
    prompt: "A friend you referred got hired, earning you a $750 bonus.",
    weight: 6,
    choices: [
      {
        id: "keep-bonus",
        label: "Keep it",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 750 }),
          narrative: "Easy cash for a quick referral.",
        }),
      },
    ],
  },
  {
    id: "declutter-sale",
    category: "positive",
    title: "Garage Sale",
    prompt: "You decluttered and sold $300 of stuff you no longer needed.",
    weight: 7,
    choices: [
      {
        id: "bank-sale",
        label: "Bank it",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 300 }),
          narrative: "A little extra cash from clearing out the closet.",
        }),
      },
    ],
  },
  {
    id: "lottery-win",
    category: "positive",
    title: "Small Lottery Win",
    prompt: "A $5 scratch ticket paid off — you won $2,000.",
    weight: 3,
    once: true,
    choices: [
      {
        id: "save-lottery",
        label: "Save it",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 2000 }),
          narrative: "Lucky day — straight into savings.",
        }),
      },
      {
        id: "invest-lottery",
        label: "Invest it",
        resolve: (state) => ({
          state: patch(state, { investments: state.investments + 2000 }),
          narrative: "Lucky day — straight into the market.",
        }),
      },
    ],
  },
  {
    id: "free-seminar",
    category: "positive",
    title: "Free Financial Seminar",
    prompt: "You attended a free financial literacy seminar and picked up a few useful habits.",
    weight: 5,
    choices: [
      {
        id: "apply-lessons",
        label: "Apply what you learned",
        resolve: (state) => ({
          state: patch(state, { investments: state.investments + 200 }),
          narrative: "A few small habit changes paid off quickly.",
        }),
      },
    ],
  },

  // --- neutral ---
  {
    id: "wedding",
    category: "neutral",
    title: "Wedding",
    prompt: "You're getting married! How do you want to celebrate?",
    weight: 8,
    once: true,
    minAge: 22,
    maxAge: 38,
    choices: [
      {
        id: "big-wedding",
        label: "Throw a big celebration",
        resolve: (state) => ({
          state: spendCash(state, 5000),
          narrative: "You threw a memorable (and pricey) wedding.",
        }),
      },
      {
        id: "small-wedding",
        label: "Keep it small",
        resolve: (state) => ({
          state: spendCash(state, 1500),
          narrative: "You kept the wedding small and saved the difference.",
        }),
      },
    ],
  },
  {
    id: "new-apartment",
    category: "neutral",
    title: "New Apartment",
    prompt: "You're moving to a nicer apartment.",
    weight: 8,
    choices: [
      {
        id: "upgrade-apartment",
        label: "Upgrade",
        resolve: (state) => ({
          state: patch(spendCash(state, 1000), { monthlyExpenses: state.monthlyExpenses + 75 }),
          narrative: "You moved into a nicer place, and your monthly expenses crept up a bit.",
        }),
      },
      {
        id: "stay-modest",
        label: "Find something modest",
        resolve: (state) => ({
          state: spendCash(state, 400),
          narrative: "You found a modest, affordable place.",
        }),
      },
    ],
  },
  {
    id: "vacation-opportunity",
    category: "neutral",
    title: "Vacation Opportunity",
    prompt: "Friends invite you on a $2,000 trip.",
    weight: 9,
    choices: [
      {
        id: "go",
        label: "Go",
        resolve: (state) => ({
          state: spendCash(state, 2000),
          narrative: "You made some great memories on the trip.",
        }),
      },
      {
        id: "skip",
        label: "Skip it and save",
        resolve: (state) => ({
          state: state,
          narrative: "You skipped the trip and kept your cash.",
        }),
      },
    ],
  },
  {
    id: "friend-loan-request",
    category: "neutral",
    title: "A Friend Needs Help",
    prompt: "A friend asks to borrow $1,000.",
    weight: 6,
    choices: [
      {
        id: "lend",
        label: "Lend it",
        resolve: (state) => ({
          state: spendCash(state, 1000),
          narrative: "You helped out a friend — no guarantee you'll see it again.",
        }),
      },
      {
        id: "decline",
        label: "Decline politely",
        resolve: (state) => ({
          state,
          narrative: "You decided to protect your own finances.",
        }),
      },
    ],
  },
  {
    id: "car-needs-replacing",
    category: "neutral",
    title: "Car Needs Replacing",
    prompt: "Your car is on its last legs. Time for a new one.",
    weight: 7,
    choices: [
      {
        id: "buy-used",
        label: "Buy a reliable used car",
        resolve: (state) => ({
          state: spendCash(state, 8000),
          narrative: "You bought a reliable used car with cash.",
        }),
      },
      {
        id: "buy-new",
        label: "Finance a new car",
        resolve: (state) => ({
          state: patch(spendCash(state, 4000), { monthlyExpenses: state.monthlyExpenses + 120 }),
          narrative: "You financed a new car, adding a monthly payment going forward.",
        }),
      },
    ],
  },
  {
    id: "new-hobby",
    category: "neutral",
    title: "New Hobby",
    prompt: "A new gym membership and hobby gear caught your eye.",
    weight: 6,
    choices: [
      {
        id: "join",
        label: "Join in",
        resolve: (state) => ({
          state: patch(state, { monthlyExpenses: state.monthlyExpenses + 40 }),
          narrative: "You picked up a new hobby — small recurring cost, big enjoyment.",
        }),
      },
      {
        id: "skip-hobby",
        label: "Skip it",
        resolve: (state) => ({
          state,
          narrative: "You decided to pass for now.",
        }),
      },
    ],
  },
  {
    id: "pet-adoption",
    category: "neutral",
    title: "Pet Adoption",
    prompt: "You're thinking about adopting a pet.",
    weight: 6,
    choices: [
      {
        id: "adopt",
        label: "Adopt",
        resolve: (state) => ({
          state: patch(spendCash(state, 300), { monthlyExpenses: state.monthlyExpenses + 50 }),
          narrative: "You adopted a pet — worth every penny.",
        }),
      },
      {
        id: "not-now",
        label: "Not right now",
        resolve: (state) => ({
          state,
          narrative: "You decided to wait on a pet.",
        }),
      },
    ],
  },
  {
    id: "continuing-education",
    category: "neutral",
    title: "Continuing Education",
    prompt: "A $1,200 certification course could boost your career.",
    weight: 6,
    choices: [
      {
        id: "take-course",
        label: "Take the course",
        resolve: (state) => ({
          state: patch(spendCash(state, 1200), { salary: Math.round(state.salary * 1.03) }),
          narrative: "The course paid off with a small salary bump.",
        }),
      },
      {
        id: "skip-course",
        label: "Skip it",
        resolve: (state) => ({
          state,
          narrative: "You decided not to take the course.",
        }),
      },
    ],
  },

  // --- negative ---
  {
    id: "car-repair",
    category: "negative",
    title: "Car Repair",
    prompt: "Your car broke down and needs a $1,200 repair.",
    weight: 10,
    choices: [
      {
        id: "pay-cash",
        label: "Pay with cash",
        resolve: (state) => ({
          state: spendCash(state, 1200),
          narrative: "You paid for the repair out of your cash reserves.",
        }),
      },
    ],
  },
  {
    id: "medical-bill",
    category: "negative",
    title: "Medical Bill",
    prompt: "An unexpected medical bill of $3,500 arrived.",
    weight: 8,
    choices: [
      {
        id: "pay-medical",
        label: "Pay it off",
        resolve: (state) => ({
          state: spendCash(state, 3500),
          narrative: "You paid the medical bill.",
        }),
      },
    ],
  },
  {
    id: "job-loss",
    category: "negative",
    title: "Job Loss",
    prompt: "You were laid off. How do you handle the gap?",
    weight: 5,
    minAge: 24,
    choices: [
      {
        id: "job-search",
        label: "Take time to find the right job",
        resolve: (state) => ({
          state: spendCash(state, 4000),
          narrative: "You dipped into savings while finding a better-fitting role.",
        }),
      },
      {
        id: "any-job",
        label: "Take the first job offered",
        resolve: (state) => ({
          state: patch(state, { salary: Math.round(state.salary * 0.85) }),
          narrative: "You took a lower-paying job just to keep income flowing.",
        }),
      },
    ],
  },
  {
    id: "stock-market-crash",
    category: "negative",
    title: "Stock Market Crash",
    prompt: "The market just dropped sharply. Your investments lost 25% of their value.",
    weight: 7,
    choices: [
      {
        id: "hold",
        label: "Hold steady",
        resolve: (state) => ({
          state: patch(state, { investments: Math.round(state.investments * 0.75) }),
          narrative: "You rode out the crash without selling.",
        }),
      },
      {
        id: "sell",
        label: "Sell to cut losses",
        resolve: (state) => {
          const remaining = Math.round(state.investments * 0.75);
          return {
            state: patch(state, { investments: 0, cash: state.cash + remaining }),
            narrative: "You sold at the bottom, locking in the loss.",
          };
        },
      },
    ],
  },
  {
    id: "recession",
    category: "negative",
    title: "Recession",
    prompt: "The economy has slowed. Raises are smaller than usual this cycle.",
    weight: 6,
    choices: [
      {
        id: "ride-recession",
        label: "Tighten your belt",
        resolve: (state) => ({
          state: patch(state, { salary: Math.round(state.salary * 0.97) }),
          narrative: "Your income growth stalled during the downturn.",
        }),
      },
    ],
  },
  {
    id: "property-repair",
    category: "negative",
    title: "Property Repair",
    prompt: "One of your rental properties needs a $2,000 repair.",
    weight: 6,
    choices: [
      {
        id: "fix-property",
        label: "Fix it",
        resolve: (state) => {
          if (state.properties.length === 0) {
            return { state, narrative: "You don't own any property yet, so nothing to repair." };
          }
          return {
            state: spendCash(state, 2000),
            narrative: "You paid to keep the property in good shape.",
          };
        },
      },
    ],
  },
  {
    id: "hvac-failure",
    category: "negative",
    title: "HVAC Failure",
    prompt: "Your HVAC system failed and needs a $5,000 repair.",
    weight: 5,
    choices: [
      {
        id: "pay-cash-hvac",
        label: "Pay cash",
        resolve: (state) => ({
          state: spendCash(state, 5000),
          narrative: "You paid for the repair outright.",
        }),
      },
      {
        id: "take-loan-hvac",
        label: "Take out a loan",
        resolve: (state) => ({
          state: patch(spendCash(state, 1000), { monthlyExpenses: state.monthlyExpenses + 90 }),
          narrative: "You financed the repair, adding a monthly loan payment.",
        }),
      },
      {
        id: "sell-investments-hvac",
        label: "Sell some investments",
        resolve: (state) => ({
          state: patch(state, { investments: Math.max(0, state.investments - 5000) }),
          narrative: "You sold off investments to cover the repair.",
        }),
      },
    ],
  },
  {
    id: "first-child",
    category: "negative",
    title: "First Child",
    prompt: "You're expecting your first child. Monthly expenses will rise.",
    weight: 6,
    once: true,
    minAge: 24,
    maxAge: 40,
    choices: [
      {
        id: "adjust-budget",
        label: "Adjust the budget",
        resolve: (state) => ({
          state: patch(state, { monthlyExpenses: state.monthlyExpenses + 300 }),
          narrative: "Congratulations! You adjusted your budget for the new addition.",
        }),
      },
      {
        id: "reduce-investing",
        label: "Pull from investments for nursery costs",
        resolve: (state) => ({
          state: patch(state, {
            investments: Math.max(0, state.investments - 2000),
            monthlyExpenses: state.monthlyExpenses + 150,
          }),
          narrative: "Congratulations! You covered some costs from your portfolio.",
        }),
      },
    ],
  },
  {
    id: "identity-theft",
    category: "negative",
    title: "Identity Theft",
    prompt: "Fraudulent charges drained $1,000 before you caught them.",
    weight: 4,
    choices: [
      {
        id: "absorb-fraud",
        label: "Absorb the loss",
        resolve: (state) => ({
          state: spendCash(state, 1000),
          narrative: "You recovered most of your accounts but ate the loss.",
        }),
      },
    ],
  },
  {
    id: "roof-leak",
    category: "negative",
    title: "Roof Leak",
    prompt: "A leak in the roof needs a $2,500 repair.",
    weight: 5,
    choices: [
      {
        id: "fix-roof",
        label: "Fix it",
        resolve: (state) => ({
          state: spendCash(state, 2500),
          narrative: "You patched up the roof before it got worse.",
        }),
      },
    ],
  },
  {
    id: "unexpected-tax-bill",
    category: "negative",
    title: "Unexpected Tax Bill",
    prompt: "You owe an unexpected $2,000 in taxes this year.",
    weight: 6,
    choices: [
      {
        id: "pay-tax-bill",
        label: "Pay it",
        resolve: (state) => ({
          state: spendCash(state, 2000),
          narrative: "You paid off the surprise tax bill.",
        }),
      },
    ],
  },
  {
    id: "natural-disaster",
    category: "negative",
    title: "Storm Damage",
    prompt: "A storm caused $1,800 of damage to your home.",
    weight: 5,
    choices: [
      {
        id: "repair-storm",
        label: "Repair the damage",
        resolve: (state) => ({
          state: spendCash(state, 1800),
          narrative: "You repaired the storm damage.",
        }),
      },
    ],
  },
  {
    id: "inflation-spike",
    category: "negative",
    title: "Inflation Spike",
    prompt: "Prices are rising faster than usual, pushing up your everyday costs.",
    weight: 6,
    choices: [
      {
        id: "absorb-inflation",
        label: "Absorb the higher costs",
        resolve: (state) => ({
          state: patch(state, { monthlyExpenses: state.monthlyExpenses + 100 }),
          narrative: "Your day-to-day expenses crept up across the board.",
        }),
      },
    ],
  },
  {
    id: "side-project-royalties",
    category: "positive",
    title: "Side Project Royalties",
    prompt: "An old side project earned you a surprise $600 in royalties.",
    weight: 5,
    choices: [
      {
        id: "keep-royalties",
        label: "Keep it",
        resolve: (state) => ({
          state: patch(state, { cash: state.cash + 600 }),
          narrative: "A pleasant surprise landed in your account.",
        }),
      },
    ],
  },
];
