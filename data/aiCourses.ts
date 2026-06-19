export interface AILessonFlowStep {
  label: string;
  description: string;
}

export interface AILesson {
  day: number;
  title: string;
  essentialQuestion: string;
  objectives: string[];
  vocabulary: string[];
  flow: AILessonFlowStep[];
  assessment: string;
}

export interface AIUnit {
  title: string;
  summary: string;
  lessons: AILesson[];
}

export interface AIFlagshipCourse {
  slug: string;
  number: number;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  gradeBand: string;
  status: "Available" | "Coming Soon";
  outcomes: string[];
  units: AIUnit[];
}

export const aiCourses: AIFlagshipCourse[] = [
  {
    slug: "ai-foundations",
    number: 1,
    title: "AI Foundations: How Machines Learn to Think",
    tagline: "A two-week journey from \"what is intelligence?\" to a working code of AI ethics.",
    description:
      "The flagship course of Sinon Learning's AI mission. Students move from defining intelligence itself to understanding how machines actually learn, then spend the second week stress-testing AI against bias, truth, privacy, and the future of work—closing with a capstone where they write their own AI ethics policy.",
    duration: "2 Weeks · 10 Lessons",
    gradeBand: "Grades 9–12",
    status: "Available",
    outcomes: [
      "Explain how machine learning and neural networks actually work, without code or math",
      "Trace the real history of AI from symbolic logic to generative models",
      "Evaluate AI systems for bias, reliability, and privacy risk using real case studies",
      "Draft an original, defensible AI code of ethics for a real-world context",
    ],
    units: [
      {
        title: "Unit 1 — How AI Actually Works",
        summary:
          "From the idea of intelligence itself to neural networks and real AI products, students build a working mental model of how machines learn.",
        lessons: [
          {
            day: 1,
            title: "What Is Intelligence, Anyway?",
            essentialQuestion:
              "Can a machine actually \"think,\" or is it just really good pattern matching?",
            objectives: [
              "Define intelligence using multiple competing definitions",
              "Distinguish between narrow AI, general AI, and superintelligence",
              "Evaluate real-world AI examples against a working definition of intelligence",
            ],
            vocabulary: ["Artificial Intelligence", "Narrow AI", "General AI (AGI)", "Turing Test", "Algorithm"],
            flow: [
              {
                label: "Warm-Up",
                description:
                  "\"Is It AI?\" sorting activity—students sort examples (a thermostat, a chess engine, Siri, a calculator, a self-driving car) into AI / not AI and defend their choices.",
              },
              {
                label: "Direct Instruction",
                description:
                  "Mini-lecture on the spectrum from rule-based automation to true learning systems; introduce the Turing Test and its limitations.",
              },
              {
                label: "Guided Practice",
                description:
                  "Small groups design a 5-minute \"Turing Test\" style game to try to distinguish a human from a bot.",
              },
              {
                label: "Discussion",
                description:
                  "Journal response: \"Do you think today's chatbots pass the Turing Test? Why does it matter if they do?\"",
              },
            ],
            assessment:
              "Exit ticket: one paragraph defining AI in the student's own words with one supporting example.",
          },
          {
            day: 2,
            title: "From Logic Gates to ChatGPT: A Brief History of AI",
            essentialQuestion: "Why did AI take 70 years to go from science fiction to your pocket?",
            objectives: [
              "Sequence the major eras of AI development",
              "Explain why data and computing power, not just new ideas, drove recent AI breakthroughs",
              "Connect historical AI milestones to current tools students already use",
            ],
            vocabulary: ["Symbolic AI", "Expert System", "AI Winter", "Machine Learning", "Deep Learning", "Generative AI"],
            flow: [
              {
                label: "Warm-Up",
                description:
                  "Timeline prediction—students guess when key AI milestones happened (1950 Turing paper, 1997 Deep Blue, 2012 deep learning breakthrough, 2022 ChatGPT) before the reveal.",
              },
              {
                label: "Direct Instruction",
                description:
                  "Illustrated history walkthrough connecting each era to a \"why now\" explanation: data availability, compute, and algorithms.",
              },
              {
                label: "Guided Practice",
                description:
                  "Class builds a shared AI history timeline, placing milestone cards in order with a one-sentence explanation for each.",
              },
              {
                label: "Independent Practice",
                description:
                  "Short reading plus three comprehension questions on why two separate \"AI winters\" happened.",
              },
            ],
            assessment:
              "Quick-write: \"What had to be true for ChatGPT to exist in 2022 and not in 1995?\"",
          },
          {
            day: 3,
            title: "How Machines Learn: Data, Patterns, and Training",
            essentialQuestion: "If a computer doesn't have a brain, how does it \"learn\" from examples?",
            objectives: [
              "Explain the basic training loop: input data, prediction, comparison, adjustment",
              "Differentiate supervised, unsupervised, and reinforcement learning with examples",
              "Identify what counts as \"training data\" for common AI tools",
            ],
            vocabulary: ["Training Data", "Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Model", "Prediction"],
            flow: [
              {
                label: "Warm-Up",
                description:
                  "\"Guess the Rule\" pattern game—students see labeled examples and try to find the pattern, mimicking how a model learns.",
              },
              {
                label: "Direct Instruction",
                description:
                  "Walk through the training loop using a simple example, like an email spam filter: data in, guess, correction, repeat.",
              },
              {
                label: "Guided Practice",
                description:
                  "Kinesthetic activity: students act out a \"human neural network,\" sorting example cards into categories, getting feedback, and adjusting their rule.",
              },
              {
                label: "Independent Practice",
                description:
                  "Worksheet matching real AI applications (recommendations, voice assistants, fraud detection) to the correct learning type.",
              },
            ],
            assessment:
              "Exit ticket: explain in 2–3 sentences how a spam filter \"learns\" what spam looks like.",
          },
          {
            day: 4,
            title: "Neural Networks Demystified",
            essentialQuestion: "What's actually happening inside the \"black box\"?",
            objectives: [
              "Describe a neural network as layers of simple decisions that combine into complex judgments",
              "Use a no-math analogy to explain neurons, weights, and layers",
              "Explain why neural networks need huge amounts of data and computing power",
            ],
            vocabulary: ["Neural Network", "Neuron (Node)", "Weight", "Layer", "Parameter"],
            flow: [
              {
                label: "Warm-Up",
                description:
                  "\"20 Questions, but weighted\"—a guessing game where some questions matter more than others, previewing weighted inputs.",
              },
              {
                label: "Direct Instruction",
                description:
                  "Build a neural network analogy on the board layer by layer: input layer as raw info, hidden layers as combinations of clues, output layer as the final decision.",
              },
              {
                label: "Guided Practice",
                description:
                  "Paper neural network activity—folded \"signal\" notes pass through rows of classmates (layers), each adjusting the message slightly before a final class decision.",
              },
              {
                label: "Independent Practice",
                description:
                  "Diagram labeling: students label a simple neural network diagram (inputs, hidden layers, weights, output).",
              },
            ],
            assessment:
              "Four-question mini-quiz on neural network vocabulary and the flow of information through layers.",
          },
          {
            day: 5,
            title: "From Models to Products + Unit 1 Review",
            essentialQuestion: "How does a trained model turn into an app on your phone?",
            objectives: [
              "Trace the path from a trained model to a real product",
              "Compare how familiar AI products use models differently",
              "Synthesize Unit 1 vocabulary and concepts for the unit review",
            ],
            vocabulary: ["Inference", "API", "Fine-Tuning", "Generative AI"],
            flow: [
              {
                label: "Warm-Up",
                description: "\"AI in My Pocket\"—students list every AI-powered feature they used in the last 24 hours.",
              },
              {
                label: "Direct Instruction",
                description:
                  "Walk through the lifecycle of a real product: data collection, training, fine-tuning, deployment, your phone.",
              },
              {
                label: "Guided Practice",
                description:
                  "Case study stations: small groups analyze a recommendation engine, an image generator, and a voice assistant, then present back to class.",
              },
              {
                label: "Unit Review",
                description: "Whole-class review game covering Days 1–4 vocabulary and concepts.",
              },
            ],
            assessment: "Unit 1 Checkpoint Quiz: 10 questions mixing vocabulary and applied scenarios.",
          },
        ],
      },
      {
        title: "Unit 2 — Living With AI: Ethics, Bias, and the Future",
        summary:
          "Students turn a critical eye on AI—examining bias, misinformation, privacy, and labor—then design their own AI ethics policy as a capstone.",
        lessons: [
          {
            day: 6,
            title: "Bias In, Bias Out",
            essentialQuestion: "Can a machine be biased if it doesn't have opinions?",
            objectives: [
              "Explain how AI bias originates from training data, not machine \"intent\"",
              "Analyze a real case study of biased AI",
              "Propose a way developers could reduce bias in a given scenario",
            ],
            vocabulary: ["Algorithmic Bias", "Training Data Bias", "Representation", "Fairness"],
            flow: [
              {
                label: "Warm-Up",
                description:
                  "Biased dataset thought experiment: a deliberately skewed \"training set\" reveals what a model would get wrong.",
              },
              {
                label: "Direct Instruction",
                description: "Case study walkthrough of a real-world biased AI system and how it happened.",
              },
              {
                label: "Guided Practice",
                description:
                  "Students audit a sample dataset description for representation gaps and predict resulting bias.",
              },
              {
                label: "Socratic Seminar",
                description:
                  "\"Who is responsible when an AI system discriminates: the data, the developer, or the company?\"",
              },
            ],
            assessment: "Written response defending a position on responsibility for AI bias.",
          },
          {
            day: 7,
            title: "Truth, Hallucination, and Misinformation",
            essentialQuestion: "Why does AI sound so confident even when it's wrong?",
            objectives: [
              "Define \"hallucination\" in AI systems and explain why it happens",
              "Practice fact-checking AI-generated content against reliable sources",
              "Develop personal habits for verifying information from AI tools",
            ],
            vocabulary: ["Hallucination", "Source Verification", "Deepfake", "Misinformation"],
            flow: [
              {
                label: "Warm-Up",
                description: "\"Spot the Hallucination\"—students find a planted factual error in an AI-generated passage.",
              },
              {
                label: "Direct Instruction",
                description:
                  "Explain why generative AI predicts plausible-sounding text rather than \"looking up\" facts, and what that means for reliability.",
              },
              {
                label: "Guided Practice",
                description:
                  "Fact-check workshop: students verify AI-generated answers using at least two outside sources.",
              },
              {
                label: "Independent Practice",
                description: "Students build a personal \"AI fact-check checklist\" they can reuse.",
              },
            ],
            assessment: "Exit ticket: apply the checklist to one new AI-generated claim.",
          },
          {
            day: 8,
            title: "Privacy, Data, and Surveillance in the Age of AI",
            essentialQuestion: "What are you giving up when an app gets \"smarter\"?",
            objectives: [
              "Explain how personal data is collected and used to train and personalize AI systems",
              "Evaluate the privacy trade-offs of common AI-powered apps and services",
              "Identify practical steps to protect personal data online",
            ],
            vocabulary: ["Data Privacy", "Consent", "Surveillance", "Data Collection", "Terms of Service"],
            flow: [
              {
                label: "Warm-Up",
                description: "\"What Does It Know?\"—students estimate how much a familiar app might know about them.",
              },
              {
                label: "Direct Instruction",
                description:
                  "Walkthrough of how data fuels personalization and targeted AI features, with attention to consent and terms-of-service realities.",
              },
              {
                label: "Guided Practice",
                description: "Students translate excerpted terms-of-service language into plain English.",
              },
              {
                label: "Debate",
                description: "\"Is trading personal data for a free, personalized AI service a fair deal?\"",
              },
            ],
            assessment: "Reflection paragraph on one personal data habit the student will change.",
          },
          {
            day: 9,
            title: "AI and the Future of Work",
            essentialQuestion: "Will AI take your job, change it, or create a new one?",
            objectives: [
              "Distinguish between job automation, augmentation, and creation",
              "Analyze how AI is currently changing at least two different career fields",
              "Identify skills that remain valuable in an AI-augmented workforce",
            ],
            vocabulary: ["Automation", "Augmentation", "Reskilling", "Human-in-the-Loop"],
            flow: [
              {
                label: "Warm-Up",
                description: "Career predictions—students guess which of 8 jobs are most/least likely to be automated and why.",
              },
              {
                label: "Direct Instruction",
                description: "Real examples of AI augmenting (not replacing) workers in medicine, law, and the arts.",
              },
              {
                label: "Guided Practice",
                description:
                  "Research stations: small groups investigate one career field and identify an essential \"human-in-the-loop\" skill.",
              },
              {
                label: "Independent Practice",
                description: "Students draft a short \"future-proofing\" skills plan for a career they're interested in.",
              },
            ],
            assessment: "Group presentation summary shared with the class.",
          },
          {
            day: 10,
            title: "Capstone: Designing an Ethical AI Policy",
            essentialQuestion: "If you were in charge, what rules would you set for AI?",
            objectives: [
              "Synthesize concepts from both units into a coherent policy",
              "Draft an original AI Code of Ethics for a chosen context",
              "Present and defend policy choices to peers",
            ],
            vocabulary: ["Policy", "Ethical Framework", "Stakeholder", "Accountability"],
            flow: [
              {
                label: "Warm-Up",
                description: "Quick poll: students vote on the single most important AI risk discussed this unit and explain why.",
              },
              {
                label: "Direct Instruction",
                description:
                  "Review real-world AI ethics frameworks—transparency, accountability, fairness, privacy—as models.",
              },
              {
                label: "Guided Practice",
                description:
                  "Small groups draft a 5-point AI Code of Ethics for a chosen context, addressing bias, transparency, privacy, and accountability.",
              },
              {
                label: "Presentation",
                description: "Groups present their code of ethics; class gives peer feedback using a simple rubric.",
              },
            ],
            assessment:
              "Final Capstone Rubric: policy completeness, use of unit vocabulary, clarity of reasoning, and presentation quality.",
          },
        ],
      },
    ],
  },
  {
    slug: "ai-ethics-and-society",
    number: 2,
    title: "AI Ethics & Society",
    tagline: "Bias, fairness, privacy, and power in a world increasingly run by algorithms.",
    description:
      "A deeper, society-level look at how AI systems reshape fairness, democracy, art, and power—building directly on the foundations from Course 1.",
    duration: "2 Weeks · Coming Soon",
    gradeBand: "Grades 9–12",
    status: "Coming Soon",
    outcomes: [],
    units: [],
  },
  {
    slug: "building-ai-responsibly",
    number: 3,
    title: "Building & Using AI Responsibly",
    tagline: "Hands-on AI literacy: prompting, evaluating, and creating with AI tools the right way.",
    description:
      "A project-based course where students practice responsible, effective AI use—from prompt literacy to evaluating outputs to a final capstone project.",
    duration: "2 Weeks · Coming Soon",
    gradeBand: "Grades 9–12",
    status: "Coming Soon",
    outcomes: [],
    units: [],
  },
];

export function getAICourseBySlug(slug: string): AIFlagshipCourse | undefined {
  return aiCourses.find((course) => course.slug === slug);
}
