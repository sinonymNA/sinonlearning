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
    slug: "budgeting-basics",
    number: 2,
    title: "Build a Budget: A Personal Finance Simulator",
    tagline: "Balance rent, bills, and surprises on a real monthly paycheck.",
    description:
      "Coming soon: allocate a monthly income across needs, wants, and savings while unexpected expenses test your plan.",
    subject: "Personal Finance",
    status: "Coming Soon",
  },
  {
    slug: "stock-market-basics",
    number: 3,
    title: "Build a Portfolio: A Stock Market Simulator",
    tagline: "Invest across a simulated market and learn what actually drives returns.",
    description:
      "Coming soon: build a portfolio across simulated companies and market cycles to learn the basics of risk, diversification, and time horizon.",
    subject: "Investing",
    status: "Coming Soon",
  },
];

export function getSimulationBySlug(slug: string): SimulationCatalogEntry | undefined {
  return simulations.find((sim) => sim.slug === slug);
}
