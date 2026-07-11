"use client";

import FlashcardLesson, { TermCard } from "./FlashcardLesson";

const ACCENT = "#7c3aed";

const CARDS: TermCard[] = [
  {
    term: "Net Worth",
    question: "What does your financial snapshot actually measure — and what doesn't it measure?",
    definition: "Net worth = total assets − total liabilities. It's a point-in-time financial baseline — not a measure of success, character, or intelligence. At 22, it tells you almost nothing about where you're headed.",
    example: "$8,000 in savings − $32,000 in student loans = −$24,000 net worth at 22. That's normal. Most college graduates start in this range. Negative isn't failure — it's the starting line.",
  },
  {
    term: "Assets",
    question: "What actually counts as something that increases your net worth?",
    definition: "Assets are things you own with monetary value: cash savings, investment accounts, vehicle market value, real property. Each asset adds to the left side of the net worth equation.",
    example: "Checking + savings: $5,000. Car market value: $8,000. 401k balance: $2,000. Total assets: $15,000. Note: your car loses value over time — it's a depreciating asset.",
  },
  {
    term: "Liabilities",
    question: "What drags your net worth down — even if it funded something valuable?",
    definition: "Liabilities are debts you owe: student loans, car loans, credit card balances, mortgages, personal loans. Every liability directly reduces net worth, regardless of what you used the money for.",
    example: "Student loan: $28,000. Car loan: $4,000. Credit card balance: $600. Total liabilities: $32,600. Assets of $15,000 − liabilities of $32,600 = −$17,600 net worth.",
  },
  {
    term: "Liquidity",
    question: "Why does it matter what form your assets are in — not just how much they're worth?",
    definition: "Liquidity describes how quickly an asset can be converted to cash without a significant loss. Cash is most liquid. Real estate is least liquid. Liquidity determines your ability to handle emergencies.",
    example: "You have $200K in home equity but need $5K for a medical bill. Your house can't help you immediately — you'd need a home equity loan (takes weeks). A $5K HYSA can help you today.",
  },
  {
    term: "Net Worth Trajectory",
    question: "Why does the direction of your net worth matter more than the number itself at 22?",
    definition: "Trajectory is the rate of change in your net worth over time. Going from −$30K to −$20K to −$5K shows strong financial habits — more meaningful than being at +$5K with no upward movement.",
    example: "Year 1: −$28K. Year 3: −$15K. Year 5: +$2K. That trajectory beats someone who inherited +$20K and stayed flat. Trajectory is the real report card.",
  },
  {
    term: "Wealth vs. Income",
    question: "Why does a teacher with good savings habits sometimes retire richer than a doctor who earns 3× as much?",
    definition: "Wealth is accumulated net worth — what you keep and invest. Income is what you earn in a time period. High income doesn't create wealth automatically. Only earning more than you spend and investing the difference does.",
    example: "Doctor earning $200K, spending $195K → net worth barely grows. Teacher earning $55K, saving 15% ($8,250/year) → meaningful net worth trajectory. Behavior matters more than salary.",
  },
];

export default function NetWorthLesson({ onReady }: { onReady: () => void }) {
  return (
    <FlashcardLesson
      cards={CARDS}
      accent={ACCENT}
      title="6 Net Worth Terms for a Strong Finish"
      subtitle="This is the capstone module. These 6 terms tie everything together — they're the language of long-term financial health."
      onReady={onReady}
      ctaLabel="Calculate My Net Worth →"
    />
  );
}
