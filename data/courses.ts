import { economicsUnits } from "./economicsCourse";

export type CourseStatus = "First Build" | "Planned" | "Coming Later";

export interface Course {
  slug: string;
  name: string;
  status: CourseStatus;
  description: string;
  includes: string[];
  eyebrow: string;
  essentialQuestion: string;
  teachingPromise: string;
  previewThemes: string[];
  visual: {
    ink: string;
    accent: string;
    soft: string;
    glow: string;
  };
}

export const courses: Course[] = [
  {
    slug: "everyday-economics",
    name: "Everyday Economics",
    status: "First Build",
    description: "A modern, classroom-ready introduction to how people, markets, and money actually work.",
    includes: ["Digital textbook", "Daily lessons", "Slides & activities"],
    eyebrow: "The flagship course",
    essentialQuestion: "How do the systems of the world shape the choices of your life?",
    teachingPromise: "Turn headlines, receipts, paychecks, markets, and life decisions into a semester students can see themselves inside.",
    previewThemes: ["Story-first inquiry", "Real financial decisions", "A complete semester path"],
    visual: { ink: "#203d2a", accent: "#7faa72", soft: "#e7f1e4", glow: "#f6c768" },
  },
  {
    slug: "everyday-government",
    name: "Everyday Government",
    status: "Planned",
    description: "A clear, balanced look at how government works and why it matters to students.",
    includes: ["Digital textbook", "Daily lessons", "Teacher guides"],
    eyebrow: "Civics made consequential",
    essentialQuestion: "Who gets to make the rules, and how can ordinary people shape them?",
    teachingPromise: "Move government beyond vocabulary and into the arguments, institutions, choices, and civic power students encounter every day.",
    previewThemes: ["Institutions in action", "Civil dialogue", "Power and participation"],
    visual: { ink: "#202f55", accent: "#6689d8", soft: "#e5ecfb", glow: "#efb95f" },
  },
  {
    slug: "everyday-world-history",
    name: "Everyday World History",
    status: "Planned",
    description: "A visual, story-driven path through world history built for engagement and clarity.",
    includes: ["Visual resources", "Complete units", "Activities"],
    eyebrow: "The human story, connected",
    essentialQuestion: "How did people, ideas, environments, and empires build the world we inherited?",
    teachingPromise: "Give teachers a visual, connected narrative that lets students follow people and ideas across borders instead of memorizing isolated dates.",
    previewThemes: ["Global connections", "Primary-source stories", "Maps that explain change"],
    visual: { ink: "#523527", accent: "#c97848", soft: "#f4e5d7", glow: "#dfb851" },
  },
  {
    slug: "everyday-us-history",
    name: "Everyday U.S. History",
    status: "Coming Later",
    description: "A modern retelling of U.S. history designed for thoughtful classroom discussion.",
    includes: ["Digital textbook", "Slides", "Assessments"],
    eyebrow: "A country still becoming",
    essentialQuestion: "Who has shaped the American promise, and who has had to fight to claim it?",
    teachingPromise: "Build a classroom where evidence, competing perspectives, and unfinished questions make American history feel alive and discussable.",
    previewThemes: ["Multiple perspectives", "Evidence-rich discussion", "Past meets present"],
    visual: { ink: "#402a38", accent: "#b65f6f", soft: "#f4e3e6", glow: "#6e94cb" },
  },
  {
    slug: "everyday-geography",
    name: "Everyday Geography",
    status: "Coming Later",
    description: "Maps, regions, and global thinking skills presented in a clean, visual format.",
    includes: ["Visual resources", "Daily lessons", "Activities"],
    eyebrow: "See the systems beneath the map",
    essentialQuestion: "Why does where something happens change what is possible?",
    teachingPromise: "Help students read landscapes, cities, climate, culture, and movement as one living system rather than a list of places.",
    previewThemes: ["Spatial thinking", "Human movement", "Climate and place"],
    visual: { ink: "#16464a", accent: "#3aa6a0", soft: "#dff3ef", glow: "#e8bd5a" },
  },
  {
    slug: "everyday-lessons",
    name: "Everyday Lessons",
    status: "Planned",
    description: "Grab-and-go daily lessons that pull from across the curriculum library for whenever you need something fast.",
    includes: ["Daily lessons", "Slides & activities", "Teacher guides"],
    eyebrow: "One great class, ready to go",
    essentialQuestion: "What could your students be talking about by the end of class today?",
    teachingPromise: "Offer polished, self-contained lessons for the days when teachers need something meaningful without building it from scratch.",
    previewThemes: ["Fast to prepare", "Built for discussion", "Useful across subjects"],
    visual: { ink: "#4f3920", accent: "#df963f", soft: "#fff0d7", glow: "#e6675e" },
  },
  {
    slug: "full-course-packs",
    name: "Full Course Packs",
    status: "Coming Later",
    description: "Complete, bundled course packs—textbook, units, slides, and assessments together—once individual courses are built out.",
    includes: ["Digital textbook", "Complete units", "Assessments"],
    eyebrow: "The whole semester, together",
    essentialQuestion: "What if a complete course felt coherent from the first hook to the final reflection?",
    teachingPromise: "Package the strongest Sinon Learning resources into complete, editable teaching systems rather than disconnected downloads.",
    previewThemes: ["Coherent course design", "Editable resources", "Everything in one place"],
    visual: { ink: "#31295c", accent: "#8c72d9", soft: "#ece8fb", glow: "#efb75f" },
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

export const homeRoadmap = economicsUnits.map((unit) => unit.title);
export const firstBuildRoadmap = economicsUnits.map((unit) => unit.title);
