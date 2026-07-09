import { economicsUnits } from "./economicsCourse";

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

// Both roadmaps mirror the real 7-unit Everyday Economics structure defined
// in data/economicsCourse.ts, rather than an invented list.
export const homeRoadmap = economicsUnits.map((u) => u.title);

export const firstBuildRoadmap = economicsUnits.map((u) => u.title);
