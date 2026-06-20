export interface SimulationCatalogEntry {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  subject: string;
  status: "Available" | "Coming Soon";
}

export const simulations: SimulationCatalogEntry[] = [
  {
    slug: "lemonade-stand-economics",
    number: 1,
    title: "Run a Lemonade Stand: A Market Simulator",
    tagline: "Set your price, manage your supply, and survive seven days of shifting demand.",
    description:
      "Every round brings new weather and events that shift how much people want to buy and at what price. Decide how many cups to prepare and what to charge—then see the demand curve, your profit, and what you could have earned if you'd priced perfectly.",
    subject: "Economics",
    status: "Available",
  },
  {
    slug: "stacked-build-wealth",
    number: 2,
    title: "STACKED: Build Wealth. Buy Assets. Create Freedom.",
    tagline: "Live 30 years of financial decisions in fifteen minutes flat.",
    description:
      "Start at 22 with a starting salary and a blank slate. Every turn brings a life event and a choice: save it, invest it, spend it, or put it toward your first rental property. Watch compound interest, lifestyle inflation, and cash flow quietly shape who you become decades later.",
    subject: "Personal Finance",
    status: "Available",
  },
  {
    slug: "budgeting-basics",
    number: 3,
    title: "Build a Budget: A Personal Finance Simulator",
    tagline: "Balance rent, bills, and surprises on a real monthly paycheck.",
    description:
      "Coming soon: allocate a monthly income across needs, wants, and savings while unexpected expenses test your plan.",
    subject: "Personal Finance",
    status: "Coming Soon",
  },
  {
    slug: "stock-market-basics",
    number: 4,
    title: "Build a Portfolio: A Stock Market Simulator",
    tagline: "Invest using real, live stock prices and learn what actually drives returns.",
    description:
      "Start with $10,000 in cash and trade a watchlist of well-known companies, priced from the real market in near real-time. Track your net worth over time, learn the basics of risk and diversification, and save your progress with a passcode you choose—no account needed.",
    subject: "Investing",
    status: "Available",
  },
];

export function getSimulationBySlug(slug: string): SimulationCatalogEntry | undefined {
  return simulations.find((sim) => sim.slug === slug);
}
