export type TeachingLabStatus = "Available" | "Coming Soon";

export interface TeachingLabEntry {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  status: TeachingLabStatus;
}

export const teachingLabTopics: TeachingLabEntry[] = [
  {
    slug: "new-teacher-starter-path",
    title: "New Teacher Starter Path",
    tagline: "A grounded starting point for your first years in the classroom.",
    description:
      "A planned guided path through the essentials of classroom management, planning, and pacing for teachers in their first few years.",
    status: "Coming Soon",
  },
  {
    slug: "professional-learning",
    title: "Professional Learning",
    tagline: "Ongoing growth that respects your time.",
    description:
      "Short, practical professional learning modules planned around real classroom challenges instead of generic theory.",
    status: "Coming Soon",
  },
  {
    slug: "lesson-planning",
    title: "Lesson Planning",
    tagline: "Plan with structure, not from scratch.",
    description:
      "A planned set of lesson planning frameworks and walkthroughs to help you build strong lessons faster.",
    status: "Coming Soon",
  },
  {
    slug: "classroom-practice",
    title: "Classroom Practice",
    tagline: "What strong teaching actually looks like, day to day.",
    description:
      "A planned collection of classroom practice breakdowns—routines, transitions, and small moves that add up to a strong classroom.",
    status: "Coming Soon",
  },
  {
    slug: "ai-for-teachers",
    title: "AI for Teachers",
    tagline: "Use AI thoughtfully, on your own terms.",
    description:
      "A planned guide to using AI as a teacher—what it's genuinely useful for, where it falls short, and how to keep your judgment in charge.",
    status: "Coming Soon",
  },
  {
    slug: "differentiation",
    title: "Differentiation",
    tagline: "Reach every student without rebuilding every lesson.",
    description:
      "A planned set of practical differentiation strategies designed to scale across a real, mixed-ability classroom.",
    status: "Coming Soon",
  },
  {
    slug: "assessment-and-feedback",
    title: "Assessment & Feedback",
    tagline: "Assessment that actually informs the next lesson.",
    description:
      "A planned look at building assessments and feedback loops that tell you—and your students—what to do next.",
    status: "Coming Soon",
  },
  {
    slug: "teacher-workflow",
    title: "Teacher Workflow",
    tagline: "Less busywork, more teaching.",
    description:
      "A planned set of workflow habits and tools to help teachers spend more of their time and energy on actual instruction.",
    status: "Coming Soon",
  },
];

export function getTeachingLabTopicBySlug(slug: string): TeachingLabEntry | undefined {
  return teachingLabTopics.find((entry) => entry.slug === slug);
}
