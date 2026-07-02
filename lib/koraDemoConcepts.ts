export interface KoraConcept {
  id: string;
  name: string;
  subject: string;
  tagline: string;
  research_prompt: string;
  source_content: string;
}

export const KORA_DEMO_CONCEPTS: KoraConcept[] = [
  {
    id: "desirable-difficulties",
    name: "Desirable Difficulties",
    subject: "Learning Science",
    tagline: "Why making learning harder can make it stick better",
    research_prompt:
      "Search: 'desirable difficulties learning science Robert Bjork'. Look for why spacing, testing, and interleaving improve long-term retention even though they feel harder in the moment.",
    source_content: `Desirable difficulties are learning conditions that slow down initial acquisition but produce stronger long-term retention and transfer. The concept, developed by Robert Bjork, challenges the intuition that easier, more fluent learning is better learning.

Key ideas:
- Spacing effect: distributing practice over time produces better retention than massed practice (cramming), even though spaced practice feels harder
- Testing effect (retrieval practice): testing yourself on material produces far better retention than re-reading it, even when tests are failed
- Interleaving: mixing different types of problems during practice improves transfer to new problems, even though blocked practice (one type at a time) feels smoother
- Illusion of knowing: when learning feels easy and fluent, students mistake familiarity for actual understanding
- Generation effect: trying to generate an answer before seeing it produces better retention than simply studying the answer
- Transfer-appropriate processing: the difficulty should match the conditions of later retrieval

Common misconceptions:
- ALL difficulty improves learning (wrong — only difficulties that engage deeper processing)
- Performance during practice predicts retention (wrong — often inversely related)
- Students are good judges of their own learning (wrong — they prefer fluent methods that produce worse retention)

Why it matters for teaching: teachers and students both optimize for the wrong signal. Smooth lessons and easy practice feel productive but produce shallow learning. The most effective teaching strategies feel uncomfortable in the moment.`,
  },
  {
    id: "opportunity-cost",
    name: "Opportunity Cost",
    subject: "Economics",
    tagline: "Every choice has a hidden cost — even free things",
    research_prompt:
      "Search: 'opportunity cost economics'. Look for why economists say every decision has a hidden cost, what that cost actually is, and why it matters even when something is free.",
    source_content: `Opportunity cost is the value of the best alternative forgone when making a decision. It is the foundation of economic reasoning and applies to all decisions, not just financial ones.

Key ideas:
- Opportunity cost is the SINGLE best alternative — not the sum of all alternatives
- It includes time, attention, and non-monetary resources, not just money
- Even "free" things have opportunity costs (the time and attention you spend)
- Rational decision-making compares the benefit of a choice to its opportunity cost, not just its direct cost
- Sunk costs (already spent, non-recoverable) are NOT opportunity costs and should not influence decisions
- Comparative advantage: countries (or people) should specialize in what they have the lowest opportunity cost producing, not just what they're best at absolutely

Common misconceptions:
- Opportunity cost is all possible alternatives combined (wrong — only the single best)
- Things with no price have no opportunity cost (wrong — time always has cost)
- The opportunity cost of a choice is the same for everyone (wrong — it depends on your alternatives)

Why it matters: Most bad decisions come from ignoring opportunity costs. A company keeps a failing division because it's profitable — ignoring that the resources could earn more elsewhere. A student studies a subject they dislike because grades are good — ignoring the career cost of going down the wrong path.`,
  },
  {
    id: "overjustification-effect",
    name: "The Overjustification Effect",
    subject: "Psychology",
    tagline: "Why rewards can kill the desire to do something",
    research_prompt:
      "Search: 'overjustification effect psychology'. Look for the Lepper, Greene and Nisbett experiments with children drawing, and why external rewards can reduce intrinsic motivation.",
    source_content: `The overjustification effect occurs when an expected external reward decreases a person's intrinsic motivation to perform an activity they previously enjoyed for its own sake. The person "overjustifies" their behavior by attributing it to the reward rather than personal interest.

Key ideas:
- When people receive an expected reward for doing something they already enjoy, they begin to see the activity as work done for the reward rather than an intrinsically enjoyable activity
- Classic study: Lepper, Greene & Nisbett (1973) gave children who enjoyed drawing either expected rewards, unexpected rewards, or no rewards. Expected-reward children drew less in free play afterward.
- Cognitive evaluation theory (Deci & Ryan): rewards undermine intrinsic motivation when they are experienced as controlling; rewards that convey competence information without controlling can maintain motivation
- Unexpected rewards do not undermine intrinsic motivation — only anticipated rewards
- The effect is stronger when the initial intrinsic motivation is high
- Praise for effort vs. praise for ability: effort praise maintains motivation; ability praise undermines it when the person fails

Common misconceptions:
- All rewards reduce motivation (wrong — unexpected rewards and informational rewards can be fine)
- The effect applies equally to all activities (wrong — activities with low intrinsic interest aren't affected)
- Removing rewards restores intrinsic motivation quickly (wrong — the damage can persist)

Why it matters for teachers: Using sticker charts, grades, and prizes for activities students already enjoy can permanently reduce their interest in those activities. The students who most love reading may be harmed most by reading reward programs.`,
  },
  {
    id: "confirmation-bias",
    name: "Confirmation Bias",
    subject: "Psychology",
    tagline: "Why we find what we're already looking for",
    research_prompt:
      "Search: 'confirmation bias psychology'. Look for how it works in information seeking, how it differs from motivated reasoning, and why intelligent people are often MORE susceptible.",
    source_content: `Confirmation bias is the tendency to search for, interpret, favor, and recall information in a way that confirms or supports one's prior beliefs or values. It is one of the most robust and consequential cognitive biases.

Key ideas:
- Selective search: people preferentially seek information that confirms their beliefs
- Biased interpretation: the same evidence is interpreted differently depending on prior beliefs — favorable evidence is accepted uncritically; unfavorable evidence is scrutinized heavily
- Memory bias: people recall confirming evidence more readily than disconfirming evidence
- It operates even when people are trying to be objective
- More intelligent people are often MORE susceptible — they're better at generating reasons to dismiss disconfirming evidence (this is called "smart people's folly" or "myside bias")
- It is distinct from motivated reasoning: confirmation bias can occur without any emotional stake, purely due to cognitive processing patterns

Common misconceptions:
- Confirmation bias means ignoring all contradictory evidence (wrong — it's subtler; we notice it but discount it)
- Education and intelligence protect against it (wrong — often amplify it)
- You can eliminate confirmation bias by "trying harder to be objective" (wrong — the bias operates automatically and largely unconsciously)

Why it matters: Confirmation bias shapes everything from medical diagnosis to scientific research to political polarization. Understanding it requires accepting that your own reasoning process is systematically distorted in ways you cannot fully detect from the inside.`,
  },
  {
    id: "zone-of-proximal-development",
    name: "Zone of Proximal Development",
    subject: "Education Science",
    tagline: "The gap between what you can do alone and what you can do with help",
    research_prompt:
      "Search: 'zone of proximal development Vygotsky'. Look for what the ZPD actually means (it's not just 'slightly above current level'), the role of a more knowledgeable other, and how scaffolding works.",
    source_content: `The Zone of Proximal Development (ZPD), developed by Lev Vygotsky, is the distance between what a learner can accomplish independently and what they can accomplish with guidance from a more knowledgeable other. It is not simply content that is "a little harder" — it specifically refers to tasks achievable only with assistance.

Key ideas:
- Three zones: what a student can do independently (current), the ZPD (with assistance), and what is too far beyond current ability
- The ZPD requires a more knowledgeable other — a teacher, peer, text, or tool that provides scaffolding
- Scaffolding: temporary support structures that enable performance within the ZPD; effective scaffolding is gradually removed as competence grows
- Language and social interaction are central to cognitive development — learning is fundamentally social before it becomes individual
- The ZPD is not a fixed property of a learner; it changes with context, domain, and available support
- Instruction should be aimed at the ZPD, not at current independent ability — teaching what students can already do wastes time

Common misconceptions:
- The ZPD is a level of difficulty ("just slightly above") — wrong, it is specifically what can be done WITH assistance
- Any help counts as scaffolding — wrong, scaffolding must be temporary and calibrated to fade
- The ZPD is the same in all domains for a given student — wrong, it varies dramatically by subject and context
- Vygotsky said direct instruction is bad — wrong, he emphasized the essential role of more knowledgeable others

Why it matters: Almost all educational design gets this wrong by teaching to current ability (too easy) or to some abstract "rigor" level (too hard). The ZPD requires knowing specifically what each student can do with assistance — which is why formative assessment is foundational, not optional.`,
  },
  {
    id: "cognitive-load",
    name: "Cognitive Load Theory",
    subject: "Education Science",
    tagline: "Why working memory is the bottleneck of all learning",
    research_prompt:
      "Search: 'cognitive load theory John Sweller'. Look for the three types of cognitive load (intrinsic, extraneous, germane), why working memory is limited, and what the split-attention effect is.",
    source_content: `Cognitive Load Theory (CLT), developed by John Sweller, proposes that learning is limited by the capacity of working memory. Instructional design should minimize unnecessary cognitive load to free working memory for the processing that actually produces learning.

Key ideas:
- Working memory is severely limited: roughly 7±2 items, and this limit is the fundamental constraint on learning
- Long-term memory is essentially unlimited; learning means building schemas in long-term memory that can be retrieved as single units, bypassing working memory limits
- Three types of load:
  - Intrinsic load: inherent complexity of the content (element interactivity — how many things must be held in mind simultaneously)
  - Extraneous load: load caused by poor instructional design (unnecessary complexity, split attention, redundancy)
  - Germane load: originally meant the load of schema formation; now understood as just intrinsic load used effectively
- Split-attention effect: when related information is physically or temporally separated, students must hold each piece in working memory while searching for the other, increasing extraneous load
- Redundancy effect: presenting the same information in multiple forms (e.g., text + narrated identical text) increases extraneous load, harming learning
- Expertise reversal effect: instructional supports that help novices can hurt experts (who find the supports distracting from their existing schemas)

Common misconceptions:
- Cognitive load is just about "not overwhelming" students (wrong — it's precise: intrinsic vs extraneous vs germane loads have very different instructional implications)
- More worked examples always help (wrong — expertise reversal effect means they hurt advanced learners)
- Colorful, multimedia-rich materials are always better (wrong — they often increase extraneous load)

Why it matters: Most teaching that "feels" good — rich multimedia, elaborate slides, multiple modalities simultaneously — often increases extraneous load and hurts learning. The cleanest instructional design is often the most effective.`,
  },
];
