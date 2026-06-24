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
    tagline: "Turn lesson content into polished Google Docs and Slides.",
    description:
      "Paste your notes, choose a classroom template, add images if you want, and Teacher Studio formats everything into editable Google materials — plus a full workspace for building slides, worksheets, and activities from scratch or from a template.",
    status: "Available",
    externalHref: "/studio",
  },
  {
    slug: "anchored-notes",
    title: "Anchored Notes",
    tagline: "Paste your lesson content, pick a template, generate a Google Doc.",
    description:
      "Paste lesson content, choose a classroom template like APWH Anchored Notes or Clean Printable Notes, add image links if you want them, and generate a polished student handout as a real Google Doc — or export it locally.",
    status: "Available",
    externalHref: "/studio/anchored-notes",
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
    tagline: "Build quizzes and assessments with the answer key filled in.",
    description:
      "Build quizzes, exit tickets, and study guides inside Teacher Studio, with answer keys auto-filled for multiple choice and true/false questions.",
    status: "Available",
    externalHref: "/studio",
  },
  {
    slug: "templates",
    title: "Templates",
    tagline: "36 ready-made templates for planning and classroom documents.",
    description:
      "A library of lesson plan templates, worksheets, activities, and assessments teachers can copy and adapt in minutes inside Teacher Studio.",
    status: "Available",
    externalHref: "/studio/templates",
  },
  {
    slug: "google-docs-slides-export",
    title: "Google Docs & Slides Export",
    tagline: "Take Teacher Studio projects straight into your own Drive.",
    description:
      "Sign into your own Google account just long enough to send a finished Teacher Studio project into a real, editable Google Doc or Slides presentation.",
    status: "Available",
    externalHref: "/studio",
  },
  {
    slug: "teach-this-tomorrow",
    title: "Teach This Tomorrow",
    tagline: "Grab-and-go lessons for when you need something fast.",
    description:
      "A few quick questions in Teacher Studio build a ready-to-teach draft right now — no waiting, built for substitutes and busy mornings.",
    status: "Available",
    externalHref: "/studio",
  },
];

export function getTeacherToolBySlug(slug: string): TeacherToolEntry | undefined {
  return teacherTools.find((entry) => entry.slug === slug);
}
