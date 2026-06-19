import type { AISandboxType } from "@/data/aiCourses";

export interface SandboxCatalogEntry {
  slug: AISandboxType;
  number: number;
  title: string;
  tagline: string;
  description: string;
  courseSlug: string;
  lessonSlug: string;
}

export const aiSandboxes: SandboxCatalogEntry[] = [
  {
    slug: "decision-boundary",
    number: 1,
    title: "Train a Real Classifier",
    tagline: "Drag a line to separate spam from not-spam, then watch a real learning algorithm do it for you.",
    description:
      "A genuine perceptron — the simplest kind of trainable model — running entirely in your browser. Move the decision boundary yourself, then hit auto-train and watch the same gradient-style update rule converge on a working classifier, one labeled example at a time.",
    courseSlug: "ai-foundations",
    lessonSlug: "how-machines-learn",
  },
  {
    slug: "neural-network",
    number: 2,
    title: "Build a Brain That Can't Be Fooled",
    tagline: "A tiny neural network, learning live, with real backpropagation under the hood.",
    description:
      "Two sensors, three hidden neurons, one output — and a rule no single neuron can learn alone (sound the alarm when exactly one sensor fires). Watch the hidden layer light up as it trains, and see exactly why deep learning needed more than one layer to begin with.",
    courseSlug: "ai-foundations",
    lessonSlug: "neural-networks-demystified",
  },
  {
    slug: "bias-detective",
    number: 3,
    title: "Bias Detective",
    tagline: "Turn features on and off and watch a hiring model's bias reappear through the back door.",
    description:
      "Sixteen equally-qualified candidates, split into two groups. Toggle which features a ranking model can see and watch how removing one biased feature isn't enough when a second feature quietly encodes the same bias.",
    courseSlug: "ai-foundations",
    lessonSlug: "bias-in-bias-out",
  },
  {
    slug: "calibration",
    number: 4,
    title: "Calibration Check",
    tagline: "Twelve confident claims. Some are true, some are myths. Can you tell which by tone alone?",
    description:
      "Every claim is delivered in the same flat, authoritative voice an AI assistant would use. Rate your confidence on each one, then see whether your certainty actually predicted your accuracy — the exact gap that produces an AI hallucination.",
    courseSlug: "ai-foundations",
    lessonSlug: "truth-hallucination-misinformation",
  },
];

export function getSandboxBySlug(slug: string): SandboxCatalogEntry | undefined {
  return aiSandboxes.find((sandbox) => sandbox.slug === slug);
}
