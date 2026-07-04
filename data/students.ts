export type StudentResourceStatus = "Available" | "Coming Soon";

export interface StudentResourceEntry {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  status: StudentResourceStatus;
  externalHref?: string;
}

export const studentResources: StudentResourceEntry[] = [
  {
    slug: "study-guides",
    title: "Study Guides",
    tagline: "Clear, visual guides for the topics that matter most.",
    description:
      "A planned library of student-facing study guides that distill each unit into the key ideas, vocabulary, and practice you need before a test.",
    status: "Coming Soon",
  },
  {
    slug: "digital-textbooks",
    title: "Digital Textbooks",
    tagline: "Modern, readable textbooks built for the screen.",
    description:
      "Browse Sinon Learning's growing library of digital textbooks—built page by page for real classroom use.",
    status: "Available",
    externalHref: "/textbooks",
  },
  {
    slug: "practice-activities",
    title: "Practice Activities",
    tagline: "Short, focused practice to build real understanding.",
    description:
      "A planned set of bite-sized practice activities tied directly to Sinon Learning's curriculum units, for use in class or at home.",
    status: "Coming Soon",
  },
  {
    slug: "simulations-and-games",
    title: "Simulations & Games",
    tagline: "Learn economics and finance by actually doing it.",
    description:
      "Run a lemonade stand, build a stock portfolio with real prices, and play through interactive simulations built to teach by experience.",
    status: "Available",
    externalHref: "/simulations",
  },
  {
    slug: "ai-literacy",
    title: "AI Literacy for Students",
    tagline: "Understand the AI you already use every day.",
    description:
      "A student-facing path through how AI actually works, where it helps, where it fails, and how to use it honestly and well.",
    status: "Available",
    externalHref: "/ai",
  },
  {
    slug: "personal-finance-tools",
    title: "Personal Finance Tools",
    tagline: "Practice real money decisions before they're real.",
    description:
      "Start with $10,000 in cash and build a portfolio using real, live stock prices—a hands-on way to learn investing basics.",
    status: "Available",
    externalHref: "/simulations/stock-market-basics",
  },
  {
    slug: "writing-help",
    title: "Margins",
    tagline: "Practice AP writing and get real, honest feedback.",
    description:
      "Join your class, write DBQ, LEQ, and SAQ essays right in the browser, and get KORA-graded, color-coded annotated feedback against your teacher's rubric.",
    status: "Available",
    externalHref: "/margins",
  },
  {
    slug: "explainers",
    title: "Explainers",
    tagline: "Short, clear breakdowns of tricky ideas.",
    description:
      "A planned library of short explainer pieces that break down confusing topics from across the curriculum into plain language.",
    status: "Coming Soon",
  },
];

export function getStudentResourceBySlug(slug: string): StudentResourceEntry | undefined {
  return studentResources.find((entry) => entry.slug === slug);
}
