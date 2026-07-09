import type { LucideIcon } from "lucide-react";
import { Scale, TrendingUpDown, Briefcase, LineChart, Globe2, CreditCard, ShieldCheck } from "lucide-react";

export type Phase = "Decide" | "Earn" | "Grow" | "Protect";

export interface EconomicsUnit {
  number: number;
  title: string;
  phase: Phase;
  dateRange: string;
  days: number;
  akaRange: string;
  description: string;
  icon: LucideIcon;
}

// Real 7-unit structure, transcribed from the Gwinnett County Public Schools
// "Everyday Economics" course master document (Semester 1, 2026-27).
export const economicsUnits: EconomicsUnit[] = [
  {
    number: 1,
    title: "Choices, Systems & Your Future",
    phase: "Decide",
    dateRange: "Aug 5 – 20",
    days: 12,
    akaRange: "SSEC.17a–21e",
    description:
      "The economic lens on every decision you'll ever make: scarcity, opportunity cost, factors of production, economic systems, standard of living, and the post-high-school decision matrix.",
    icon: Scale,
  },
  {
    number: 2,
    title: "Supply & Demand",
    phase: "Decide",
    dateRange: "Aug 21 – Sep 8",
    days: 12,
    akaRange: "SSEC.31a, 32a–34c",
    description:
      "How prices emerge from the push and pull of supply and demand — shifters, equilibrium, elasticity, price controls, market structures, and the business cycle.",
    icon: TrendingUpDown,
  },
  {
    number: 3,
    title: "Work, Wages, Taxes & the Fed",
    phase: "Earn",
    dateRange: "Sep 9 – 23",
    days: 11,
    akaRange: "SSEC.22a–f, 25a–b, 28a–c, 35a–36b",
    description:
      "What determines your paycheck — labor markets, human capital, gross vs. net, the 1040, the Federal Reserve, monetary and fiscal policy, and building your own budget.",
    icon: Briefcase,
  },
  {
    number: 4,
    title: "Saving, Investing & Risk",
    phase: "Grow",
    dateRange: "Sep 24 – Oct 8",
    days: 11,
    akaRange: "SSEC.23a–e, 24a–e",
    description:
      "Why saving beats waiting, how compound interest multiplies money, savings vehicles and bonds, speculation and bubbles, retirement accounts, crypto, and risk in real markets — capped by the Stock Market Challenge launch.",
    icon: LineChart,
  },
  {
    number: 5,
    title: "Global Trade & Exchange Rates",
    phase: "Grow",
    dateRange: "Oct 9 – 27",
    days: 8,
    akaRange: "SSEC.37a–c, 38a–b",
    description:
      "Why nations trade, tariffs and trade barriers, Georgia's role in global trade, exchange rates, and how international forces reach directly into your own investment portfolio.",
    icon: Globe2,
  },
  {
    number: 6,
    title: "Credit, Debt & Big Purchases",
    phase: "Protect",
    dateRange: "Oct 28 – Nov 17",
    days: 15,
    akaRange: "SSEC.21a–e, 24a–e, 26a–e",
    description:
      "Credit reports and scores, redlining and access, revolving vs. installment debt, APR and amortization, rent vs. buy, student loans, car buying, bankruptcy, and generational wealth — capped by the Future Budget presentations.",
    icon: CreditCard,
  },
  {
    number: 7,
    title: "Insurance & Consumer Protection",
    phase: "Protect",
    dateRange: "Nov 18 – Dec 9",
    days: 11,
    akaRange: "SSEC.27a–d, 29a–c, 30a–d",
    description:
      "Why insurance exists and how it's priced, identity theft and investment scams, consumer protection agencies, and a closing course reflection — ending in the semester final exam.",
    icon: ShieldCheck,
  },
];

export interface PhaseInfo {
  name: Phase;
  unitRange: string;
  question: string;
  icon: LucideIcon;
}

export const phases: PhaseInfo[] = [
  {
    name: "Decide",
    unitRange: "Units 1–2",
    question:
      "How do people, businesses, and governments make choices under scarcity? What systems govern those choices — and who do they serve?",
    icon: Scale,
  },
  {
    name: "Earn",
    unitRange: "Unit 3",
    question:
      "What determines income? How does the government take its cut? What do the Fed and fiscal policy mean for your actual paycheck?",
    icon: Briefcase,
  },
  {
    name: "Grow",
    unitRange: "Units 4–5",
    question:
      "How does money multiply — and who gets left out? How do global trade forces shape the value of everything you own?",
    icon: LineChart,
  },
  {
    name: "Protect",
    unitRange: "Units 6–7",
    question:
      "What threatens wealth? How do you build a financial life that survives loss, fraud, debt, and the forces that work against ordinary people?",
    icon: ShieldCheck,
  },
];

export interface LessonDNAStep {
  order: number;
  name: string;
  time: string;
  description: string;
}

export const lessonDNA: LessonDNAStep[] = [
  {
    order: 1,
    name: "Table Document",
    time: "Pre-class",
    description:
      "A physical artifact in every desk folder before students arrive — a graph, map, receipt, data table, photo, or primary source. Students pick it up and start interpreting.",
  },
  {
    order: 2,
    name: "Hook Question",
    time: "0–5 min",
    description:
      "One genuine provocation on the board. Students write before instruction starts. No right answer — real disagreement. The hook connects directly to the document on their desk.",
  },
  {
    order: 3,
    name: "Guided Notes",
    time: "5–25 min",
    description:
      "20–25 minutes of active instruction. Format adapts to content each day — diagrams, timelines, case matrices, decision trees. Story first. Definition second. Never fully blank, never fully filled in.",
  },
  {
    order: 4,
    name: "Inquiry Activity",
    time: "25–47 min",
    description:
      "Eight adaptive archetypes — Evidence Dossier, Allocation Simulation, Case File, Data Investigation, Debate Prep, Personal Audit, Timeline Reconstruction, Pressure Test — taught through rotating strategies: Lines of Contention, Fishbowl, Gallery Walk, Four Corners, Jigsaw, and more.",
  },
  {
    order: 5,
    name: "Debrief",
    time: "47–50 min",
    description:
      "One question that returns to the hook with new vocabulary. Never fully resolved — always leaves something hanging that creates anticipation for tomorrow.",
  },
];

export type CalendarDayType =
  | "lesson"
  | "inquiry"
  | "flex"
  | "exam"
  | "presentation"
  | "buffer"
  | "break";

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  code?: string;
  title: string;
  type: CalendarDayType;
  unit?: number;
}

// Transcribed day-by-day from the course master document's semester calendar
// (Aug 5 – Dec 18, 2026). Weekday alignment cross-checked against native Date
// computation (Aug 5 2026 = Wednesday, Oct 12 = Monday, Nov 23 = Monday,
// Sep 7 = Monday — all match the source document's own day labels).
export const calendarDays: CalendarDay[] = [
  // Unit 1 — Aug 5–20
  { date: "2026-08-05", code: "U1·D01", title: "What is Economics?", type: "lesson", unit: 1 },
  { date: "2026-08-06", code: "U1·D02", title: "Scarcity", type: "lesson", unit: 1 },
  { date: "2026-08-07", code: "U1·D03", title: "Opportunity Cost & Trade-Offs", type: "lesson", unit: 1 },
  { date: "2026-08-10", code: "U1·D04", title: "Titanic Inquiry Day", type: "inquiry", unit: 1 },
  { date: "2026-08-11", code: "U1·D05", title: "Factors of Production", type: "lesson", unit: 1 },
  { date: "2026-08-12", code: "U1·D06", title: "Marginal Thinking & Incentives", type: "lesson", unit: 1 },
  { date: "2026-08-13", code: "U1·D07", title: "Economic Systems: Command", type: "lesson", unit: 1 },
  { date: "2026-08-14", code: "U1·D08", title: "Economic Systems: Market & Mixed", type: "lesson", unit: 1 },
  { date: "2026-08-17", code: "U1·D09", title: "Standard of Living, Human Capital & PPC", type: "lesson", unit: 1 },
  { date: "2026-08-18", code: "U1·D10", title: "Post-HS Decision Matrix", type: "lesson", unit: 1 },
  { date: "2026-08-19", code: "U1·FLEX", title: "Flex / Review", type: "flex", unit: 1 },
  { date: "2026-08-20", code: "U1·EXAM", title: "Unit 1 Exam", type: "exam", unit: 1 },

  // Unit 2 — Aug 21–Sep 8
  { date: "2026-08-21", code: "U2·D01", title: "Supply & Demand: Big Picture", type: "lesson", unit: 2 },
  { date: "2026-08-24", code: "U2·D02", title: "Laws of Supply & Demand", type: "lesson", unit: 2 },
  { date: "2026-08-25", code: "U2·D03", title: "Supply & Demand Shifters", type: "lesson", unit: 2 },
  { date: "2026-08-26", code: "U2·D04", title: "Equilibrium", type: "lesson", unit: 2 },
  { date: "2026-08-27", code: "U2·D05", title: "Price Controls", type: "lesson", unit: 2 },
  { date: "2026-08-28", code: "U2·D06", title: "Elasticity", type: "lesson", unit: 2 },
  { date: "2026-08-31", code: "U2·D07", title: "Business Organization", type: "lesson", unit: 2 },
  { date: "2026-09-01", code: "U2·D08", title: "Monopoly & Oligopoly", type: "lesson", unit: 2 },
  { date: "2026-09-02", code: "U2·D09", title: "Market Competition", type: "lesson", unit: 2 },
  { date: "2026-09-03", code: "U2·D10", title: "GDP, Circular Flow & Business Cycle", type: "lesson", unit: 2 },
  { date: "2026-09-04", code: "U2·FLEX", title: "Flex / Review", type: "flex", unit: 2 },
  { date: "2026-09-07", title: "Labor Day", type: "break" },
  { date: "2026-09-08", code: "U2·EXAM", title: "Unit 2 Exam", type: "exam", unit: 2 },

  // Unit 3 — Sep 9–23
  { date: "2026-09-09", code: "U3·D01", title: "Labor Markets & Fight for $15", type: "lesson", unit: 3 },
  { date: "2026-09-10", code: "U3·D02", title: "Career & Human Capital ROI", type: "lesson", unit: 3 },
  { date: "2026-09-11", code: "U3·D03", title: "Your Paycheck: Gross vs. Net", type: "lesson", unit: 3 },
  { date: "2026-09-14", code: "U3·D04", title: "Taxes: How They Work & Who Pays", type: "lesson", unit: 3 },
  { date: "2026-09-15", code: "U3·D05", title: "The 1040 Workshop", type: "lesson", unit: 3 },
  { date: "2026-09-16", code: "U3·D06", title: "Federal Reserve: Origin & Tools", type: "lesson", unit: 3 },
  { date: "2026-09-17", code: "U3·D07", title: "Monetary Policy", type: "lesson", unit: 3 },
  { date: "2026-09-18", code: "U3·D08", title: "Fiscal Policy & National Debt", type: "lesson", unit: 3 },
  { date: "2026-09-21", code: "U3·D09", title: "Building YOUR Budget", type: "lesson", unit: 3 },
  { date: "2026-09-22", code: "U3·FLEX", title: "Flex / Review", type: "flex", unit: 3 },
  { date: "2026-09-23", code: "U3·EXAM", title: "Unit 3 Exam", type: "exam", unit: 3 },

  // Unit 4 — Sep 24–Oct 8
  { date: "2026-09-24", code: "U4·D01", title: "Why Save? Cost of Waiting", type: "lesson", unit: 4 },
  { date: "2026-09-25", code: "U4·D02", title: "Compound Interest: The Math", type: "lesson", unit: 4 },
  { date: "2026-09-28", code: "U4·D03", title: "Financial Institutions & Payments", type: "lesson", unit: 4 },
  { date: "2026-09-29", code: "U4·D04", title: "Savings Vehicles, Bonds & ETFs", type: "lesson", unit: 4 },
  { date: "2026-09-30", code: "U4·D05", title: "Speculation, Bubbles & the Market", type: "lesson", unit: 4 },
  { date: "2026-10-01", code: "U4·D06", title: "Retirement Accounts", type: "lesson", unit: 4 },
  { date: "2026-10-02", code: "U4·D07", title: "Crypto, FTX & Speculation", type: "lesson", unit: 4 },
  { date: "2026-10-05", code: "U4·D08", title: "Risk, Diversification & Markets", type: "lesson", unit: 4 },
  { date: "2026-10-06", code: "U4·D09", title: "Stock Market Challenge Launch", type: "lesson", unit: 4 },
  { date: "2026-10-07", code: "U4·FLEX", title: "Flex / Review", type: "flex", unit: 4 },
  { date: "2026-10-08", code: "U4·EXAM", title: "Unit 4 Exam + SMC Final", type: "exam", unit: 4 },

  // Unit 5 — Oct 9–27
  { date: "2026-10-09", code: "U5·D01", title: "Why Nations Trade", type: "lesson", unit: 5 },
  { date: "2026-10-12", title: "Fall Break", type: "break" },
  { date: "2026-10-13", title: "Fall Break", type: "break" },
  { date: "2026-10-14", title: "Fall Break", type: "break" },
  { date: "2026-10-15", title: "Fall Break", type: "break" },
  { date: "2026-10-16", title: "Fall Break", type: "break" },
  { date: "2026-10-19", code: "U5·D02", title: "Trade Barriers & Tariffs", type: "lesson", unit: 5 },
  { date: "2026-10-20", code: "U5·D03", title: "Georgia & Global Trade", type: "lesson", unit: 5 },
  { date: "2026-10-21", code: "U5·D04", title: "Exchange Rates", type: "lesson", unit: 5 },
  { date: "2026-10-22", code: "U5·D05", title: "Asian Financial Crisis", type: "lesson", unit: 5 },
  { date: "2026-10-23", code: "U5·D06", title: "Trade Policy & Your Portfolio", type: "lesson", unit: 5 },
  { date: "2026-10-26", code: "U5·FLEX", title: "Flex / Review", type: "flex", unit: 5 },
  { date: "2026-10-27", code: "U5·EXAM", title: "Unit 5 Exam", type: "exam", unit: 5 },

  // Unit 6 — Oct 28–Nov 17
  { date: "2026-10-28", code: "U6·D01", title: "Credit: What It Is & Your Score", type: "lesson", unit: 6 },
  { date: "2026-10-29", code: "U6·D02", title: "Redlining & Credit Access", type: "lesson", unit: 6 },
  { date: "2026-10-30", code: "U6·D03", title: "Reading a Credit Report", type: "lesson", unit: 6 },
  { date: "2026-11-02", code: "U6·D04", title: "Revolving vs. Installment & Credit Cards", type: "lesson", unit: 6 },
  { date: "2026-11-03", code: "U6·D05", title: "APR & Amortization", type: "lesson", unit: 6 },
  { date: "2026-11-04", code: "U6·D06", title: "Rent vs. Buy & 2008 Crisis", type: "lesson", unit: 6 },
  { date: "2026-11-05", code: "U6·D07", title: "Student Loans", type: "lesson", unit: 6 },
  { date: "2026-11-06", code: "U6·D08", title: "Car Buying & Bankruptcy", type: "lesson", unit: 6 },
  { date: "2026-11-09", code: "U6·D09", title: "Generational Wealth", type: "lesson", unit: 6 },
  { date: "2026-11-10", code: "U6·D10", title: "Future Budget Work Day", type: "lesson", unit: 6 },
  { date: "2026-11-11", code: "U6·PRES", title: "Future Budget Presentations", type: "presentation", unit: 6 },
  { date: "2026-11-12", code: "U6·PRES", title: "Future Budget Presentations", type: "presentation", unit: 6 },
  { date: "2026-11-13", code: "U6·PRES", title: "Future Budget Presentations", type: "presentation", unit: 6 },
  { date: "2026-11-16", code: "U6·FLEX", title: "Flex / Review", type: "flex", unit: 6 },
  { date: "2026-11-17", code: "U6·EXAM", title: "Unit 6 Exam", type: "exam", unit: 6 },

  // Unit 7 — Nov 18–Dec 9
  { date: "2026-11-18", code: "U7·D01", title: "Why Insurance Exists", type: "lesson", unit: 7 },
  { date: "2026-11-19", code: "U7·D02", title: "Insurance Math, Types & Ethics", type: "lesson", unit: 7 },
  { date: "2026-11-20", code: "U7·D03", title: "Health, Life & Disability", type: "lesson", unit: 7 },
  { date: "2026-11-23", title: "Thanksgiving Break", type: "break" },
  { date: "2026-11-24", title: "Thanksgiving Break", type: "break" },
  { date: "2026-11-25", title: "Thanksgiving Break", type: "break" },
  { date: "2026-11-26", title: "Thanksgiving Break", type: "break" },
  { date: "2026-11-27", title: "Thanksgiving Break", type: "break" },
  { date: "2026-11-30", code: "U7·D04", title: "Consumer Protection", type: "lesson", unit: 7 },
  { date: "2026-12-01", code: "U7·D05", title: "Identity Theft: How It Happens", type: "lesson", unit: 7 },
  { date: "2026-12-02", code: "U7·D06", title: "Identity Theft: Protection", type: "lesson", unit: 7 },
  { date: "2026-12-03", code: "U7·D07", title: "Investment Scams", type: "lesson", unit: 7 },
  { date: "2026-12-04", code: "U7·D08", title: "Consumer Rights in Action", type: "lesson", unit: 7 },
  { date: "2026-12-07", code: "U7·D09", title: "Course Reflection", type: "lesson", unit: 7 },
  { date: "2026-12-08", code: "U7·FLEX", title: "Flex / Review", type: "flex", unit: 7 },
  { date: "2026-12-09", code: "FINAL", title: "Final Exam", type: "exam" },

  // Buffer — Dec 10–18
  { date: "2026-12-10", title: "Buffer", type: "buffer" },
  { date: "2026-12-11", title: "Buffer", type: "buffer" },
  { date: "2026-12-14", title: "Buffer", type: "buffer" },
  { date: "2026-12-15", title: "Buffer", type: "buffer" },
  { date: "2026-12-16", title: "Buffer", type: "buffer" },
  { date: "2026-12-17", title: "Buffer", type: "buffer" },
  { date: "2026-12-18", title: "Buffer · Last Day, Semester 1", type: "buffer" },
];

export interface FlagshipProject {
  name: string;
  tagline: string;
  milestones: { label: string; date: string }[];
  requirements: string[];
}

export const flagshipProjects: FlagshipProject[] = [
  {
    name: "Stock Market Challenge",
    tagline:
      "Trade $100K in simulated capital while Unit 5's tariffs and exchange rates move the market in real time.",
    milestones: [
      { label: "Launches", date: "Oct 6 · U4·D09" },
      { label: "Closes", date: "Oct 8 · Unit 4 Exam" },
    ],
    requirements: [
      "Minimum 8 stocks across 3 sectors — at least 1 international",
      "Weekly portfolio memos: buy/sell reasoning + macro connection",
      "Unit 5 live connection: a new tariff is announced — which holdings are hit?",
      "Final debrief graded on reasoning, not performance",
    ],
  },
  {
    name: "Future Budget Simulation",
    tagline:
      "Research a real career, salary, and monthly budget — then present it like you're pitching a financial advisor.",
    milestones: [
      { label: "Seeded", date: "Aug 18 · U1·D10" },
      { label: "Built", date: "Sep 21 · U3·D09" },
      { label: "Presented", date: "Nov 11–13 · U6·PRES" },
    ],
    requirements: [
      "Researched salary, full net pay, and a real housing decision from real listings",
      "Transportation, debt repayment, and a full monthly budget",
      "30-year compound interest projection on monthly surplus",
      "Net worth snapshots at Year 1, Year 5, and Year 10",
      "A one-page generational wealth reflection",
      "A 3-minute oral presentation to the class",
    ],
  },
];

export interface AksStandard {
  code: string;
  topic: string;
  unit: string;
  days: string;
}

export const akaStandards: AksStandard[] = [
  { code: "SSEC.17a–d", topic: "Scarcity, allocation, factors of production, opportunity cost", unit: "Unit 1", days: "D01–D05" },
  { code: "SSEC.18a–b", topic: "Marginal decision-making, incentives", unit: "Unit 1", days: "D06" },
  { code: "SSEC.19a–c", topic: "Economic systems: command, market, mixed", unit: "Unit 1", days: "D07–D08" },
  { code: "SSEC.20a–d", topic: "Standard of living, human capital, production possibilities", unit: "Unit 1", days: "D09" },
  { code: "SSEC.21a–e", topic: "Major life decisions, post-HS paths, generational wealth", unit: "Unit 1 · Unit 6", days: "U1:D10 · U6:D02,06–09" },
  { code: "SSEC.22a–f", topic: "Income types, pay stub, 1040, budgeting, net worth", unit: "Unit 3", days: "D03–D09" },
  { code: "SSEC.23a–e", topic: "Financial system, savings, investment options, speculation", unit: "Unit 4", days: "D01–D09" },
  { code: "SSEC.24a–e", topic: "Interest rates, APR, compound interest, amortization", unit: "Unit 4 · Unit 6", days: "U4:D02,D09 · U6:D04–05,08" },
  { code: "SSEC.25a–b", topic: "Tax types: progressive, regressive, proportional", unit: "Unit 3", days: "D04–D05" },
  { code: "SSEC.26a–e", topic: "Credit reports, scores, creditworthiness, bankruptcy", unit: "Unit 6", days: "D01–D09" },
  { code: "SSEC.27a–d", topic: "Insurance types, costs, benefits, rate determination", unit: "Unit 7", days: "D01–D03" },
  { code: "SSEC.28a–c", topic: "Worker earnings, social media footprint, career ROI", unit: "Unit 3", days: "D01–D02" },
  { code: "SSEC.29a–c", topic: "Consumer protection agencies and laws", unit: "Unit 7", days: "D04, D08" },
  { code: "SSEC.30a–d", topic: "Identity theft prevention, response, investment scams", unit: "Unit 7", days: "D05–D08" },
  { code: "SSEC.31a", topic: "Circular flow of goods, services, resources, money", unit: "Unit 2", days: "D10" },
  { code: "SSEC.32a–d", topic: "Supply, demand, equilibrium, elasticity, price controls", unit: "Unit 2", days: "D01–D06" },
  { code: "SSEC.33a–b", topic: "Business organization, market structures", unit: "Unit 2", days: "D07–D09" },
  { code: "SSEC.34a–c", topic: "GDP, CPI, unemployment types, business cycle", unit: "Unit 2", days: "D10" },
  { code: "SSEC.35a–c", topic: "Federal Reserve structure, monetary policy tools", unit: "Unit 3", days: "D06–D07" },
  { code: "SSEC.36a–b", topic: "Fiscal policy, government spending, national debt", unit: "Unit 3", days: "D08" },
  { code: "SSEC.37a–c", topic: "International trade, comparative advantage, Georgia's role", unit: "Unit 5", days: "D01–D03, D06" },
  { code: "SSEC.38a–b", topic: "Exchange rates, appreciation, depreciation, impact", unit: "Unit 5", days: "D04–D06" },
  { code: "SSEC.A.1–4", topic: "Map & globe skills — trade routes, economic geography", unit: "Unit 2 · Unit 5", days: "Ongoing" },
  { code: "SSEC.B.5–16", topic: "Information processing skills", unit: "All units", days: "Every lesson" },
];

export interface CourseStats {
  units: number;
  scheduledDays: number;
  lessonDays: number;
  bufferDays: number;
  flagshipProjects: number;
  inquiryArchetypes: number;
  aksCoverage: string;
}

export const courseStats: CourseStats = {
  units: 7,
  scheduledDays: 80,
  lessonDays: 63,
  bufferDays: 7,
  flagshipProjects: 2,
  inquiryArchetypes: 8,
  aksCoverage: "100%",
};

export interface SampleDayStep {
  name: string;
  description: string;
}

export interface SampleDay {
  unitDay: string;
  title: string;
  hook: string;
  steps: SampleDayStep[];
  debrief: string;
}

export const sampleDay: SampleDay = {
  unitDay: "U1 · D01",
  title: "What is Economics?",
  hook: "Why does a bottle of water cost $1.25 in the hallway but $6.00 at a Braves game — and why do you pay it?",
  steps: [
    {
      name: "Table Document",
      description:
        "A grocery receipt comparing the same basket of items in 2019 vs. 2024, total circled in red: \"+$12.02. Why?\"",
    },
    {
      name: "Hook Question",
      description: "The stadium-water question above — students write a gut reaction before any instruction begins.",
    },
    {
      name: "Guided Notes",
      description:
        "A balance-scale diagram (unlimited wants vs. limited resources) and the Three Questions Every Economy Answers, worked through live using the hallway vending machine as the example.",
    },
    {
      name: "Inquiry Activity",
      description:
        "Students analyze four real scenarios — Braves water, the egg crisis, an unchanged vending-machine price, college tuition — then map their own last 24 hours onto a resource-use pie chart.",
    },
    {
      name: "Debrief",
      description:
        "\"You paid nothing for this class today. What is the actual cost of you being here right now?\" Left hanging — answered by Friday.",
    },
  ],
  debrief:
    "That question has a precise economic answer. You'll be able to give it by Friday.",
};

export interface CorePhilosophy {
  quote: string;
  centralQuestion: string;
  whyThisExists: string;
}

export const corePhilosophy: CorePhilosophy = {
  quote:
    "Every economic decision is a personal one. Every personal finance choice is shaped by economic forces.",
  centralQuestion: "How do the systems of the world shape the choices of your life?",
  whyThisExists:
    "This course refuses to treat economics and personal finance as separate subjects. Students encounter the same ideas — scarcity, incentives, risk, return — at the scale of the global economy and at the scale of the kitchen table. Every lesson begins with something real: a current news story, a historical case, a document on their desk when they walk in. The concept emerges from the story — never before it.",
};
