export type TeacherToolStatus = "Available" | "Coming Soon";

export interface TeacherToolEntry {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  status: TeacherToolStatus;
  externalHref?: string;
}

export const teacherTools: TeacherToolEntry[] = [
  {
    slug: "teacher-studio",
    title: "Teacher Studio",
    tagline: "Teacher-first AI that removes the dirty work, not the teaching.",
    description:
      "An upcoming workspace where teachers plan, draft, and refine classroom materials with AI support that stays under the teacher's control from start to finish.",
    status: "Coming Soon",
  },
  {
    slug: "simulations-and-games",
    title: "Simulations & Games",
    tagline: "Interactive economics and finance simulators, ready today.",
    description:
      "Live simulations like the Lemonade Stand market simulator and the real-time Stock Market portfolio game, built for classroom use.",
    status: "Available",
    externalHref: "/simulations",
  },
  {
    slug: "classroom-tools",
    title: "Classroom Tools",
    tagline: "Simple web apps for the everyday classroom.",
    description:
      "Classboard, the Game Show Generator, and a growing set of lightweight tools built for how teachers actually run a classroom.",
    status: "Available",
    externalHref: "/tools",
  },
  {
    slug: "assessment-builder",
    title: "Assessment Builder",
    tagline: "Build quizzes and assessments aligned to your lessons.",
    description:
      "A planned tool for assembling quizzes, exit tickets, and unit assessments directly from Sinon Learning curriculum as the library grows.",
    status: "Coming Soon",
  },
  {
    slug: "templates",
    title: "Templates",
    tagline: "Ready-made templates for planning and classroom documents.",
    description:
      "A future library of lesson plan templates, syllabi, and classroom document starters teachers can copy and adapt in minutes.",
    status: "Coming Soon",
  },
  {
    slug: "google-docs-slides-export",
    title: "Google Docs & Slides Export",
    tagline: "Take Sinon Learning materials straight into your own Drive.",
    description:
      "A planned export option for sending lessons, slides, and activities directly into Google Docs and Slides. This is in development and not yet available.",
    status: "Coming Soon",
  },
  {
    slug: "teach-this-tomorrow",
    title: "Teach This Tomorrow",
    tagline: "Grab-and-go lessons for when you need something fast.",
    description:
      "A future shortcut from the curriculum library straight to a ready-to-teach lesson for the next day, built for substitutes and busy mornings.",
    status: "Coming Soon",
  },
];

export function getTeacherToolBySlug(slug: string): TeacherToolEntry | undefined {
  return teacherTools.find((entry) => entry.slug === slug);
}
