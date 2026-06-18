export type CourseStatus = "First Build" | "Planned" | "Coming Later";

export interface Course {
  name: string;
  status: CourseStatus;
  description: string;
  includes: string[];
}

export const courses: Course[] = [
  {
    name: "Everyday Economics",
    status: "First Build",
    description:
      "A modern, classroom-ready introduction to how people, markets, and money actually work.",
    includes: ["Digital textbook", "Daily lessons", "Slides & activities"],
  },
  {
    name: "Everyday Personal Finance",
    status: "First Build",
    description:
      "Practical money skills—budgeting, credit, taxes, and investing—built for real student life.",
    includes: ["Complete units", "Assessments", "Visual resources"],
  },
  {
    name: "Everyday Government",
    status: "Planned",
    description:
      "A clear, balanced look at how government works and why it matters to students.",
    includes: ["Digital textbook", "Daily lessons", "Teacher guides"],
  },
  {
    name: "Everyday World History",
    status: "Planned",
    description:
      "A visual, story-driven path through world history built for engagement and clarity.",
    includes: ["Visual resources", "Complete units", "Activities"],
  },
  {
    name: "Everyday U.S. History",
    status: "Coming Later",
    description:
      "A modern retelling of U.S. history designed for thoughtful classroom discussion.",
    includes: ["Digital textbook", "Slides", "Assessments"],
  },
  {
    name: "Everyday Geography",
    status: "Coming Later",
    description:
      "Maps, regions, and global thinking skills presented in a clean, visual format.",
    includes: ["Visual resources", "Daily lessons", "Activities"],
  },
];

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
