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
    slug: "scaffold",
    title: "Scaffold",
    tagline: "Upload a slideshow — get a structured student notesheet in seconds.",
    description:
      "Upload a PowerPoint or PDF, tell KORA the concept and grade level, and Scaffold builds a structured notesheet plan. Download student PDFs and a teacher answer key instantly.",
    status: "Available",
    externalHref: "/notesheet",
  },
  {
    slug: "kora-game",
    title: "KORA Game",
    tagline: "A live game where understanding depth earns points — not recall speed.",
    description:
      "Teachers launch a game, students join with a code and type short answers. KORA evaluates each response for understanding level and misconceptions in real time. Teachers see a live grid of who understands what.",
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
];

export function getTeacherToolBySlug(slug: string): TeacherToolEntry | undefined {
  return teacherTools.find((entry) => entry.slug === slug);
}
