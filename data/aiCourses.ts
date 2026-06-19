export interface AILessonFlowStep {
  label: string;
  description: string;
}

export interface AILessonVideo {
  title: string;
  url: string;
}

export type AIActivityType = "quiz" | "reflection" | "guess-the-rule" | "checklist";

export interface AIQuizQuestion {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface AIGuessTheRuleExample {
  label: string;
  matches: boolean;
}

export interface AIChecklistItem {
  id: string;
  label: string;
}

export interface AILessonActivity {
  type: AIActivityType;
  title: string;
  instructions: string;
  quiz?: AIQuizQuestion[];
  reflectionPrompt?: string;
  guessTheRule?: { examples: AIGuessTheRuleExample[]; rule: string };
  checklist?: AIChecklistItem[];
}

export type AISandboxType = "decision-boundary" | "neural-network" | "bias-detective" | "calibration";

export interface AILessonSandbox {
  type: AISandboxType;
  title: string;
  description: string;
}

export interface AILesson {
  day: number;
  slug: string;
  title: string;
  essentialQuestion: string;
  objectives: string[];
  vocabulary: string[];
  flow: AILessonFlowStep[];
  assessment: string;
  narrative?: string[];
  videos?: AILessonVideo[];
  sandbox?: AILessonSandbox;
  activity?: AILessonActivity;
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
            slug: "what-is-intelligence-anyway",
            title: "What Is Intelligence, Anyway?",
            essentialQuestion:
              "Can a machine actually \"think,\" or is it just really good pattern matching?",
            objectives: [
              "Define intelligence using multiple competing definitions",
              "Distinguish between narrow AI, general AI, and superintelligence",
              "Evaluate real-world AI examples against a working definition of intelligence",
            ],
            vocabulary: ["Artificial Intelligence", "Narrow AI", "General AI (AGI)", "Turing Test", "Algorithm"],
            narrative: [
              "Here's a trick question: is your thermostat intelligent? It senses the temperature, compares it to a number you set, and flips the furnace on or off. That's a real decision based on real data. But nobody calls a thermostat \"smart\" the way we'd call a person smart. So what's missing?",
              "That gap is exactly where this course lives. Most of what gets marketed as \"AI\" today—from the autocomplete on your phone to the recommendation feed deciding what video plays next—is what researchers call narrow AI: systems that are extremely good at one specific job and clueless about everything else. A chess engine that can beat any human on Earth has no idea what chess even is outside of the board in front of it. It can't order a pizza. A self-driving car that can navigate a highway better than you can has zero opinion about anything that isn't a road.",
              "Compare that to general AI (AGI)—a system that could learn anything a human can, the way a person can go from cooking dinner to debating politics to fixing a bike without being \"retrained\" for each one. AGI doesn't exist yet, despite how often it shows up in headlines. Everything you interact with today, no matter how impressive, is narrow.",
              "So how do we even decide what counts as \"thinking\"? In 1950, mathematician Alan Turing dodged the philosophical mess of defining intelligence and proposed a test instead: if a human chatting with a hidden computer can't reliably tell it apart from a hidden human, the machine passes. It's a clever sidestep—it judges behavior, not whether something \"really\" understands. That distinction (acting intelligent vs. actually understanding) is one you'll keep bumping into all course long, especially once we get to chatbots that sound thoughtful but are doing something very different under the hood.",
              "By the end of today, you won't have a clean, one-sentence definition of intelligence—nobody does, including the experts. But you'll have a sharper set of questions to ask whenever someone says \"this is AI,\" which turns out to be a far more useful skill.",
            ],
            videos: [
              { title: "What Is Artificial Intelligence? — Crash Course AI #1", url: "https://www.youtube.com/watch?v=a0_lo_GDcFw" },
            ],
            activity: {
              type: "quiz",
              title: "Is It AI?",
              instructions:
                "For each example, decide whether it counts as AI and pick the explanation that best matches how it actually works.",
              quiz: [
                {
                  question: "A thermostat that turns the heat on when the temperature drops below 68°F.",
                  choices: [
                    "AI — it's making a decision based on data",
                    "Not AI — it's a fixed rule, not a learned pattern",
                    "AI — it can sense its environment",
                  ],
                  correctIndex: 1,
                  explanation:
                    "It's following one hardcoded if/then rule. No data was used to learn that rule and no pattern was discovered — a human just wrote it in.",
                },
                {
                  question: "A chess engine that has beaten every human grandmaster.",
                  choices: [
                    "Narrow AI — superhuman at one task, clueless outside it",
                    "General AI — it can reason, so it can reason about anything",
                    "Not AI — it's just doing math",
                  ],
                  correctIndex: 0,
                  explanation:
                    "It evaluates millions of possible move sequences far better than any human, but that skill doesn't transfer to anything outside the 64 squares.",
                },
                {
                  question: "A voice assistant that can set a timer, but also fails badly on an unfamiliar accent.",
                  choices: [
                    "AI — and its failure on accents shows the limits of its training data",
                    "Not AI — if it fails, it isn't intelligent",
                    "AI — but only when it works correctly",
                  ],
                  correctIndex: 0,
                  explanation:
                    "It's still AI — it's pattern-matching speech to text using data it was trained on. The accent failure reveals whose voices were (and weren't) well represented in that training data, a theme we'll return to in Unit 2.",
                },
                {
                  question: "A calculator that computes 847 × 392 instantly.",
                  choices: [
                    "AI — it's solving a problem faster than a human can",
                    "Not AI — it's executing a fixed arithmetic procedure, not learning or judging",
                    "AI — anything a human can't do quickly must be AI",
                  ],
                  correctIndex: 1,
                  explanation:
                    "Speed isn't the test. A calculator follows the exact same multiplication procedure every time; it never adapts based on examples.",
                },
              ],
            },
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
            slug: "brief-history-of-ai",
            title: "From Logic Gates to ChatGPT: A Brief History of AI",
            essentialQuestion: "Why did AI take 70 years to go from science fiction to your pocket?",
            objectives: [
              "Sequence the major eras of AI development",
              "Explain why data and computing power, not just new ideas, drove recent AI breakthroughs",
              "Connect historical AI milestones to current tools students already use",
            ],
            vocabulary: ["Symbolic AI", "Expert System", "AI Winter", "Machine Learning", "Deep Learning", "Generative AI"],
            narrative: [
              "If AI feels like it appeared overnight in 2022, it's worth knowing the idea is older than your grandparents. Researchers were building \"thinking machines\" in the 1950s. So why did it take 70 years to get from a chalkboard idea to a chatbot in your pocket? The short answer: the early approach was fighting the wrong battle.",
              "The first wave, symbolic AI, tried to hand-code intelligence directly — programmers wrote out explicit rules and logical facts (\"if the patient has a fever AND a rash, THEN consider measles\") to build expert systems that mimicked specialists. This worked surprisingly well in narrow, rule-heavy domains, but it hit a wall: the real world is full of fuzzy, exception-riddled situations that nobody can fully write down as if/then rules. Funding dried up — twice — in periods historians now call AI winters, when the hype outran the results and investment collapsed.",
              "The breakthrough wasn't a smarter rule-writer. It was a shift to machine learning: instead of programming the rules by hand, you show the system thousands (or millions) of examples and let it find the patterns itself. That idea existed for decades too, but it needed two things the 1980s simply didn't have enough of: data and compute. The internet generated an ocean of text, images, and clicks to learn from, and GPUs (originally built for video game graphics) turned out to be extremely good at the math behind learning patterns at scale.",
              "Put those two ingredients together with deep learning — machine learning using many-layered neural networks, which we'll unpack tomorrow — and you get the generative AI boom: systems that don't just classify or predict a number, but generate new text, images, and audio that didn't exist before. ChatGPT wasn't a sudden spark of genius; it was the payoff of 70 years of theory finally meeting enough data and enough computing power to actually run it.",
              "Keep that pattern in mind for the rest of this course: almost every \"sudden\" AI breakthrough you'll read about is really an old idea meeting new data or new hardware, not a brand-new idea out of nowhere.",
            ],
            videos: [
              { title: "The History of AI Explained — Crash Course Futures of AI #1", url: "https://www.youtube.com/watch?v=UFJQV5Jb0pY" },
            ],
            activity: {
              type: "quiz",
              title: "Why Now?",
              instructions: "Test your understanding of what actually drove AI's recent breakthroughs.",
              quiz: [
                {
                  question: "Why did early symbolic AI / expert systems struggle to scale to real-world problems?",
                  choices: [
                    "Computers in the 1980s couldn't run any software that complex",
                    "Humans can't write explicit rules to cover every fuzzy, real-world exception",
                    "Nobody was funding AI research at the time",
                  ],
                  correctIndex: 1,
                  explanation:
                    "The bottleneck was conceptual, not just computational: hand-written rules can't capture every exception in messy real-world data, no matter how many rules you add.",
                },
                {
                  question: "What are the two main ingredients that finally made deep learning practical?",
                  choices: [
                    "A new programming language and a new type of keyboard",
                    "Massive datasets and powerful parallel computing (GPUs)",
                    "Government regulation and corporate funding",
                  ],
                  correctIndex: 1,
                  explanation:
                    "Neural networks needed huge amounts of example data to learn from and enough raw computing power (largely from GPUs) to process it — both became abundant only in the last ~15 years.",
                },
                {
                  question: "What is an \"AI winter\"?",
                  choices: [
                    "A season when AI researchers take a break",
                    "A period when AI hype outran real results, causing funding and interest to collapse",
                    "A type of cooling system for data centers",
                  ],
                  correctIndex: 1,
                  explanation:
                    "AI has gone through at least two major winters, where overpromised results failed to materialize and investment dried up for years.",
                },
              ],
            },
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
            slug: "how-machines-learn",
            title: "How Machines Learn: Data, Patterns, and Training",
            essentialQuestion: "If a computer doesn't have a brain, how does it \"learn\" from examples?",
            objectives: [
              "Explain the basic training loop: input data, prediction, comparison, adjustment",
              "Differentiate supervised, unsupervised, and reinforcement learning with examples",
              "Identify what counts as \"training data\" for common AI tools",
            ],
            vocabulary: ["Training Data", "Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Model", "Prediction"],
            narrative: [
              "Picture this: someone shows you ten photos, says \"yes\" to some and \"no\" to others, and never tells you why. After enough photos, you start guessing correctly before they answer — you found the pattern without anyone stating the rule out loud. That's almost exactly what a machine learning model does, and it's the core trick behind this entire field.",
              "This particular flavor is called supervised learning: the model sees training data made of examples that are already labeled with the right answer (this email is spam / not spam, this photo is a cat / not a cat), and it adjusts itself, bit by bit, to get better at predicting the label on new, unlabeled examples. There's no understanding of \"spam\" or \"cat\" in any human sense — just a steadily improving guess based on which patterns in the data lined up with which labels in the past.",
              "Not all learning comes with an answer key, though. Unsupervised learning hands the model a pile of unlabeled data and asks it to find structure on its own — like grouping customers into clusters based on shopping habits, with no one telling it what the groups should be ahead of time. And reinforcement learning is a third style entirely: instead of labeled examples, the system gets a reward or penalty for actions it takes (think of training a dog with treats), which is how systems learn to play games or control robots through trial and error.",
              "Here's the part that surprises people: the model itself isn't the data, and it isn't really \"thinking\" — it's closer to a giant adjustable dial that's been tuned by exposure to thousands or millions of examples until its predictions are useful. Once that tuning is done, you've got a trained model that can take a brand-new input it's never seen and produce a prediction.",
              "Today's activity puts you on the other side of that process: you'll be the one staring at labeled examples, hunting for the hidden rule, and feeling exactly how strange and probabilistic that kind of learning is — you'll be confident before you're certain, which is basically how every model works too.",
            ],
            videos: [
              { title: "Supervised Learning — Crash Course AI #2", url: "https://www.youtube.com/watch?v=4qVRBYAdLAo" },
            ],
            sandbox: {
              type: "decision-boundary",
              title: "Train a Real Classifier",
              description:
                "This isn't a simulation of training — it's the actual perceptron learning rule running in your browser. Drag the boundary yourself, then watch the same algorithm converge on its own, one labeled example at a time.",
            },
            activity: {
              type: "guess-the-rule",
              title: "Guess the Rule",
              instructions:
                "Each example below is labeled with a checkmark or an X by a hidden rule. Study the pattern, write your best guess, then reveal the actual rule — exactly the process a model goes through during training, just slower and out loud.",
              guessTheRule: {
                examples: [
                  { label: "Triangle, red, 3 sides", matches: true },
                  { label: "Square, blue, 4 sides", matches: false },
                  { label: "Triangle, blue, 3 sides", matches: true },
                  { label: "Pentagon, red, 5 sides", matches: false },
                  { label: "Triangle, green, 3 sides", matches: true },
                  { label: "Hexagon, red, 6 sides", matches: false },
                  { label: "Triangle, yellow, 3 sides", matches: true },
                  { label: "Circle, red, 0 sides", matches: false },
                ],
                rule: "Matches are every shape with exactly 3 sides — color is a red herring, the model would learn to ignore it if it generalizes correctly.",
              },
            },
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
            slug: "neural-networks-demystified",
            title: "Neural Networks Demystified",
            essentialQuestion: "What's actually happening inside the \"black box\"?",
            objectives: [
              "Describe a neural network as layers of simple decisions that combine into complex judgments",
              "Use a no-math analogy to explain neurons, weights, and layers",
              "Explain why neural networks need huge amounts of data and computing power",
            ],
            vocabulary: ["Neural Network", "Neuron (Node)", "Weight", "Layer", "Parameter"],
            narrative: [
              "Imagine a row of people passing a rumor down a line, where each person is allowed to slightly exaggerate or tone down the story before passing it on, and the last person announces a final verdict: true or false. That chain of small adjustments, layer by layer, is a surprisingly good mental model for a neural network — the technology behind almost every headline-grabbing AI system from image recognition to ChatGPT.",
              "A neural network is built from neurons (also called nodes), organized into layers. The input layer takes in raw information — pixel brightness values for an image, or word fragments for text. That information flows into one or more hidden layers, where each neuron combines signals from the previous layer, each signal multiplied by a weight that says how much that particular input should matter. A neuron looking for \"is this a cat photo\" might give a huge weight to \"pointy ears detected\" and almost no weight to \"background color.\"",
              "Here's the key idea: no single neuron understands the word \"cat.\" Each one is just doing simple weighted math. But stack enough layers, each combining the outputs of the last, and the network as a whole becomes able to represent something as abstract as \"catness\" — the same way no single person in the rumor chain understands the full story, yet the group as a whole produces a verdict.",
              "All of those weights — there can be billions of them in a large model — are called the network's parameters. None of them are hand-set by a programmer; they all start out close to random and get nudged, training example by training example, until the network's predictions get reliably better. That's why modern neural networks need such enormous amounts of training data and computing power: you're not writing rules, you're slowly sculpting billions of dials through repeated exposure to examples.",
              "Once you can see a neural network as \"layers of simple weighted votes stacked into something that can recognize complex patterns,\" the mystery of the \"black box\" gets a lot less mysterious — even though, notably, even the engineers who build these systems often can't fully explain why any one specific weight ended up at the value it did.",
            ],
            videos: [
              { title: "Neural Networks and Deep Learning — Crash Course AI #3", url: "https://www.youtube.com/watch?v=oV3ZY6tJiA0" },
            ],
            sandbox: {
              type: "neural-network",
              title: "Build a Brain That Can't Be Fooled",
              description:
                "A real 2-input, 3-hidden-neuron network learning live in your browser. Try to teach a single neuron the \"exactly one sensor\" rule and watch it fail — then add the hidden layer and watch it succeed.",
            },
            activity: {
              type: "quiz",
              title: "Inside the Black Box",
              instructions: "Check your understanding of how information actually flows through a neural network.",
              quiz: [
                {
                  question: "What does a \"weight\" control in a neural network?",
                  choices: [
                    "How much computing power the network uses",
                    "How much a particular input should influence a neuron's output",
                    "How many layers the network has",
                  ],
                  correctIndex: 1,
                  explanation:
                    "Weights are the dials that determine how much each incoming signal matters to a given neuron — a high weight means that input has a big say in the result.",
                },
                {
                  question: "Does any single neuron in a deep network \"understand\" a high-level concept like a face or a word?",
                  choices: [
                    "Yes, the largest neuron holds the full concept",
                    "No — understanding emerges from many simple neurons' weighted outputs combining across layers",
                    "Yes, but only in the output layer",
                  ],
                  correctIndex: 1,
                  explanation:
                    "Complex concepts emerge from the combined effect of many simple weighted computations spread across layers — not from any one neuron \"knowing\" what a face is.",
                },
                {
                  question: "Where do a neural network's weights come from?",
                  choices: [
                    "A programmer writes each one by hand based on expert knowledge",
                    "They start near-random and are adjusted automatically during training on examples",
                    "They're copied from a dictionary of facts",
                  ],
                  correctIndex: 1,
                  explanation:
                    "Weights begin essentially random and are nudged repeatedly as the network sees training examples — nobody hand-sets the billions of parameters in a large model.",
                },
                {
                  question: "Why do neural networks typically need huge datasets and lots of computing power?",
                  choices: [
                    "Because the code itself is unusually long",
                    "Because adjusting billions of weights reliably requires seeing many examples and doing massive amounts of math",
                    "Because they need to store every training example permanently",
                  ],
                  correctIndex: 1,
                  explanation:
                    "Tuning billions of weights to generalize well requires both a large number of examples and the computational power to do the math behind each adjustment.",
                },
              ],
            },
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
            slug: "models-to-products-review",
            title: "From Models to Products + Unit 1 Review",
            essentialQuestion: "How does a trained model turn into an app on your phone?",
            objectives: [
              "Trace the path from a trained model to a real product",
              "Compare how familiar AI products use models differently",
              "Synthesize Unit 1 vocabulary and concepts for the unit review",
            ],
            vocabulary: ["Inference", "API", "Fine-Tuning", "Generative AI"],
            narrative: [
              "A trained model sitting on a researcher's computer isn't a product — it's closer to a finished engine sitting in a garage with no car built around it yet. So how does that engine end up running your phone's recommendation feed or your video app's \"up next\" list?",
              "Once a model is trained, using it on new, real-world input is called inference — the model isn't learning anymore, it's just applying everything it already learned to make a fast prediction. Training a model can take weeks of computing time; running inference on your one search query takes a fraction of a second. Companies often take a general-purpose trained model and fine-tune it — keep training it a little further on a narrower, more specific dataset — so a broad language model becomes specialized at, say, customer support replies for one company.",
              "But a model on its own still can't talk to your phone's app. That connection usually happens through an API (Application Programming Interface) — a defined way for one piece of software to ask another piece of software to do something and get an answer back. When an app \"calls an AI model,\" it's almost always sending a request through an API, getting a prediction back, and displaying it to you, often within milliseconds.",
              "This is exactly how the recommendation engine deciding what video to show you next works: a model trained on patterns of what similar viewers watched is running inference, through an API, on data about your recent activity, dozens of times a day, every time you open the app. The same pipeline — train once, fine-tune, deploy behind an API, run inference constantly — powers everything from your voice assistant to AI image generators, which is exactly the recipe behind generative AI tools that create new text, images, or audio on demand rather than just classifying or predicting a number.",
              "Today wraps up Unit 1: you now have the full pipeline in your head, from \"what counts as intelligence\" all the way to \"how a trained model ends up running an app on your phone.\" Unit 2 turns a more critical eye on that pipeline — starting tomorrow, we ask what can go wrong.",
            ],
            videos: [
              { title: "How YouTube Knows What You Should Watch — Crash Course AI #15", url: "https://www.youtube.com/watch?v=kiInh5STnyQ" },
            ],
            activity: {
              type: "quiz",
              title: "Unit 1 Checkpoint",
              instructions: "A mixed review of Days 1–4 vocabulary and concepts before we move into Unit 2.",
              quiz: [
                {
                  question: "Which best distinguishes narrow AI from general AI (AGI)?",
                  choices: [
                    "Narrow AI is older technology; AGI is newer",
                    "Narrow AI excels at one specific task; AGI could learn any task a human can",
                    "Narrow AI uses neural networks; AGI does not",
                  ],
                  correctIndex: 1,
                  explanation: "Narrow AI systems, no matter how impressive, are specialized to one domain. AGI — which doesn't exist yet — would generalize across any task.",
                },
                {
                  question: "What finally made deep learning practical after decades of theory?",
                  choices: [
                    "A new mathematical proof that intelligence is computable",
                    "Massive datasets and powerful computing (GPUs) becoming available",
                    "Governments mandating AI research funding",
                  ],
                  correctIndex: 1,
                  explanation: "The ideas existed for decades; what changed was the availability of huge datasets and the computing power to train on them.",
                },
                {
                  question: "In supervised learning, what is \"training data\"?",
                  choices: [
                    "Any data the model has ever seen, labeled or not",
                    "Examples paired with the correct answer, used to teach the model the pattern",
                    "The final output the model produces",
                  ],
                  correctIndex: 1,
                  explanation: "Supervised learning specifically relies on labeled examples — input paired with the correct answer — so the model can learn what predicts what.",
                },
                {
                  question: "What is a \"weight\" inside a neural network?",
                  choices: [
                    "A measure of how much computing power a layer uses",
                    "A value controlling how much an input influences a neuron's output",
                    "The number of neurons in a layer",
                  ],
                  correctIndex: 1,
                  explanation: "Weights are the adjustable dials that determine how strongly each input signal matters to a neuron's output.",
                },
                {
                  question: "What is \"inference\" in the lifecycle of an AI model?",
                  choices: [
                    "The training phase where the model learns from data",
                    "Using an already-trained model to make a prediction on new input",
                    "The process of labeling training data",
                  ],
                  correctIndex: 1,
                  explanation: "Inference is what happens after training: the model applies what it learned to produce a fast prediction on new input.",
                },
              ],
            },
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
            slug: "bias-in-bias-out",
            title: "Bias In, Bias Out",
            essentialQuestion: "Can a machine be biased if it doesn't have opinions?",
            objectives: [
              "Explain how AI bias originates from training data, not machine \"intent\"",
              "Analyze a real case study of biased AI",
              "Propose a way developers could reduce bias in a given scenario",
            ],
            vocabulary: ["Algorithmic Bias", "Training Data Bias", "Representation", "Fairness"],
            narrative: [
              "Here's a question that trips people up: a machine doesn't have feelings, so how can it be \"biased\"? The answer is that AI doesn't inherit bias the way people do — through upbringing or prejudice. It inherits bias the way a photocopier inherits whatever's already on the page. If the original document has a smudge, every copy has that smudge too, copied perfectly and without judgment.",
              "Think of training data as the \"page\" being copied. If a hiring model is trained mostly on resumes from people who got hired in the past — and that past hiring was skewed toward one gender, one school, one zip code — the model doesn't see that as unfair. It just sees a pattern: \"successful candidates tend to look like this.\" It's not malicious. It's not even wrong, technically — it learned exactly what the data taught it. The smudge is just baked into the page.",
              "This is why \"the AI was biased\" is almost always a misleading headline. A more accurate one would be: \"the world that generated this data was unequal, and the model learned that inequality fluently.\" Facial recognition systems that struggled to identify people with darker skin weren't designed to discriminate — they were trained on datasets that simply contained far more lighter-skinned faces. The model became an expert at the homework it was given, and nobody checked whether the homework was representative.",
              "So who's responsible? That's genuinely a harder question than it looks, and reasonable people land in different places. The data was incomplete. The developers chose that data without auditing it. The company shipped the product without testing it on diverse users. Each link in that chain had a chance to catch the problem and didn't. There's rarely one villain — usually it's a system where everyone assumed someone else was checking.",
              "The encouraging part: because bias comes from data and decisions, it can be addressed with better data and better decisions. Teams now deliberately audit datasets for representation gaps, test models on diverse groups before launch, and bring in people who will be affected by a system to review it before it ships. Fairness isn't something a model has by default — it's something people have to build in on purpose.",
            ],
            videos: [
              { title: "Algorithmic Bias and Fairness — Crash Course AI #18", url: "https://www.youtube.com/watch?v=gV0_raKR2UQ" },
            ],
            sandbox: {
              type: "bias-detective",
              title: "Bias Detective",
              description:
                "Toggle which features a hiring model is allowed to use and watch the ranking shift in real time. Turning off one biased feature isn't always enough — find out why.",
            },
            activity: {
              type: "reflection",
              title: "Who's Responsible?",
              instructions:
                "An AI hiring tool consistently ranks candidates from one university higher than equally qualified candidates from other schools, because most of its training data came from that university's graduates. Write a short response answering: who is most responsible for this outcome — the historical data, the developers who chose it, or the company that deployed it without testing? Defend your position, and name one concrete change at each stage (data, development, deployment) that could have prevented it.",
              reflectionPrompt:
                "Who is responsible when an AI system discriminates: the data, the developer, or the company? Defend your answer.",
            },
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
            slug: "truth-hallucination-misinformation",
            title: "Truth, Hallucination, and Misinformation",
            essentialQuestion: "Why does AI sound so confident even when it's wrong?",
            objectives: [
              "Define \"hallucination\" in AI systems and explain why it happens",
              "Practice fact-checking AI-generated content against reliable sources",
              "Develop personal habits for verifying information from AI tools",
            ],
            vocabulary: ["Hallucination", "Source Verification", "Deepfake", "Misinformation"],
            narrative: [
              "Picture a friend who is supremely confident, speaks in complete, polished sentences, and is also wrong about 10% of the things they tell you — but never once says \"I'm not sure.\" That's roughly what it's like to talk to a large language model. It's not lying, exactly, because lying requires knowing the truth and saying something else on purpose. What it's doing is closer to confident guessing dressed up as fact. AI researchers call this hallucination.",
              "Here's why it happens. A language model doesn't have a database of facts it looks things up in. It has learned, from enormous amounts of text, what words tend to follow other words. When you ask it a question, it's not retrieving an answer — it's predicting the most plausible-sounding continuation, one piece at a time, like an extremely well-read improv performer who has to keep talking no matter what. Most of the time that prediction lines up with the truth, because the truth is usually the most common pattern in its training data. But sometimes the most plausible-sounding answer and the correct answer part ways, and the model has no internal alarm bell to tell the difference.",
              "This matters more as these tools get better at sounding right. A clumsy answer is easy to doubt. A fluent, well-structured, confidently-worded paragraph with a fake citation in it is much easier to believe — and that's exactly the kind of thing a hallucinating model produces. The danger isn't that AI gets things wrong; humans get things wrong all the time. The danger is that AI's wrong answers are dressed in the same confident voice as its right ones.",
              "The fix isn't to stop using these tools — it's to change your relationship with their answers. Treat an AI's claim the way you'd treat a tip from a stranger: useful as a starting point, not as a citation. If a fact matters — a date, a statistic, a quote, a medical or legal claim — check it against an independent source before you repeat it. That single habit, applied consistently, neutralizes most of the risk.",
              "This isn't unique to text, either. The same underlying issue — a system generating plausible content with no built-in fact-checker — shows up in AI-generated images, voices, and video (deepfakes). The skill you're building today, verifying before believing, is the same skill that protects you across all of it.",
            ],
            videos: [
              { title: "Why Large Language Models Hallucinate", url: "https://www.youtube.com/watch?v=cfqtFvWOfg0" },
            ],
            sandbox: {
              type: "calibration",
              title: "Calibration Check",
              description:
                "Twelve confidently-stated claims — some true, some myths, all delivered in the same flat, authoritative tone an AI would use. Rate your confidence on each one and see whether your certainty actually tracks your accuracy.",
            },
            activity: {
              type: "quiz",
              title: "Spot the Hallucination",
              instructions:
                "Each question below presents an AI-generated claim. Decide whether it's a hallucination (a fabricated or incorrect fact dressed in confident language) or accurate, and check your reasoning against the explanation.",
              quiz: [
                {
                  question:
                    "An AI chatbot states: \"The Eiffel Tower was completed in 1822 and designed by Leonardo da Vinci.\" What's going on here?",
                  choices: [
                    "This is correct and well-documented history.",
                    "This is a hallucination — the Eiffel Tower was completed in 1889 and designed by Gustave Eiffel's company.",
                    "This is a matter of opinion, not fact.",
                    "AI can't make mistakes about historical dates.",
                  ],
                  correctIndex: 1,
                  explanation:
                    "Both the date and the designer are fabricated, but stated with total confidence — a textbook hallucination.",
                },
                {
                  question: "Why do language models hallucinate instead of just saying \"I don't know\"?",
                  choices: [
                    "They are programmed to deceive users.",
                    "They predict plausible-sounding next words rather than retrieving verified facts, and have no built-in way to flag uncertainty.",
                    "They only hallucinate when asked about controversial topics.",
                    "It only happens with older, outdated models.",
                  ],
                  correctIndex: 1,
                  explanation:
                    "Language models generate the statistically most plausible continuation of text — they don't query a verified fact database, so confidence in tone doesn't reflect confidence in accuracy.",
                },
                {
                  question:
                    "An AI assistant gives you a real, correct quote from a famous speech, with the correct speaker and year. Is this an example of hallucination?",
                  choices: [
                    "Yes — all AI output should be treated as hallucination.",
                    "No — accurate, verifiable output is not a hallucination, even though the same model can hallucinate elsewhere.",
                    "Only if the speech was recent.",
                    "Only if a human fact-checked it first.",
                  ],
                  correctIndex: 1,
                  explanation:
                    "Models are right far more often than they're wrong — hallucination describes the specific failure mode, not every output.",
                },
                {
                  question: "What is the single best habit for protecting yourself against AI hallucinations?",
                  choices: [
                    "Never use AI tools for anything factual.",
                    "Only trust AI answers that sound confident.",
                    "Independently verify any claim that matters (dates, statistics, quotes, citations) before repeating it.",
                    "Assume AI is always less reliable than a quick guess.",
                  ],
                  correctIndex: 2,
                  explanation:
                    "Verifying important claims against an independent source is the one habit that neutralizes most of the risk, without requiring you to abandon the tool.",
                },
              ],
            },
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
            slug: "privacy-data-surveillance",
            title: "Privacy, Data, and Surveillance in the Age of AI",
            essentialQuestion: "What are you giving up when an app gets \"smarter\"?",
            objectives: [
              "Explain how personal data is collected and used to train and personalize AI systems",
              "Evaluate the privacy trade-offs of common AI-powered apps and services",
              "Identify practical steps to protect personal data online",
            ],
            vocabulary: ["Data Privacy", "Consent", "Surveillance", "Data Collection", "Terms of Service"],
            narrative: [
              "Free apps aren't really free — you're paying with something other than money. Think of it like a loyalty card at a coffee shop, except instead of tracking how many lattes you buy, the app is tracking where you go, what you search for, who you talk to, what you linger on, and what makes you click. That information is the actual product being sold, and the \"smarter\" an app feels — the more it seems to know what you want before you ask — the more data it had to collect to get there.",
              "This is the trade at the heart of most AI-powered personalization: a recommendation engine that nails your taste in music, a map app that predicts your commute, a feed that always seems to know what you'll scroll past versus what you'll watch to the end. None of that is magic. It's the result of a system that has been quietly watching patterns in your behavior, often across many apps and far longer than you'd guess.",
              "The catch is that almost nobody reads the terms of service that technically explain all this. They're written in dense legal language, partly because lawyers wrote them and partly because vague language gives companies more room to use your data in ways they haven't decided yet. \"We may share data with trusted partners to improve your experience\" sounds harmless until you realize it can mean almost anything.",
              "None of this means AI personalization is automatically bad — a lot of it genuinely makes products more useful. But \"useful\" and \"informed consent\" are different things, and the gap between them is where privacy problems live. The healthiest approach isn't paranoia, it's literacy: knowing roughly what's being collected, why, and having a few deliberate habits — checking app permissions, reading at least the headline of a privacy policy, deciding which conveniences are worth which trade-offs — rather than clicking \"Agree\" on autopilot.",
              "By the end of today, you'll have done something most adults never do: actually translate a real terms-of-service excerpt into plain English, and decide for yourself, with eyes open, what's a fair trade and what isn't.",
            ],
            videos: [
              { title: "Data Privacy — Study Hall: Data Literacy #10", url: "https://www.youtube.com/watch?v=N9I7smAOspM" },
            ],
            activity: {
              type: "checklist",
              title: "My AI Privacy Checklist",
              instructions:
                "Go through each habit below and check off the ones you already do — or commit to starting. This is a personal audit, not a quiz; there's no \"passing score,\" just an honest look at your own data habits.",
              checklist: [
                { id: "permissions", label: "I've checked what permissions (location, microphone, contacts) my most-used apps actually have." },
                { id: "policy-skim", label: "I've skimmed at least the headline points of a privacy policy for an app I use daily." },
                { id: "settings-review", label: "I've reviewed my ad/personalization settings on at least one major platform (e.g. Google, Instagram, TikTok)." },
                { id: "data-minimal", label: "I think before granting an app access to data it doesn't obviously need for its core function." },
                { id: "password-hygiene", label: "I use unique, strong passwords (or a password manager) rather than reusing one password everywhere." },
                { id: "think-before-share", label: "I pause before sharing personal information with an AI chatbot or assistant, knowing it may be stored or used for training." },
              ],
            },
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
            slug: "ai-and-future-of-work",
            title: "AI and the Future of Work",
            essentialQuestion: "Will AI take your job, change it, or create a new one?",
            objectives: [
              "Distinguish between job automation, augmentation, and creation",
              "Analyze how AI is currently changing at least two different career fields",
              "Identify skills that remain valuable in an AI-augmented workforce",
            ],
            vocabulary: ["Automation", "Augmentation", "Reskilling", "Human-in-the-Loop"],
            narrative: [
              "Every time a new technology arrives, the same question shows up: \"Is this going to take my job?\" The honest answer for AI is: it depends enormously on what \"my job\" actually consists of — because most jobs aren't one task, they're a bundle of dozens of tasks, and AI is much better at automating some of those tasks than others.",
              "It helps to separate three different things people lump together as \"AI taking jobs.\" Automation is when a machine fully replaces a task a human used to do — like an assembly-line robot. Augmentation is when AI makes a human better or faster at their job without replacing them — like a doctor using an AI tool to flag suspicious spots on an X-ray, while the doctor still makes the diagnosis and has the conversation with the patient. And creation is when AI generates entirely new kinds of jobs that didn't exist before, like \"prompt engineer\" or \"AI ethics auditor\" — roles nobody needed a decade ago.",
              "In practice, augmentation is by far the most common pattern today. Lawyers use AI to draft first-pass contract summaries, then apply judgment a model doesn't have. Concept artists use AI to generate options quickly, then choose and refine. Customer service reps use AI to draft replies, then add the empathy and context that make a reply actually land. In each case, the human moved up the chain — from doing the rote part of the task to doing the judgment part.",
              "That points to what stays valuable in an AI-augmented workplace: the things AI is still weak at. Judgment calls with incomplete information. Reading a room. Taking responsibility when something goes wrong. Creativity that comes from lived experience, not pattern-matching on existing examples. Skills like these don't go out of style just because a tool got faster at the mechanical parts of a job.",
              "The practical move, then, isn't to bet your future on AI never improving — it will. It's to get comfortable working alongside it: knowing what to hand off to a tool, what to double-check, and which of your own skills are worth deliberately strengthening because they're hard for a model to replicate. That's the \"future-proofing\" mindset you'll practice today.",
            ],
            videos: [
              { title: "The Future of Artificial Intelligence — Crash Course AI #20", url: "https://www.youtube.com/watch?v=T7Rv4tGRlfc" },
            ],
            activity: {
              type: "reflection",
              title: "Future-Proofing Skills Plan",
              instructions:
                "Pick a career field you're genuinely interested in (it can be specific, like \"pediatric nurse,\" or broad, like \"marketing\"). In a few sentences, identify: (1) one task in that field AI is already automating or likely to automate soon, (2) one task where AI is more likely to augment a human than replace them, and (3) one human skill in that field that you think will stay valuable for a long time, and why. This is your personal future-proofing plan — write it for yourself, not for a grade.",
              reflectionPrompt:
                "What career field are you exploring, and what's your future-proofing plan for it?",
            },
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
            slug: "capstone-ethical-ai-policy",
            title: "Capstone: Designing an Ethical AI Policy",
            essentialQuestion: "If you were in charge, what rules would you set for AI?",
            objectives: [
              "Synthesize concepts from both units into a coherent policy",
              "Draft an original AI Code of Ethics for a chosen context",
              "Present and defend policy choices to peers",
            ],
            vocabulary: ["Policy", "Ethical Framework", "Stakeholder", "Accountability"],
            narrative: [
              "Over the past nine lessons, you've looked at AI from a lot of angles: how it learns, how it can go wrong, who it can hurt, and how it's reshaping work. Today you put all of that together and do something genuinely difficult — write the rules.",
              "Think about it like designing a constitution for a small country instead of just complaining about its problems. Anyone can point out that an AI system might be biased, might hallucinate, might mishandle privacy, or might displace workers unfairly — you've spent two weeks doing exactly that. It's a different skill entirely to sit down and decide, in concrete terms, what should be done about it before the system is ever built or shipped.",
              "Real organizations actually do this. Companies, governments, and research labs publish \"AI ethics frameworks\" — documents that try to answer questions like: How transparent must a system be about how it makes decisions? Who is accountable when something goes wrong? What data is off-limits to collect or use? How do you check for bias before launch, not just after the damage is done? These frameworks differ in detail, but they tend to circle back to four recurring pillars: bias and fairness, transparency, privacy, and accountability.",
              "Those four pillars are your rubric today. A strong AI ethics policy doesn't just say \"be fair\" in the abstract — it says something a developer could actually act on, like \"before deployment, test system outputs across demographic groups and document any disparities.\" It doesn't just say \"be transparent\" — it specifies what users are told and when. Vague good intentions are easy; specific, enforceable commitments are the hard and valuable part.",
              "There's no single correct answer here — reasonable policies for a hospital AI, a hiring AI, and a social media recommendation AI will look different, because the stakes and stakeholders are different. What matters is that your policy is specific enough that someone could actually check whether a system follows it, and that you can defend why you drew the lines where you did. That's the real skill this whole course has been building toward: not fearing AI, and not blindly trusting it either, but being able to reason clearly about it.",
            ],
            videos: [
              { title: "What is AI Ethics?", url: "https://www.youtube.com/watch?v=aGwYtUzMQUk" },
            ],
            activity: {
              type: "reflection",
              title: "Draft Your AI Code of Ethics",
              instructions:
                "Choose a specific context for your policy (for example: an AI tool used in your school, a hiring AI at a company, or a healthcare AI). Draft a short AI Code of Ethics — at least one concrete, checkable commitment for each of these four areas: (1) Bias & Fairness — how will you check for and address unequal outcomes? (2) Transparency — what will users be told about how the system works or makes decisions? (3) Privacy — what data will and won't be collected, and how is consent handled? (4) Accountability — who is responsible when something goes wrong, and what happens next? Avoid vague statements like \"be fair\" — write commitments specific enough that someone could check whether they're being followed.",
              reflectionPrompt:
                "What context did you choose, and what is your AI Code of Ethics for it? Address bias, transparency, privacy, and accountability.",
            },
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

export function getAILessonBySlug(course: AIFlagshipCourse, lessonSlug: string) {
  const all = course.units.flatMap((unit) => unit.lessons);
  const index = all.findIndex((lesson) => lesson.slug === lessonSlug);
  if (index === -1) return undefined;
  return { lesson: all[index], prev: all[index - 1], next: all[index + 1] };
}
