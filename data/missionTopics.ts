export type MissionTopicStatus = "Available";

export interface MissionTopicEntry {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  status: MissionTopicStatus;
  body: string[];
}

export const missionTopics: MissionTopicEntry[] = [
  {
    slug: "free-education-promise",
    title: "Free Education Promise",
    tagline: "The core curriculum library stays free, always.",
    description:
      "Why Sinon Learning's essential curriculum and classroom tools are free, and what that promise actually covers.",
    status: "Available",
    body: [
      "Great learning should not be locked behind a paywall, and a student's education should not depend on what their school district can afford. That is the starting promise behind Sinon Learning.",
      "The core curriculum library—courses, digital textbooks, daily lessons, and the essential classroom tools—will always be free to teachers and students. Free is not a launch discount. It is the foundation the rest of the project is built on.",
      "More advanced or specialized features may eventually exist alongside the free core, but the essential library that every classroom needs will never move behind a paywall.",
    ],
  },
  {
    slug: "teacher-first-ai",
    title: "Teacher-First AI",
    tagline: "AI that works for teachers, not around them.",
    description:
      "What it means for Sinon Learning to build AI that strengthens teaching instead of replacing it.",
    status: "Available",
    body: [
      "Most AI tools built for education are built to save time by cutting teachers out of the loop. Sinon Learning is building the opposite: AI that makes teachers more powerful, not more replaceable.",
      "That means every tool is designed to remove the dirty, repetitive work around teaching—not the thinking, judgment, and relationships that make teaching matter in the first place.",
      "Teacher-first is not a marketing line here. It is the design constraint every feature has to pass before it ships.",
    ],
  },
  {
    slug: "keep-teaching-human",
    title: "Keep Teaching Human",
    tagline: "The classroom should stay a human space.",
    description:
      "Why Sinon Learning treats human teaching as something to protect, not automate away.",
    status: "Available",
    body: [
      "Teaching is a human relationship built on trust, attention, and judgment that no model can fully replicate. Sinon Learning's tools are built around that fact, not against it.",
      "AI can help a teacher prepare faster or think through an idea, but the decisions about what a classroom needs, what a student is ready for, and how to respond in the moment stay with the teacher.",
      "Keeping teaching human is treated as a constraint on the technology, not an afterthought layered on top of it.",
    ],
  },
  {
    slug: "teacher-compensation",
    title: "Teacher Compensation",
    tagline: "Teachers who help build this should be valued for it.",
    description:
      "How Sinon Learning thinks about recognizing and compensating the teachers who shape its curriculum and tools.",
    status: "Available",
    body: [
      "Sinon Learning is built from real classroom experience, and that experience has value. As the project grows, contributing teachers should be recognized and compensated for the work they put into shaping curriculum, feedback, and tools.",
      "This is an ongoing commitment rather than a finished program: as Sinon Learning's resources grow, so should the paths for teachers to be paid fairly for their expertise.",
    ],
  },
  {
    slug: "kora-constitution",
    title: "KORA Constitution",
    tagline: "Eight principles that govern how KORA is built.",
    description:
      "The numbered principles that constrain how Sinon Learning's teacher-first AI model is designed, trained, and used.",
    status: "Available",
    body: [
      "1. KORA exists to support teachers, never to replace them.",
      "2. Every output KORA produces is a draft for a teacher to review, not a finished decision.",
      "3. KORA will never be designed to remove a teacher's judgment from a classroom decision.",
      "4. KORA is built to be transparent about what it can and cannot do.",
      "5. KORA is built with privacy and student data protection as a requirement, not an option.",
      "6. KORA will never generate fabricated images presented as real historical or factual material.",
      "7. The core of Sinon Learning's curriculum and tools stays free, regardless of how KORA evolves.",
      "8. KORA's development stays accountable to teachers, not just to engineering or business goals.",
    ],
  },
  {
    slug: "about-sinon-learning",
    title: "About Sinon Learning",
    tagline: "Built by a teacher, for real classrooms.",
    description: "The story and purpose behind Sinon Learning.",
    status: "Available",
    body: [
      "Sinon Learning started from a simple frustration: teachers spending their own time and money to give students resources that should have existed already.",
      "It is built by someone who has stood in front of a classroom, not just studied one from the outside. Every course, tool, and decision is shaped by that experience.",
      "The mission is straightforward: free curriculum, free tools, and teacher-first AI—built for the way real classrooms actually work.",
    ],
  },
];

export function getMissionTopicBySlug(slug: string): MissionTopicEntry | undefined {
  return missionTopics.find((entry) => entry.slug === slug);
}
