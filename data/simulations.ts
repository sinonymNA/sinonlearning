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
    title: "Stock Market Academy",
    tagline: "9 units of Harvard-caliber investing — with a live trading simulator built in.",
    description:
      "Start with $100,000 in virtual cash and trade real stocks with live prices from Finnhub. Nine self-paced units guide you from 'what is a stock?' through valuation, portfolio theory, market cycles, and behavioral finance — each ending with a mission to apply what you just learned. Track your returns against the S&P 500 and compete on a class leaderboard.",
    subject: "Investing",
    status: "Available",
  },
  {
    slug: "car-deal",
    number: 5,
    title: "DRIVELINE: Your First Car",
    tagline: "Build the dream, compare real-world deals, and read the fine print before you sign.",
    description:
      "Start your first job, customize the car you want, then explore a changing local market of dealership offers. Compare total cost, financing, add-ons, and hidden fees to find a deal that protects your future.",
    subject: "Personal Finance",
    status: "Available",
  },
  {
    slug: "life-budget",
    number: 6,
    title: "Future Budget Simulation: Build Your Life",
    tagline: "Research real numbers. Make real decisions. Build a real personal finance portfolio.",
    description:
      "Ten modules. Real websites. Your actual career, city, paycheck, and choices — not made-up averages. Every number you research becomes part of a downloadable portfolio you can actually use after this class. Start with Module 1 and build from there.",
    subject: "Personal Finance",
    status: "Available",
  },
  {
    slug: "take-a-star",
    number: 7,
    title: "TAKE A STAR: Navigate the Indian Ocean",
    tagline: "Walk the deck, sight the noon sun, and use an astrolabe to hold your course toward Calicut.",
    description:
      "Step aboard a Portuguese vessel in 1500 and become its apprentice navigator. Take three readings on a moving deck, calculate latitude, and discover how knowledge moving between Greek, Islamic, and European worlds helped reshape maritime power in an Indian Ocean already connected by trade.",
    subject: "AP World History",
    status: "Available",
  },
  {
    slug: "cloth-that-conquered-world",
    number: 8,
    title: "The Cloth That Conquered the World",
    tagline: "One Indian textile. Three centuries of desire, industry, coercion, and empire.",
    description:
      "Enter a museum-style investigation of an eighteenth-century Indian chintz. Inspect the object, follow its trade constellation, trace the knowledge embedded in its dyes, and build an AP World History causation argument about how cotton reshaped the global economy from 1450 to 1900.",
    subject: "AP World History",
    status: "Available",
  },
  {
    slug: "dice-merge",
    number: 9,
    title: "DICE//MERGE: Build the Perfect Chain",
    tagline: "Place, combine, and cascade your way from a single spark to a board-clearing Prism.",
    description:
      "A fast strategy puzzle built for short, replayable runs. Place one- and two-die pieces, connect matching groups, trigger scoring cascades, and use tactical tools to keep the board alive.",
    subject: "Logic & Strategy",
    status: "Available",
  },
];

export function getSimulationBySlug(slug: string): SimulationCatalogEntry | undefined {
  return simulations.find((sim) => sim.slug === slug);
}
