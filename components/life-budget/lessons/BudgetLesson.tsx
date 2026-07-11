"use client";

import FlashcardLesson, { TermCard } from "./FlashcardLesson";

const ACCENT = "#16a34a";

const CARDS: TermCard[] = [
  {
    term: "50/30/20 Rule",
    question: "Is there a simple framework that works for most 22-year-olds just starting out?",
    definition: "A budget guideline: 50% of net income to needs, 30% to wants, 20% to savings and debt payoff. Not perfect for everyone, but a useful starting target for a first-year budget.",
    example: "$3,000/month net: $1,500 needs, $900 wants, $600 savings. Most new graduates find the 50% needs bucket too tight — especially with student loans counted as a need.",
  },
  {
    term: "Fixed vs. Variable Expenses",
    question: "Which expenses can you actually cut, and which ones are locked in?",
    definition: "Fixed expenses stay the same every month (rent, car payment, loan minimums). Variable expenses change monthly (groceries, gas, dining out). You can only reduce variables in the short term.",
    example: "Rent ($1,100) is fixed — you can't cut it mid-lease. Groceries ($300) is variable — you can bring it to $200 if you need to free up cash this month.",
  },
  {
    term: "Emergency Fund",
    question: "Why do financial advisors keep saying 3–6 months of expenses?",
    definition: "A cash reserve set aside to cover 3–6 months of essential expenses in case of job loss, medical bills, or car repairs. It prevents going into credit card debt when the unexpected happens.",
    example: "Monthly needs = $1,800 → emergency fund target: $5,400–$10,800. Held in a separate high-yield savings account, not your checking account.",
  },
  {
    term: "Discretionary Spending",
    question: "What actually counts as a 'want' vs. a 'need' in a real budget?",
    definition: "Discretionary spending is anything not essential for survival or fulfilling existing commitments — the 'wants' category. The line between needs and wants is personal, but the distinction matters when you need to cut.",
    example: "Netflix ($15), dining out ($200), new sneakers ($80) = $295/month discretionary. You could cut all of it in a financial emergency. You can't cut rent.",
  },
  {
    term: "Budget Variance",
    question: "What's the difference between making a budget and actually tracking your spending?",
    definition: "Variance is the gap between what you planned to spend and what you actually spent. Tracking variance monthly shows you where your plan breaks down — and where your habits are leaking money.",
    example: "Budgeted $200 for dining out, actually spent $340 → $140 unfavorable variance. If this happens 3 months in a row, the budget number is wrong — not you.",
  },
  {
    term: "Sinking Fund",
    question: "How do you stop being blindsided by expenses you knew were coming?",
    definition: "A sinking fund is money saved monthly toward a predictable future expense — car registration, holiday gifts, annual subscriptions, vehicle maintenance — so it doesn't arrive as a surprise.",
    example: "Car registration = $180/year. Save $15/month in a sinking fund → the money is there when the bill arrives. No budget crisis, no credit card use.",
  },
  {
    term: "Zero-Based Budget",
    question: "What does it mean to give every dollar a 'job' before the month starts?",
    definition: "A zero-based budget assigns every dollar of income to a specific category so that income minus all allocated expenses equals zero. Every dollar has a purpose before it's spent.",
    example: "$3,200 income: rent $1,100 + car $300 + groceries $250 + savings $500 + entertainment $200 + misc $850 = $3,200. Zero left means zero wasted — you decided where it went.",
  },
];

export default function BudgetLesson({ onReady }: { onReady: () => void }) {
  return (
    <FlashcardLesson
      cards={CARDS}
      accent={ACCENT}
      title="7 Terms for Building a Real Budget"
      subtitle="Most budgets fail because people skip these concepts. Learn them first — then your numbers will make sense."
      onReady={onReady}
      ctaLabel="Build My Real Budget →"
    />
  );
}
