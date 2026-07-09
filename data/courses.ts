import type { LucideIcon } from "lucide-react";
import { Scale, TrendingUpDown, Briefcase, Landmark, CreditCard, Sprout, Building2, Globe2 } from "lucide-react";

export type CourseStatus = "First Build" | "Planned" | "Coming Later";

export interface Course {
  slug: string;
  name: string;
  status: CourseStatus;
  description: string;
  includes: string[];
}

export const courses: Course[] = [
  {
    slug: "everyday-economics",
    name: "Everyday Economics",
    status: "First Build",
    description:
      "A modern, classroom-ready introduction to how people, markets, and money actually work.",
    includes: ["Digital textbook", "Daily lessons", "Slides & activities"],
  },
  {
    slug: "everyday-personal-finance",
    name: "Everyday Personal Finance",
    status: "First Build",
    description:
      "Practical money skills—budgeting, credit, taxes, and investing—built for real student life.",
    includes: ["Complete units", "Assessments", "Visual resources"],
  },
  {
    slug: "everyday-government",
    name: "Everyday Government",
    status: "Planned",
    description:
      "A clear, balanced look at how government works and why it matters to students.",
    includes: ["Digital textbook", "Daily lessons", "Teacher guides"],
  },
  {
    slug: "everyday-world-history",
    name: "Everyday World History",
    status: "Planned",
    description:
      "A visual, story-driven path through world history built for engagement and clarity.",
    includes: ["Visual resources", "Complete units", "Activities"],
  },
  {
    slug: "everyday-us-history",
    name: "Everyday U.S. History",
    status: "Coming Later",
    description:
      "A modern retelling of U.S. history designed for thoughtful classroom discussion.",
    includes: ["Digital textbook", "Slides", "Assessments"],
  },
  {
    slug: "everyday-geography",
    name: "Everyday Geography",
    status: "Coming Later",
    description:
      "Maps, regions, and global thinking skills presented in a clean, visual format.",
    includes: ["Visual resources", "Daily lessons", "Activities"],
  },
  {
    slug: "everyday-lessons",
    name: "Everyday Lessons",
    status: "Planned",
    description:
      "Grab-and-go daily lessons that pull from across the curriculum library for whenever you need something fast.",
    includes: ["Daily lessons", "Slides & activities", "Teacher guides"],
  },
  {
    slug: "full-course-packs",
    name: "Full Course Packs",
    status: "Coming Later",
    description:
      "Complete, bundled course packs—textbook, units, slides, and assessments together—once individual courses are built out.",
    includes: ["Digital textbook", "Complete units", "Assessments"],
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export const courseIncludes = [
  "Digital textbook chapters",
  "Complete units",
  "Daily lessons",
  "Slides",
  "Activities",
  "Assessments",
  "Visual resources",
  "Teacher guides",
];

export const homeRoadmap = [
  "Thinking Like an Economist",
  "Supply & Demand",
  "Budgeting",
  "Credit & Debt",
  "Taxes",
  "Investing",
  "Adult Life Simulation",
];

export const firstBuildRoadmap = [
  "Thinking Like an Economist",
  "Supply and Demand",
  "Money and Banking",
  "Budgeting",
  "Credit and Debt",
  "Taxes",
  "Investing",
  "Adult Life Simulation",
];

export interface EconomicsUnit {
  title: string;
  blurb: string;
  icon: LucideIcon;
}

export const economicsUnits: EconomicsUnit[] = [
  { title: "Choices & Scarcity", blurb: "Why we can't have everything.", icon: Scale },
  { title: "Supply & Demand", blurb: "Why prices go up or down.", icon: TrendingUpDown },
  { title: "Work, Wages & Careers", blurb: "Why people get paid differently.", icon: Briefcase },
  { title: "Money, Banking & Inflation", blurb: "Why your dollar changes over time.", icon: Landmark },
  { title: "Credit, Debt & Big Purchases", blurb: "Borrow smart. Avoid traps.", icon: CreditCard },
  { title: "Investing & Wealth", blurb: "How money can grow.", icon: Sprout },
  { title: "Government & the Economy", blurb: "How policies affect your life.", icon: Building2 },
  { title: "The Future Economy", blurb: "AI, automation, climate, and jobs.", icon: Globe2 },
];
