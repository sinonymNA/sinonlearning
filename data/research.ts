export type ResearchStatus = "Available" | "Coming Soon";

export interface ResearchEntry {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  status: ResearchStatus;
  externalHref?: string;
}

export const researchTopics: ResearchEntry[] = [
  {
    slug: "research-to-practice",
    title: "Research to Practice",
    tagline: "What the research says, turned into something you can teach tomorrow.",
    description:
      "A real, structured breakdown connecting learning science to classroom action—big idea, evidence, why it matters, and a concrete classroom example.",
    status: "Available",
  },
  {
    slug: "educational-theory",
    title: "Educational Theory",
    tagline: "The ideas behind how Sinon Learning is built.",
    description:
      "Read the thinking behind Sinon Learning's approach to curriculum, classroom tools, and teacher-first AI.",
    status: "Available",
    externalHref: "/educational-theory",
  },
  {
    slug: "paper-breakdowns",
    title: "Paper Breakdowns",
    tagline: "Real papers, explained without the jargon.",
    description:
      "A planned series breaking down notable education research papers into plain language teachers can actually use.",
    status: "Coming Soon",
  },
  {
    slug: "strategy-library",
    title: "Strategy Library",
    tagline: "A growing collection of evidence-informed teaching strategies.",
    description:
      "A planned library of classroom strategies, each tied back to the research that supports it.",
    status: "Coming Soon",
  },
  {
    slug: "kora-model",
    title: "KORA Model",
    tagline: "Teachers think. KORA builds.",
    description:
      "Sinon Learning's teacher-first AI vision—built to support teaching, never to replace it.",
    status: "Available",
    externalHref: "/research/kora-model",
  },
  {
    slug: "open-education-and-ai",
    title: "Open Education & AI",
    tagline: "What an open, teacher-centered AI future could look like.",
    description:
      "A planned look at open datasets, open models, and teacher-centered evaluation as part of a freer education infrastructure.",
    status: "Coming Soon",
  },
];

export function getResearchTopicBySlug(slug: string): ResearchEntry | undefined {
  return researchTopics.find((entry) => entry.slug === slug);
}
