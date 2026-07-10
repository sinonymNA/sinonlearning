export interface LifeBudgetModule {
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  timeEstimate: string;
  courseUnit: number;
  accent: string; // hex
  researchSites: string[]; // real sites students visit
}

export const LIFE_BUDGET_MODULES: LifeBudgetModule[] = [
  {
    slug: "career",
    number: 1,
    title: "Career",
    subtitle: "Choose your path. Know your worth.",
    description:
      "Research real job titles using Bureau of Labor Statistics data. Compare education paths, starting salaries, and the long-run earnings trajectory of your career choice. This number drives every other number in your portfolio.",
    timeEstimate: "~5 hours",
    courseUnit: 1,
    accent: "#3b82f6",
    researchSites: ["bls.gov/ooh", "onetonline.org", "collegescorecard.ed.gov"],
  },
  {
    slug: "paycheck",
    number: 2,
    title: "First Paycheck",
    subtitle: "Gross isn't what you get.",
    description:
      "Decode your pay stub: federal and state income tax, FICA, health insurance deductions, and 401k withholding. Build the real take-home number you actually live on — the gap between gross and net is usually $800–$1,400/month.",
    timeEstimate: "~5 hours",
    courseUnit: 3,
    accent: "#10b981",
    researchSites: ["taxfoundation.org", "irs.gov", "smartasset.com/taxes/paycheck-calculator"],
  },
  {
    slug: "housing",
    number: 3,
    title: "Housing",
    subtitle: "Rent or buy — both cost more than you think.",
    description:
      "Search real listings on Zillow and Apartments.com for your chosen city. Run rent vs. buy math. Understand security deposits, renters insurance, utility estimates, and what \"affordable\" actually means on your specific paycheck.",
    timeEstimate: "~5 hours",
    courseUnit: 1,
    accent: "#8b5cf6",
    researchSites: ["zillow.com", "apartments.com", "consumerfinance.gov/owning-a-home"],
  },
  {
    slug: "transportation",
    number: 4,
    title: "Transportation",
    subtitle: "Buy, lease, or take the bus.",
    description:
      "Use Driveline — the car-buying simulation — to find your vehicle, compare three dealer sites, and negotiate a real deal. Your signed contract flows directly into your portfolio. Or model the true monthly cost of public transit in your city.",
    timeEstimate: "~2 hours",
    courseUnit: 3,
    accent: "#f59e0b",
    researchSites: ["kbb.com", "consumerreports.org/cars", "transitapp.com"],
  },
  {
    slug: "budget",
    number: 5,
    title: "Monthly Budget",
    subtitle: "Where does it all go?",
    description:
      "Assemble your full monthly picture using real numbers from every previous module. Apply the 50/30/20 rule and stress-test your plan against a surprise expense. This is the first time you see your whole life on one page.",
    timeEstimate: "~4 hours",
    courseUnit: 3,
    accent: "#f97316",
    researchSites: ["mint.intuit.com", "consumerfinance.gov/consumer-tools/budget"],
  },
  {
    slug: "banking",
    number: 6,
    title: "Banking & Emergency Fund",
    subtitle: "Boring and absolutely essential.",
    description:
      "Compare real checking and high-yield savings account rates. Build a 3–6 month emergency fund plan. Understand FDIC insurance, APY vs. APR, overdraft fees, and why this layer comes before any investing.",
    timeEstimate: "~4 hours",
    courseUnit: 4,
    accent: "#06b6d4",
    researchSites: ["bankrate.com", "nerdwallet.com/banking", "fdic.gov/deposit/deposits"],
  },
  {
    slug: "credit",
    number: 7,
    title: "Credit & Debt",
    subtitle: "Your score follows you everywhere.",
    description:
      "Read a real credit report sample. Model how minimum payments drag out a $3,000 credit card balance over years. Understand student loan repayment plans, what builds vs. tanks your score, and how credit shapes your housing and car options.",
    timeEstimate: "~5 hours",
    courseUnit: 6,
    accent: "#ef4444",
    researchSites: ["annualcreditreport.com", "consumerfinance.gov/consumer-tools/credit-reports", "studentaid.gov/loan-simulator"],
  },
  {
    slug: "insurance",
    number: 8,
    title: "Insurance",
    subtitle: "The thing you pay for hoping you never use.",
    description:
      "Compare Bronze, Silver, and Gold health plan tiers. Calculate your true annual cost under each (premium + expected out-of-pocket). Price renters insurance and auto coverage. Learn what deductibles, copays, and coinsurance actually mean.",
    timeEstimate: "~5 hours",
    courseUnit: 7,
    accent: "#ec4899",
    researchSites: ["healthcare.gov", "naic.org", "progressive.com/auto/coverage-options"],
  },
  {
    slug: "investing",
    number: 9,
    title: "Investing",
    subtitle: "Compound interest is patient.",
    description:
      "Model a 401k with your employer's match. Compare Roth vs. Traditional IRA. Run a 30-year compound interest projection on your monthly surplus. See what one extra year of starting makes worth — and what waiting a decade costs.",
    timeEstimate: "~5 hours",
    courseUnit: 4,
    accent: "#a3e635",
    researchSites: ["investor.gov/financial-tools-calculators", "finra.org/investors/tools-calculators", "vanguard.com/investor-resources-education"],
  },
  {
    slug: "net-worth",
    number: 10,
    title: "Net Worth & Future Self",
    subtitle: "What will you have built?",
    description:
      "Calculate your net worth at Year 1, Year 5, and Year 10. Write a generational wealth reflection: what decisions made the most difference, and what would you do differently? Download your complete portfolio.",
    timeEstimate: "~3 hours",
    courseUnit: 6,
    accent: "#fbbf24",
    researchSites: ["consumerfinance.gov", "nytimes.com/your-money"],
  },
];

export function getModule(slug: string): LifeBudgetModule | undefined {
  return LIFE_BUDGET_MODULES.find((m) => m.slug === slug);
}
