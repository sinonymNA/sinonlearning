"use client";

import FlashcardLesson, { TermCard } from "./FlashcardLesson";

const ACCENT = "#2563eb";

const CARDS: TermCard[] = [
  {
    term: "BLS Median Wage",
    question: "Why doesn't the number in the job listing match what people actually earn?",
    definition: "The Bureau of Labor Statistics tracks what the middle worker in a field earns — half earn more, half earn less. Job listings often advertise the top of the pay range.",
    example: "A posted marketing job at $65K may have a BLS median of $51K — that's your real year-1 benchmark, not the posting.",
  },
  {
    term: "Net vs. Gross Income",
    question: "Why does 'making $50K' feel like way less than $50K?",
    definition: "Gross is what your employer pays you. Net is what actually hits your bank account after all taxes and deductions. Your budget must be built on net — not gross.",
    example: "At $50K gross, you might net $38K after taxes and benefits — a $12K difference that changes every budget decision you make.",
  },
  {
    term: "Salary Negotiation",
    question: "Why does your very first salary matter more than any raise you'll ever get?",
    definition: "Negotiating your starting salary sets the baseline for every future raise, bonus, and competing offer — those gaps compound across an entire career.",
    example: "Negotiating $3K more at 22 can translate to $150K+ more in lifetime earnings, because future raises and offers are all percentage-based on top of that number.",
  },
  {
    term: "10-Year Job Outlook",
    question: "What does 'projected to grow 15%' actually mean for your career plan?",
    definition: "The BLS publishes projected percentage growth for every occupation over the next decade. It tells you if the field is expanding, stable, or shrinking before you commit to training.",
    example: "An occupation with 15% projected growth means roughly 15 new jobs for every 100 that exist today — faster-than-average demand for workers in that field.",
  },
  {
    term: "Education ROI",
    question: "Is a more expensive degree always worth more money?",
    definition: "Return on investment: how many years until your degree pays for itself in higher earnings relative to what it cost. A higher-cost school does not automatically mean a higher salary.",
    example: "A $120K degree in social work vs. $30K at a community college — same starting salary, four times the debt. The ROI on the expensive option is far worse.",
  },
  {
    term: "Industry vs. Occupation",
    question: "What's the difference between 'I work in healthcare' and 'I work as a nurse'?",
    definition: "Your occupation is your role (nurse, accountant, engineer). Your industry is who employs you (hospital, tech company, nonprofit). The same occupation can pay very differently across industries.",
    example: "Accountants in finance earn roughly 30% more than accountants in nonprofits — same skill set and credential, different industry.",
  },
  {
    term: "Career Ladder",
    question: "What's a realistic salary in 5 years — and how do you actually plan for it?",
    definition: "Most careers have published entry, mid-level, and senior pay bands. Knowing the ladder lets you set real salary targets and financial goals, rather than hoping for surprises.",
    example: "Entry-level software engineer: $75K. Senior engineer (8 years): $140K+. Knowing this lets you project your income trajectory and plan around it.",
  },
];

export default function CareerLesson({ onReady }: { onReady: () => void }) {
  return (
    <FlashcardLesson
      cards={CARDS}
      accent={ACCENT}
      title="7 Terms Every Job Hunter Needs"
      subtitle="These words control your earning power. Learn them before you negotiate a single dollar."
      onReady={onReady}
      ctaLabel="Research My Career →"
    />
  );
}
